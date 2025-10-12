'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

// Icons
const CheckCircleIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const LoginRedirect: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const redirectUrl = searchParams.get('redirect');
      
      if (redirectUrl) {
        setRedirecting(true);
        // Decode and redirect to the original URL
        const decodedUrl = decodeURIComponent(redirectUrl);
        setTimeout(() => {
          router.push(decodedUrl);
        }, 2000);
      } else {
        // Default redirect to dashboard
        setRedirecting(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    }
  }, [user, loading, searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Memverifikasi autentikasi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white">Anda belum login. Silakan login terlebih dahulu.</p>
        </div>
      </div>
    );
  }

  return (
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
            </div>
          )}
          
          <div className="mt-6">
            <button
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
        </div>
      </div>
    </div>
  );
};

export default LoginRedirect;
