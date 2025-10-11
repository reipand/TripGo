'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

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
  billingAddress: {
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
  onPaymentSuccess: (result: any) => void;
  onPaymentError: (error: any) => void;
}

// Midtrans Sandbox Configuration
const MIDTRANS_CONFIG = {
  clientKey: 'Mid-client-pSkjZZCMxWR2cBec', // Replace with actual sandbox client key
  serverKey: 'Mid-server-oSNG3QLRva2jGYuvtZiJ6M2A', // Replace with actual sandbox server key
  baseUrl: 'https://api.sandbox.midtrans.com/v2',
  snapUrl: 'https://app.sandbox.midtrans.com/snap/snap.js'
};

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
    id: 'bank_transfer_bca',
    name: 'Transfer Bank BCA',
    type: 'bank_transfer',
    icon: '🏦',
    description: 'Virtual Account BCA',
    fee: 0,
    available: true
  },
  {
    id: 'bank_transfer_mandiri',
    name: 'Transfer Bank Mandiri',
    type: 'bank_transfer',
    icon: '🏦',
    description: 'Virtual Account Mandiri',
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
  onPaymentError
}) => {
  const { user, userProfile } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentToken, setPaymentToken] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);

  // Load Midtrans Snap.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = MIDTRANS_CONFIG.snapUrl;
    script.setAttribute('data-client-key', MIDTRANS_CONFIG.clientKey);
    script.onload = () => setSnapLoaded(true);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Generate payment token
  const generatePaymentToken = async (paymentMethod: PaymentMethod) => {
    setLoading(true);
    
    try {
      // Prepare transaction data for Midtrans
      const transactionDetails = {
        order_id: paymentData.orderId,
        gross_amount: paymentData.amount
      };

      const itemDetails = paymentData.items.map(item => ({
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
        category: 'Travel',
        merchant_name: 'TripGO'
      }));

      const customerDetails = {
        first_name: paymentData.customerDetails.first_name,
        last_name: paymentData.customerDetails.last_name,
        email: paymentData.customerDetails.email,
        phone: paymentData.customerDetails.phone,
        billing_address: paymentData.billingAddress,
        shipping_address: paymentData.billingAddress
      };

      // Call your backend API to create transaction
      const response = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_details: transactionDetails,
          item_details: itemDetails,
          customer_details: customerDetails,
          payment_type: paymentMethod.type,
          enabled_payments: [paymentMethod.id]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      const result = await response.json();
      setPaymentToken(result.token);
      return result.token;
    } catch (error) {
      console.error('Error generating payment token:', error);
      onPaymentError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Process payment
  const processPayment = async (paymentMethod: PaymentMethod) => {
    if (!snapLoaded) {
      onPaymentError(new Error('Payment system not ready'));
      return;
    }

    try {
      const token = await generatePaymentToken(paymentMethod);
      
      // Initialize Snap.js
      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: (result: any) => {
            console.log('Payment success:', result);
            onPaymentSuccess(result);
          },
          onPending: (result: any) => {
            console.log('Payment pending:', result);
            // Handle pending payment (e.g., bank transfer)
            onPaymentSuccess({ ...result, status: 'pending' });
          },
          onError: (error: any) => {
            console.error('Payment error:', error);
            onPaymentError(error);
          },
          onClose: () => {
            console.log('Payment popup closed');
          }
        });
      } else {
        throw new Error('Snap.js not loaded');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      onPaymentError(error);
    }
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  const handlePayNow = () => {
    if (!selectedMethod) {
      alert('Pilih metode pembayaran terlebih dahulu');
      return;
    }
    processPayment(selectedMethod);
  };

  return (
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
                    Biaya admin: {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR'
                    }).format(method.fee)}
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
              <span>
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR'
                }).format(item.price * item.quantity)}
              </span>
            </div>
          ))}
          <hr className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Total Pembayaran</span>
            <span className="text-blue-600">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR'
              }).format(paymentData.amount)}
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

      {/* Pay Now Button */}
      <button
        onClick={handlePayNow}
        disabled={!selectedMethod || loading || !snapLoaded}
        className={`
          w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200
          ${selectedMethod && !loading && snapLoaded
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
        ) : (
          `Bayar ${new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(paymentData.amount)}`
        )}
      </button>

      {/* Payment Status */}
      {!snapLoaded && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            Sedang memuat sistem pembayaran...
          </p>
        </div>
      )}
    </div>
  );
};

// Extend Window interface for Snap.js
declare global {
  interface Window {
    snap: any;
  }
}

export default PaymentGateway;
