'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// --- Tipe Data ---
interface Train {
  id: string;
  train_id: string;
  train_number: string;
  train_name: string;
  train_type: string;
  operator: string;
  origin_station: {
    code: string;
    name: string;
    city: string;
  };
  destination_station: {
    code: string;
    name: string;
    city: string;
  };
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  duration: string;
  travel_date: string;
  status: string;
  harga: number;
  price: number;
  stok_kursi: number;
  availableSeats: number;
  class_type: string;
  trainClass: string;
  facilities: string[];
  insurance: number;
  seat_type: string;
  route_type: string;
  // Fields untuk kompatibilitas tambahan
  trainName?: string;
  originStation?: string;
  originCity?: string;
  destinationStation?: string;
  destinationCity?: string;
  departureTime?: string;
  arrivalTime?: string;
  trainType?: string;
  schedule_id?: string;
  isRefundable?: boolean;
  isCheckinAvailable?: boolean;
  isBestDeal?: boolean;
  isHighDemand?: boolean;
  warning?: string;
}

// --- Komponen Ikon ---
const TrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block -mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
  </svg>
);

const SortIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
    <path d="M3 3h14a1 1 0 010 2H3a1 1 0 010-2zm0 6h14a1 1 0 010 2H3a1 1 0 010-2zm0 6h10a1 1 0 010 2H3a1 1 0 010-2z" />
  </svg>
);

