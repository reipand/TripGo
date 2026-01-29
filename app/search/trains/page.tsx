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
    'origin': 'Bandung',
    'destination': 'Gambir'
  };
  return stations[code] || code;
};

// Types
interface TransitStation {
  id: string;
  station_id: string;
  station_name: string;
  arrival_time: string;
  departure_time: string;
  waiting_minutes: number;
  available_seats: number;
  additional_price?: number;
  previous_station: string;
  next_station: string;
}

interface Segment {
  segmentId: string;
  trainId: number;
  trainName: string;
  trainType: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  origin: string;
  destination: string;
  price: number;
  availableSeats: number;
  departureDate: string;
  scheduleId?: string;
  transitStations?: TransitStation[];
  selectedTransit?: TransitStation | null;
  selectedSeats: any[];
}

interface MultiSegmentBooking {
  segments: Segment[];
  totalPrice: number;
  totalDuration: string;
  isMultiSegment: boolean;
  connectionTime?: number;
}

interface Train {
  id?: string;
  train_id?: number;
  trainId: number;
  train_number?: string;
  train_name: string;
  train_type: string;
  operator?: string;
  origin_station?: {
    code: string;
    name: string;
    city: string;
  };
  destination_station?: {
    code: string;
    name: string;
    city: string;
  };
  departure_time: string;
  arrival_time: string;
  duration_minutes?: number;
  duration: string;
  travel_date: string;
  status?: string;
  harga?: number;
  price: number;
  stok_kursi?: number;
  availableSeats: number;
  class_type?: string;
  trainClass?: string;
  facilities?: string[];
  insurance?: number;
  seat_type?: string;
  route_type?: string;
  schedule_id?: string;
  isRefundable?: boolean;
  isCheckinAvailable?: boolean;
  isBestDeal?: boolean;
  isHighDemand?: boolean;
  isMultiSegment?: boolean;
  segments?: Segment[];
  connectionTime?: number;
  classes?: any[];
}

// Fungsi untuk mengambil data multi-segment dari database
const fetchMultiSegmentOptionsFromDB = async (
  origin: string,
  destination: string,
  departureDate: string,
  passengerCount: number
): Promise<MultiSegmentBooking[]> => {
  try {
    const response = await fetch(
      `/api/trains/multi-segment?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${departureDate}&passengers=${passengerCount}`
    );

    if (response.ok) {
      const data = await response.json();
      
      if (data.success && Array.isArray(data.options)) {
        return data.options.map((option: any) => ({
          segments: option.segments.map((seg: any) => ({
            segmentId: seg.id || `segment-${Math.random().toString(36).substr(2, 9)}`,
            trainId: seg.train_id || seg.trainId || Date.now(),
            trainName: seg.train_name || seg.trainName || 'Kereta',
            trainType: seg.train_type || seg.trainType || 'Executive',
            departureTime: seg.departure_time || seg.departureTime || '07:00',
            arrivalTime: seg.arrival_time || seg.arrivalTime || '10:00',
            duration: seg.duration || formatDuration(seg.duration_minutes || 180),
            origin: seg.origin_station?.name || seg.origin || origin,
            destination: seg.destination_station?.name || seg.destination || destination,
            price: seg.price || seg.harga || 250000,
            availableSeats: seg.available_seats || seg.stok_kursi || 20,
            departureDate: seg.travel_date || seg.departureDate || departureDate,
            scheduleId: seg.schedule_id || seg.id,
            selectedSeats: [],
            transitStations: seg.transitStations || []
          })),
          totalPrice: option.totalPrice || (option.segments.reduce((sum: number, seg: any) => sum + (seg.price || 250000), 0)),
          totalDuration: option.totalDuration || `${option.segments.length * 3}j 0m`,
          isMultiSegment: option.segments.length > 1,
          connectionTime: option.connectionTime || 30
        }));
      }
    }

    // Fallback ke data khusus untuk Bandung-Gambir
    return generateBandungGambirMultiSegmentOptions(origin, destination, departureDate, passengerCount);
  } catch (error) {
    console.error('Error fetching multi-segment options:', error);
    return generateBandungGambirMultiSegmentOptions(origin, destination, departureDate, passengerCount);
  }
};

