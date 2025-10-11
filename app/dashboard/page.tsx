'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// --- Komponen Ikon ---
const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PlaneIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const HeartIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// --- Komponen Kartu Booking ---
const BookingCard = ({ booking }: { booking: any }) => (
  <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-3">
        <img 
          src={`/images/airline-logo-${booking.airline.toLowerCase()}.png`} 
          alt={`${booking.airline} logo`} 
          className="w-8 h-8 object-contain"
        />
        <div>
          <h4 className="font-semibold text-gray-800">{booking.airline}</h4>
          <p className="text-sm text-gray-500">{booking.flightNumber}</p>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {booking.status === 'confirmed' ? 'Dikonfirmasi' :
         booking.status === 'pending' ? 'Menunggu' : 'Dibatalkan'}
      </span>
    </div>
    
    <div className="flex items-center justify-between text-sm">
      <div>
        <p className="font-medium text-gray-800">{booking.origin} → {booking.destination}</p>
        <p className="text-gray-500">{booking.departureDate}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-orange-500">Rp {booking.totalPrice.toLocaleString('id-ID')}</p>
        <p className="text-gray-500">{booking.passengerCount} penumpang</p>
      </div>
    </div>
    
    <div className="mt-3 pt-3 border-t border-gray-200 flex space-x-2">
      <button className="flex-1 bg-blue-500 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-600 transition-colors">
        Lihat Detail
      </button>
      <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200 transition-colors">
        Download
      </button>
    </div>
  </div>
);

// --- Halaman Dashboard ---
export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');
    const storedUserData = localStorage.getItem('userData');
    
    if (!token || !email) {
      router.push('/auth/login');
      return;
    }

    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userData');
    router.push('/');
  };

  // Mock data untuk bookings
  const mockBookings = [
    {
      id: 'TRP123456789',
      airline: 'Garuda',
      flightNumber: 'GA-123',
      origin: 'Jakarta',
      destination: 'Bali',
      departureDate: '15 Jan 2024',
      totalPrice: 1425000,
      passengerCount: 1,
      status: 'confirmed'
    },
    {
      id: 'TRP987654321',
      airline: 'Lion',
      flightNumber: 'JT-456',
      origin: 'Jakarta',
      destination: 'Yogyakarta',
      departureDate: '20 Jan 2024',
      totalPrice: 980000,
      passengerCount: 2,
      status: 'pending'
    }
  ];

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/logo_tg2.svg"
                alt="TripGO Logo"
                width={120}
                height={32}
              />
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Halo, {userData.firstName}!</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserIcon />
                </div>
                <h3 className="font-bold text-lg text-gray-800">{userData.firstName} {userData.lastName}</h3>
                <p className="text-gray-500">{userData.email}</p>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'bookings' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <PlaneIcon />
                  <span>Pesanan Saya</span>
                </button>
                <button
                  onClick={() => setActiveTab('favorites')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'favorites' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <HeartIcon />
                  <span>Favorit</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <SettingsIcon />
                  <span>Pengaturan</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Pesanan Saya</h2>
                <div className="space-y-4">
                  {mockBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Favorit</h2>
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <HeartIcon />
                  <h3 className="text-lg font-semibold text-gray-800 mt-4">Belum ada favorit</h3>
                  <p className="text-gray-500 mt-2">Simpan destinasi favorit Anda untuk akses cepat</p>
                  <Link href="/" className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    Jelajahi Destinasi
                  </Link>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan Profil</h2>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Depan</label>
                        <input
                          type="text"
                          defaultValue={userData.firstName}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Belakang</label>
                        <input
                          type="text"
                          defaultValue={userData.lastName}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        defaultValue={userData.email}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                      <input
                        type="tel"
                        defaultValue={userData.phone}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Simpan Perubahan
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
