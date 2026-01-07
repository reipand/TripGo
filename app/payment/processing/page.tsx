'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

export default function PaymentProcessingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderId = searchParams.get('orderId');
  const bookingCode = searchParams.get('bookingCode');
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'processing' | 'success' | 'failed' | 'pending'>('processing');
  const [countdown, setCountdown] = useState(5);
  const [paymentUrl, setPaymentUrl] = useState('');

  // Use useCallback to memoize the redirect function
  const redirectToSuccess = useCallback(() => {
    if (!orderId || !bookingCode) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Use window.location instead of router.push to avoid React state update during render
          window.location.href = `/payment/success?orderId=${orderId}&bookingCode=${bookingCode}`;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [orderId, bookingCode]);

  const checkPaymentStatus = useCallback(async () => {
    if (!orderId) return;

    try {
      const response = await fetch('/api/payment/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId })
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.status === 'settlement') {
          setStatus('success');
          redirectToSuccess();
        } else if (data.status === 'pending') {
          setStatus('pending');
        } else if (data.status === 'expire' || data.status === 'cancel' || data.status === 'deny') {
          setStatus('failed');
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  }, [orderId, redirectToSuccess]);

  useEffect(() => {
    if (token) {
      // Jika ada token, tampilkan snap popup
      initializeSnap(token);
    } else if (orderId && bookingCode) {
      // Jika tidak ada token, cek status pembayaran
      checkPaymentStatus();
    }
  }, [token, orderId, bookingCode, checkPaymentStatus]);

  const initializeSnap = (snapToken: string) => {
    // Load Midtrans Snap script
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YourClientKeyHere');
    
    script.onload = () => {
      // @ts-ignore
      window.snap.pay(snapToken, {
        onSuccess: function(result: any) {
          console.log('Payment success:', result);
          setStatus('success');
          redirectToSuccess();
        },
        onPending: function(result: any) {
          console.log('Payment pending:', result);
          setStatus('pending');
          setPaymentUrl(result.redirect_url || '');
        },
        onError: function(result: any) {
          console.log('Payment error:', result);
          setStatus('failed');
        },
        onClose: function() {
          console.log('Payment popup closed');
          setStatus('pending');
        }
      });
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  };

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="beforeInteractive"
      />
      
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          {status === 'processing' ? (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute inset-4 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Memproses Pembayaran</h2>
                <p className="text-gray-600">
                  Mohon tunggu sebentar, transaksi Anda sedang diproses...
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-left text-gray-500">Order ID</div>
                    <div className="text-right font-medium">{orderId}</div>
                    
                    <div className="text-left text-gray-500">Kode Booking</div>
                    <div className="text-right font-medium">{bookingCode}</div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  Jangan tutup halaman ini selama proses pembayaran
                </div>
              </div>
            </>
          ) : status === 'pending' ? (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Menunggu Pembayaran</h2>
                <p className="text-gray-600">
                  Silakan selesaikan pembayaran Anda.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-700">
                    Pembayaran Anda tertunda. Silakan selesaikan pembayaran melalui metode yang Anda pilih.
                  </p>
                  {paymentUrl && (
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Klik di sini untuk melanjutkan pembayaran
                    </a>
                  )}
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={() => checkPaymentStatus()}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Cek Status Pembayaran
                  </button>
                  
                  <Link
                    href="/dashboard"
                    className="block w-full mt-2 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Ke Dashboard
                  </Link>
                </div>
              </div>
            </>
          ) : status === 'success' ? (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h2>
                <p className="text-gray-600">
                  Transaksi Anda telah berhasil diproses.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-left text-gray-500">Order ID</div>
                    <div className="text-right font-medium text-gray-700">{orderId}</div>
                    
                    <div className="text-left text-gray-500">Kode Booking</div>
                    <div className="text-right font-medium text-gray-700">{bookingCode}</div>
                  </div>
                </div>
                
                <div className="text-sm text-green-600 font-medium">
                  Mengarahkan ke halaman tiket dalam {countdown} detik...
                </div>
                
                <div className="pt-4">
                  <Link
                    href={`/payment/success?orderId=${orderId}&bookingCode=${bookingCode}`}
                    className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Lihat Tiket Sekarang
                  </Link>
                  
                  <Link
                    href="/dashboard"
                    className="block w-full mt-2 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Ke Dashboard
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Pembayaran Gagal</h2>
                <p className="text-gray-600">
                  Terjadi kesalahan dalam proses pembayaran.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">
                    Silakan coba lagi atau hubungi customer service.
                  </p>
                </div>
                
                <div className="pt-4">
                  <Link
                    href={`/booking?retry=${orderId}`}
                    className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Coba Lagi
                  </Link>
                  
                  <Link
                    href="/dashboard"
                    className="block w-full mt-2 border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Ke Dashboard
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}