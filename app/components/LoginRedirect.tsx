'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

// Icons
<<<<<<< HEAD
const CheckCircleIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
=======
const CheckCircleIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
>>>>>>> 93a879e (fix fitur)
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

<<<<<<< HEAD
const ArrowRightIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
=======
const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
>>>>>>> 93a879e (fix fitur)
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const LoginRedirect: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
<<<<<<< HEAD
  const [countdown, setCountdown] = useState(3);
=======
>>>>>>> 93a879e (fix fitur)

  useEffect(() => {
    if (!loading && user) {
      const redirectUrl = searchParams.get('redirect');
      
      if (redirectUrl) {
        setRedirecting(true);
        // Decode and redirect to the original URL
        const decodedUrl = decodeURIComponent(redirectUrl);
<<<<<<< HEAD
        
        // Countdown timer
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              router.push(decodedUrl);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } else {
        // Default redirect to dashboard
        setRedirecting(true);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              router.push('/dashboard');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
=======
        setTimeout(() => {
          router.push(decodedUrl);
        }, 2000);
      } else {
        // Default redirect to dashboard
        setRedirecting(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
>>>>>>> 93a879e (fix fitur)
      }
    }
  }, [user, loading, searchParams, router]);

<<<<<<< HEAD
  const handleContinue = () => {
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      router.push(decodeURIComponent(redirectUrl));
    } else {
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Memverifikasi Autentikasi</h2>
          <p className="text-gray-600">Mohon tunggu sebentar...</p>
=======
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Memverifikasi autentikasi...</p>
>>>>>>> 93a879e (fix fitur)
        </div>
      </div>
    );
  }

  if (!user) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600 mb-6">
            Anda belum login. Silakan login terlebih dahulu untuk mengakses halaman ini.
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 w-full"
          >
            Login Sekarang
          </button>
=======
      <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white">Anda belum login. Silakan login terlebih dahulu.</p>
>>>>>>> 93a879e (fix fitur)
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="text-green-500 w-10 h-10" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Login Berhasil!</h1>
          <p className="text-gray-600 mb-2">
            Selamat datang kembali! Anda akan diarahkan secara otomatis.
          </p>
          
          {redirecting && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-500">Mengarahkan dalam...</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{countdown} detik</div>
=======
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Login Berhasil!</h1>
          <p className="text-gray-600 mb-6">
            Selamat datang kembali! Anda akan diarahkan ke halaman sebelumnya.
          </p>
          
          {redirecting && (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-500">Mengarahkan...</p>
>>>>>>> 93a879e (fix fitur)
            </div>
          )}
          
          <div className="mt-6">
            <button
<<<<<<< HEAD
              onClick={handleContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300 flex items-center justify-center space-x-2 w-full"
            >
              <span>Lanjutkan Sekarang</span>
              <ArrowRightIcon />
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Jika tidak diarahkan otomatis, klik tombol di atas
          </p>
=======
              onClick={() => {
                const redirectUrl = searchParams.get('redirect');
                if (redirectUrl) {
                  router.push(decodeURIComponent(redirectUrl));
                } else {
                  router.push('/dashboard');
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center mx-auto"
            >
              <span>Lanjutkan</span>
              <ArrowRightIcon />
            </button>
          </div>
>>>>>>> 93a879e (fix fitur)
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default LoginRedirect;
=======
export default LoginRedirect;
>>>>>>> 93a879e (fix fitur)
