'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

// Types
interface BookNowButtonProps {
  flightId: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

// Icons
const PlaneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BookNowButton: React.FC<BookNowButtonProps> = ({
  flightId,
  className = '',
  children,
  variant = 'primary',
  size = 'md'
}) => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Get button styles based on variant and size
  const getButtonStyles = () => {
    const baseStyles = 'font-bold rounded-lg transition-colors duration-300 flex items-center justify-center';
    
    const sizeStyles = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    const variantStyles = {
      primary: 'bg-blue-500 hover:bg-blue-600 text-white',
      secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
      outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white'
    };

    return `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;
  };

  // Handle booking attempt
  const handleBookingAttempt = () => {
    if (!user && !loading) {
      setShowLoginModal(true);
    } else if (user) {
      // User is logged in, proceed to booking
      router.push(`/flight/${flightId}`);
    }
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    const currentPath = `/flight/${flightId}`;
    localStorage.setItem('tripgo_redirect_url', currentPath);
    router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  // Handle register redirect
  const handleRegisterRedirect = () => {
    const currentPath = `/flight/${flightId}`;
    localStorage.setItem('tripgo_redirect_url', currentPath);
    router.push(`/auth/register?redirect=${encodeURIComponent(currentPath)}`);
  };

  return (
    <>
      {/* Book Now Button */}
      <button
        onClick={handleBookingAttempt}
        disabled={loading}
        className={getButtonStyles()}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Loading...
          </>
        ) : user ? (
          <>
            <PlaneIcon />
            <span className="ml-2">{children || 'Pilih Tiket'}</span>
          </>
        ) : (
          <>
            <LockIcon />
            <span className="ml-2">{children || 'Login untuk Beli'}</span>
          </>
        )}
      </button>

      {/* Login Required Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LockIcon />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Diperlukan</h2>
              <p className="text-gray-600">
                Anda harus login terlebih dahulu untuk melakukan pembelian tiket
              </p>
            </div>

            {/* Benefits */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Keuntungan memiliki akun:</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Simpan data penumpang untuk pemesanan cepat</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Lacak status pemesanan real-time</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Notifikasi update penerbangan</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>Riwayat pemesanan dan e-ticket</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleLoginRedirect}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
              >
                <UserIcon />
                <span className="ml-2">Login ke Akun Saya</span>
              </button>
              
              <button
                onClick={handleRegisterRedirect}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
              >
                <UserIcon />
                <span className="ml-2">Daftar Akun Baru</span>
              </button>
              
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full text-gray-500 hover:text-gray-700 py-2 transition-colors duration-300"
              >
                Batal
              </button>
            </div>

            {/* Info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 text-center">
                Dengan login, Anda akan diarahkan kembali ke halaman pemesanan setelah autentikasi berhasil
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookNowButton;
