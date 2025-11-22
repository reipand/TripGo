// app/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Icon Components
const PlaneIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const TrainIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const SwitchIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const LocationIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CalendarIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const SeatIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const TrendingUpIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const StarIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
  </svg>
);

const ShieldIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const ClockIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SupportIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Search Widget Component
const TravelSearchWidget = () => {
  const router = useRouter();
  const [transportType, setTransportType] = useState<'flight' | 'train'>('flight');
  const [tripType, setTripType] = useState<'oneWay' | 'roundTrip'>('oneWay');
  const [searchData, setSearchData] = useState({
    origin: 'Jakarta',
    destination: 'Surabaya',
    departureDate: '',
    returnDate: '',
    passengers: '1',
    class: 'economy'
  });

  const today = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

 const popularDestinations: Array<{
  code: string;
  name: string;
  price: string;
  type: 'flight' | 'train'; // Explicitly define the type
}> = [
  { 
    code: 'DPS', 
    name: 'Denpasar', 
    price: 'Rp 650rb',
    type: 'flight'
  },
  { 
    code: 'JOG', 
    name: 'Yogyakarta', 
    price: 'Rp 150rb',
    type: 'flight'
  },
  { 
    code: 'SUB', 
    name: 'Surabaya', 
    price: 'Rp 400rb',
    type: 'flight'
  },
  { 
    code: 'BDO', 
    name: 'Bandung', 
    price: 'Rp 300rb',
    type: 'flight'
  },
  { 
    code: 'GMR', 
    name: 'Gambir', 
    price: 'Rp 200rb',
    type: 'train'
  },
  { 
    code: 'PSE', 
    name: 'Pasar Senen', 
    price: 'Rp 180rb',
    type: 'train'
  },
];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      transport: transportType,
      type: tripType,
      from: searchData.origin,
      to: searchData.destination,
      depart: searchData.departureDate,
      ...(tripType === 'roundTrip' && { return: searchData.returnDate }),
      passengers: searchData.passengers,
      class: searchData.class
    }).toString();
    
    router.push(`/search?${query}`);
  };

  const handleQuickSearch = (destination: string, type: 'flight' | 'train') => {
    const query = new URLSearchParams({
      transport: type,
      type: 'oneWay',
      from: type === 'flight' ? 'Jakarta (CGK)' : 'Jakarta',
      to: destination,
      depart: today,
      passengers: '1',
      class: 'economy'
    }).toString();
    
    router.push(`/search?${query}`);
  };

  const switchLocations = () => {
    setSearchData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-4xl mx-auto border border-gray-200">
      {/* Transport Type Selector */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTransportType('flight')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
            transportType === 'flight'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <PlaneIcon className="w-5 h-5" />
          <span>Pesawat</span>
        </button>
        <button
          onClick={() => setTransportType('train')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center space-x-2 ${
            transportType === 'train'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <TrainIcon className="w-5 h-5" />
          <span>Kereta</span>
        </button>
      </div>

      {/* Trip Type Selector */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTripType('oneWay')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            tripType === 'oneWay'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Sekali Jalan
        </button>
        <button
          onClick={() => setTripType('roundTrip')}
          className={`px-6 py-2 rounded-lg font-medium transition-all ${
            tripType === 'roundTrip'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Pulang Pergi
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* Origin */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              {transportType === 'flight' ? 'Kota Asal atau Bandara' : 'Stasiun Asal'}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <LocationIcon />
              </div>
              <input
                type="text"
                placeholder={transportType === 'flight' ? "Kota atau bandara asal" : "Stasiun asal"}
                value={searchData.origin}
                onChange={(e) => setSearchData(prev => ({ ...prev, origin: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Switch Button */}
          <button
            type="button"
            onClick={switchLocations}
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-all shadow-lg border-2 border-white"
          >
            <SwitchIcon className="w-4 h-4" />
          </button>

          {/* Destination */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              {transportType === 'flight' ? 'Kota Tujuan atau Bandara' : 'Stasiun Tujuan'}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <LocationIcon />
              </div>
              <input
                type="text"
                placeholder={transportType === 'flight' ? "Kota atau bandara tujuan" : "Stasiun tujuan"}
                value={searchData.destination}
                onChange={(e) => setSearchData(prev => ({ ...prev, destination: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Departure Date */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Tanggal Pergi</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <CalendarIcon />
              </div>
              <input
                type="date"
                value={searchData.departureDate}
                onChange={(e) => setSearchData(prev => ({ ...prev, departureDate: e.target.value }))}
                min={today}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Return Date */}
          {tripType === 'roundTrip' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Tanggal Pulang</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <CalendarIcon />
                </div>
                <input
                  type="date"
                  value={searchData.returnDate}
                  onChange={(e) => setSearchData(prev => ({ ...prev, returnDate: e.target.value }))}
                  min={searchData.departureDate || today}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Passengers & Class */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Penumpang</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <UserIcon />
                </div>
                <select
                  value={searchData.passengers}
                  onChange={(e) => setSearchData(prev => ({ ...prev, passengers: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  {[1,2,3,4,5,6,7,8,9].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Penumpang' : 'Penumpang'}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Kelas</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <SeatIcon />
                </div>
                <select
                  value={searchData.class}
                  onChange={(e) => setSearchData(prev => ({ ...prev, class: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="economy">Economy</option>
                  <option value="premium_economy">Premium Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 text-lg flex items-center justify-center space-x-3 mt-6 shadow-lg"
        >
          {transportType === 'flight' ? <PlaneIcon className="w-5 h-5" /> : <TrainIcon className="w-5 h-5" />}
          <span>CARI {transportType === 'flight' ? 'TIKET PESAWAT' : 'TIKET KERETA'}</span>
        </button>
      </form>

      {/* Popular Destinations */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Destinasi Populer
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {popularDestinations.map((dest, index) => (
            <button
              key={index}
              onClick={() => handleQuickSearch(dest.name, dest.type)}
              className="group text-center p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
            >
              <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-all ${
                dest.type === 'flight' 
                  ? 'bg-gradient-to-br from-blue-400 to-purple-500 group-hover:from-blue-500 group-hover:to-purple-600'
                  : 'bg-gradient-to-br from-green-400 to-blue-500 group-hover:from-green-500 group-hover:to-blue-600'
              }`}>
                {dest.type === 'flight' ? <PlaneIcon className="w-4 h-4" /> : <TrainIcon className="w-4 h-4" />}
              </div>
              <div className="font-semibold text-gray-800 text-xs mb-1">{dest.code}</div>
              <div className="text-xs text-gray-600 mb-1 truncate">{dest.name}</div>
              <div className="text-orange-500 font-bold text-xs">{dest.price}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon, title, description, color = "blue" }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  color?: "blue" | "green" | "orange";
}) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600", 
    orange: "bg-orange-100 text-orange-600"
  };

  return (
    <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
      <div className={`w-14 h-14 ${colorClasses[color]} rounded-full flex items-center justify-center mx-auto mb-4`}>
        {icon}
      </div>
      <h3 className="font-bold text-gray-800 mb-2 text-lg">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

// Main Landing Page
export default function HomePage() {
  const features = [
    {
      icon: <TrendingUpIcon />,
      title: "Harga Terbaik",
      description: "Garansi harga terbaik dengan penawaran eksklusif",
      color: "orange" as const
    },
    {
      icon: <ShieldIcon />,
      title: "Aman & Terpercaya",
      description: "Transaksi aman dengan garansi uang kembali 100%",
      color: "blue" as const
    },
    {
      icon: <ClockIcon />,
      title: "Cepat & Mudah",
      description: "Pesan tiket hanya dalam hitungan menit",
      color: "green" as const
    },
    {
      icon: <SupportIcon />,
      title: "24/7 Support",
      description: "Tim support siap membantu kapan saja",
      color: "blue" as const
    }
  ];

  const promotions = [
    {
      title: "Flash Sale",
      discount: "50%",
      description: "Khusus pembelian melalui app",
      color: "bg-red-500"
    },
    {
      title: "New User",
      discount: "Rp 100rb",
      description: "Voucher untuk pengguna baru",
      color: "bg-green-500"
    },
    {
      title: "Weekend Deal",
      discount: "30%",
      description: "Setiap akhir pekan",
      color: "bg-purple-500"
    }
  ];

  const airlines = [
    { name: "Garuda Indonesia", rating: 5 },
    { name: "Lion Air", rating: 4 },
    { name: "Citilink", rating: 4 },
    { name: "AirAsia", rating: 4 },
    { name: "Batik Air", rating: 5 },
    { name: "Sriwijaya Air", rating: 3 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 py-12">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10 container mx-auto px-4">
          <div className="text-center mb-8 text-white">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg">
              Hi Kamu! Mau ke mana?
            </h1>
            <p className="text-xl text-blue-100 drop-shadow-md max-w-2xl mx-auto">
              Pesan tiket pesawat & kereta dengan harga terbaik. Perjalananmu, prioritas kami.
            </p>
          </div>
          
          <TravelSearchWidget />
        </div>
      </section>

      {/* Promotions Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Promo Spesial</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {promotions.map((promo, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 text-center hover:shadow-lg transition-all duration-300">
                <div className={`w-16 h-16 ${promo.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl`}>
                  {promo.discount}
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-2">{promo.title}</h3>
                <p className="text-gray-600 text-sm">{promo.description}</p>
                <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  Klaim Sekarang
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Kenapa Memilih TripGo?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Platform terpercaya untuk memesan tiket pesawat dan kereta dengan pengalaman terbaik
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Airlines Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Maskapai Partner Kami
            </h2>
            <p className="text-gray-600">
              Bekerja sama dengan maskapai terbaik untuk kenyamanan Anda
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-6xl mx-auto">
            {airlines.map((airline, index) => (
              <div key={index} className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {airline.name.split(' ').map(word => word[0]).join('')}
                  </div>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2 text-sm">{airline.name}</h4>
                <div className="flex items-center justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-3 h-3 ${i < airline.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Download Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto">
            <div className="md:w-1/2 mb-8 md:mb-0 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-4">Download Aplikasi TripGo</h2>
              <p className="text-blue-100 mb-6 text-lg">
                Dapatkan pengalaman memesan yang lebih baik dengan fitur eksklusif hanya di aplikasi mobile
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                  <span>Download di Play Store</span>
                </button>
                <button className="bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                  <span>Download di App Store</span>
                </button>
              </div>
            </div>
            <div className="md:w-2/5 relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <h3 className="font-bold text-lg mb-4">Keuntungan di Aplikasi:</h3>
                <ul className="space-y-3 text-blue-100">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Promo dan voucher eksklusif</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Notifikasi harga terbaik</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Pemesanan lebih cepat</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Riwayat pemesanan mudah</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}