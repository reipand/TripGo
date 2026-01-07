'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// --- Komponen Ikon ---
const CheckIcon = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const TrainIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const MapIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const TicketIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default function VerifySuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  useEffect(() => {
    // Auto redirect to dashboard or specified redirect URL after 5 seconds
    const timer = setTimeout(() => {
      if (redirectUrl) {
        router.push(decodeURIComponent(redirectUrl));
      } else {
        router.push('/dashboard');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [router, redirectUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-bold text-3xl">TG</span>
            </div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">TripGO Kereta Api</h1>
            <p className="text-sm text-gray-500">Solusi Pemesanan Tiket Kereta Terpercaya</p>
          </div>

          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckIcon />
          </div>

          {/* Success Message */}
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Verifikasi Berhasil! Akun TripGO Anda Aktif
          </h2>
          
          <div className="mb-8">
            <p className="text-gray-600 text-lg mb-4 leading-relaxed">
              🎉 Selamat! Email Anda telah berhasil diverifikasi.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Sekarang Anda dapat menikmati kemudahan pemesanan tiket kereta api secara online dengan semua fitur premium TripGO.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4 mb-10">
            <Link
              href="/search"
              className="block w-full bg-gradient-to-r from-[#FD7E14] to-[#FF9500] hover:from-[#E06700] hover:to-[#FF8500] text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
            >
              🚂 CARI JADWAL KERETA SEKARANG
            </Link>
            
            {redirectUrl ? (
              <Link
                href={decodeURIComponent(redirectUrl)}
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
              >
                Lanjutkan ke Halaman Sebelumnya
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
              >
                Lihat Dashboard Saya
              </Link>
            )}
          </div>

          {/* Quick Start Guide */}
          <div className="text-left border-t border-gray-200 pt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
              🎯 Mulai Perjalanan Anda dengan TripGO:
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-r from-[#FD7E14] to-[#FF9500] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <TrainIcon />
                    <span className="ml-2">Cari & Pesan Tiket Kereta</span>
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Gunakan sistem pencarian kami untuk menemukan jadwal kereta terbaik dengan harga terbaik. Dapatkan kursi pilihan Anda dalam hitungan menit.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-r from-[#FD7E14] to-[#FF9500] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <TicketIcon />
                    <span className="ml-2">Kelola Pemesanan Anda</span>
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Akses semua tiket Anda di satu tempat. Lakukan perubahan jadwal, batalkan pesanan, atau cetak tiket kapan saja.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-r from-[#FD7E14] to-[#FF9500] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <UserIcon />
                    <span className="ml-2">Lengkapi Profil Perjalanan</span>
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Tambahkan data penumpang tetap untuk pemesanan yang lebih cepat. Simpan preferensi kursi dan jadwal favorit Anda.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-r from-[#FD7E14] to-[#FF9500] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <MapIcon />
                    <span className="ml-2">Nikmati Fitur Lengkap</span>
                  </h4>
                  <p className="text-gray-600 text-sm">
                    E-ticket mobile, notifikasi real-time, info delay kereta, dan akses lounge khusus member premium.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Auto Redirect Notice */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <p className="text-blue-800 font-semibold">
                {redirectUrl 
                  ? `Otomatis dialihkan dalam 5 detik...` 
                  : `Otomatis ke dashboard dalam 5 detik...`}
              </p>
            </div>
            <p className="text-blue-600 text-sm">
              {redirectUrl ? (
                <Link href={decodeURIComponent(redirectUrl)} className="underline hover:no-underline font-medium">
                  Klik di sini untuk langsung melanjutkan
                </Link>
              ) : (
                <Link href="/dashboard" className="underline hover:no-underline font-medium">
                  Klik di sini untuk langsung ke dashboard
                </Link>
              )}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 space-y-2 md:space-y-0">
              <div>
                <p>&copy; 2025 TripGO Kereta Api. Hak cipta dilindungi undang-undang.</p>
              </div>
              <div className="flex space-x-4">
                <Link href="/help" className="hover:text-blue-600">Bantuan</Link>
                <Link href="/privacy" className="hover:text-blue-600">Privasi</Link>
                <Link href="/terms" className="hover:text-blue-600">Syarat & Ketentuan</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}