// Fungsi khusus untuk rute Bandung-Gambir
const generateBandungGambirMultiSegmentOptions = (
  origin: string,
  destination: string,
  departureDate: string,
  passengerCount: number
): MultiSegmentBooking[] => {
  const originName = originCodeToName(origin);
  const destinationName = originCodeToName(destination);
  
  // Jika rute bukan Bandung-Gambir atau sebaliknya, kembalikan array kosong
  const normalizedOrigin = originName.toLowerCase();
  const normalizedDest = destinationName.toLowerCase();
  
  const isBandungGambirRoute = 
    (normalizedOrigin.includes('bandung') && normalizedDest.includes('gambir')) ||
    (normalizedOrigin.includes('gambir') && normalizedDest.includes('bandung'));
  
  if (!isBandungGambirRoute) {
    return [];
  }
  
  return [
    // Opsi 1: Bandung -> Cirebon -> Gambir
    {
      segments: [
        {
          segmentId: 'bdg-cbn-1',
          trainId: 201,
          trainName: 'Lokal Bandung-Cirebon',
          trainType: 'Economy',
          departureTime: '07:00',
          arrivalTime: '09:30',
          duration: '2j 30m',
          origin: 'Bandung',
          destination: 'Cirebon',
          price: 75000,
          availableSeats: 45,
          departureDate: departureDate,
          scheduleId: 'schedule-bdg-cbn-0700',
          selectedSeats: []
        },
        {
          segmentId: 'cbn-gmr-1',
          trainId: 202,
          trainName: 'Argo Bromo',
          trainType: 'Executive',
          departureTime: '11:00',
          arrivalTime: '14:30',
          duration: '3j 30m',
          origin: 'Cirebon',
          destination: 'Gambir',
          price: 175000,
          availableSeats: 30,
          departureDate: departureDate,
          scheduleId: 'schedule-cbn-gmr-1100',
          selectedSeats: []
        }
      ],
      totalPrice: 250000,
      totalDuration: '6j 0m',
      isMultiSegment: true,
      connectionTime: 90 // 1.5 jam transit di Cirebon
    },
    
    // Opsi 2: Bandung -> Purwakarta -> Gambir
    {
      segments: [
        {
          segmentId: 'bdg-pwk-1',
          trainId: 203,
          trainName: 'Lokal Bandung-Purwakarta',
          trainType: 'Economy',
          departureTime: '08:30',
          arrivalTime: '10:15',
          duration: '1j 45m',
          origin: 'Bandung',
          destination: 'Purwakarta',
          price: 45000,
          availableSeats: 50,
          departureDate: departureDate,
          scheduleId: 'schedule-bdg-pwk-0830',
          selectedSeats: []
        },
        {
          segmentId: 'pwk-gmr-1',
          trainId: 204,
          trainName: 'Argo Parahyangan',
          trainType: 'Executive',
          departureTime: '11:30',
          arrivalTime: '13:45',
          duration: '2j 15m',
          origin: 'Purwakarta',
          destination: 'Gambir',
          price: 205000,
          availableSeats: 25,
          departureDate: departureDate,
          scheduleId: 'schedule-pwk-gmr-1130',
          selectedSeats: []
        }
      ],
      totalPrice: 250000,
      totalDuration: '4j 0m',
      isMultiSegment: true,
      connectionTime: 75 // 1.25 jam transit di Purwakarta
    }
  ];
};

