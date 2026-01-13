// app/components/LogoutButton.tsx (PERBAIKAN)
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showConfirmation?: boolean;
  redirectTo?: string;
  onLogoutSuccess?: () => void;
  children?: React.ReactNode;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  showConfirmation = true,
  redirectTo = '/',
  onLogoutSuccess,
  children
}) => {
  const router = useRouter();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    
    try {
      // Call the signOut function from auth context
      const result = await signOut();
      
      if (result.success) {
        // Show success toast
        window.dispatchEvent(new CustomEvent('showToast', {
          detail: {
            type: 'success',
            message: 'Logout berhasil!'
          }
        }));
        
        // Call custom success callback
        if (onLogoutSuccess) {
          onLogoutSuccess();
        }
        
        // Redirect
        router.push(redirectTo);
        router.refresh();
      } else {
        // Even if signOut reports error, we still redirect
        console.warn('Logout had issues but continuing...');
        router.push(redirectTo);
        router.refresh();
      }
      
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Still try to redirect even on error
      router.push(redirectTo);
      router.refresh();
      
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const handleClick = () => {
    if (showConfirmation) {
      setShowModal(true);
    } else {
      handleLogout();
    }
  };

  // Button size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  // Button variant styles
  const variantStyles = {
    default: 'bg-blue-600 hover:bg-blue-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border border-gray-300',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${className}
          rounded-lg font-medium
          transition-all duration-200
          flex items-center justify-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        `}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Sedang logout...</span>
          </>
        ) : (
          children || (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </>
          )
        )}
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Logout dari TripGO
              </h3>
              <p className="text-gray-600 mb-6">
                Anda akan keluar dari akun TripGO. Apakah Anda yakin?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batalkan
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    'Ya, Logout'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;