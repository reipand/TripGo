// app/search/trains/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// --- Tipe Data ---
interface TrainSchedule {
  id: string;
  trainNumber: string;
  trainName: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  origin: string;
  destination: string;
  originCode: string;
  destinationCode: string;
  departureDate: string;
  classes: TrainClass[];
  availableSeats: number;
  isRefundable: boolean;
  isCheckinAvailable: boolean;
  isHighDemand?: boolean;
  warning?: string;
  scheduleId?: string;
  trainId?: string;
  trainType?: string;
  originCity?: string;
  destinationCity?: string;
  travelDate?: string;
}

interface TrainClass {
  class: string;
  subclass: string;
  price: number;
  seatsLeft: number;
  isSoldOut?: boolean;
  isBestDeal?: boolean;
  demandStatus?: 'high' | 'low' | 'normal';
  trainType?: string;
}

// --- Komponen Ikon ---
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

// --- Komponen TrainCard yang sudah diupdate ---
const TrainCard = ({ train, passengers }: { train: TrainSchedule, passengers: number }) => {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<TrainClass | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleSelectClass = (trainClass: TrainClass) => {
    if (!trainClass.isSoldOut && trainClass.seatsLeft > 0) {
      setSelectedClass(trainClass);
    }
  };

  const handleBookNow = () => {
    if (!selectedClass) {
      alert('Silakan pilih kelas terlebih dahulu');
      return;
    }

    // Simpan data ke session storage dengan format yang konsisten
    const bookingData = {
      id: train.id,
      scheduleId: train.scheduleId || train.id,
      trainId: train.trainId || train.id,
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      trainType: selectedClass.trainType || train.trainType || selectedClass.class,
      departureTime: train.departureTime,
      arrivalTime: train.arrivalTime,
      duration: train.duration,
      origin: train.origin,
      destination: train.destination,
      originCode: train.originCode,
      destinationCode: train.destinationCode,
      departureDate: train.departureDate || train.travelDate,
      originCity: train.originCity || train.origin,
      destinationCity: train.destinationCity || train.destination,
      selectedClass: selectedClass.class,
      selectedSubclass: selectedClass.subclass,
      price: selectedClass.price,
      passengers: passengers,
      totalAmount: selectedClass.price * passengers,
      availableSeats: selectedClass.seatsLeft,
      savedAt: new Date().toISOString()
    };

    // Simpan ke sessionStorage dengan key yang sama seperti halaman booking lain
    sessionStorage.setItem('selectedTrain', JSON.stringify(bookingData));
    console.log('💾 Saved train to sessionStorage:', bookingData);
    
    // Redirect ke halaman booking
    router.push('/booking');
  };

  // Render setiap kelas sebagai card terpisah
  return (
    <div className="space-y-4 mb-6">
      {/* Card untuk setiap kelas dalam satu kereta */}
      {train.classes.map((trainClass, index) => (
        <div 
          key={index}
          className={`bg-white rounded-xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 ${
            selectedClass?.class === trainClass.class && selectedClass?.subclass === trainClass.subclass 
              ? 'border-[#FD7E14] border-2' 
              : 'border-gray-200'
          } ${trainClass.isSoldOut ? 'opacity-75' : 'cursor-pointer'}`}
          onClick={() => !trainClass.isSoldOut && handleSelectClass(trainClass)}
        >
          {/* Header dengan nama kereta dan kelas */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedClass?.class === trainClass.class && selectedClass?.subclass === trainClass.subclass
                    ? 'border-[#FD7E14] bg-[#FD7E14]'
                    : 'border-gray-300'
                }`}>
                  {selectedClass?.class === trainClass.class && selectedClass?.subclass === trainClass.subclass && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {train.trainName} {train.trainNumber}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      trainClass.class.toLowerCase().includes('executive') ? 'bg-blue-100 text-blue-800' :
                      trainClass.class.toLowerCase().includes('business') ? 'bg-green-100 text-green-800' :
                      trainClass.class.toLowerCase().includes('premium') ? 'bg-purple-100 text-purple-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trainClass.class} ({trainClass.subclass})
                    </span>
                    {trainClass.isBestDeal && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        💰 Best Deal
                      </span>
                    )}
                    {trainClass.demandStatus === 'high' && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        🔥 High Demand
                      </span>
                    )}
                    {trainClass.seatsLeft < 5 && trainClass.seatsLeft > 0 && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        ⚠️ Almost Sold Out
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-[#FD7E14]">
                  {formatPrice(trainClass.price)}
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
                <div className="text-3xl font-bold text-gray-900">{train.departureTime}</div>
                <div className="text-sm font-medium text-gray-700 mt-1">{train.originCode}</div>
                <div className="text-xs text-gray-500">{train.origin}</div>
              </div>
              
              {/* Duration */}
              <div className="flex flex-col items-center">
                <div className="text-sm text-gray-600 mb-2">{train.duration}</div>
                <div className="flex items-center w-64">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <div className="flex-1 h-0.5 bg-gray-300 mx-3"></div>
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H3a1 1 0 110-2h9.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 h-0.5 bg-gray-300 mx-3"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                </div>
              </div>
              
              {/* Arrival */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{train.arrivalTime}</div>
                <div className="text-sm font-medium text-gray-700 mt-1">{train.destinationCode}</div>
                <div className="text-xs text-gray-500">{train.destination}</div>
              </div>
            </div>
          </div>

          {/* Footer dengan seat info */}
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {trainClass.isSoldOut ? (
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
                      trainClass.seatsLeft < 5 ? 'text-red-600' : 
                      trainClass.seatsLeft < 10 ? 'text-yellow-600' : 
                      'text-gray-700'
                    }`}>
                      {trainClass.seatsLeft} seats left
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {train.isRefundable && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    100% Refund
                  </span>
                )}
                {train.isCheckinAvailable && (
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
        </div>
      ))}
      
      {/* Total dan tombol Book Now di luar card kelas */}
      {selectedClass && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total for {passengers} passenger{passengers > 1 ? 's' : ''}</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(selectedClass.price * passengers)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Selected: <span className="font-medium">{selectedClass.class} ({selectedClass.subclass})</span> • 
                <span className="ml-2">Departure: {formatDate(train.departureDate || train.travelDate || '')}</span>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button 
                onClick={() => setSelectedClass(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Change Class
              </button>
              
              <button 
                onClick={handleBookNow}
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
};

// --- Filter and Sort Component yang sudah diupdate ---
const FilterAndSort = ({ 
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
  const sortOptions = [
    { id: 'earliest', label: 'Earliest Departure' },
    { id: 'lowest', label: 'Lowest Price' },
    { id: 'duration', label: 'Shortest Duration' },
    { id: 'latest', label: 'Latest Departure' }
  ];

  const filterOptions = [
    { id: 'all', label: 'All Classes' },
    { id: 'executive', label: 'Executive' },
    { id: 'business', label: 'Business' },
    { id: 'economy', label: 'Economy' }
  ];

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center text-sm font-semibold text-gray-700 mb-3">
            <SortIcon /> Sort By:
          </div>
          <div className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onSort(option.id)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeSort === option.id
                    ? 'bg-[#FD7E14] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex items-center text-sm font-semibold text-gray-700 mb-3">
            <FilterIcon /> Filter By Class:
          </div>
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onFilter(option.id)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  activeFilter === option.id
                    ? 'bg-[#FD7E14] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Komponen Utama dengan integrasi API ---
const TrainResultsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [trains, setTrains] = useState<TrainSchedule[]>([]);
  const [filteredTrains, setFilteredTrains] = useState<TrainSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState('earliest');
  const [filterType, setFilterType] = useState('all');
  
  const origin = searchParams.get('origin') || 'BD';
  const destination = searchParams.get('destination') || 'GMR';
  const departureDate = searchParams.get('departureDate') || '2026-01-07';
  const passengers = parseInt(searchParams.get('passengers') || '1');
  const tripType = searchParams.get('tripType') || 'oneWay';

  // Fungsi untuk mengonversi data dari API
  const transformApiData = (apiData: any[]): TrainSchedule[] => {
    if (!apiData || !Array.isArray(apiData)) {
      return [];
    }

    return apiData.map((train, index) => {
      // Format waktu untuk tampilan
      const departureTime = train.departure_time ? 
        train.departure_time.split(':').slice(0, 2).join(':') : '08:00';
      
      const arrivalTime = train.arrival_time ? 
        train.arrival_time.split(':').slice(0, 2).join(':') : '12:00';
      
      const durationMinutes = train.duration_minutes || 180;
      const duration = `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
      
      // Tentukan demand status
      let demandStatus: 'high' | 'low' | 'normal' = 'normal';
      const seatsLeft = train.stok_kursi || train.availableSeats || 0;
      
      if (seatsLeft < 5) {
        demandStatus = 'high';
      } else if (seatsLeft > 20) {
        demandStatus = 'low';
      }

      // Tentukan apakah best deal (harga terendah)
      const isBestDeal = index === 0; // Untuk sederhana, kereta pertama adalah best deal

      return {
        id: train.id || `train-${index}`,
        scheduleId: train.schedule_id || train.id,
        trainId: train.train_id || train.id,
        trainNumber: train.train_number || train.train_code || `${index + 1}00`,
        trainName: train.train_name || 'Kereta',
        trainType: train.train_type || train.class_type || 'Executive',
        departureTime,
        arrivalTime,
        duration,
        origin: train.origin_station?.city || train.originCity || 'Bandung',
        destination: train.destination_station?.city || train.destinationCity || 'Jakarta',
        originCode: train.origin_station?.code || train.originCode || 'BD',
        destinationCode: train.destination_station?.code || train.destinationCode || 'GMR',
        originCity: train.origin_station?.city || train.originCity || 'Bandung',
        destinationCity: train.destination_station?.city || train.destinationCity || 'Jakarta',
        departureDate: train.travel_date || train.departureDate || departureDate,
        travelDate: train.travel_date || train.departureDate || departureDate,
        classes: [{
          class: train.class_type || 'Executive',
          subclass: train.seat_type === 'Premium' ? 'P' : 'AD',
          trainType: train.class_type || 'Executive',
          price: train.harga || train.price || 250000,
          seatsLeft: seatsLeft,
          isBestDeal: isBestDeal && seatsLeft > 0,
          demandStatus,
          isSoldOut: seatsLeft === 0
        }],
        availableSeats: seatsLeft,
        isRefundable: true,
        isCheckinAvailable: true,
        isHighDemand: demandStatus === 'high',
        warning: seatsLeft < 5 ? 'High demand, sold out quickly!' : undefined
      };
    });
  };

  // Data mock sebagai fallback
  const mockTrains: TrainSchedule[] = [
    {
      id: 'schedule-001',
      scheduleId: 'schedule-001',
      trainId: 'train-001',
      trainNumber: '131',
      trainName: 'Parahyangan',
      trainType: 'Executive',
      departureTime: '05:00',
      arrivalTime: '08:01',
      duration: '3h 1m',
      origin: 'Bandung',
      destination: 'Gambir',
      originCode: 'BD',
      destinationCode: 'GMR',
      originCity: 'Bandung',
      destinationCity: 'Jakarta',
      departureDate: departureDate,
      travelDate: departureDate,
      classes: [
        {
          class: 'Executive',
          subclass: 'AD',
          trainType: 'Executive',
          price: 265000,
          seatsLeft: 15,
          isBestDeal: true,
          demandStatus: 'normal'
        }
      ],
      availableSeats: 15,
      isRefundable: true,
      isCheckinAvailable: true,
      isHighDemand: false
    },
    {
      id: 'schedule-002',
      scheduleId: 'schedule-002',
      trainId: 'train-002',
      trainNumber: '135',
      trainName: 'Parahyangan',
      trainType: 'Mixed',
      departureTime: '08:01',
      arrivalTime: '11:02',
      duration: '3h 1m',
      origin: 'Bandung',
      destination: 'Gambir',
      originCode: 'BD',
      destinationCode: 'GMR',
      originCity: 'Bandung',
      destinationCity: 'Jakarta',
      departureDate: departureDate,
      travelDate: departureDate,
      classes: [
        {
          class: 'Executive',
          subclass: 'AD',
          trainType: 'Executive',
          price: 265000,
          seatsLeft: 3,
          isBestDeal: false,
          demandStatus: 'high'
        }
      ],
      availableSeats: 3,
      isRefundable: true,
      isCheckinAvailable: true,
      isHighDemand: true,
      warning: 'High demand, sold out quickly!'
    },
    {
      id: 'schedule-003',
      scheduleId: 'schedule-003',
      trainId: 'train-003',
      trainNumber: '145',
      trainName: 'Argo Wilis',
      trainType: 'Executive',
      departureTime: '07:30',
      arrivalTime: '10:45',
      duration: '3h 15m',
      origin: 'Bandung',
      destination: 'Gambir',
      originCode: 'BD',
      destinationCode: 'GMR',
      originCity: 'Bandung',
      destinationCity: 'Jakarta',
      departureDate: departureDate,
      travelDate: departureDate,
      classes: [
        {
          class: 'Executive',
          subclass: 'AD',
          trainType: 'Executive',
          price: 285000,
          seatsLeft: 23,
          isBestDeal: false,
          demandStatus: 'normal'
        }
      ],
      availableSeats: 23,
      isRefundable: true,
      isCheckinAvailable: true,
      isHighDemand: false
    }
  ];

  // Fetch real data from API
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

        // Try multiple API endpoints
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
          const formattedTrains = transformApiData(apiData);
          setTrains(formattedTrains);
          setFilteredTrains(formattedTrains);
          console.log('✅ API data loaded:', formattedTrains.length, 'trains');
        } else {
          // Fallback to mock data
          console.log('⚠️ No API data, using mock data');
          setTrains(mockTrains);
          setFilteredTrains(mockTrains);
        }
        
      } catch (error: any) {
        console.error('❌ Error fetching trains:', error);
        setError('Gagal memuat data kereta. Menampilkan data contoh.');
        // Fallback to mock data
        setTrains(mockTrains);
        setFilteredTrains(mockTrains);
      } finally {
        setLoading(false);
      }
    };

    fetchTrains();
  }, [origin, destination, departureDate, passengers]);

  // Apply filters and sort
  useEffect(() => {
    let result = [...trains];
    
    // Apply filter by class
    if (filterType !== 'all') {
      result = result.map(train => {
        const filteredClasses = train.classes.filter(cls => 
          cls.class.toLowerCase().includes(filterType.toLowerCase())
        );
        
        if (filteredClasses.length > 0) {
          return {
            ...train,
            classes: filteredClasses
          };
        }
        return null;
      }).filter(Boolean) as TrainSchedule[];
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortType) {
        case 'earliest':
          return a.departureTime.localeCompare(b.departureTime);
        case 'latest':
          return b.departureTime.localeCompare(a.departureTime);
        case 'lowest':
          const aMinPrice = Math.min(...a.classes.map(c => c.price));
          const bMinPrice = Math.min(...b.classes.map(c => c.price));
          return aMinPrice - bMinPrice;
        case 'duration':
          const aDuration = parseInt(a.duration.replace(/\D/g, ''));
          const bDuration = parseInt(b.duration.replace(/\D/g, ''));
          return aDuration - bDuration;
        default:
          return 0;
      }
    });
    
    setFilteredTrains(result);
  }, [sortType, filterType, trains]);

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
              <h1 className="text-2xl font-bold text-gray-800">Hasil Pencarian Kereta</h1>
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
                      Klik pada kelas kereta untuk memilih, kemudian lanjutkan ke pemesanan
                    </p>
                  </div>
                  
                  {/* Sort Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Diurutkan berdasarkan:</span>
                    <span className="text-sm font-medium text-[#FD7E14]">
                      {sortType === 'earliest' ? 'Keberangkatan Tercepat' :
                       sortType === 'latest' ? 'Keberangkatan Terlambat' :
                       sortType === 'lowest' ? 'Harga Terendah' :
                       'Durasi Terpendek'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {filteredTrains.map((train) => (
                    <TrainCard
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

// --- Export dengan Suspense ---
export default function SearchTrainsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat hasil pencarian...</p>
        </div>
      </div>
    }>
      <TrainResultsContent />
    </Suspense>
  );
}