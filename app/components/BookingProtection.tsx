'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';

// Types
interface BookingProtectionProps {
  children: React.ReactNode;
  redirectTo?: string;
  showModal?: boolean;
}

// Icons
const LockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const BookingProtection: React.FC<BookingProtectionProps> = ({
  children,
  redirectTo,
  showModal = true
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Handle booking attempt when not logged in
  const handleBookingAttempt = () => {
    if (!user && !loading) {
      if (showModal) {
        setShowLoginModal(true);
      } else {
        // Redirect to login with return URL
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
      }
    }
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    const currentPath = window.location.pathname + window.location.search;
    // Store redirect URL in localStorage as backup
    localStorage.setItem('tripgo_redirect_url', currentPath);
    router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  // Handle register redirect
  const handleRegisterRedirect = () => {
    const currentPath = window.location.pathname + window.location.search;
    // Store redirect URL in localStorage as backup
    localStorage.setItem('tripgo_redirect_url', currentPath);
    router.push(`/auth/register?redirect=${encodeURIComponent(currentPath)}`);
  };

  // If user is logged in, show children
  if (user) {
    return <>{children}</>;
  }

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Memverifikasi autentikasi...</span>
      </div>
    );
  }

  // If not logged in and showModal is false, redirect immediately
  if (!showModal) {
    handleBookingAttempt();
    return null;
  }

  // Show login required modal
  return (
    <>
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
                  <CheckIcon />
                  <span className="ml-2">Simpan data penumpang untuk pemesanan cepat</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckIcon />
                  <span className="ml-2">Lacak status pemesanan real-time</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckIcon />
                  <span className="ml-2">Notifikasi update penerbangan</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckIcon />
                  <span className="ml-2">Riwayat pemesanan dan e-ticket</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <CheckIcon />
                  <span className="ml-2">Akses ke promo dan diskon khusus</span>
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
                Lanjutkan sebagai Guest
              </button>
            </div>

            {/* Info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700 text-center">
                Dengan login, Anda akan diarahkan kembali ke halaman ini setelah autentikasi berhasil
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Protected Content with Overlay */}
      <div className="relative">
        {/* Overlay */}
        <div className="absolute inset-0 bg-white bg-opacity-90 z-10 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LockIcon />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Login Diperlukan</h3>
            <p className="text-gray-600 mb-6">
              Silakan login untuk melanjutkan pembelian tiket
            </p>
            <button
              onClick={handleBookingAttempt}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 flex items-center mx-auto"
            >
              <UserIcon />
              <span className="ml-2">Login Sekarang</span>
              <ArrowRightIcon />
            </button>
          </div>
        </div>

        {/* Blurred Content */}
        <div className="filter blur-sm pointer-events-none">
          {children}
        </div>
      </div>
    </>
  );
};

export default BookingProtection;
