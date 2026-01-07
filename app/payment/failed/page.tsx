// app/payment/failed/page.tsx
'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function FailedPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const bookingCode = searchParams.get('bookingCode');

  useEffect(() => {
    // Update payment status ke failed di database
    if (orderId) {
      fetch('/api/payment/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          status: 'failed'
        })
      }).catch(err => console.error('Error updating payment status:', err));
    }
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Pembayaran Gagal</h1>
        <p className="text-gray-600 mb-6">
          Maaf, pembayaran Anda tidak dapat diproses. Silakan coba lagi atau pilih metode pembayaran lain.
        </p>

        {bookingCode && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Kode Booking</p>
            <p className="font-bold text-gray-800">{bookingCode}</p>
          </div>
        )}

        <div className="space-y-3">
          {bookingCode && (
            <Link
              href={`/booking/confirmation?bookingCode=${bookingCode}`}
              className="block w-full bg-[#FD7E14] text-white font-semibold py-3 rounded-lg hover:bg-[#E06700] transition-colors text-center"
            >
              Coba Bayar Lagi
            </Link>
          )}
          
          <Link
            href="/my-bookings"
            className="block w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Lihat Booking Saya
          </Link>
          
          <Link
            href="/search"
            className="block w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            Cari Tiket Lain
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-bold text-blue-800 mb-2">Butuh Bantuan?</h4>
          <p className="text-sm text-blue-700">
            Hubungi Customer Service di <span className="font-semibold">1500-123</span> atau email ke <span className="font-semibold">support@tripgo.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    }>
      <FailedPageContent />
    </Suspense>
  );
}

