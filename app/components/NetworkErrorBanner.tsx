'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const NetworkErrorBanner: React.FC = () => {
  const { networkError } = useAuth();

  if (!networkError) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-2 text-center text-sm">
      <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span>
          Koneksi ke server terganggu. Beberapa fitur mungkin tidak berfungsi dengan baik.
          <button
            onClick={() => window.location.reload()}
            className="ml-2 underline hover:no-underline"
          >
            Coba lagi
          </button>
        </span>
      </div>
    </div>
  );
};