// Fungsi untuk mengambil data direct trains (tanpa transit) dari database
const fetchDirectTrainsFromDB = async (
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number
): Promise<Train[]> => {
  try {
    const response = await fetch(
      `/api/trains/direct?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${departureDate}&passengers=${passengers}`
    );

    if (response.ok) {
      const data = await response.json();
      
      if (data.success && Array.isArray(data.trains)) {
        return data.trains.map((train: any) => ({
          id: train.id || `train-${Date.now()}-${Math.random()}`,
          train_id: train.train_id || train.id || Date.now(),
          trainId: train.train_id || train.id || Date.now(),
          train_number: train.train_number || train.kode_kereta || '',
          train_name: train.train_name || train.nama_kereta || '',
          train_type: train.train_type || train.tipe_kereta || 'Executive',
          operator: train.operator || 'PT KAI',
          origin_station: train.origin_station || {
            code: origin,
            name: `Stasiun ${origin}`,
            city: origin
          },
          destination_station: train.destination_station || {
            code: destination,
            name: `Stasiun ${destination}`,
            city: destination
          },
          departure_time: train.departure_time || '07:00:00',
          arrival_time: train.arrival_time || '10:00:00',
          duration_minutes: train.duration_minutes || 180,
          duration: train.duration || formatDuration(train.duration_minutes || 180),
          travel_date: train.travel_date || departureDate,
          status: train.status || 'scheduled',
          harga: train.price || train.harga || 250000,
          price: train.price || train.harga || 250000,
          stok_kursi: train.available_seats || train.stok_kursi || 20,
          availableSeats: train.available_seats || train.stok_kursi || 20,
          class_type: train.class_type || train.train_type || 'Executive',
          trainClass: train.class_type || train.train_type || 'Executive',
          facilities: train.facilities || getFacilitiesByClass(train.class_type || train.train_type || 'Executive'),
          insurance: 5000,
          seat_type: 'AD',
          route_type: 'Direct',
          schedule_id: train.schedule_id || train.id,
          isRefundable: true,
          isCheckinAvailable: true,
          isBestDeal: (train.available_seats || 0) > 15,
          isHighDemand: (train.available_seats || 0) < 5,
          isMultiSegment: false,
          classes: train.classes || [{
            class_type: train.class_type || train.train_type || 'Executive',
            price: train.price || train.harga || 250000,
            originalPrice: (train.price || 250000) * 1.2,
            availableSeats: train.available_seats || train.stok_kursi || 20,
            insurance: 5000,
            facilities: train.facilities || getFacilitiesByClass(train.class_type || train.train_type || 'Executive')
          }]
        }));
      }
    }

    // Fallback ke data realistis jika API gagal
    return generateRealisticDirectTrains(origin, destination, departureDate);
  } catch (error) {
    console.error('Error fetching direct trains:', error);
    return generateRealisticDirectTrains(origin, destination, departureDate);
  }
};

