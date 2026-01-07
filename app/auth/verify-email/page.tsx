'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';

// --- Komponen Ikon --- (Dibuat dengan React.memo untuk optimasi)
const CheckIcon = React.memo(() => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
));

const ResendIcon = React.memo(() => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
));

const AlertIcon = React.memo(() => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.28 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
));

CheckIcon.displayName = 'CheckIcon';
ResendIcon.displayName = 'ResendIcon';
AlertIcon.displayName = 'AlertIcon';

// Komponen untuk konten yang menggunakan useSearchParams
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerificationCode, verifyEmailWithToken } = useAuth();
  
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [email, setEmail] = useState('');
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string>('');
  const [urlErrorCode, setUrlErrorCode] = useState<string>('');
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Get parameters from URL - hanya sekali saat mount
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const token = searchParams.get('token');
    const redirect = searchParams.get('redirect');
    const errorParam = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');
    
    // Cek error dari URL
    if (errorParam) {
      let errorMessage = 'Terjadi kesalahan saat verifikasi';
      
      if (errorCode === 'otp_expired' || errorParam === 'access_denied') {
        errorMessage = 'Link verifikasi sudah kadaluarsa. Silakan minta kode verifikasi baru.';
      } else if (errorDescription) {
        // Decode URL encoded error description
        errorMessage = decodeURIComponent(errorDescription);
      }
      
      setUrlError(errorMessage);
      setUrlErrorCode(errorCode || '');
    }
    
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    
    if (redirect) {
      setRedirectUrl(redirect);
    }
    
    // Jika ada token di URL (untuk verifikasi via link email), otomatis verifikasi
    if (token && !errorParam) { // Hanya jika tidak ada error
      handleTokenVerification(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array untuk run sekali

  // Timer countdown dengan cleanup
  useEffect(() => {
    if (timeLeft > 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else {
      setCanResend(true);
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft]);

  // Reset timer ketika email berubah
  useEffect(() => {
    if (email) {
      setTimeLeft(300);
      setCanResend(false);
    }
  }, [email]);

  // Handle token verification from email link
  const handleTokenVerification = useCallback(async (token: string) => {
    setLoading(true);
    setError('');
    setUrlError('');
    
    try {
      const result = await verifyEmailWithToken(token);
      
      if (result.error) {
        setError(result.error.message || 'Token verifikasi tidak valid atau sudah kadaluarsa');
      } else if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          if (redirectUrl) {
            router.push(decodeURIComponent(redirectUrl));
          } else {
            router.push('/dashboard');
          }
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat verifikasi');
    } finally {
      setLoading(false);
    }
  }, [redirectUrl, router, verifyEmailWithToken]);

  // Auto-focus next input
  const handleInputChange = useCallback((index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setError('');
    setUrlError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        setTimeout(() => nextInput.focus(), 10);
      }
    }
  }, [verificationCode]);

  // Handle backspace
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        setTimeout(() => prevInput.focus(), 10);
      }
    }
  }, [verificationCode]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...verificationCode];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i];
    }
    
    setVerificationCode(newCode);
    setUrlError('');
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    const nextInput = inputRefs.current[nextIndex];
    if (nextInput) {
      setTimeout(() => nextInput.focus(), 10);
    }
  }, [verificationCode]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email tidak ditemukan. Silakan login kembali atau daftar ulang.');
      return;
    }
    
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Masukkan kode verifikasi 6 digit');
      return;
    }

    setLoading(true);
    setError('');
    setUrlError('');

    try {
      const result = await verifyEmail(email, code);
      
      if (result.error) {
        setError(result.error.message || 'Kode verifikasi tidak valid');
      } else if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          if (redirectUrl) {
            router.push(decodeURIComponent(redirectUrl));
          } else {
            router.push('/dashboard');
          }
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat verifikasi');
    } finally {
      setLoading(false);
    }
  }, [email, verificationCode, redirectUrl, router, verifyEmail]);

  const handleResendCode = useCallback(async () => {
    if (!canResend || !email) return;
    
    setResendLoading(true);
    setError('');
    setUrlError('');

    try {
      const result = await resendVerificationCode(email);
      
      if (result.error) {
        setError(result.error.message || 'Gagal mengirim ulang kode');
      } else if (result.success) {
        setTimeLeft(300);
        setCanResend(false);
        // Reset input fields
        setVerificationCode(['', '', '', '', '', '']);
        const firstInput = inputRefs.current[0];
        if (firstInput) {
          setTimeout(() => firstInput.focus(), 10);
        }
        
        // Show success message
        alert('Kode verifikasi baru telah dikirim ke email Anda!');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengirim ulang kode');
    } finally {
      setResendLoading(false);
    }
  }, [canResend, email, resendVerificationCode]);

  const handleGoToRegister = useCallback(() => {
    const registerUrl = redirectUrl 
      ? `/auth/register?redirect=${encodeURIComponent(redirectUrl)}`
      : '/auth/register';
    router.push(registerUrl);
  }, [redirectUrl, router]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Memorize expensive calculations
  const memoizedRedirectUrl = useMemo(() => {
    return redirectUrl ? `/auth/login?redirect=${encodeURIComponent(redirectUrl)}` : '/auth/login';
  }, [redirectUrl]);

  const memoizedRegisterUrl = useMemo(() => {
    return redirectUrl ? `/auth/register?redirect=${encodeURIComponent(redirectUrl)}` : '/auth/register';
  }, [redirectUrl]);

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckIcon />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Terverifikasi!</h1>
            <p className="text-gray-600 mb-6">
              {redirectUrl 
                ? 'Akun Anda telah berhasil diverifikasi. Mengalihkan...' 
                : 'Akun Anda telah berhasil diverifikasi. Mengalihkan ke dashboard...'}
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Jika ada error dari URL (otp_expired) dan email tersedia
  if (urlError && urlErrorCode === 'otp_expired' && email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">Kode Verifikasi Kadaluarsa</h1>
            <p className="text-blue-100 mt-2">
              Link verifikasi sudah tidak valid atau kadaluarsa
            </p>
            {email && (
              <div className="mt-3">
                <p className="text-blue-200 text-sm font-medium">Email yang diverifikasi:</p>
                <p className="text-blue-100 text-sm mt-1 font-mono bg-blue-900 bg-opacity-30 p-2 rounded">{email}</p>
              </div>
            )}
          </div>

          {/* Error Card */}
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertIcon />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Link Verifikasi Kadaluarsa</h2>
            <p className="text-gray-600 mb-4">
              Link verifikasi yang Anda klik sudah kadaluarsa. Kode verifikasi hanya berlaku untuk waktu terbatas.
            </p>
            
            {/* Error Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-700 text-sm">{urlError}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleResendCode}
                disabled={!canResend || resendLoading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                  canResend && !resendLoading
                    ? 'bg-[#FD7E14] hover:bg-[#E06700] text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {resendLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Mengirim Kode Baru...
                  </>
                ) : (
                  <>
                    <ResendIcon />
                    <span className="ml-2">Kirim Kode Verifikasi Baru</span>
                  </>
                )}
              </button>

              <button
                onClick={handleGoToRegister}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Daftar dengan Email Lain
              </button>

              <Link 
                href={memoizedRedirectUrl}
                className="block w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors text-center"
              >
                Kembali ke Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Jika tidak ada email dan tidak ada token
  if (!email && !searchParams.get('token')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertIcon />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Tidak Ditemukan</h1>
            <p className="text-gray-600 mb-6">
              Silakan login atau daftar ulang untuk menerima kode verifikasi.
            </p>
            
            {urlError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm">{urlError}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <Link 
                href={memoizedRedirectUrl}
                className="block w-full bg-[#FD7E14] hover:bg-[#E06700] text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 text-center"
              >
                Login
              </Link>
              <Link 
                href={memoizedRegisterUrl}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 text-center"
              >
                Daftar Baru
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Masukkan Kode Verifikasi</h1>
          <p className="text-blue-100 mt-2">
            Kami telah mengirimkan kode keamanan 6 digit ke email Anda
          </p>
          {email && (
            <div className="mt-3">
              <p className="text-blue-200 text-sm font-medium">Email yang diverifikasi:</p>
              <p className="text-blue-100 text-sm mt-1 font-mono bg-blue-900 bg-opacity-30 p-2 rounded">{email}</p>
            </div>
          )}
          
          {redirectUrl && (
            <div className="mt-3 p-2 bg-blue-500 bg-opacity-20 rounded-lg">
              <p className="text-blue-100 text-sm">
                Anda akan diarahkan ke tujuan setelah verifikasi berhasil
              </p>
            </div>
          )}
        </div>

        {/* Form Verifikasi */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* URL Error Message (jika ada) */}
          {urlError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertIcon />
                </div>
                <div className="ml-3">
                  <p className="text-yellow-700 text-sm">{urlError}</p>
                  {urlErrorCode === 'otp_expired' && (
                    <p className="text-yellow-600 text-xs mt-1">
                      Silakan minta kode verifikasi baru di bawah.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Timer */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Kode kedaluwarsa dalam{' '}
                <span className={`font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-orange-500'}`}>
                  {formatTime(timeLeft)}
                </span>
              </p>
            </div>

            {/* Code Input */}
            <div className="flex justify-center space-x-3">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 text-gray-800 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none transition-colors"
                  disabled={loading}
                  autoFocus={index === 0 && !loading}
                />
              ))}
            </div>

            {/* Instructions */}
            <div className="text-center text-sm text-gray-600">
              <p>Masukkan 6 digit kode yang dikirim ke email Anda</p>
              <p className="mt-1 text-xs">Tips: Anda bisa paste kode langsung dengan Ctrl+V</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertIcon />
                  </div>
                  <div className="ml-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || verificationCode.join('').length !== 6}
              className="w-full bg-[#FD7E14] hover:bg-[#E06700] disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Memverifikasi...
                </>
              ) : (
                'Verifikasi dan Lanjutkan'
              )}
            </button>

            {/* Resend Code */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-2">
                Tidak menerima kode?
              </p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend || resendLoading}
                className={`text-sm font-medium flex items-center justify-center mx-auto transition-colors ${
                  canResend && !resendLoading 
                    ? 'text-orange-500 hover:text-orange-600' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                {resendLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <ResendIcon />
                    <span className="ml-1">
                      {canResend ? 'Kirim Ulang Kode' : `Tunggu ${formatTime(timeLeft)} untuk mengirim ulang`}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Help Links */}
            <div className="text-center space-y-2 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Bukan Anda yang meminta?{' '}
                <Link href="/help" className="text-blue-600 hover:text-blue-500 font-medium">
                  Hubungi Dukungan
                </Link>
              </p>
              <p className="text-sm text-gray-500">
                <Link 
                  href={memoizedRedirectUrl}
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Kembali ke Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Loading component
function VerifyEmailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Memuat halaman verifikasi...</p>
      </div>
    </div>
  );
}

// Main component dengan Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}