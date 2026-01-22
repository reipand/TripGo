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

const hasAccess = (userRole: string | undefined, path: string): boolean => {
  if (!userRole) return false;
  
  const role = userRole.toLowerCase();
  const targetPath = path.toLowerCase();
  
  // Rule untuk Super Admin (Akses Segalanya)
  if (role === 'super_admin') return true;

  // Rule untuk Admin
  if (targetPath.startsWith('/admin')) {
    return role === 'admin';
  }
  
  // Rule untuk Staff
  if (targetPath.startsWith('/staff')) {
    return role === 'staff';
  }
  
  // Rule untuk User biasa ke Dashboard Umum
  if (targetPath.startsWith('/dashboard')) {
    return true; // Semua role yang login bisa ke dashboard umum
  }
  
  return true; 
};
// Helper function untuk menentukan redirect berdasarkan role
const getDefaultRedirectByRole = (userRole: string | undefined): string => {
  const role = (userRole || 'user').toLowerCase();
  
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'super_admin':
      return '/admin/dashboard';
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
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'no_access'>('checking');
  const [targetPath, setTargetPath] = useState<string>('/dashboard');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!loading) {
      if (user) {
        // User sudah login, tentukan redirect path
        const redirectParam = searchParams.get('redirect');
        
        let finalPath = '/dashboard';
        
        if (redirectParam) {
          try {
            const decodedPath = decodeURIComponent(redirectParam);
            
            // Validasi apakah user punya akses ke path tersebut
            if (hasAccess(user.role, decodedPath)) {
              finalPath = decodedPath;
            } else {
              // User tidak punya akses, gunakan default berdasarkan role
              finalPath = getDefaultRedirectByRole(user.role);
              setStatus('no_access');
            }
          } catch (error) {
            console.error('Invalid redirect URL:', error);
            finalPath = getDefaultRedirectByRole(user.role);
          }
        } else {
          // Tidak ada redirect param, gunakan default berdasarkan role
          finalPath = getDefaultRedirectByRole(user.role);
        }
        
        setTargetPath(finalPath);
        setStatus('redirecting');
        
        // Mulai countdown untuk redirect
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              router.push(finalPath);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(interval);
      } else {
        // User belum login, redirect ke login page
        const loginUrl = new URL('/auth/login', window.location.origin);
        const redirectParam = searchParams.get('redirect');
        if (redirectParam) {
          loginUrl.searchParams.set('redirect', redirectParam);
        }
        router.push(loginUrl.toString());
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

  if (status === 'checking') {
    return null;
  }

  // Get role display name
  const getRoleDisplayName = (role: string | undefined) => {
    const normalizedRole = (role || 'user').toLowerCase();
    switch (normalizedRole) {
      case 'admin': return 'Admin';
      case 'super_admin': return 'Super Admin';
      case 'staff': return 'Staff';
      default: return 'User';
    }
  };

  // Get path display name
  const getPathDisplayName = (path: string) => {
    if (path.startsWith('/admin')) return 'Admin Dashboard';
    if (path.startsWith('/staff')) return 'Staff Dashboard';
    if (path.startsWith('/super-admin')) return 'Super Admin Dashboard';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {status === 'no_access' ? 'Akses Dibatasi' : 'Login Berhasil!'}
          </h1>
          
          {status === 'no_access' ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Maaf, Anda tidak memiliki akses ke halaman yang diminta.
              </p>
              <p className="text-gray-600">
                Sebagai <span className="font-semibold">{getRoleDisplayName(user?.role)}</span>, Anda akan diarahkan ke:
              </p>
            </div>
          ) : (
            <p className="text-gray-600 mb-2">
              Selamat datang kembali, <span className="font-semibold">{user?.name || user?.email}</span>!
            </p>
          )}
          
          <div className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mb-4">
            Role: {getRoleDisplayName(user?.role)}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 mb-2">
              {status === 'redirecting' ? 'Mengarahkan ke:' : 'Anda akan diarahkan ke:'}
            </p>
            <div className="text-xl font-bold text-blue-600 mb-2">
              {getPathDisplayName(targetPath)}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {targetPath}
            </div>
            
            {status === 'redirecting' && (
              <div className="mt-4">
                <div className="text-3xl font-bold text-blue-600">{countdown}</div>
                <p className="text-sm text-gray-500 mt-1">detik</p>
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            {status === 'redirecting' && (
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(3 - countdown) * 33.33}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">Mempersiapkan halaman...</p>
              </div>
            )}
            
            <button
              onClick={() => router.push(targetPath)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
            >
              Lanjutkan Sekarang
            </button>
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