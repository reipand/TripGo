'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// --- Komponen Ikon ---
const CheckIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const PlaneIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const MapIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function VerifySuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 font-bold text-2xl">TG</span>
            </div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">TripGo</h1>
            <p className="text-sm text-gray-500">Your Journey Starts Here</p>
          </div>

          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckIcon />
          </div>

          {/* Success Message */}
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Sukses! Akun TripGo Anda Siap.
          </h2>
          
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Selamat bergabung! Email Anda telah terkonfirmasi. Sekarang Anda dapat mengakses dashboard pribadi Anda dan mulai merencanakan perjalanan sempurna Anda.
          </p>

          {/* CTA Buttons */}
          <div className="space-y-4 mb-8">
            <Link
              href="/dashboard"
              className="block w-full bg-[#FD7E14] hover:bg-[#E06700] text-white font-bold py-4 px-6 rounded-lg transition-colors duration-300 text-lg"
            >
              START PLANNING TRIP BARU
            </Link>
            
            <Link
              href="/search"
              className="block w-full bg-[#0A58CA] hover:bg-[#0548AD] text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
            >
              Jelajahi Destinasi Populer
            </Link>
          </div>

          {/* Quick Start Guide */}
          <div className="text-left border-t border-gray-200 pt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
              Siap Berangkat? Checklist TripGo Anda:
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#FD7E14] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1 flex items-center">
                    <PlaneIcon />
                    <span className="ml-2">Temukan Petualangan Anda</span>
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Gunakan pencarian pintar kami untuk menemukan penerbangan dan aktivitas terbaik dengan harga kompetitif.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#FD7E14] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1 flex items-center">
                    <UserIcon />
                    <span className="ml-2">Lengkapi Profil Anda</span>
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Tambahkan preferensi perjalanan Anda agar pemesanan lebih cepat dan personalisasi rekomendasi.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-[#FD7E14] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1 flex items-center">
                    <MapIcon />
                    <span className="ml-2">Cek Fitur Kunci</span>
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Coba generator daftar barang bawaan, pelacak penerbangan, dan fitur perencanaan perjalanan lainnya.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Auto Redirect Notice */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700 text-sm">
              <span className="font-semibold">Otomatis dialihkan ke dashboard dalam 5 detik...</span>
              <br />
              <Link href="/dashboard" className="underline hover:no-underline">
                Klik di sini untuk langsung ke dashboard
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              &copy; 2025 TripGo. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
