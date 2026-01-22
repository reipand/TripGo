// app/auth/callback/page.tsx
'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';

// Helper untuk menentukan redirect berdasarkan role
const getDefaultRedirectByRole = (userRole: string | undefined): string => {
  const role = (userRole || 'user').toLowerCase();
  
  switch (role) {
    case 'admin':
    case 'super_admin':
      return '/admin/dashboard';
    case 'staff':
      return '/staff/dashboard';
    case 'user':
    default:
      return '/dashboard';
  }
};

// Helper untuk cek akses
const hasAccess = (userRole: string | undefined, path: string): boolean => {
  if (!userRole) return false;
  
  const role = userRole.toLowerCase();
  
  if (path.startsWith('/admin')) {
    return ['admin', 'super_admin'].includes(role);
  }
  
  if (path.startsWith('/staff')) {
    return ['staff', 'super_admin'].includes(role);
  }
  
  if (path.startsWith('/super-admin')) {
    return role === 'super_admin';
  }
  
  // Untuk dashboard umum (/dashboard), semua role yang login boleh akses
  return true;
};

// Komponen utama
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, fetchUserProfile } = useAuth();
  const [status, setStatus] = useState<'checking' | 'redirecting' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const [targetPath, setTargetPath] = useState<string>('/dashboard');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('checking');
        
        // Cek jika ada error dari OAuth
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorParam) {
          throw new Error(errorDescription || `OAuth Error: ${errorParam}`);
        }

        // Tunggu sampai auth context selesai loading
        if (authLoading) {
          return;
        }

        // Jika user tidak terautentikasi, cek session
        if (!user) {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            throw new Error('No active session found');
          }
          
          // Fetch user profile jika session ada
          await fetchUserProfile();
          return;
        }

        // User sudah login, tentukan redirect path
        const redirectParam = searchParams.get('redirect');
        let finalPath = getDefaultRedirectByRole(user.role);
        
        if (redirectParam) {
          try {
            const decodedPath = decodeURIComponent(redirectParam);
            
            // Validasi akses
            if (hasAccess(user.role, decodedPath)) {
              finalPath = decodedPath;
            } else {
              // User tidak punya akses
              setMessage(`Role ${user.role} tidak memiliki akses ke ${decodedPath}`);
              // Tetap gunakan default path
            }
          } catch (error) {
            console.error('Invalid redirect URL:', error);
            setMessage('Redirect URL tidak valid');
          }
        }
        
        setTargetPath(finalPath);
        setStatus('redirecting');
        setMessage(`Mengarahkan ke ${getPathDisplayName(finalPath)}...`);
        
        // Countdown untuk redirect
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
        
      } catch (error: any) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Terjadi kesalahan');
        
        // Redirect ke login setelah 3 detik
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [user, authLoading, searchParams, router, fetchUserProfile]);

  // Helper untuk menampilkan nama path
  const getPathDisplayName = (path: string) => {
    if (path.startsWith('/admin/dashboard')) return 'Admin Dashboard';
    if (path.startsWith('/admin')) return 'Admin Panel';
    if (path.startsWith('/staff/dashboard')) return 'Staff Dashboard';
    if (path.startsWith('/staff')) return 'Staff Panel';
    if (path.startsWith('/super-admin')) return 'Super Admin Dashboard';
    if (path.startsWith('/dashboard')) return 'Dashboard User';
    return 'Dashboard';
  };

  // Helper untuk menampilkan nama role
  const getRoleDisplayName = (role: string | undefined) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'Admin';
      case 'super_admin': return 'Super Admin';
      case 'staff': return 'Staff';
      default: return 'User';
    }
  };

  // Loading state
  if (authLoading || status === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Memverifikasi autentikasi...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Autentikasi Gagal</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state - Redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Login Berhasil!</h1>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">
                Selamat datang, <span className="font-semibold">{user?.name || user?.email}</span>!
              </p>
              <div className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mt-2">
                Role: {getRoleDisplayName(user?.role)}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 mb-2">Mengarahkan ke:</p>
              <div className="text-xl font-bold text-blue-600 mb-2">
                {getPathDisplayName(targetPath)}
              </div>
              <div className="text-sm text-gray-500 truncate">
                {targetPath}
              </div>
              
              <div className="mt-4">
                <div className="text-3xl font-bold text-blue-600">{countdown}</div>
                <p className="text-sm text-gray-500 mt-1">detik</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(3 - countdown) * 33.33}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">Mempersiapkan halaman...</p>
              </div>
              
              <button
                onClick={() => router.push(targetPath)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
              >
                Lanjutkan Sekarang
              </button>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors duration-300 text-sm"
              >
                Dashboard Umum
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading wrapper
function CallbackLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Memuat halaman...</p>
      </div>
    </div>
  );
}

// Main component dengan Suspense
export default function CallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackContent />
    </Suspense>
  );
}