// --- Helper Functions ---
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}j ${mins}m`;
};

const parseDurationToMinutes = (durationStr: string): number => {
  const match = durationStr.match(/(\d+)j\s*(\d+)m/);
  if (match) {
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    return hours * 60 + minutes;
  }
  return 0;
};

const getTrainTypeColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'eksekutif': 
    case 'executive': 
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'bisnis':
    case 'business':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'ekonomi':
    case 'economy':
      return 'bg-gray-100 text-gray-800 border border-gray-200';
    default: return 'bg-orange-100 text-orange-800 border border-orange-200';
  }
};

const getFacilitiesByClass = (trainClass: string): string[] => {
  switch (trainClass.toLowerCase()) {
    case 'eksekutif':
    case 'executive':
      return ['AC', 'Makanan', 'WiFi', 'Toilet Bersih', 'Stop Kontak', 'TV', 'Pemandangan'];
    case 'bisnis':
    case 'business':
      return ['AC', 'Makanan Ringan', 'Toilet Bersih', 'Stop Kontak', 'Pemandangan'];
    case 'ekonomi':
    case 'economy':
      return ['AC', 'Toilet', 'Kipas Angin'];
    default:
      return ['AC', 'Toilet'];
  }
};

// --- Komponen Kartu Tiket Kereta ---
const TrainTicketCard = React.memo(({ train, passengers }: { train: Train, passengers: number }) => {
  const router = useRouter();
  const [selected, setSelected] = useState(false);
  
  // Format waktu untuk tampilan
  const departureTime = train.departure_time ? 
    train.departure_time.split(':').slice(0, 2).join(':') : 
    train.departureTime || '--:--';
    
  const arrivalTime = train.arrival_time ? 
    train.arrival_time.split(':').slice(0, 2).join(':') : 
    train.arrivalTime || '--:--';
  
  // Durasi
  const duration = train.duration || 
    (train.duration_minutes ? formatDuration(train.duration_minutes) : '');
  
  const kotaAsal = train.origin_station?.city || train.originCity || '';
  const kotaTujuan = train.destination_station?.city || train.destinationCity || '';
  
  const availableSeats = train.stok_kursi || train.availableSeats || 0;
  const isSoldOut = availableSeats <= 0;
  const isLimited = availableSeats > 0 && availableSeats <= 5;
  const isAlmostSoldOut = availableSeats > 5 && availableSeats <= 10;
  
  const trainName = train.train_name || train.trainName || '';
  const trainType = train.class_type || train.trainClass || train.train_type || '';
  const price = train.harga || train.price || 0;
  const trainCode = train.train_number || '';

  const handleSelect = () => {
    if (isSoldOut) return;
    setSelected(!selected);
  };

  const handleContinue = () => {
    if (!selected || isSoldOut) return;

    // Simpan data ke sessionStorage untuk digunakan di halaman booking
    const bookingData = {
      id: train.id,
      scheduleId: train.schedule_id || train.id,
      trainId: train.train_id || train.id,
      trainNumber: trainCode,
      trainName,
      trainType: train.class_type || trainType,
      departureTime,
      arrivalTime,
      duration,
      origin: train.origin_station?.name || kotaAsal,
      destination: train.destination_station?.name || kotaTujuan,
      originCode: train.origin_station?.code || '',
      destinationCode: train.destination_station?.code || '',
      originCity: train.origin_station?.city || kotaAsal,
      destinationCity: train.destination_station?.city || kotaTujuan,
      departureDate: train.travel_date || '',
      selectedClass: train.class_type || trainType,
      price,
      passengers,
      totalAmount: price * passengers,
      availableSeats,
      isRefundable: train.isRefundable !== false,
      isCheckinAvailable: train.isCheckinAvailable !== false,
      savedAt: new Date().toISOString()
    };
    
    sessionStorage.setItem('selectedTrain', JSON.stringify(bookingData));
    console.log('💾 Saved train to sessionStorage:', bookingData);
    
    // Redirect ke halaman booking
    router.push('/booking');
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 mb-6 ${
      selected ? 'border-[#FD7E14] border-2' : 'border-gray-200'
    } ${isSoldOut ? 'opacity-75' : ''}`}>
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              selected ? 'border-[#FD7E14] bg-[#FD7E14]' : 'border-gray-300'
            }`}>
              {selected && (
                <div className="w-2 h-2 rounded-full bg-white"></div>
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {trainName} {trainCode}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded ${getTrainTypeColor(trainType)}`}>
                  {trainType}
                </span>
                {train.isBestDeal && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    💰 Best Deal
                  </span>
                )}
                {train.isHighDemand && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    🔥 High Demand
                  </span>
                )}
                {isAlmostSoldOut && !isLimited && (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    ⚠️ Almost Sold Out
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-[#FD7E14]">
              Rp {price.toLocaleString('id-ID')}
            </div>
            <div className="text-sm text-gray-500">per person</div>
          </div>
        </div>
      </div>

      {/* Rute dan waktu */}
      <div className="p-5">
        <div className="flex items-center justify-between">
          {/* Departure */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{departureTime}</div>
            <div className="text-sm font-medium text-gray-700 mt-1">{train.origin_station?.code || ''}</div>
            <div className="text-xs text-gray-500">{kotaAsal}</div>
          </div>
          
          {/* Duration */}
          <div className="flex flex-col items-center">
            <div className="text-sm text-gray-600 mb-2">{duration}</div>
            <div className="flex items-center w-64">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <div className="flex-1 h-0.5 bg-gray-300 mx-3"></div>
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H3a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <div className="flex-1 h-0.5 bg-gray-300 mx-3"></div>
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            </div>
            <div className="flex items-center justify-center mt-1">
              <svg className="w-3 h-3 text-gray-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-gray-500">Langsung</p>
            </div>
          </div>
          
          {/* Arrival */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{arrivalTime}</div>
            <div className="text-sm font-medium text-gray-700 mt-1">{train.destination_station?.code || ''}</div>
            <div className="text-xs text-gray-500">{kotaTujuan}</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isSoldOut ? (
              <span className="text-red-600 font-medium flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Sold Out
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className={`font-medium ${
                  isLimited ? 'text-red-600' : 
                  isAlmostSoldOut ? 'text-yellow-600' : 
                  'text-gray-700'
                }`}>
                  {availableSeats} seats left
                </span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {(train.isRefundable !== false) && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                100% Refund
              </span>
            )}
            {(train.isCheckinAvailable !== false) && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                </svg>
                E-Boarding
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      {selected && !isSoldOut && (
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total for {passengers} passenger{passengers > 1 ? 's' : ''}</div>
              <div className="text-2xl font-bold text-gray-900">
                Rp {(price * passengers).toLocaleString('id-ID')}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Selected: <span className="font-medium">{trainType}</span> • 
                <span className="ml-2">Departure: {train.travel_date ? new Date(train.travel_date).toLocaleDateString('id-ID') : 'Today'}</span>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button 
                onClick={() => setSelected(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Change Class
              </button>
              
              <button 
                onClick={handleContinue}
                className="px-6 py-2.5 text-sm font-semibold bg-[#FD7E14] text-white rounded-lg hover:bg-[#E06700] transition-colors flex items-center gap-2"
              >
                <span>Continue to Booking</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TrainTicketCard.displayName = 'TrainTicketCard';

// --- Filter and Sort Component ---
const FilterAndSort = React.memo(({ 
  onSort, 
  onFilter, 
  activeSort, 
  activeFilter 
}: { 
  onSort: (sortType: string) => void, 
  onFilter: (filterType: string) => void,
  activeSort: string,
  activeFilter: string
}) => {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center text-sm font-semibold text-gray-700 mb-3">
            <SortIcon /> Sort By:
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => onSort('departure-asc')} 
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeSort === 'departure-asc'
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Earliest Departure
            </button>
            <button 
              onClick={() => onSort('price-asc')} 
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeSort === 'price-asc'
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Lowest Price
            </button>
            <button 
              onClick={() => onSort('duration-asc')} 
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeSort === 'duration-asc'
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Shortest Duration
            </button>
            <button 
              onClick={() => onSort('departure-desc')} 
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeSort === 'departure-desc'
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Latest Departure
            </button>
          </div>
        </div>
        
        <div>
          <div className="flex items-center text-sm font-semibold text-gray-700 mb-3">
            <FilterIcon /> Filter By Class:
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => onFilter('all')} 
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeFilter === 'all'
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Classes
            </button>
            <button 
              onClick={() => onFilter('executive')} 
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeFilter === 'executive'
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Executive
            </button>
            <button 
              onClick={() => onFilter('business')} 
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeFilter === 'business'
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Business
            </button>
            <button 
              onClick={() => onFilter('economy')} 
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                activeFilter === 'economy'
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Economy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

FilterAndSort.displayName = 'FilterAndSort';

// --- Komponen Utama Hasil Pencarian ---
const TrainResults = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [allTrains, setAllTrains] = useState<Train[]>([]);
  const [filteredTrains, setFilteredTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState('departure-asc');
  const [filterType, setFilterType] = useState('all');
  
  const origin = searchParams.get('origin') || 'BD';
  const destination = searchParams.get('destination') || 'GMR';
  const departureDate = searchParams.get('departureDate') || '2026-01-07';
  const passengers = parseInt(searchParams.get('passengers') || '1');
  const tripType = searchParams.get('tripType') || 'oneWay';

  // Data dummy sebagai fallback
  const generateDummyTrains = useCallback((origin: string, destination: string, date: string): Train[] => {
    const stations: Record<string, { name: string, city: string }> = {
      'GMR': { name: 'Stasiun Gambir', city: 'Jakarta' },
      'BD': { name: 'Stasiun Bandung', city: 'Bandung' },
      'SBY': { name: 'Stasiun Surabaya Gubeng', city: 'Surabaya' },
      'SMG': { name: 'Stasiun Semarang Tawang', city: 'Semarang' },
      'YK': { name: 'Stasiun Yogyakarta', city: 'Yogyakarta' },
    };

    const originInfo = stations[origin] || { name: `Stasiun ${origin}`, city: origin };
    const destinationInfo = stations[destination] || { name: `Stasiun ${destination}`, city: destination };

    const dummyTrains: Train[] = [
      {
        id: 'parahyangan-131',
        train_id: 'train-001',
        train_number: '131',
        train_name: 'Parahyangan',
        train_type: 'Executive',
        operator: 'PT KAI',
        origin_station: {
          code: origin,
          name: originInfo.name,
          city: originInfo.city
        },
        destination_station: {
          code: destination,
          name: destinationInfo.name,
          city: destinationInfo.city
        },
        departure_time: '05:00:00',
        arrival_time: '08:01:00',
        duration_minutes: 181,
        duration: '3j 1m',
        travel_date: date,
        status: 'scheduled',
        harga: 265000,
        price: 265000,
        stok_kursi: 15,
        availableSeats: 15,
        class_type: 'Executive',
        trainClass: 'Executive',
        facilities: ['AC', 'Makanan', 'WiFi', 'Toilet Bersih', 'Stop Kontak', 'TV', 'Pemandangan'],
        insurance: 5000,
        seat_type: 'AD',
        route_type: 'Direct',
        schedule_id: 'schedule-001',
        isRefundable: true,
        isCheckinAvailable: true,
        isBestDeal: true,
        isHighDemand: false
      },
      {
        id: 'parahyangan-135',
        train_id: 'train-002',
        train_number: '135',
        train_name: 'Parahyangan',
        train_type: 'Executive',
        operator: 'PT KAI',
        origin_station: {
          code: origin,
          name: originInfo.name,
          city: originInfo.city
        },
        destination_station: {
          code: destination,
          name: destinationInfo.name,
          city: destinationInfo.city
        },
        departure_time: '08:01:00',
        arrival_time: '11:02:00',
        duration_minutes: 181,
        duration: '3j 1m',
        travel_date: date,
        status: 'scheduled',
        harga: 265000,
        price: 265000,
        stok_kursi: 3,
        availableSeats: 3,
        class_type: 'Executive',
        trainClass: 'Executive',
        facilities: ['AC', 'Makanan', 'WiFi', 'Toilet Bersih', 'Stop Kontak', 'TV', 'Pemandangan'],
        insurance: 5000,
        seat_type: 'AD',
        route_type: 'Direct',
        schedule_id: 'schedule-002',
        isRefundable: true,
        isCheckinAvailable: true,
        isBestDeal: false,
        isHighDemand: true,
        warning: 'High demand, sold out quickly!'
      },
      {
        id: 'argo-wilis-145',
        train_id: 'train-003',
        train_number: '145',
        train_name: 'Argo Wilis',
        train_type: 'Executive',
        operator: 'PT KAI',
        origin_station: {
          code: origin,
          name: originInfo.name,
          city: originInfo.city
        },
        destination_station: {
          code: destination,
          name: destinationInfo.name,
          city: destinationInfo.city
        },
        departure_time: '07:30:00',
        arrival_time: '10:45:00',
        duration_minutes: 195,
        duration: '3j 15m',
        travel_date: date,
        status: 'scheduled',
        harga: 285000,
        price: 285000,
        stok_kursi: 23,
        availableSeats: 23,
        class_type: 'Executive',
        trainClass: 'Executive',
        facilities: ['AC', 'Makanan', 'WiFi', 'Toilet Bersih', 'Stop Kontak', 'TV', 'Pemandangan'],
        insurance: 5000,
        seat_type: 'AD',
        route_type: 'Direct',
        schedule_id: 'schedule-003',
        isRefundable: true,
        isCheckinAvailable: true,
        isBestDeal: false,
        isHighDemand: false
      }
    ];

    return dummyTrains;
  }, []);

  // Fetch data dari API
  useEffect(() => {
    const fetchTrains = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching trains with params:', {
          origin,
          destination,
          departureDate,
          passengers
        });

        // Coba multiple API endpoints
        const endpoints = [
          `/api/search/train?origin=${origin}&destination=${destination}&departureDate=${departureDate}&passengers=${passengers}`,
          `/api/trains/search?origin=${origin}&destination=${destination}&date=${departureDate}&passengers=${passengers}`,
          `/api/search/trains?origin=${origin}&destination=${destination}&departureDate=${departureDate}&passengers=${passengers}`
        ];

        let apiData = null;
        
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${endpoint}`);
            const response = await fetch(endpoint);
            
            if (response.ok) {
              const data = await response.json();
              console.log(`✅ Success from ${endpoint}:`, data);
              
              // Handle different response formats
              if (Array.isArray(data)) {
                apiData = data;
              } else if (data.data && Array.isArray(data.data)) {
                apiData = data.data;
              } else if (data.success && data.data && Array.isArray(data.data)) {
                apiData = data.data;
              }
              
              if (apiData) break;
            }
          } catch (endpointError) {
            console.log(`❌ Failed from ${endpoint}:`, endpointError);
          }
        }

        if (apiData && apiData.length > 0) {
          const formattedData: Train[] = apiData.map((item: any) => ({
            id: item.id || `train-${Date.now()}-${Math.random()}`,
            train_id: item.train_id || item.id || '',
            train_number: item.train_number || item.train_code || '',
            train_name: item.train_name || item.trainName || '',
            train_type: item.train_type || item.trainType || '',
            operator: item.operator || 'PT KAI',
            origin_station: item.origin_station || {
              code: origin,
              name: item.originStation || origin,
              city: item.originCity || origin
            },
            destination_station: item.destination_station || {
              code: destination,
              name: item.destinationStation || destination,
              city: item.destinationCity || destination
            },
            departure_time: item.departure_time || item.departureTime || '00:00:00',
            arrival_time: item.arrival_time || item.arrivalTime || '00:00:00',
            duration_minutes: item.duration_minutes || 
                             (item.duration ? parseDurationToMinutes(item.duration) : 180),
            duration: item.duration || formatDuration(item.duration_minutes || 180),
            travel_date: item.travel_date || item.departureDate || departureDate,
            status: item.status || 'scheduled',
            harga: item.harga || item.price || 0,
            price: item.harga || item.price || 0,
            stok_kursi: item.stok_kursi || item.availableSeats || 0,
            availableSeats: item.stok_kursi || item.availableSeats || 0,
            class_type: item.class_type || item.trainClass || item.train_type || 'Executive',
            trainClass: item.class_type || item.trainClass || item.train_type || 'Executive',
            facilities: item.facilities || getFacilitiesByClass(item.class_type || item.trainClass || 'Executive'),
            insurance: item.insurance || 5000,
            seat_type: item.seat_type || item.seatType || 'AD',
            route_type: item.route_type || item.routeType || 'Direct',
            schedule_id: item.schedule_id || item.id,
            isRefundable: true,
            isCheckinAvailable: true,
            isBestDeal: false,
            isHighDemand: (item.stok_kursi || 0) < 10
          }));
          
          setAllTrains(formattedData);
          setFilteredTrains(formattedData);
          console.log('✅ API data loaded:', formattedData.length, 'trains');
        } else {
          // Fallback to dummy data
          console.log('⚠️ No API data, using dummy data');
          const dummyTrains = generateDummyTrains(origin, destination, departureDate);
          setAllTrains(dummyTrains);
          setFilteredTrains(dummyTrains);
        }
        
      } catch (error: any) {
        console.error('❌ Error fetching trains:', error);
        setError('Gagal memuat data kereta. Menampilkan data contoh.');
        
        // Fallback to dummy data
        const dummyTrains = generateDummyTrains(origin, destination, departureDate);
        setAllTrains(dummyTrains);
        setFilteredTrains(dummyTrains);
      } finally {
        setLoading(false);
      }
    };

    fetchTrains();
  }, [origin, destination, departureDate, passengers, generateDummyTrains]);

  // Apply filters and sort
  useEffect(() => {
    let result = [...allTrains];
    
    // Apply filter by class
    if (filterType !== 'all') {
      result = result.filter(train => 
        train.class_type.toLowerCase().includes(filterType.toLowerCase()) ||
        train.trainClass.toLowerCase().includes(filterType.toLowerCase())
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortType) {
        case 'departure-asc':
          return (a.departure_time || '').localeCompare(b.departure_time || '');
        case 'departure-desc':
          return (b.departure_time || '').localeCompare(a.departure_time || '');
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'duration-asc':
          return (a.duration_minutes || 0) - (b.duration_minutes || 0);
        default:
          return 0;
      }
    });
    
    setFilteredTrains(result);
  }, [sortType, filterType, allTrains]);

  const formatDateDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const handleRetrySearch = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Searching for available trains...</p>
          <p className="text-sm text-gray-500">Please wait while we find the best options for you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center group">
              <div className="w-10 h-10 bg-[#FD7E14] rounded-lg flex items-center justify-center group-hover:bg-[#E06700] transition-colors">
                <span className="text-white font-bold text-lg">TG</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-800">TripGo</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href="/my-bookings" className="text-gray-600 hover:text-gray-900 transition-colors">My Bookings</Link>
              <button className="px-4 py-2 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors">
                Help
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-yellow-700">
                  <span className="font-semibold">Perhatian:</span> {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Summary */}
        <div className="mb-8 bg-white rounded-xl shadow p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Hasil Pencarian Kereta <TrainIcon /></h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">{origin}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="font-semibold">{destination}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>{formatDateDisplay(departureDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>{passengers} Penumpang{passengers > 1 ? '' : ''}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleRetrySearch}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Ubah Pencarian
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6 sticky top-6">
              <h2 className="text-lg font-bold text-gray-800 mb-6">Filter & Sort</h2>
              
              <FilterAndSort 
                onSort={setSortType}
                onFilter={setFilterType}
                activeSort={sortType}
                activeFilter={filterType}
              />
              
              {/* Features */}
              <div className="space-y-4 mt-8">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-blue-800">Print e-boarding pass</h4>
                      <p className="text-xs text-blue-600 mt-1">
                        Check in online. Skip the queue and enjoy a smoother journey.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-green-800">100% Refund</h4>
                      <p className="text-xs text-green-600 mt-1">
                        Uncertain about travel date? Claim 100% refund for any reason.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {filteredTrains.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak ada kereta yang ditemukan</h3>
                <p className="text-gray-500 mb-6">Silakan ubah kriteria pencarian Anda atau coba tanggal lain</p>
                <button
                  onClick={handleRetrySearch}
                  className="px-4 py-2 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors"
                >
                  Cari Lagi
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      Menampilkan <span className="font-semibold text-gray-800">{filteredTrains.length}</span> kereta
                    </p>
                    <p className="text-xs text-gray-500">
                      Klik pada kereta untuk memilih, kemudian lanjutkan ke pemesanan
                    </p>
                  </div>
                  
                  {/* Sort Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Diurutkan berdasarkan:</span>
                    <span className="text-sm font-medium text-[#FD7E14]">
                      {sortType === 'departure-asc' ? 'Keberangkatan Tercepat' :
                       sortType === 'departure-desc' ? 'Keberangkatan Terlambat' :
                       sortType === 'price-asc' ? 'Harga Terendah' :
                       'Durasi Terpendek'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {filteredTrains.map((train) => (
                    <TrainTicketCard
                      key={train.id}
                      train={train}
                      passengers={passengers}
                    />
                  ))}
                </div>
                
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1">Catatan Penting:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Pemesanan akan dikonfirmasi setelah pembayaran berhasil</li>
                        <li>• E-ticket akan dikirim ke email setelah pembayaran</li>
                        <li>• Check-in online tersedia 2 jam sebelum keberangkatan</li>
                        <li>• Pembatalan sesuai ketentuan KAI</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#FD7E14] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">TG</span>
                </div>
                <span className="ml-3 text-xl font-bold">TripGo</span>
              </div>
              <p className="text-gray-400 mt-2 text-sm">Platform booking kereta api terpercaya</p>
            </div>
            
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Kebijakan Privasi</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Syarat & Ketentuan</Link>
              <Link href="/faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</Link>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} TripGo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- Error Boundary ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode, fallback: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error di komponen:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// --- Export Utama ---
export default function SearchTrainsPage() {
  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-600 mb-6">Maaf, terjadi masalah saat memuat halaman pencarian.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gradient-to-r from-[#FD7E14] to-[#FF922B] text-white font-semibold rounded-lg hover:from-[#E06700] hover:to-[#F08C00] transition-all duration-300 shadow"
          >
            Muat Ulang Halaman
          </button>
        </div>
      </div>
    }>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat hasil pencarian...</p>
          </div>
        </div>
      }>
        <TrainResults />
      </Suspense>
    </ErrorBoundary>
  );
}