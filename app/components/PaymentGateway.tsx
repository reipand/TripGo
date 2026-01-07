// app/components/PaymentGateway.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { initMidtransSnap } from '@/app/lib/midtrans';

// Types
interface PaymentMethod {
  id: string;
  name: string;
  type: 'credit_card' | 'bank_transfer' | 'e_wallet' | 'convenience_store';
  icon: string;
  description: string;
  fee: number;
  available: boolean;
}

interface PaymentData {
  orderId: string;
  amount: number;
  currency: string;
  items: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  customerDetails: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  billingAddress?: {
    first_name: string;
    last_name: string;
    address: string;
    city: string;
    postal_code: string;
    phone: string;
  };
}

interface PaymentGatewayProps {
  paymentData: PaymentData;
  onPaymentSuccess?: (result: any) => void;
  onPaymentError?: (error: any) => void;
  onPaymentPending?: (result: any) => void;
  onPaymentClose?: () => void;
  showStatus?: boolean;
}

// Payment Methods
const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'credit_card',
    name: 'Kartu Kredit/Debit',
    type: 'credit_card',
    icon: '💳',
    description: 'Visa, Mastercard, JCB',
    fee: 0,
    available: true
  },
  {
    id: 'bank_transfer',
    name: 'Transfer Bank',
    type: 'bank_transfer',
    icon: '🏦',
    description: 'BCA, Mandiri, BRI, BNI',
    fee: 0,
    available: true
  },
  {
    id: 'gopay',
    name: 'GoPay',
    type: 'e_wallet',
    icon: '📱',
    description: 'GoPay Wallet',
    fee: 0,
    available: true
  },
  {
    id: 'shopeepay',
    name: 'ShopeePay',
    type: 'e_wallet',
    icon: '🛒',
    description: 'ShopeePay Wallet',
    fee: 0,
    available: true
  },
  {
    id: 'alfamart',
    name: 'Alfamart',
    type: 'convenience_store',
    icon: '🏪',
    description: 'Bayar di Alfamart',
    fee: 0,
    available: true
  }
];

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  paymentData,
  onPaymentSuccess,
  onPaymentError,
  onPaymentPending,
  onPaymentClose,
  showStatus = false
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Midtrans Snap.js
  useEffect(() => {
    const loadSnap = async () => {
      try {
        await initMidtransSnap('');
        setSnapLoaded(true);
        console.log('✅ Snap.js loaded successfully');
      } catch (err) {
        console.error('❌ Failed to load Snap.js:', err);
        setError('Gagal memuat sistem pembayaran');
      }
    };

    loadSnap();
  }, []);

  // Generate payment token
  const generatePaymentToken = async (paymentMethod: PaymentMethod): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for payment API
      const requestData = {
        booking_code: `BOOK-${Date.now().toString().slice(-8)}`,
        order_id: paymentData.orderId,
        customer_name: paymentData.customerDetails.first_name + ' ' + (paymentData.customerDetails.last_name || ''),
        customer_email: paymentData.customerDetails.email,
        amount: paymentData.amount,
        payment_method: paymentMethod.type === 'credit_card' ? 'credit-card' : 
                      paymentMethod.type === 'bank_transfer' ? 'bank-transfer' : 'e-wallet',
        selected_bank: paymentMethod.type === 'bank_transfer' ? 'bca' : null
      };

      console.log('📤 Sending payment request:', requestData);

      const response = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      
      console.log('📥 Payment API response:', result);

      if (!response.ok || !result.success) {
        const errorMessage = result.message || result.error || 'Gagal membuat transaksi pembayaran';
        throw new Error(errorMessage);
      }
      
      if (!result.data?.token) {
        throw new Error('Token pembayaran tidak ditemukan');
      }
      
      setPaymentToken(result.data.token);
      return result.data.token;
    } catch (err: any) {
      console.error('❌ Error generating payment token:', err);
      const errorMessage = err?.message || 'Gagal membuat transaksi pembayaran. Silakan coba lagi.';
      setError(errorMessage);
      
      if (onPaymentError) {
        onPaymentError(new Error(errorMessage));
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Process payment dengan Snap.js
  const processPaymentWithSnap = async (token: string) => {
    if (!window.snap) {
      throw new Error('Sistem pembayaran belum siap');
    }

    return new Promise((resolve, reject) => {
      window.snap.pay(token, {
        onSuccess: (result: any) => {
          console.log('✅ Payment success:', result);
          setPaymentInitiated(false);
          if (onPaymentSuccess) {
            onPaymentSuccess(result);
          }
          resolve(result);
        },
        onPending: (result: any) => {
          console.log('⏳ Payment pending:', result);
          setPaymentInitiated(false);
          if (onPaymentPending) {
            onPaymentPending(result);
          }
          resolve(result);
        },
        onError: (error: any) => {
          console.error('❌ Payment error:', error);
          setPaymentInitiated(false);
          if (onPaymentError) {
            onPaymentError(error);
          }
          reject(error);
        },
        onClose: () => {
          console.log('🚪 Payment popup closed by user');
          setPaymentInitiated(false);
          if (onPaymentClose) {
            onPaymentClose();
          }
          reject(new Error('Pembayaran dibatalkan'));
        }
      });
    });
  };

  // Handle pay now button click
  const handlePayNow = async () => {
    if (!selectedMethod) {
      alert('Pilih metode pembayaran terlebih dahulu');
      return;
    }

    if (!snapLoaded) {
      setError('Sistem pembayaran sedang memuat, silakan tunggu sebentar');
      return;
    }

    setPaymentInitiated(true);
    setError(null);

    try {
      // 1. Generate payment token
      const token = await generatePaymentToken(selectedMethod);
      
      // 2. Process payment with Snap
      await processPaymentWithSnap(token);
      
    } catch (err: any) {
      console.error('❌ Payment process failed:', err);
      setPaymentInitiated(false);
      
      // Don't show alert if user closed the popup
      if (err.message !== 'Pembayaran dibatalkan') {
        setError(err.message || 'Terjadi kesalahan saat memproses pembayaran');
      }
    }
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    if (!method.available) return;
    setSelectedMethod(method);
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-red-500 text-lg mr-2">⚠️</div>
            <div>
              <p className="text-red-700 font-medium">Terjadi Kesalahan</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6">Metode Pembayaran</h3>
      
        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {PAYMENT_METHODS.map((method) => (
            <div
              key={method.id}
              onClick={() => handlePaymentMethodSelect(method)}
              className={`
                p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                ${selectedMethod?.id === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{method.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{method.name}</h4>
                  <p className="text-sm text-gray-500">{method.description}</p>
                  {method.fee > 0 && (
                    <p className="text-xs text-orange-600">
                      Biaya admin: {formatCurrency(method.fee)}
                    </p>
                  )}
                </div>
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${selectedMethod?.id === method.id
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                  }
                `}>
                  {selectedMethod?.id === method.id && (
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Ringkasan Pembayaran</h4>
          <div className="space-y-2">
            {paymentData.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <hr className="my-2" />
            <div className="flex justify-between font-semibold">
              <span>Total Pembayaran</span>
              <span className="text-blue-600">
                {formatCurrency(paymentData.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="text-green-500 text-xl">🔒</div>
            <div>
              <h4 className="font-semibold text-green-800 mb-1">Pembayaran Aman</h4>
              <p className="text-sm text-green-700">
                Transaksi Anda dilindungi dengan enkripsi SSL 256-bit. 
                Data kartu kredit tidak disimpan di server kami.
              </p>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {paymentInitiated && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Mengarahkan ke Pembayaran</h3>
              <p className="text-gray-600 text-sm">Jangan tutup halaman ini...</p>
            </div>
          </div>
        )}

        {/* Pay Now Button */}
        <button
          onClick={handlePayNow}
          disabled={!selectedMethod || loading || !snapLoaded || paymentInitiated}
          className={`
            w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200
            ${selectedMethod && !loading && snapLoaded && !paymentInitiated
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-400 cursor-not-allowed'
            }
          `}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Memproses...
            </div>
          ) : paymentInitiated ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Mengarahkan...
            </div>
          ) : (
            `Bayar ${formatCurrency(paymentData.amount)}`
          )}
        </button>

        {/* Snap.js Status */}
        {!snapLoaded && !error && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              Sedang memuat sistem pembayaran...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentGateway;