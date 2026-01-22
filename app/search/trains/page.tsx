// app/search/trains/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Helper functions
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

const originCodeToName = (code: string): string => {
  const stations: Record<string, string> = {
    'BD': 'Bandung',
    'GMR': 'Gambir',
    'SMC': 'Semarang',
    'ML': 'Malang',
    'SOL': 'Solo',
    'SBY': 'Surabaya',
    'YK': 'Yogyakarta',
    'BDO': 'Bandung',
    'JKT': 'Jakarta',
    'TNG': 'Tangerang',
    'BKS': 'Bekasi',
    'origin': 'Bandung', // Fallback
    'destination': 'Gambir' // Fallback
  };
  return stations[code] || code;
};

// Custom hook untuk fetch trains
const useFetchTrains = (
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number
) => {
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Validasi input
        if (!origin || !destination || !departureDate) {
          console.log('⚠️ Invalid search parameters');
          setTrains(generateDummyTrains(origin, destination, departureDate));
          setLoading(false);
          return;
        }

        // Coba multiple API endpoints
        const endpoints = [
          `/api/search/train?origin=${origin}&destination=${destination}&departureDate=${departureDate}&passengers=${passengers}`,
          `/api/trains/search?origin=${origin}&destination=${destination}&date=${departureDate}&passengers=${passengers}`,
          `/api/search/trains?origin=${origin}&destination=${destination}&departureDate=${departureDate}&passengers=${passengers}`
        ];

        let apiData = null;
        let lastError = null;
        
        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 Trying endpoint: ${endpoint}`);
            const response = await fetch(endpoint, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
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
              } else if (data.trains && Array.isArray(data.trains)) {
                apiData = data.trains;
              }
              
              if (apiData) {
                console.log(`🎉 Found ${apiData.length} trains from ${endpoint}`);
                break;
              }
            } else {
              console.log(`❌ Endpoint ${endpoint} returned ${response.status}`);
            }
          } catch (endpointError) {
            lastError = endpointError;
            console.log(`❌ Failed from ${endpoint}:`, endpointError);
          }
        }

        if (apiData && apiData.length > 0) {
          // Format data sesuai dengan struktur yang diharapkan TrainCard
          const formattedData = apiData.map((item: any, index: number) => {
            // Parse waktu untuk perhitungan duration yang lebih akurat
            const departureTime = item.departure_time || item.departureTime || '08:00';
            const arrivalTime = item.arrival_time || item.arrivalTime || '13:00';
            
            // Hitung duration dari waktu
            const calculateDuration = (dep: string, arr: string) => {
              try {
                const [depHours, depMinutes] = dep.split(':').map(Number);
                const [arrHours, arrMinutes] = arr.split(':').map(Number);
                
                let totalMinutes = (arrHours * 60 + arrMinutes) - (depHours * 60 + depMinutes);
                if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle next day arrival
                
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return `${hours}j ${minutes}m`;
              } catch {
                return item.duration || '5j 0m';
              }
            };
            
            const duration = calculateDuration(departureTime, arrivalTime);
            
            return {
              id: item.id || item.train_id || `train-${Date.now()}-${index}`,
              train_number: item.train_number || item.train_code || item.trainNumber || '131',
              train_name: item.train_name || item.trainName || 'Parahyangan',
              departure_time: departureTime,
              arrival_time: arrivalTime,
              duration: duration,
              duration_minutes: item.duration_minutes || item.travelTime || 300,
              origin_station: {
                code: origin,
                name: item.origin_station?.name || item.origin || originCodeToName(origin),
                city: item.origin_station?.city || item.originCity || originCodeToName(origin)
              },
              destination_station: {
                code: destination,
                name: item.destination_station?.name || item.destination || originCodeToName(destination),
                city: item.destination_station?.city || item.destinationCity || originCodeToName(destination)
              },
              classes: item.classes || [{
                class_type: item.class_type || item.trainClass || 'Executive',
                price: item.harga || item.price || item.fare || 265000,
                availableSeats: item.stok_kursi || item.availableSeats || item.seatAvailability || 10,
                facilities: item.facilities || ['AC', 'Makanan', 'WiFi', 'Stop Kontak'],
                insurance: item.insurance || 5000
              }],
              // Additional properties
              schedule_id: item.schedule_id || item.scheduleId,
              train_type: item.train_type || item.trainType,
              isAvailable: item.isAvailable !== false
            };
          });
          
          setTrains(formattedData);
          console.log('✅ API data loaded:', formattedData.length, 'trains');
        } else {
          // Fallback to dummy data
          console.log('⚠️ No API data, using dummy data. Last error:', lastError);
          const dummyTrains = generateDummyTrains(origin, destination, departureDate);
          setTrains(dummyTrains);
        }
        
      } catch (error: any) {
        console.error('❌ Error fetching trains:', error);
        setError('Gagal memuat data kereta. Menampilkan data contoh.');
        
        // Fallback to dummy data
        const dummyTrains = generateDummyTrains(origin, destination, departureDate);
        setTrains(dummyTrains);
      } finally {
        setLoading(false);
      }
    };

    fetchTrains();
  }, [origin, destination, departureDate, passengers]);

  return { trains, loading, error };
};

// Generate dummy data sebagai fallback
const generateDummyTrains = (origin: string, destination: string, date: string) => {
  console.log('🎲 Generating dummy trains for:', { origin, destination, date });
  
  const dummyTrains = [
    {
      id: 'parahyangan-131',
      train_number: '131',
      train_name: 'Parahyangan',
      departure_time: '05:00',
      arrival_time: '10:00',
      duration: '5j 0m',
      duration_minutes: 300,
      origin_station: {
        code: origin,
        name: `Stasiun ${originCodeToName(origin)}`,
        city: originCodeToName(origin)
      },
      destination_station: {
        code: destination,
        name: `Stasiun ${originCodeToName(destination)}`,
        city: originCodeToName(destination)
      },
      classes: [
        {
          class_type: 'Executive',
          price: 265000,
          availableSeats: 15,
          facilities: ['AC', 'Makanan', 'WiFi', 'Stop Kontak', 'Bantal'],
          insurance: 5000
        },
        {
          class_type: 'Business',
          price: 185000,
          availableSeats: 25,
          facilities: ['AC', 'Makanan Ringan', 'Stop Kontak'],
          insurance: 5000
        }
      ],
      train_type: 'Executive',
      isAvailable: true
    },
    {
      id: 'parahyangan-135',
      train_number: '135',
      train_name: 'Parahyangan',
      departure_time: '08:00',
      arrival_time: '13:00',
      duration: '5j 0m',
      duration_minutes: 300,
      origin_station: {
        code: origin,
        name: `Stasiun ${originCodeToName(origin)}`,
        city: originCodeToName(origin)
      },
      destination_station: {
        code: destination,
        name: `Stasiun ${originCodeToName(destination)}`,
        city: originCodeToName(destination)
      },
      classes: [
        {
          class_type: 'Executive',
          price: 265000,
          availableSeats: 8,
          facilities: ['AC', 'Makanan', 'WiFi', 'Stop Kontak'],
          insurance: 5000
        },
        {
          class_type: 'Economy',
          price: 125000,
          availableSeats: 40,
          facilities: ['AC', 'Snack'],
          insurance: 5000
        }
      ],
      train_type: 'Executive',
      isAvailable: true
    },
    {
      id: 'argo-wilis-145',
      train_number: '145',
      train_name: 'Argo Wilis',
      departure_time: '10:30',
      arrival_time: '15:45',
      duration: '5j 15m',
      duration_minutes: 315,
      origin_station: {
        code: origin,
        name: `Stasiun ${originCodeToName(origin)}`,
        city: originCodeToName(origin)
      },
      destination_station: {
        code: destination,
        name: `Stasiun ${originCodeToName(destination)}`,
        city: originCodeToName(destination)
      },
      classes: [
        {
          class_type: 'Executive',
          price: 285000,
          availableSeats: 12,
          facilities: ['AC', 'Makanan Full', 'WiFi', 'TV', 'Bantal', 'Selimut'],
          insurance: 5000
        }
      ],
      train_type: 'Executive',
      isAvailable: true
    },
    {
      id: 'taksaka-61',
      train_number: '61',
      train_name: 'Taksaka',
      departure_time: '19:00',
      arrival_time: '05:00',
      duration: '10j 0m',
      duration_minutes: 600,
      origin_station: {
        code: origin,
        name: `Stasiun ${originCodeToName(origin)}`,
        city: originCodeToName(origin)
      },
      destination_station: {
        code: destination,
        name: `Stasiun ${originCodeToName(destination)}`,
        city: originCodeToName(destination)
      },
      classes: [
        {
          class_type: 'Executive',
          price: 350000,
          availableSeats: 5,
          facilities: ['AC', 'Makanan Premium', 'WiFi', 'TV', 'Bantal', 'Selimut', 'Sleeper'],
          insurance: 5000
        },
        {
          class_type: 'Business',
          price: 250000,
          availableSeats: 20,
          facilities: ['AC', 'Makanan', 'WiFi', 'Bantal'],
          insurance: 5000
        }
      ],
      train_type: 'Executive',
      isAvailable: true
    }
  ];

  // Adjust based on origin/destination
  if (origin === 'JKT' && destination === 'BD') {
    dummyTrains.forEach(train => {
      train.train_name = train.train_number === '145' ? 'Argo Parahyangan' : train.train_name;
    });
  }
  
  if (origin === 'SBY' || destination === 'SBY') {
    dummyTrains.forEach(train => {
      train.duration = '8j 0m';
      train.duration_minutes = 480;
      train.arrival_time = '16:00';
    });
  }

  return dummyTrains;
};

// Komponen FilterAndSort yang lebih lengkap
const FilterAndSort = ({ 
  onSort, 
  onFilter, 
  onPriceRange,
  activeSort, 
  activeFilter,
  priceRange
}: { 
  onSort: (sortType: string) => void, 
  onFilter: (filterType: string) => void,
  onPriceRange: (range: { min: number, max: number }) => void,
  activeSort: string,
  activeFilter: string,
  priceRange: { min: number, max: number }
}) => {
  const priceRanges = [
    { label: 'Semua Harga', min: 0, max: 1000000 },
    { label: '< Rp 150.000', min: 0, max: 150000 },
    { label: 'Rp 150.000 - Rp 300.000', min: 150000, max: 300000 },
    { label: 'Rp 300.000 - Rp 500.000', min: 300000, max: 500000 },
    { label: '> Rp 500.000', min: 500000, max: 1000000 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">Urutkan berdasarkan:</h3>
        <div className="space-y-2">
          {[
            { id: 'earliest', label: 'Keberangkatan Tercepat', icon: '⏰' },
            { id: 'latest', label: 'Keberangkatan Terlambat', icon: '🕙' },
            { id: 'lowest', label: 'Harga Terendah', icon: '💰' },
            { id: 'highest', label: 'Harga Tertinggi', icon: '💎' },
            { id: 'duration', label: 'Durasi Terpendek', icon: '⏱️' }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => onSort(option.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeSort === option.id
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">Filter kelas:</h3>
        <div className="space-y-2">
          {[
            { id: 'all', label: 'Semua Kelas', icon: '🎫' },
            { id: 'executive', label: 'Eksekutif', icon: '⭐' },
            { id: 'business', label: 'Bisnis', icon: '💼' },
            { id: 'economy', label: 'Ekonomi', icon: '🚉' }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => onFilter(option.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeFilter === option.id
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 mb-3">Rentang Harga:</h3>
        <div className="space-y-2">
          {priceRanges.map((range, index) => (
            <button
              key={index}
              onClick={() => onPriceRange(range)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                priceRange.min === range.min && priceRange.max === range.max
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t">
        <h3 className="font-semibold text-gray-700 mb-3">Fasilitas:</h3>
        <div className="space-y-2">
          {[
            { id: 'wifi', label: 'WiFi', icon: '📶' },
            { id: 'food', label: 'Makanan', icon: '🍱' },
            { id: 'tv', label: 'TV', icon: '📺' },
            { id: 'power', label: 'Stop Kontak', icon: '🔌' }
          ].map((facility) => (
            <div key={facility.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{facility.icon}</span>
                <span className="text-gray-700">{facility.label}</span>
              </div>
              <input type="checkbox" className="h-4 w-4 text-[#FD7E14] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Komponen TrainCard yang lebih informatif
const TrainCard = ({ train, passengers, onSelect }: { 
  train: any, 
  passengers: number,
  onSelect: (train: any, trainClass: any) => void 
}) => {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showAllFacilities, setShowAllFacilities] = useState(false);

  // Format facilities untuk ditampilkan
  const displayFacilities = showAllFacilities 
    ? train.classes?.[0]?.facilities || []
    : (train.classes?.[0]?.facilities || []).slice(0, 3);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-orange-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-gray-900">
                {train.train_name}
              </h3>
              <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                No. {train.train_number}
              </span>
              {train.train_type && (
                <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                  {train.train_type}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {train.duration}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Berangkat {train.departure_time}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            {train.isAvailable === false ? (
              <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-800 rounded-full">
                Penuh
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-sm font-semibold bg-green-100 text-green-800 rounded-full">
                  Tersedia
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Timeline */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{train.departure_time}</div>
              <div className="text-sm font-medium text-gray-800">{train.origin_station?.city}</div>
              <div className="text-xs text-gray-500 mt-1">{train.origin_station?.name}</div>
            </div>
            
            <div className="flex-1 mx-8">
              <div className="relative">
                <div className="h-1 bg-gradient-to-r from-blue-500 via-orange-500 to-green-500 w-full rounded-full"></div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow"></div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-green-600 rounded-full border-2 border-white shadow"></div>
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="text-center mt-2">
                <span className="text-sm text-gray-600">{train.duration} perjalanan</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{train.arrival_time}</div>
              <div className="text-sm font-medium text-gray-800">{train.destination_station?.city}</div>
              <div className="text-xs text-gray-500 mt-1">{train.destination_station?.name}</div>
            </div>
          </div>
        </div>

        {/* Facilities */}
        {train.classes?.[0]?.facilities && train.classes[0].facilities.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Fasilitas:</span>
              {train.classes[0].facilities.length > 3 && (
                <button
                  onClick={() => setShowAllFacilities(!showAllFacilities)}
                  className="text-xs text-[#FD7E14] hover:text-[#E06700]"
                >
                  {showAllFacilities ? 'Lihat lebih sedikit' : 'Lihat semua'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {displayFacilities.map((facility: string, idx: number) => (
                <span 
                  key={idx}
                  className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-100 flex items-center gap-1"
                >
                  {facility === 'WiFi' && '📶'}
                  {facility === 'Makanan' && '🍱'}
                  {facility === 'TV' && '📺'}
                  {facility === 'Stop Kontak' && '🔌'}
                  {facility === 'AC' && '❄️'}
                  {facility === 'Bantal' && '🛏️'}
                  {facility === 'Sleeper' && '😴'}
                  {facility}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Classes */}
        <div className="space-y-3">
          {train.classes?.map((trainClass: any, index: number) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-[#FD7E14] hover:shadow-md ${
                selectedClass === trainClass 
                  ? 'border-[#FD7E14] bg-orange-50' 
                  : 'border-gray-200'
              }`}
              onClick={() => {
                if (trainClass.availableSeats > 0) {
                  setSelectedClass(trainClass);
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-gray-800 text-lg">{trainClass.class_type}</h4>
                    {trainClass.availableSeats <= 5 && trainClass.availableSeats > 0 ? (
                      <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                        Hanya {trainClass.availableSeats} kursi tersisa!
                      </span>
                    ) : trainClass.availableSeats === 0 ? (
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">
                        Habis
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        Tersedia
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      {trainClass.availableSeats} kursi tersedia
                    </span>
                    {trainClass.insurance && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Asuransi Rp {trainClass.insurance.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#FD7E14]">
                    Rp {trainClass.price.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-gray-500">per orang</div>
                  {trainClass.originalPrice && trainClass.originalPrice > trainClass.price && (
                    <div className="text-xs text-gray-400 line-through">
                      Rp {trainClass.originalPrice.toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {selectedClass && selectedClass.availableSeats > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="text-sm text-gray-600">Total untuk {passengers} penumpang</div>
                <div className="text-2xl font-bold text-gray-900">
                  Rp {(selectedClass.price * passengers).toLocaleString('id-ID')}
                </div>
                {selectedClass.insurance && (
                  <div className="text-xs text-gray-500 mt-1">
                    + Asuransi Rp {(selectedClass.insurance * passengers).toLocaleString('id-ID')}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Save to localStorage for later
                    const favoriteTrains = JSON.parse(localStorage.getItem('favoriteTrains') || '[]');
                    favoriteTrains.push({
                      train: train,
                      class: selectedClass,
                      savedAt: new Date().toISOString()
                    });
                    localStorage.setItem('favoriteTrains', JSON.stringify(favoriteTrains));
                    alert('Kereta disimpan untuk dilihat nanti!');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Simpan
                </button>
                
                <button
                  onClick={() => onSelect(train, selectedClass)}
                  className="px-6 py-3 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Pilih & Lanjutkan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Komponen Utama
const TrainResultsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [sortType, setSortType] = useState('earliest');
  const [filterType, setFilterType] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [searchStats, setSearchStats] = useState({
    totalTrains: 0,
    totalClasses: 0,
    cheapestPrice: 0,
    fastestDuration: ''
  });
  
  const origin = searchParams.get('origin') || 'origin';
  const destination = searchParams.get('destination') || 'destination';
  const departureDate = searchParams.get('departureDate') || new Date().toISOString().split('T')[0];
  const passengers = parseInt(searchParams.get('passengers') || '1');
  
  // Gunakan custom hook
  const { trains, loading, error } = useFetchTrains(
    origin,
    destination,
    departureDate,
    passengers
  );

  // Hitung stats saat trains berubah
  useEffect(() => {
    if (trains.length > 0) {
      let totalClasses = 0;
      let cheapestPrice = Infinity;
      let fastestDuration = Infinity;
      
      trains.forEach(train => {
        train.classes?.forEach((trainClass: any) => {
          totalClasses++;
          if (trainClass.price < cheapestPrice) {
            cheapestPrice = trainClass.price;
          }
        });
        
        if (train.duration_minutes < fastestDuration) {
          fastestDuration = train.duration_minutes;
        }
      });
      
      const hours = Math.floor(fastestDuration / 60);
      const minutes = fastestDuration % 60;
      const durationString = `${hours}j ${minutes}m`;
      
      setSearchStats({
        totalTrains: trains.length,
        totalClasses,
        cheapestPrice: cheapestPrice === Infinity ? 0 : cheapestPrice,
        fastestDuration: durationString
      });
    }
  }, [trains]);

  // Apply filters and sort
  const filteredTrains = useMemo(() => {
    if (!trains.length) return [];

    let result = [...trains];
    
    // Filter by class
    if (filterType !== 'all') {
      result = result.map(train => {
        const filteredClasses = train.classes?.filter((cls: any) => {
          const classType = (cls.class_type || '').toLowerCase();
          return classType.includes(filterType.toLowerCase());
        });
        
        if (filteredClasses && filteredClasses.length > 0) {
          return {
            ...train,
            classes: filteredClasses
          };
        }
        return null;
      }).filter(Boolean) as any[];
    }
    
    // Filter by price range
    result = result.map(train => {
      const filteredClasses = train.classes?.filter((cls: any) => {
        return cls.price >= priceRange.min && cls.price <= priceRange.max;
      });
      
      if (filteredClasses && filteredClasses.length > 0) {
        return {
          ...train,
          classes: filteredClasses
        };
      }
      return null;
    }).filter(Boolean) as any[];
    
    // Sort
    result.sort((a, b) => {
      switch (sortType) {
        case 'earliest':
          return a.departure_time.localeCompare(b.departure_time);
        case 'latest':
          return b.departure_time.localeCompare(a.departure_time);
        case 'lowest':
          const aMinPrice = a.classes?.length > 0 
            ? Math.min(...a.classes.map((c: any) => c.price || 0))
            : Infinity;
          const bMinPrice = b.classes?.length > 0 
            ? Math.min(...b.classes.map((c: any) => c.price || 0))
            : Infinity;
          return aMinPrice - bMinPrice;
        case 'highest':
          const aMaxPrice = a.classes?.length > 0 
            ? Math.max(...a.classes.map((c: any) => c.price || 0))
            : 0;
          const bMaxPrice = b.classes?.length > 0 
            ? Math.max(...b.classes.map((c: any) => c.price || 0))
            : 0;
          return bMaxPrice - aMaxPrice;
        case 'duration':
          return (a.duration_minutes || 0) - (b.duration_minutes || 0);
        default:
          return 0;
      }
    });
    
    return result;
  }, [trains, sortType, filterType, priceRange]);

  const handleSelectTrain = (train: any, trainClass: any) => {
    // Persiapkan data untuk booking
    const bookingData = {
      scheduleId: train.schedule_id || train.id,
      trainId: train.id || 1,
      trainName: train.train_name,
      trainType: trainClass.class_type,
      departureTime: train.departure_time,
      arrivalTime: train.arrival_time,
      duration: train.duration,
      origin: train.origin_station?.city || originCodeToName(origin),
      destination: train.destination_station?.city || originCodeToName(destination),
      price: trainClass.price,
      availableSeats: trainClass.availableSeats,
      departureDate: departureDate,
      trainCode: train.train_number,
      originCity: train.origin_station?.city,
      destinationCity: train.destination_station?.city,
      // Additional data for booking page
      passengerCount: passengers,
      totalAmount: trainClass.price * passengers,
      selectedClass: trainClass,
      trainDetails: train
    };
    
    // Simpan ke sessionStorage
    sessionStorage.setItem('selectedTrain', JSON.stringify(bookingData));
    console.log('🚂 Saved train to session:', bookingData);
    
    // Redirect ke booking page dengan query params
    const queryParams = new URLSearchParams({
      scheduleId: bookingData.scheduleId,
      trainId: bookingData.trainId.toString(),
      trainName: bookingData.trainName,
      trainType: bookingData.trainType,
      departureTime: bookingData.departureTime,
      origin: bookingData.origin,
      destination: bookingData.destination,
      price: bookingData.price.toString(),
      departureDate: bookingData.departureDate,
      passengers: passengers.toString()
    });
    
    router.push(`/booking?${queryParams.toString()}`);
  };

  const handleRetrySearch = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="inline-block relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#FD7E14]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h4a1 1 0 001-1v-1h2a1 1 0 001-1V7a1 1 0 00-1-1h-2a1 1 0 00-1 1v1H9V5a1 1 0 00-1-1H3z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Mencari Kereta...</h2>
            <p className="text-gray-600">Sedang mencari kereta yang tersedia untuk perjalanan Anda</p>
            <p className="text-sm text-gray-500 mt-2">Harap tunggu sebentar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-yellow-700">
                  <span className="font-semibold">Perhatian:</span> {error}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Anda melihat data contoh. Fitur pencarian sesungguhnya akan tersedia segera.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search Summary Card */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-blue-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h4a1 1 0 001-1v-1h2a1 1 0 001-1V7a1 1 0 00-1-1h-2a1 1 0 00-1 1v1H9V5a1 1 0 00-1-1H3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Hasil Pencarian Kereta</h1>
                  <p className="text-gray-600">Berikut adalah kereta yang tersedia untuk perjalanan Anda</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Rute</div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-700">{originCodeToName(origin)}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-semibold text-green-700">{originCodeToName(destination)}</span>
                  </div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Tanggal</div>
                  <div className="font-semibold text-gray-800">{formatDateDisplay(departureDate)}</div>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Penumpang</div>
                  <div className="font-semibold text-gray-800 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {passengers} Orang
                  </div>
                </div>
                
                {searchStats.totalTrains > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Statistik</div>
                    <div className="font-semibold text-gray-800">
                      {searchStats.totalTrains} Kereta • {searchStats.totalClasses} Kelas
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRetrySearch}
                className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Ubah Pencarian
              </button>
              
              <Link
                href="/"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-center"
              >
                Beranda
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {searchStats.totalTrains > 0 && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Harga Termurah</div>
                  <div className="text-xl font-bold text-green-600">
                    Rp {searchStats.cheapestPrice.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.414L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Durasi Tercepat</div>
                  <div className="text-xl font-bold text-blue-600">
                    {searchStats.fastestDuration}
                  </div>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Kereta Tersedia</div>
                  <div className="text-xl font-bold text-orange-600">
                    {searchStats.totalTrains} Kereta
                  </div>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800">Filter & Sort</h2>
                <button
                  onClick={() => {
                    setSortType('earliest');
                    setFilterType('all');
                    setPriceRange({ min: 0, max: 1000000 });
                  }}
                  className="text-sm text-[#FD7E14] hover:text-[#E06700]"
                >
                  Reset
                </button>
              </div>
              <FilterAndSort 
                onSort={setSortType}
                onFilter={setFilterType}
                onPriceRange={setPriceRange}
                activeSort={sortType}
                activeFilter={filterType}
                priceRange={priceRange}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {filteredTrains.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Tidak ada kereta yang ditemukan</h3>
                <p className="text-gray-500 mb-6">Silakan ubah filter atau coba tanggal lain</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleRetrySearch}
                    className="px-6 py-3 bg-gradient-to-r from-[#FD7E14] to-orange-500 text-white font-semibold rounded-xl hover:from-[#E06700] hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
                  >
                    Cari Lagi
                  </button>
                  <Link
                    href="/contact"
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Butuh Bantuan?
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Menampilkan <span className="font-semibold text-gray-800">{filteredTrains.length}</span> kereta
                        {filterType !== 'all' && ` • Filter: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`}
                        {sortType !== 'earliest' && ` • Urutkan: ${sortType}`}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        Harga: <span className="font-semibold">Rp {priceRange.min.toLocaleString('id-ID')} - Rp {priceRange.max.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {filteredTrains.map((train) => (
                    <TrainCard
                      key={train.id}
                      train={train}
                      passengers={passengers}
                      onSelect={handleSelectTrain}
                    />
                  ))}
                </div>
                
                {/* Pagination atau info tambahan */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-600">
                      📍 Perhatikan waktu keberangkatan dan pastikan tiba di stasiun minimal 30 menit sebelum keberangkatan.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Harga sudah termasuk PPN 10%. Biaya tambahan seperti asuransi akan ditambahkan saat checkout.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      
      {/* Footer Mini */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              © 2024 TripGo. Semua hak dilindungi.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Data kereta diperbarui secara real-time. Jadwal dapat berubah tanpa pemberitahuan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export utama dengan Suspense
export default function SearchTrainsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#FD7E14]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h4a1 1 0 001-1v-1h2a1 1 0 001-1V7a1 1 0 00-1-1h-2a1 1 0 00-1 1v1H9V5a1 1 0 00-1-1H3z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Memuat Hasil Pencarian</h2>
          <p className="text-gray-600">Sedang mencari kereta terbaik untuk Anda...</p>
        </div>
      </div>
    }>
      <TrainResultsContent />
    </Suspense>
  );
}