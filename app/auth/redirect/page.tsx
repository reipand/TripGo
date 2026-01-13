'use client';

import React, { useEffect, Suspense, useState } from 'react';
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

// Helper function untuk menentukan redirect berdasarkan role
const getRedirectPathByRole = (userRole: string | undefined) => {
  switch (userRole?.toLowerCase()) {
    case 'admin':
      return '/admin/dashboard';
    case 'super_admin':
      return '/super-admin/dashboard';
    case 'staff':
      return '/staff/dashboard';
    case 'user':
    default:
      return '/dashboard';
  }
};

// Komponen untuk konten yang menggunakan useSearchParams
function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!loading && user) {
      const redirectUrl = searchParams.get('redirect');
      
      if (redirectUrl) {
        setRedirecting(true);
        // Decode and redirect to the original URL
        const decodedUrl = decodeURIComponent(redirectUrl);
        // Mulai countdown
        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              router.push(decodedUrl);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(countdownInterval);
      } else {
        // Redirect berdasarkan role user
        setRedirecting(true);
        const roleBasedPath = getRedirectPathByRole(user.role);
        const countdownInterval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              router.push(roleBasedPath);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(countdownInterval);
      }
    } else if (!loading && !user) {
      // If not logged in, redirect to login
      router.push('/auth/login');
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
          <p className="text-white">Anda belum login. Mengarahkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  // Get role display name
  const getRoleDisplayName = (role: string | undefined) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'Admin';
      case 'super_admin': return 'Super Admin';
      case 'staff': return 'Staff';
      case 'user': return 'User';
      default: return 'User';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Login Berhasil!</h1>
          <p className="text-gray-600 mb-2">
            Selamat datang kembali, <span className="font-semibold">{user.name || user.email}</span>!
          </p>
          <div className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
            Role: {getRoleDisplayName(user.role)}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 mb-2">
              Anda akan diarahkan ke halaman {user.role === 'admin' ? 'admin' : 'dashboard'} dalam:
            </p>
            <div className="text-3xl font-bold text-blue-600">{countdown} detik</div>
          </div>
          
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
                  const roleBasedPath = getRedirectPathByRole(user.role);
                  router.push(roleBasedPath);
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center mx-auto"
            >
              <span>Lanjutkan Sekarang</span>
              <ArrowRightIcon />
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            <p>Redirect ke: {
              searchParams.get('redirect') 
                ? decodeURIComponent(searchParams.get('redirect')!)
                : getRedirectPathByRole(user.role)
            }</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading component
function RedirectLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Memuat halaman redirect...</p>
      </div>
    </div>
  );
}

// Main component dengan Suspense
export default function RedirectPage() {
  return (
    <Suspense fallback={<RedirectLoading />}>
      <RedirectContent />
    </Suspense>
  );
}