// Fungsi helper
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}j ${mins}m`;
};

const getFacilitiesByClass = (trainClass: string): string[] => {
  const facilities: Record<string, string[]> = {
    'Executive': ['AC Dingin', 'Makanan Premium', 'WiFi Gratis', 'Stop Kontak', 'Bantal & Selimut', 'TV Personal'],
    'Business': ['AC', 'Makanan Ringan', 'Stop Kontak', 'Bantal', 'TV Komunal'],
    'Economy': ['AC', 'Toilet', 'Kipas Angin', 'Jendela']
  };
  return facilities[trainClass] || ['AC', 'Toilet'];
};

// Custom Hook untuk mengambil data kereta dengan dukungan multi-segment
const useFetchTrains = (
  origin: string,
  destination: string,
  departureDate: string,
  passengers: number
) => {
  const [allTrains, setAllTrains] = useState<Train[]>([]);
  const [filteredTrains, setFilteredTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [multiSegmentOptions, setMultiSegmentOptions] = useState<MultiSegmentBooking[]>([]);
  const [showMultiSegment, setShowMultiSegment] = useState(false);

  useEffect(() => {
    const fetchTrains = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching trains with params:', {
          origin,
          destination,
          departureDate,
          passengers,
          showMultiSegment
        });

        // Ambil data multi-segment jika dipilih
        if (showMultiSegment) {
          const multiSegmentData = await fetchMultiSegmentOptionsFromDB(
            origin,
            destination,
            departureDate,
            passengers
          );
          setMultiSegmentOptions(multiSegmentData);
          
          // Konversi multi-segment ke format train untuk display
          const segmentTrains: Train[] = multiSegmentData.map((option, index) => ({
            id: `multi-segment-${index}`,
            trainId: index + 1000,
            train_name: `${option.segments.length} Segmen`,
            train_type: 'Multi-Segmen',
            departure_time: option.segments[0]?.departureTime || '07:00',
            arrival_time: option.segments[option.segments.length - 1]?.arrivalTime || '17:00',
            duration: option.totalDuration,
            price: option.totalPrice,
            availableSeats: Math.min(...option.segments.map(s => s.availableSeats)),
            travel_date: departureDate,
            isMultiSegment: true,
            segments: option.segments,
            connectionTime: option.connectionTime,
            classes: [{
              class_type: 'Multi-Segmen',
              price: option.totalPrice,
              originalPrice: option.totalPrice * 1.1,
              availableSeats: Math.min(...option.segments.map(s => s.availableSeats)),
              insurance: 5000,
              facilities: ['Transfer Antar Kereta', 'Asuransi Perjalanan', 'Bantuan Porter']
            }]
          }));

          setAllTrains(segmentTrains);
          setFilteredTrains(segmentTrains);
          console.log('✅ Multi-segment data loaded:', segmentTrains.length, 'options');
        } else {
          // Ambil data direct trains (tanpa transit)
          const directTrains = await fetchDirectTrainsFromDB(
            origin,
            destination,
            departureDate,
            passengers
          );
          
          setAllTrains(directTrains);
          setFilteredTrains(directTrains);
          console.log('✅ Direct trains loaded:', directTrains.length, 'trains');
        }

      } catch (error: any) {
        console.error('❌ Error fetching trains:', error);
        setError('Gagal memuat data kereta dari database. Menampilkan data realistis.');
        
        // Fallback ke data realistis
        const realisticTrains = generateRealisticDirectTrains(origin, destination, departureDate);
        setAllTrains(realisticTrains);
        setFilteredTrains(realisticTrains);
      } finally {
        setLoading(false);
      }
    };

    fetchTrains();
  }, [origin, destination, departureDate, passengers, showMultiSegment]);

  return {
    trains: filteredTrains,
    allTrains,
    loading,
    error,
    multiSegmentOptions,
    showMultiSegment,
    setShowMultiSegment
  };
};

// Fungsi untuk generate data direct trains realistis
const generateRealisticDirectTrains = (
  originCode: string,
  destinationCode: string,
  date: string
): Train[] => {
  const stationNames: Record<string, { name: string, city: string }> = {
    'BD': { name: 'Stasiun Bandung', city: 'Bandung' },
    'PSE': { name: 'Stasiun Gambir', city: 'Jakarta' },
    'GMR': { name: 'Stasiun Gambir', city: 'Jakarta' },
    'SBY': { name: 'Stasiun Surabaya Gubeng', city: 'Surabaya' },
    'YK': { name: 'Stasiun Yogyakarta', city: 'Yogyakarta' },
    'SMC': { name: 'Stasiun Semarang Tawang', city: 'Semarang' },
    'ML': { name: 'Stasiun Malang', city: 'Malang' },
    'BDO': { name: 'Stasiun Bandung', city: 'Bandung' },
  };

  const originInfo = stationNames[originCode] || { name: `Stasiun ${originCode}`, city: originCode };
  const destinationInfo = stationNames[destinationCode] || { name: `Stasiun ${destinationCode}`, city: destinationCode };

  return [
    {
      id: 'argo-parahyangan-001',
      trainId: 101,
      train_number: 'KA-001',
      train_name: 'Argo Parahyangan',
      train_type: 'Executive',
      operator: 'PT KAI',
      origin_station: {
        code: originCode,
        name: originInfo.name,
        city: originInfo.city
      },
      destination_station: {
        code: destinationCode,
        name: destinationInfo.name,
        city: destinationInfo.city
      },
      departure_time: '05:00:00',
      arrival_time: '09:30:00',
      duration_minutes: 270,
      duration: '4j 30m',
      travel_date: date,
      status: 'scheduled',
      harga: 250000,
      price: 250000,
      stok_kursi: 35,
      availableSeats: 35,
      class_type: 'Executive',
      trainClass: 'Executive',
      facilities: ['AC Dingin', 'Makanan Premium', 'WiFi Gratis', 'Stop Kontak', 'Bantal & Selimut', 'TV Personal'],
      insurance: 5000,
      seat_type: 'AD',
      route_type: 'Direct',
      schedule_id: 'schedule-001',
      isRefundable: true,
      isCheckinAvailable: true,
      isBestDeal: true,
      isHighDemand: false,
      isMultiSegment: false,
      classes: [{
        class_type: 'Executive',
        price: 250000,
        originalPrice: 300000,
        availableSeats: 35,
        insurance: 5000,
        facilities: ['AC Dingin', 'Makanan Premium', 'WiFi Gratis', 'Stop Kontak', 'Bantal & Selimut', 'TV Personal']
      }]
    },
    {
      id: 'lodaya-002',
      trainId: 102,
      train_number: 'LDY-002',
      train_name: 'Lodaya',
      train_type: 'Business',
      operator: 'PT KAI',
      origin_station: {
        code: originCode,
        name: originInfo.name,
        city: originInfo.city
      },
      destination_station: {
        code: destinationCode,
        name: destinationInfo.name,
        city: destinationInfo.city
      },
      departure_time: '08:00:00',
      arrival_time: '14:00:00',
      duration_minutes: 360,
      duration: '6j 0m',
      travel_date: date,
      status: 'scheduled',
      harga: 180000,
      price: 180000,
      stok_kursi: 25,
      availableSeats: 25,
      class_type: 'Business',
      trainClass: 'Business',
      facilities: ['AC', 'Makanan Ringan', 'Stop Kontak', 'Bantal', 'TV Komunal'],
      insurance: 5000,
      seat_type: 'AD',
      route_type: 'Direct',
      schedule_id: 'schedule-002',
      isRefundable: true,
      isCheckinAvailable: true,
      isBestDeal: false,
      isHighDemand: false,
      isMultiSegment: false,
      classes: [{
        class_type: 'Business',
        price: 180000,
        originalPrice: 216000,
        availableSeats: 25,
        insurance: 5000,
        facilities: ['AC', 'Makanan Ringan', 'Stop Kontak', 'Bantal', 'TV Komunal']
      }]
    },
    {
      id: 'argo-wilis-003',
      trainId: 103,
      train_number: 'AW-003',
      train_name: 'Argo Wilis',
      train_type: 'Executive',
      operator: 'PT KAI',
      origin_station: {
        code: originCode,
        name: originInfo.name,
        city: originInfo.city
      },
      destination_station: {
        code: destinationCode,
        name: destinationInfo.name,
        city: destinationInfo.city
      },
      departure_time: '09:30:00',
      arrival_time: '15:00:00',
      duration_minutes: 330,
      duration: '5j 30m',
      travel_date: date,
      status: 'scheduled',
      harga: 280000,
      price: 280000,
      stok_kursi: 20,
      availableSeats: 20,
      class_type: 'Executive',
      trainClass: 'Executive',
      facilities: ['AC Dingin', 'Makanan Premium', 'WiFi Gratis', 'Stop Kontak', 'Bantal & Selimut', 'TV Personal'],
      insurance: 5000,
      seat_type: 'AD',
      route_type: 'Direct',
      schedule_id: 'schedule-003',
      isRefundable: true,
      isCheckinAvailable: true,
      isBestDeal: false,
      isHighDemand: true,
      isMultiSegment: false,
      classes: [{
        class_type: 'Executive',
        price: 280000,
        originalPrice: 336000,
        availableSeats: 20,
        insurance: 5000,
        facilities: ['AC Dingin', 'Makanan Premium', 'WiFi Gratis', 'Stop Kontak', 'Bantal & Selimut', 'TV Personal']
      }]
    }
  ];
};

// Komponen FilterAndSort dengan perbaikan untuk multi-segment
const FilterAndSort = ({
  onSort,
  onFilter,
  onPriceRange,
  activeSort,
  activeFilter,
  priceRange,
  showMultiSegment,
  setShowMultiSegment,
  origin,
  destination
}: {
  onSort: (sortType: string) => void;
  onFilter: (filterType: string) => void;
  onPriceRange: (range: { min: number, max: number }) => void;
  activeSort: string;
  activeFilter: string;
  priceRange: { min: number, max: number };
  showMultiSegment: boolean;
  setShowMultiSegment: (show: boolean) => void;
  origin: string;
  destination: string;
}) => {
  const priceRanges = [
    { label: 'Semua Harga', min: 0, max: 1000000 },
    { label: '< Rp 150.000', min: 0, max: 150000 },
    { label: 'Rp 150.000 - Rp 300.000', min: 150000, max: 300000 },
    { label: 'Rp 300.000 - Rp 500.000', min: 300000, max: 500000 },
    { label: '> Rp 500.000', min: 500000, max: 1000000 }
  ];

  // Cek apakah rute ini mendukung multi-segment
  const originName = originCodeToName(origin);
  const destinationName = originCodeToName(destination);
  const normalizedOrigin = originName.toLowerCase();
  const normalizedDest = destinationName.toLowerCase();
  
  const isBandungGambirRoute = 
    (normalizedOrigin.includes('bandung') && normalizedDest.includes('gambir')) ||
    (normalizedOrigin.includes('gambir') && normalizedDest.includes('bandung'));
  
  const showMultiSegmentOption = isBandungGambirRoute;

  return (
    <div className="space-y-6">
      {/* Toggle Multi Segment */}
      {showMultiSegmentOption && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Tipe Perjalanan</h3>
          <div className="bg-gray-100 p-1.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setShowMultiSegment(false)}
              className={`w-full px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${!showMultiSegment
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <span>🚂</span>
              <span>Perjalanan Langsung</span>
            </button>
            <button
              onClick={() => setShowMultiSegment(true)}
              className={`w-full px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${showMultiSegment
                  ? 'bg-[#FD7E14] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <span>🔄</span>
              <span>Dengan Transit Kereta</span>
            </button>
          </div>
        </div>
      )}

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
              className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${activeSort === option.id
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

      {!showMultiSegment && (
        <>
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
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${activeFilter === option.id
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
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all ${priceRange.min === range.min && priceRange.max === range.max
                      ? 'bg-[#FD7E14] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Komponen TrainCard yang diperbarui
const TrainCard = ({ train, passengers, onSelect }: {
  train: any,
  passengers: number,
  onSelect: (train: any, trainClass: any) => void
}) => {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showAllFacilities, setShowAllFacilities] = useState(false);

  const isMultiSegment = train.isMultiSegment;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-orange-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-gray-900">
                {isMultiSegment ? `${train.segments?.length || 2} Segmen Perjalanan` : train.train_name}
              </h3>
              {isMultiSegment ? (
                <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                  Dengan Transit Kereta
                </span>
              ) : (
                <>
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                    No. {train.train_number}
                  </span>
                  {train.train_type && (
                    <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full">
                      {train.train_type}
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.414L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {train.duration}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Berangkat {train.departure_time}
              </span>
              {isMultiSegment && train.connectionTime && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  Waktu transfer: {train.connectionTime} menit
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-sm font-semibold bg-green-100 text-green-800 rounded-full">
                Tersedia
              </span>
            </div>
          </div>
        </div>

        {/* Schedule Timeline untuk Multi-Segmen */}
        {isMultiSegment && train.segments && (
          <div className="mb-6 space-y-4">
            {train.segments.map((segment: any, index: number) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-3">
                      {index + 1}
                    </div>
                    <h4 className="font-bold text-gray-800">{segment.trainName}</h4>
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                      {segment.trainType}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-700">
                      Rp {segment.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{segment.departureTime}</div>
                    <div className="text-sm text-gray-800">{segment.origin}</div>
                  </div>
                  
                  <div className="flex-1 mx-4">
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
                      <span className="text-sm text-gray-600">{segment.duration}</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{segment.arrivalTime}</div>
                    <div className="text-sm text-gray-800">{segment.destination}</div>
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {segment.availableSeats} kursi tersedia
                  </span>
                </div>
              </div>
            ))}
            
            {/* Connection Info */}
            {train.connectionTime && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Waktu Transfer</p>
                    <p className="text-xs text-yellow-700">
                      Anda memiliki {train.connectionTime} menit untuk pindah kereta di stasiun transit.
                      Pastikan tiba minimal 30 menit sebelum keberangkatan kereta berikutnya.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schedule Timeline untuk Single Segment */}
        {!isMultiSegment && (
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
        )}

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
              {train.classes[0].facilities.slice(0, showAllFacilities ? undefined : 3).map((facility: string, idx: number) => (
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
                  {facility === 'Transfer Antar Kereta' && '🔄'}
                  {facility === 'Asuransi Perjalanan' && '🛡️'}
                  {facility === 'Bantuan Porter' && '🧳'}
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
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-[#FD7E14] hover:shadow-md ${selectedClass === trainClass
                  ? 'border-[#FD7E14] bg-orange-50'
                  : 'border-gray-200'
                }`}
              onClick={() => {
                setSelectedClass(trainClass);
              }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-bold text-gray-800 text-lg">{trainClass.class_type}</h4>
                    <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                      Tersedia
                    </span>
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
        {selectedClass && (
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
                  {isMultiSegment ? 'Pilih Perjalanan dengan Transit' : 'Pilih & Lanjutkan'}
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

  const origin = searchParams.get('origin') || 'BD';
  const destination = searchParams.get('destination') || 'GMR';
  const departureDate = searchParams.get('departureDate') || new Date().toISOString().split('T')[0];
  const passengers = parseInt(searchParams.get('passengers') || '1');

  // Gunakan custom hook
  const {
    trains,
    loading,
    error,
    showMultiSegment,
    setShowMultiSegment
  } = useFetchTrains(
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

        // Untuk multi-segment, hitung total duration
        if (train.isMultiSegment) {
          const segments = train.segments || [];
          const totalMinutes = segments.reduce((sum: number, segment: any) => {
            const match = segment.duration.match(/(\d+)j\s*(\d+)m/);
            if (match) {
              const hours = parseInt(match[1]);
              const minutes = parseInt(match[2]);
              return sum + (hours * 60 + minutes);
            }
            return sum + 180; // default 3 hours
          }, 0);
          
          // Tambahkan waktu transfer
          const connectionTime = train.connectionTime || 0;
          const totalWithTransfer = totalMinutes + connectionTime;
          
          if (totalWithTransfer < fastestDuration) {
            fastestDuration = totalWithTransfer;
          }
        } else if (train.duration_minutes && train.duration_minutes < fastestDuration) {
          fastestDuration = train.duration_minutes;
        }
      });

      const hours = Math.floor(fastestDuration / 60);
      const minutes = fastestDuration % 60;
      const durationString = fastestDuration === Infinity ? '' : `${hours}j ${minutes}m`;

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

    // Filter by class (hanya untuk non-multi-segment)
    if (filterType !== 'all' && !showMultiSegment) {
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

    // Filter by price range (untuk semua tipe)
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
          if (a.isMultiSegment && b.isMultiSegment) {
            // Untuk multi-segment, hitung total duration termasuk waktu transfer
            const getTotalMinutes = (train: any) => {
              if (!train.segments) return Infinity;
              const segmentMinutes = train.segments.reduce((sum: number, segment: any) => {
                const match = segment.duration.match(/(\d+)j\s*(\d+)m/);
                if (match) {
                  const hours = parseInt(match[1]);
                  const minutes = parseInt(match[2]);
                  return sum + (hours * 60 + minutes);
                }
                return sum + 180;
              }, 0);
              return segmentMinutes + (train.connectionTime || 0);
            };
            return getTotalMinutes(a) - getTotalMinutes(b);
          }
          if (a.isMultiSegment) return 1; // Multi-segment diakhir
          if (b.isMultiSegment) return -1;
          return (a.duration_minutes || 0) - (b.duration_minutes || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [trains, sortType, filterType, priceRange, showMultiSegment]);

  const handleSelectTrain = (train: any, trainClass: any) => {
    if (train.isMultiSegment) {
      // Handle multi-segment booking
      const segmentData = train.segments.map((segment: any, index: number) => ({
        segmentId: segment.segmentId,
        trainId: segment.trainId,
        trainName: segment.trainName,
        trainType: segment.trainType,
        departureTime: segment.departureTime,
        arrivalTime: segment.arrivalTime,
        duration: segment.duration,
        origin: segment.origin,
        destination: segment.destination,
        price: segment.price,
        availableSeats: segment.availableSeats,
        departureDate: segment.departureDate,
        scheduleId: segment.scheduleId
      }));

      const bookingData = {
        isMultiSegment: true,
        segments: segmentData,
        totalPrice: trainClass.price,
        totalDuration: train.duration,
        passengerCount: passengers,
        connectionTime: train.connectionTime,
        selectedClass: trainClass,
        trainDetails: train
      };

      sessionStorage.setItem('selectedMultiSegment', JSON.stringify(bookingData));
      
      // Redirect ke booking page dengan data multi-segment
      const queryParams = new URLSearchParams({
        isMultiSegment: 'true',
        segments: JSON.stringify(segmentData),
        totalPrice: trainClass.price.toString(),
        totalDuration: train.duration,
        passengers: passengers.toString(),
        connectionTime: train.connectionTime?.toString() || '30'
      });

      router.push(`/booking?${queryParams.toString()}`);
    } else {
      // Handle single segment booking
      const bookingData = {
        scheduleId: train.schedule_id || train.id,
        trainId: train.trainId,
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
        passengerCount: passengers,
        totalAmount: trainClass.price * passengers,
        selectedClass: trainClass,
        trainDetails: train
      };

      sessionStorage.setItem('selectedTrain', JSON.stringify(bookingData));
      
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
    }
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
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {showMultiSegment ? 'Mencari Opsi Perjalanan dengan Transit...' : 'Mencari Kereta...'}
            </h2>
            <p className="text-gray-600">
              {showMultiSegment 
                ? 'Sedang mencari opsi perjalanan multi-segmen untuk Anda'
                : 'Sedang mencari kereta yang tersedia untuk perjalanan Anda'}
            </p>
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
                  {showMultiSegment
                    ? 'Menampilkan data contoh untuk opsi perjalanan dengan transit.'
                    : 'Anda melihat data contoh. Fitur pencarian sesungguhnya akan tersedia segera.'}
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
                  <h1 className="text-2xl font-bold text-gray-800">
                    {showMultiSegment ? 'Hasil Pencarian Perjalanan dengan Transit' : 'Hasil Pencarian Kereta'}
                  </h1>
                  <p className="text-gray-600">
                    {showMultiSegment
                      ? 'Opsi perjalanan dengan transit kereta untuk rute Anda'
                      : 'Berikut adalah kereta yang tersedia untuk perjalanan Anda'}
                  </p>
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
                      {searchStats.totalTrains} {showMultiSegment ? 'Opsi' : 'Kereta'} • {searchStats.totalClasses} Kelas
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

            {searchStats.fastestDuration && (
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
            )}

            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Tersedia</div>
                  <div className="text-xl font-bold text-orange-600">
                    {searchStats.totalTrains} {showMultiSegment ? 'Opsi' : 'Kereta'}
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
                showMultiSegment={showMultiSegment}
                setShowMultiSegment={setShowMultiSegment}
                origin={origin}
                destination={destination}
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
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {showMultiSegment 
                    ? 'Tidak ada opsi perjalanan dengan transit yang ditemukan'
                    : 'Tidak ada kereta yang ditemukan'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {showMultiSegment
                    ? 'Perjalanan dengan transit hanya tersedia untuk rute Bandung-Gambir'
                    : 'Silakan ubah filter atau coba tanggal lain'}
                </p>
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
                        Menampilkan <span className="font-semibold text-gray-800">{filteredTrains.length}</span> {showMultiSegment ? 'opsi perjalanan' : 'kereta'}
                        {filterType !== 'all' && !showMultiSegment && ` • Filter: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`}
                        {sortType !== 'earliest' && ` • Urutkan: ${sortType}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {!showMultiSegment && (
                        <div className="text-sm text-gray-600">
                          Harga: <span className="font-semibold">Rp {priceRange.min.toLocaleString('id-ID')} - Rp {priceRange.max.toLocaleString('id-ID')}</span>
                        </div>
                      )}
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

                {/* Info tambahan */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-gray-600">
                      {showMultiSegment
                        ? '⚠️ Perhatikan waktu transfer antara kereta dan pastikan tiba di stasiun transit minimal 45 menit sebelum keberangkatan kereta berikutnya.'
                        : '📍 Perhatikan waktu keberangkatan dan pastikan tiba di stasiun minimal 30 menit sebelum keberangkatan.'}
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