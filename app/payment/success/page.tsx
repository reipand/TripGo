'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';

// Loading component
function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Memproses pembayaran...</p>
      </div>
    </div>
  );
}

// Main content component
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const transactionStatus = searchParams.get('transaction_status');
    const transactionId = searchParams.get('transaction_id');

    if (orderId) {
      setPaymentData({
        orderId,
        transactionStatus,
        transactionId
      });
    }
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return <PaymentSuccessLoading />;
  }

  const isSuccess = paymentData?.transactionStatus === 'capture' || 
                   paymentData?.transactionStatus === 'settlement';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {isSuccess ? 'Pembayaran Berhasil' : 'Status Pembayaran'}
              </h1>
              <p className="text-gray-600 mt-1">
                {isSuccess 
                  ? 'Terima kasih! Pembayaran Anda telah berhasil diproses.' 
                  : 'Silakan periksa status pembayaran Anda.'
                }
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <Link 
                  href="/dashboard" 
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Dashboard
                </Link>
              )}
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-700 font-medium"
              >
                Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success/Failure Status */}
          <div className={`rounded-lg border p-8 text-center mb-8 ${
            isSuccess 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="text-6xl mb-4">
              {isSuccess ? '✅' : '⏳'}
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${
              isSuccess ? 'text-green-800' : 'text-yellow-800'
            }`}>
              {isSuccess ? 'Pembayaran Berhasil!' : 'Pembayaran Sedang Diproses'}
            </h2>
            <p className={`text-lg ${
              isSuccess ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {isSuccess 
                ? 'Tiket Anda akan segera dikirim ke email Anda.' 
                : 'Mohon tunggu konfirmasi pembayaran dari bank atau penyedia pembayaran.'
              }
            </p>
          </div>

          {/* Payment Details */}
          {paymentData && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Pembayaran</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-gray-800">{paymentData.orderId}</span>
                </div>
                {paymentData.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-gray-800">{paymentData.transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-semibold ${
                    isSuccess ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {paymentData.transactionStatus === 'capture' ? 'Berhasil' :
                     paymentData.transactionStatus === 'settlement' ? 'Selesai' :
                     paymentData.transactionStatus === 'pending' ? 'Pending' :
                     paymentData.transactionStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Langkah Selanjutnya</h3>
            <div className="space-y-4">
              {isSuccess ? (
                <>
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 text-xl">📧</div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Cek Email Anda</h4>
                      <p className="text-gray-600">E-ticket akan dikirim ke email Anda dalam 5-10 menit.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-green-500 text-xl">📱</div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Download E-Ticket</h4>
                      <p className="text-gray-600">Simpan e-ticket di ponsel Anda untuk kemudahan akses.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-purple-500 text-xl">✈️</div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Siap Berangkat</h4>
                      <p className="text-gray-600">Datang ke bandara 2 jam sebelum keberangkatan.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start space-x-3">
                    <div className="text-yellow-500 text-xl">⏰</div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Tunggu Konfirmasi</h4>
                      <p className="text-gray-600">Pembayaran akan diproses dalam 1x24 jam untuk transfer bank.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-500 text-xl">📱</div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Pantau Status</h4>
                      <p className="text-gray-600">Anda dapat memantau status pembayaran di halaman ini.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {paymentData?.orderId && (
              <Link
                href={`/payment/status/${paymentData.orderId}`}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-semibold"
              >
                Pantau Status Pembayaran
              </Link>
            )}
            {user && (
              <Link
                href="/dashboard"
                className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center font-semibold"
              >
                Lihat Dashboard
              </Link>
            )}
            <Link
              href="/"
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-semibold"
            >
              Pesan Tiket Lagi
            </Link>
          </div>

          {/* Support Information */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Butuh Bantuan?</h3>
            <p className="text-blue-700 mb-4">
              Tim customer service kami siap membantu Anda 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href="mailto:support@tripgo.com" 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                📧 Email Support
              </a>
              <a 
                href="tel:+6281234567890" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                📞 Telepon Support
              </a>
              <a 
                href="https://wa.me/6281234567890" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-center"
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
