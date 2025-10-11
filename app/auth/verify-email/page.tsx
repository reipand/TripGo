                                    'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';

// --- Komponen Ikon ---
const CheckIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ResendIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

export default function VerifyEmailPage() {                                                                                                                                                             
  const router = useRouter();                                                                                                                       
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerificationCode } = useAuth();
  
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const email = searchParams.get('email') || '';

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-focus next input
  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...verificationCode];
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i];
    }
    
    setVerificationCode(newCode);
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('Masukkan kode verifikasi 6 digit');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error, success } = await verifyEmail(email, code);
      
      if (error) {
        setError(error.message || 'Kode verifikasi tidak valid');
      } else if (success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/verify-success');
        }, 2000);
      }
    } catch (err) {
      setError('Terjadi kesalahan saat verifikasi');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setResendLoading(true);
    setError('');

    try {
      const { error, success } = await resendVerificationCode(email);
      
      if (error) {
        setError(error.message || 'Gagal mengirim ulang kode');
      } else if (success) {
        setTimeLeft(300);
        setCanResend(false);
        setError('');
        alert('Kode verifikasi baru telah dikirim ke email Anda!');
      }
    } catch (err) {
      setError('Terjadi kesalahan saat mengirim ulang kode');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckIcon />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Terverifikasi!</h1>
            <p className="text-gray-600 mb-6">Akun Anda telah berhasil diverifikasi. Mengalihkan ke dashboard...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
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
            <p className="text-blue-200 text-sm mt-1 font-mono">{email}</p>
          )}
        </div>

        {/* Form Verifikasi */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
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
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition-colors"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || verificationCode.join('').length !== 6}
              className="w-full bg-[#FD7E14] hover:bg-[#E06700] disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
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
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Tidak menerima kode?
              </p>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={!canResend || resendLoading}
                className="text-orange-500 hover:text-orange-600 disabled:text-gray-400 font-medium flex items-center justify-center mx-auto transition-colors"
              >
                {resendLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-2"></div>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <ResendIcon />
                    <span className="ml-1">Kirim Ulang Kode</span>
                  </>
                )}
              </button>
            </div>

            {/* Help Links */}
            <div className="text-center space-y-2 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Bukan Anda yang meminta?{' '}
                <Link href="/help" className="text-blue-600 hover:text-blue-500">
                  Hubungi Dukungan
                </Link>
              </p>
              <p className="text-sm text-gray-500">
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
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
