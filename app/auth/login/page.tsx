'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';

// --- Komponen Ikon ---
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.28 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// --- Komponen Login Content ---
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle, loading: authLoading, user, userProfile, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState<string>('/dashboard');

  // Get redirect URL from query params
  useEffect(() => {
    const redirect = searchParams.get('redirect');
    const message = searchParams.get('message');
    const email = searchParams.get('email');

    if (redirect) {
      // Decode and validate redirect URL
      try {
        const decodedRedirect = decodeURIComponent(redirect);
        // Validate it's a safe path
        if (decodedRedirect.startsWith('/')) {
          setRedirectUrl(decodedRedirect);
        }
      } catch (err) {
        console.error('Invalid redirect URL:', err);
      }
    }

    if (message) {
      switch (message) {
        case 'verify_success':
          setSuccessMessage('Email berhasil diverifikasi! Silakan login dengan akun Anda.');
          break;
        case 'reset_success':
          setSuccessMessage('Password berhasil direset! Silakan login dengan password baru.');
          break;
        case 'registered':
          if (email) {
            setSuccessMessage(`Registrasi berhasil! Silakan login dengan email ${decodeURIComponent(email)}.`);
          } else {
            setSuccessMessage('Registrasi berhasil! Silakan login dengan akun Anda.');
          }
          break;
      }
    }

    // Load remembered email from localStorage
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }

    // Jika user sudah login, redirect berdasarkan role
    if (user && userProfile) {
      handleAlreadyLoggedIn();
    }
  }, [searchParams, user, userProfile]);

  const handleAlreadyLoggedIn = () => {
    console.log('User already logged in, checking for redirect...');

    if (!userProfile) return;

    const userRole = userProfile.role?.toLowerCase() || 'user';
    console.log(`Logged in user role: ${userRole}`);

    // Determine target path based on role
    let targetPath = redirectUrl;

    // Jika redirect URL adalah dashboard default, tentukan berdasarkan role
    if (redirectUrl === '/dashboard' || redirectUrl === '/') {
      switch (userRole) {
        case 'admin':
        case 'super_admin':
          targetPath = '/admin/dashboard';
          break;
        case 'staff':
          targetPath = '/staff/dashboard';
          break;
        default:
          targetPath = '/dashboard';
      }
    }

    // Check if user has access to the target path
    if (!hasAccess(userRole, targetPath)) {
      // Jika tidak punya akses, redirect ke dashboard sesuai role
      switch (userRole) {
        case 'admin':
        case 'super_admin':
          targetPath = '/admin/dashboard';
          break;
        case 'staff':
          targetPath = '/staff/dashboard';
          break;
        default:
          targetPath = '/dashboard';
      }
    }

    console.log('Redirecting logged-in user to:', targetPath);
    router.push(targetPath);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError(''); // Clear error when user types
  };

  // Fixed: handleSubmit dengan proper role checking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Save remember me preference
      if (formData.rememberMe && formData.email) {
        localStorage.setItem('remembered_email', formData.email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      const { error: signInError } = await signIn(formData.email, formData.password);

      if (signInError) {
        setError(signInError.message || 'Login gagal. Periksa email dan password Anda.');
        setLoading(false);
        return;
      }

      // Login berhasil, set pesan sukses dan tunggu redirect dari auth context
      setSuccessMessage('Login berhasil! Mengarahkan...');

      // Redirect akan ditangani oleh onAuthStateChange di AuthContext
      // atau oleh handleAlreadyLoggedIn di useEffect

    } catch (err: any) {
      console.error('Login exception:', err);
      setError(err.message || 'Terjadi kesalahan saat login');
      setLoading(false);
    }
  };

  // Helper function to check access
  const hasAccess = (userRole: string, path: string): boolean => {
    const normalizedRole = userRole.toLowerCase();

    // Admin dan Super Admin bisa akses semua admin routes
    if (path.startsWith('/admin') && !['admin', 'super_admin'].includes(normalizedRole)) {
      return false;
    }

    // Staff hanya bisa akses staff routes
    if (path.startsWith('/staff') && !['staff', 'super_admin'].includes(normalizedRole)) {
      return false;
    }

    // Super Admin only routes
    if (path.startsWith('/super-admin') && normalizedRole !== 'super_admin') {
      return false;
    }

    return true;
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Save remember me preference untuk email dari Google
      if (formData.rememberMe && formData.email) {
        localStorage.setItem('remembered_email', formData.email);
      }

      // Construct proper callback URL with redirect parameter
      const callbackUrl = `${window.location.origin}/api/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`;
      console.log('Google login callback URL:', callbackUrl);

      const { error: socialError } = await signInWithGoogle(callbackUrl);

      if (socialError) {
        if (socialError.message?.includes('popup blocked')) {
          setError('Popup diblokir oleh browser. Silakan izinkan popup untuk situs ini.');
        } else if (socialError.message?.includes('access_denied')) {
          setError('Anda membatalkan proses login dengan Google.');
        } else {
          setError(socialError.message || 'Gagal login dengan Google');
        }
        setLoading(false);
      } else {
        // Google login initiated successfully
        setSuccessMessage('Mengarahkan ke Google untuk login...');
        // Redirect will be handled by OAuth flow
      }
    } catch (err: any) {
      setError('Terjadi kesalahan saat login dengan Google');
      setLoading(false);
    }
  };

  // Check if we should show the form or redirecting state
  if (authLoading || (user && userProfile)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white font-medium text-lg">
            {successMessage || 'Mengarahkan ke dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <span className="text-2xl font-bold text-[#0A58CA]">TG</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Selamat Datang Kembali</h1>
          <p className="text-blue-100 mt-2">Masuk untuk melanjutkan ke TripGO</p>

          {redirectUrl && redirectUrl !== '/dashboard' && (
            <div className="mt-3 p-3 bg-blue-500 bg-opacity-20 rounded-lg inline-block">
              <p className="text-blue-100 text-sm">
                Anda akan diarahkan ke <span className="font-semibold">{redirectUrl}</span> setelah login
              </p>
            </div>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 animate-fadeIn">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="nama@email.com"
                  required
                  disabled={loading || authLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <Link
                  href={`/auth/forgot-password?redirect=${encodeURIComponent(redirectUrl)}`}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 text-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukkan password"
                  required
                  disabled={loading || authLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  disabled={loading || authLoading}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading || authLoading}
              />
              <label className="ml-2 text-sm text-gray-600">
                Ingat email saya
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-fadeIn">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertIcon />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full bg-[#FD7E14] hover:bg-[#E06700] disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center text-lg shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {loading || authLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Memproses...
                </>
              ) : (
                'Masuk ke Akun'
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Atau login dengan</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || authLoading}
              className="w-full bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              <span className="ml-3">Lanjutkan dengan Google</span>
            </button>

            {/* Register Link */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-gray-600">
                Belum punya akun?{' '}
                <Link
                  href={`/auth/register?redirect=${encodeURIComponent(redirectUrl)}`}
                  className="text-blue-600 hover:text-blue-500 font-semibold hover:underline"
                >
                  Daftar sekarang
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Info tambahan */}
        <div className="mt-8 text-center">
          <p className="text-blue-100 text-sm">
            Butuh bantuan?{' '}
            <Link href="/help" className="text-white hover:text-blue-100 font-medium underline">
              Hubungi support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Loading component
function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Memuat halaman login...</p>
      </div>
    </div>
  );
}

// Main component dengan Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}