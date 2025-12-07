'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

interface PaymentStatus {
  order_id: string;
  status: 'pending' | 'capture' | 'settlement' | 'deny' | 'cancel' | 'expire' | 'failure';
  fraud_status: 'accept' | 'deny' | 'challenge';
  transaction_id: string;
  payment_type: string;
  amount: number;
  updated_at: string;
}

interface RealtimePaymentStatusProps {
  orderId: string;
  onStatusChange?: (status: PaymentStatus) => void;
}

const RealtimePaymentStatus: React.FC<RealtimePaymentStatusProps> = ({
  orderId,
  onStatusChange
}) => {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get status display info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Menunggu Pembayaran',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: '⏳'
        };
      case 'capture':
        return {
          text: 'Pembayaran Berhasil',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: '✅'
        };
      case 'settlement':
        return {
          text: 'Pembayaran Selesai',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: '✅'
        };
      case 'deny':
        return {
          text: 'Pembayaran Ditolak',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '❌'
        };
      case 'cancel':
        return {
          text: 'Pembayaran Dibatalkan',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '🚫'
        };
      case 'expire':
        return {
          text: 'Pembayaran Kedaluwarsa',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: '⏰'
        };
      case 'failure':
        return {
          text: 'Pembayaran Gagal',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '❌'
        };
      default:
        return {
          text: 'Status Tidak Diketahui',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '❓'
        };
    }
  };

  // Fetch initial payment status
  const fetchPaymentStatus = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      if (!orderId) {
        setError('Order ID tidak valid');
        setLoading(false);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('transactions')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      // Log the actual response for debugging
      console.log('Supabase response:', { data, error: supabaseError });

      if (supabaseError) {
        // Only throw error if it's not "not found" error
        if (supabaseError.code !== 'PGRST116') {
          // Create a proper error object with all details
          const errorObj = {
            message: supabaseError.message || 'Unknown Supabase error',
            code: supabaseError.code,
            details: supabaseError.details,
            hint: supabaseError.hint,
            toString: () => JSON.stringify(supabaseError)
          };
          throw errorObj;
        }
        // For "not found" errors, set as pending
        setPaymentStatus({
          order_id: orderId,
          status: 'pending',
          fraud_status: 'accept',
          transaction_id: '',
          payment_type: '',
          amount: 0,
          updated_at: new Date().toISOString()
        });
        setLoading(false);
        return;
      }

      if (data) {
        const statusData: PaymentStatus = {
          order_id: data.order_id,
          status: data.status as any,
          fraud_status: data.fraud_status as any,
          transaction_id: data.midtrans_transaction_id || '',
          payment_type: data.payment_type || '',
          amount: Number(data.amount || 0),
          updated_at: data.updated_at || data.created_at || new Date().toISOString()
        };
        setPaymentStatus(statusData);
        onStatusChange?.(statusData);
      }
    } catch (err: unknown) {
      console.error('Error fetching payment status:', err);
      
      // Enhanced error logging
      if (err && typeof err === 'object') {
        console.error('Error object keys:', Object.keys(err));
        console.error('Error object stringified:', JSON.stringify(err));
      }
      
      // Retry logic for transient errors
      if (retryCount < 3) {
        setTimeout(() => {
          fetchPaymentStatus(retryCount + 1);
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
        return;
      }
      
      // Handle different error types
      let errorMessage = 'Gagal mengambil status pembayaran';
      
      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object') {
        // Try to extract message from various possible properties
        const errorObj = err as Record<string, any>;
        if (errorObj.message) {
          errorMessage = errorObj.message;
        } else if (errorObj.error?.message) {
          errorMessage = errorObj.error.message;
        } else if (errorObj.details) {
          errorMessage = errorObj.details;
        } else if (errorObj.code) {
          errorMessage = `Error ${errorObj.code}: ${errorObj.message || 'Unknown error'}`;
        } else if (Object.keys(errorObj).length === 0) {
          errorMessage = 'Terjadi kesalahan tidak diketahui (empty error object)';
        } else {
          // Try to stringify the entire object
          try {
            errorMessage = JSON.stringify(errorObj);
          } catch {
            errorMessage = 'Terjadi kesalahan yang tidak dapat diproses';
          }
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!orderId) return;

    // Fetch initial status
    fetchPaymentStatus();

    // Set up real-time subscription
    let subscription: any;
    
    try {
      subscription = supabase
        .channel(`payment-status-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'transactions',
            filter: `order_id=eq.${orderId}`
          },
          (payload) => {
            console.log('Payment status updated:', payload);
            const updatedStatus = payload.new as PaymentStatus;
            setPaymentStatus(updatedStatus);
            onStatusChange?.(updatedStatus);
          }
        )
        .subscribe((status: any) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to order ${orderId}`);
          }
          if (status === 'CHANNEL_ERROR') {
            console.error('Channel subscription error');
            // Retry subscription after delay
            setTimeout(() => {
              fetchPaymentStatus();
            }, 5000);
          }
        });
    } catch (err) {
      console.error('Failed to set up subscription:', err);
    }

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [orderId]);

  // Polling fallback for real-time updates
  useEffect(() => {
    if (!orderId || !paymentStatus) return;

    const interval = setInterval(() => {
      fetchPaymentStatus();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [orderId, paymentStatus]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Memuat status pembayaran...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="text-red-500 text-xl">❌</div>
          <div>
            <h4 className="font-semibold text-red-800">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
            <button 
              onClick={() => fetchPaymentStatus()}
              className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!paymentStatus) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">Status pembayaran tidak ditemukan</p>
        <button 
          onClick={() => fetchPaymentStatus()}
          className="mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(paymentStatus.status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Status Pembayaran</h3>
        <div className="text-sm text-gray-500">
          Order ID: {paymentStatus.order_id}
        </div>
      </div>

      {/* Status Display */}
      <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-4 mb-4`}>
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{statusInfo.icon}</div>
          <div>
            <h4 className={`font-semibold ${statusInfo.color}`}>
              {statusInfo.text}
            </h4>
            <p className="text-sm text-gray-600">
              Terakhir diperbarui: {new Date(paymentStatus.updated_at).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Transaction ID:</span>
          <p className="font-mono text-gray-800">{paymentStatus.transaction_id}</p>
        </div>
        <div>
          <span className="text-gray-500">Payment Type:</span>
          <p className="text-gray-800 capitalize">{paymentStatus.payment_type}</p>
        </div>
        <div>
          <span className="text-gray-500">Amount:</span>
          <p className="font-semibold text-gray-800">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR'
            }).format(paymentStatus.amount)}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Fraud Status:</span>
          <p className={`font-semibold ${
            paymentStatus.fraud_status === 'accept' ? 'text-green-600' : 
            paymentStatus.fraud_status === 'deny' ? 'text-red-600' : 
            'text-yellow-600'
          }`}>
            {paymentStatus.fraud_status === 'accept' ? 'Aman' :
             paymentStatus.fraud_status === 'deny' ? 'Berisiko' :
             'Perlu Verifikasi'}
          </p>
        </div>
      </div>

      {/* Action Buttons based on status */}
      {paymentStatus.status === 'pending' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Instruksi:</strong> Selesaikan pembayaran sesuai dengan metode yang dipilih. 
            Status akan diperbarui secara otomatis.
          </p>
        </div>
      )}

      {(paymentStatus.status === 'capture' || paymentStatus.status === 'settlement') && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <strong>Pembayaran Berhasil!</strong> Tiket Anda akan segera diproses dan dikirim ke email.
          </p>
        </div>
      )}

      {(paymentStatus.status === 'deny' || paymentStatus.status === 'failure') && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Pembayaran Gagal.</strong> Silakan coba metode pembayaran lain atau hubungi customer service.
          </p>
        </div>
      )}
    </div>
  );
};

export default RealtimePaymentStatus;