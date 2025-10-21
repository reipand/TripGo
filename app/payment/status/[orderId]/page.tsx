'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import RealtimePaymentStatus from '@/app/components/RealtimePaymentStatus';
import { useAuth } from '@/app/contexts/AuthContext';

// Loading component
function PaymentStatusLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat status pembayaran...</p>
      </div>
    </div>
  );
}

// Main content component
function PaymentStatusContent() {
  const params = useParams();
  const { user } = useAuth();
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    if (params?.orderId) {
      setOrderId(params.orderId as string);
    }
  }, [params]);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order ID Tidak Valid</h1>
          <p className="text-gray-600 mb-6">Order ID yang Anda masukkan tidak valid.</p>
          <Link 
            href="/dashboard" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Status Pembayaran</h1>
              <p className="text-gray-600 mt-1">Pantau status pembayaran Anda secara real-time</p>
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
          {/* Payment Status Component */}
          <RealtimePaymentStatus
            orderId={orderId}
            onStatusChange={(status) => {
              console.log('Payment status changed:', status);
            }}
          />

          {/* Additional Information */}
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Penting</h3>
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="text-blue-500 text-xl">ℹ️</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Status Real-time</h4>
                  <p>Status pembayaran akan diperbarui secara otomatis setiap 30 detik.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-green-500 text-xl">✅</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Pembayaran Berhasil</h4>
                  <p>Jika pembayaran berhasil, tiket akan dikirim ke email Anda dalam 5-10 menit.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-yellow-500 text-xl">⏳</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Pembayaran Pending</h4>
                  <p>Untuk transfer bank, pembayaran akan diproses dalam 1x24 jam.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="text-red-500 text-xl">❌</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Pembayaran Gagal</h4>
                  <p>Jika pembayaran gagal, Anda dapat mencoba metode pembayaran lain.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Support Information */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Butuh Bantuan?</h3>
            <p className="text-blue-700 mb-4">
              Jika Anda mengalami masalah dengan pembayaran atau memiliki pertanyaan, 
              tim customer service kami siap membantu Anda.
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
export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<PaymentStatusLoading />}>
      <PaymentStatusContent />
    </Suspense>
  );
}
