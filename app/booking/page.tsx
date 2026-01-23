'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TrainSeatMap } from '@/app/components/TrainSeatMap';

// --- Tipe Data ---
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

interface Passenger {
  id: number;
  title: string;
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
  seatNumber: string;
  birthDate: string;
  gender: string;
  seatId: string;
  wagonNumber: string;
  wagonClass: string;
  useContactDetail: boolean;
  idType: string;
  transit_station?: string;
  transit_arrival?: string;
  transit_departure?: string;
}

interface ContactDetail {
  fullName: string;
  email: string;
  phoneNumber: string;
  title: string;
}

interface TrainDetail {
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
  trainCode?: string;
  originCity?: string;
  destinationCity?: string;
  originStationId?: string;
  destinationStationId?: string;
}

interface Seat {
  id: string;
  number: string;
  row: number;
  column: string;
  available: boolean;
  windowSeat: boolean;
  forwardFacing: boolean;
  price: number;
  wagonNumber?: string;
  wagonClass?: string;
}

interface Train {
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
  wagons: Array<{
    number: string;
    name: string;
    class: string;
    facilities: string[];
    availableSeats: number;
    totalSeats: number;
    seats: Seat[];
  }>;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  banks?: string[];
  fees?: number;
  midtrans_payment_type?: string;
}

interface PromoVoucher {
  id: string;
  name: string;
  description: string;
  promo_code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  usage_count: number;
  user_limit: number;
  is_active: boolean;
  applicable_to: string[] | null;
  specific_dates?: Array<{
    start_date: string;
    end_date: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

// --- Multi Segment Types ---
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
  selectedSeats: Seat[];
}

interface MultiSegmentBooking {
  segments: Segment[];
  totalPrice: number;
  totalDuration: string;
  isMultiSegment: boolean;
  connectionTime?: number; // minutes between segments
}

// --- Komponen Ikon ---
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const TrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const TagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);

const TransitIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

const SegmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
  </svg>
);

const ConnectionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
  </svg>
);

// --- Metode Pembayaran ---
const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'bank-transfer',
    name: 'Transfer Bank',
    description: 'BNI, BCA, Mandiri, BRI',
    icon: '🏦',
    banks: ['BNI', 'BCA', 'Mandiri', 'BRI'],
    fees: 0,
    midtrans_payment_type: 'bank_transfer'
  },
  {
    id: 'virtual-account',
    name: 'Virtual Account',
    description: 'Bayar dengan virtual account',
    icon: '🏧',
    banks: ['BCA VA', 'BNI VA', 'Mandiri VA', 'BRI VA'],
    fees: 4000,
    midtrans_payment_type: 'bank_transfer'
  },
  {
    id: 'credit-card',
    name: 'Kartu Kredit',
    description: 'Visa, MasterCard, JCB',
    icon: '💳',
    fees: 0,
    midtrans_payment_type: 'credit_card'
  },
  {
    id: 'e-wallet',
    name: 'E-Wallet',
    description: 'Qris, OVO, GoPay, DANA, ShopeePay',
    icon: '💰',
    midtrans_payment_type: 'gopay'
  },
];

// --- Fungsi Helper ---
const createDefaultPassenger = (id: number): Passenger => ({
  id,
  title: 'Tn',
  fullName: '',
  idNumber: '',
  phoneNumber: '',
  email: '',
  seatNumber: '',
  birthDate: '',
  gender: '',
  seatId: '',
  wagonNumber: '',
  wagonClass: '',
  useContactDetail: false,
  idType: 'ID',
});

const formatDepartureDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Tanggal tidak valid');
    }
    
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    if (typeof dateString === 'string' && dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        const monthNames = [
          'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
          'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const dayName = dayNames[dateObj.getDay()];
        const monthName = monthNames[dateObj.getMonth()];
        
        return `${dayName}, ${parseInt(day)} ${monthName} ${year}`;
      }
    }
    
    const today = new Date();
    return today.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getRealtimeDepartureDate = (dateFromUrl: string | null): string => {
  if (dateFromUrl) {
    if (typeof dateFromUrl === 'string') {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (datePattern.test(dateFromUrl)) {
        const selectedDate = new Date(dateFromUrl);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const maxDate = new Date();
        maxDate.setMonth(today.getMonth() + 3);
        
        if (selectedDate >= today && selectedDate <= maxDate) {
          return dateFromUrl;
        }
      }
    }
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const autoSelectSeats = (trainData: Train | null, passengerCount: number): Seat[] => {
  if (!trainData || !trainData.wagons || passengerCount <= 0) {
    return [];
  }

  const selectedSeats: Seat[] = [];
  
  for (const wagon of trainData.wagons) {
    if (selectedSeats.length >= passengerCount) break;

    const availableSeats = wagon.seats.filter(seat => seat.available);
    
    const sortedSeats = [...availableSeats].sort((a, b) => {
      if (a.windowSeat !== b.windowSeat) return a.windowSeat ? 1 : -1;
      if (a.forwardFacing !== b.forwardFacing) return a.forwardFacing ? 1 : -1;
      return a.price - b.price;
    });

    for (const seat of sortedSeats) {
      if (selectedSeats.length >= passengerCount) break;
      
      selectedSeats.push({
        ...seat,
        wagonNumber: wagon.number,
        wagonClass: wagon.class
      });
    }
  }

  return selectedSeats.slice(0, passengerCount);
};

// DUMMY PROMO - SEMUA KATEGORI KERETA
const DUMMY_PROMO_VOUCHERS: PromoVoucher[] = [
  {
    id: '1',
    name: 'Flash Sale 40%',
    description: 'Diskon 40% untuk pembelian cepat',
    promo_code: 'FLASH40',
    discount_type: 'percentage',
    discount_value: 40,
    min_order_amount: 200000,
    max_discount_amount: 200000,
    start_date: '2025-01-01T00:00:00Z',
    end_date: '2026-12-31T23:59:59Z',
    usage_limit: 500,
    usage_count: 250,
    user_limit: 1,
    is_active: true,
    applicable_to: null
  },
  {
    id: '2',
    name: 'Welcome Discount',
    description: 'Diskon 10% untuk pembelian pertama',
    promo_code: 'WELCOME10',
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 100000,
    max_discount_amount: 50000,
    start_date: '2024-01-01T00:00:00Z',
    end_date: '2024-12-31T23:59:59Z',
    usage_limit: 1000,
    usage_count: 245,
    user_limit: 1,
    is_active: true,
    applicable_to: null
  },
  {
    id: '3',
    name: 'Diskon Keluarga 30%',
    description: 'Diskon khusus untuk minimal 3 penumpang',
    promo_code: 'FAMILY30',
    discount_type: 'percentage',
    discount_value: 30,
    min_order_amount: 300000,
    max_discount_amount: 150000,
    start_date: '2024-01-01T00:00:00Z',
    end_date: '2024-12-31T23:59:59Z',
    usage_limit: 200,
    usage_count: 120,
    user_limit: 2,
    is_active: true,
    applicable_to: null
  },
  {
    id: '4',
    name: 'Potongan Tetap 50rb',
    description: 'Potongan harga tetap Rp 50.000',
    promo_code: 'DISKON50',
    discount_type: 'fixed',
    discount_value: 50000,
    min_order_amount: 250000,
    max_discount_amount: 50000,
    start_date: '2024-01-01T00:00:00Z',
    end_date: '2024-12-31T23:59:59Z',
    usage_limit: 300,
    usage_count: 180,
    user_limit: 1,
    is_active: true,
    applicable_to: null
  }
];

// Fungsi validasi promo
const validatePromoCode = (
  promoCode: string, 
  basePrice: number, 
  passengerCount: number, 
  trainType: string,
  departureDate: string
): { isValid: boolean; promo?: PromoVoucher; discountAmount: number; message: string } => {
  
  const promo = DUMMY_PROMO_VOUCHERS.find(p => 
    p.promo_code.toUpperCase() === promoCode.toUpperCase() && p.is_active
  );
  
  if (!promo) {
    return {
      isValid: false,
      discountAmount: 0,
      message: 'Kode promo/voucher tidak ditemukan'
    };
  }
  
  const today = new Date();
  const startDate = new Date(promo.start_date);
  const endDate = new Date(promo.end_date);
  
  if (today < startDate) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Promo akan berlaku mulai ${formatDate(promo.start_date)}`
    };
  }
  
  if (today > endDate) {
    return {
      isValid: false,
      discountAmount: 0,
      message: 'Promo/voucher telah kadaluarsa'
    };
  }
  
  if (promo.usage_limit > 0 && promo.usage_count >= promo.usage_limit) {
    return {
      isValid: false,
      discountAmount: 0,
      message: 'Kuota promo/voucher telah habis'
    };
  }
  
  const totalPrice = basePrice * passengerCount;
  if (totalPrice < promo.min_order_amount) {
    return {
      isValid: false,
      discountAmount: 0,
      message: `Minimal pembelian Rp ${promo.min_order_amount.toLocaleString('id-ID')}`
    };
  }
  
  if (promo.applicable_to && promo.applicable_to.length > 0) {
    if (!promo.applicable_to.includes(trainType)) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Promo tidak berlaku untuk kelas ${trainType}`
      };
    }
  }
  
  if (promo.promo_code === 'FAMILY30' && passengerCount < 3) {
    return {
      isValid: false,
      discountAmount: 0,
      message: 'Promo keluarga berlaku untuk minimal 3 penumpang'
    };
  }
  
  let discountAmount = 0;
  
  if (promo.discount_type === 'percentage') {
    discountAmount = totalPrice * (promo.discount_value / 100);
    if (promo.max_discount_amount > 0 && discountAmount > promo.max_discount_amount) {
      discountAmount = promo.max_discount_amount;
    }
  } else if (promo.discount_type === 'fixed') {
    discountAmount = promo.discount_value;
  }
  
  return {
    isValid: true,
    promo,
    discountAmount,
    message: `Promo/voucher berhasil diterapkan! Diskon: Rp ${discountAmount.toLocaleString('id-ID')}`
  };
};

// --- FUNGSI TRANSIT ---
const fetchTransitStations = async (
  scheduleId: string,
  origin: string,
  destination: string
): Promise<TransitStation[]> => {
  try {
    if (!scheduleId || !origin || !destination) {
      console.warn('Missing parameters for fetchTransitStations');
      return [];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const url = `/api/schedules/${scheduleId}/transit?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Transit API error: ${response.status} ${response.statusText}`);
      return getDummyTransitStations();
    }
    
    const data = await response.json();
    
    if (data.success && data.transitRoutes) {
      return data.transitRoutes.map((route: any) => ({
        id: route.id,
        station_id: route.station_id,
        station_name: route.station_name,
        arrival_time: route.arrival_time,
        departure_time: route.departure_time,
        waiting_minutes: route.waiting_minutes,
        available_seats: route.available_seats,
        additional_price: route.additional_price || 0,
        previous_station: route.previous_station,
        next_station: route.next_station
      }));
    }
    
    return getDummyTransitStations();
    
  } catch (error: any) {
    console.error('Error fetching transit stations:', error);
    return getDummyTransitStations();
  }
};

const getDummyTransitStations = (): TransitStation[] => {
  return [
    {
      id: 'transit-1',
      station_id: 'stasiun-cirebon',
      station_name: 'Stasiun Cirebon',
      arrival_time: '07:30',
      departure_time: '07:45',
      waiting_minutes: 15,
      available_seats: 20,
      additional_price: 50000,
      previous_station: 'Bandung',
      next_station: 'Jakarta Gambir'
    },
    {
      id: 'transit-2',
      station_id: 'stasiun-tasikmalaya',
      station_name: 'Stasiun Tasikmalaya',
      arrival_time: '06:30',
      departure_time: '06:45',
      waiting_minutes: 15,
      available_seats: 15,
      additional_price: 30000,
      previous_station: 'Bandung',
      next_station: 'Yogyakarta'
    }
  ];
};

const createTransitBooking = async (bookingData: any) => {
  try {
    const response = await fetch('/api/bookings/transit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create booking');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating transit booking:', error);
    throw error;
  }
};

// --- FUNGSI MULTI SEGMEN ---
const fetchMultiSegmentOptions = async (
  origin: string,
  destination: string,
  departureDate: string,
  passengerCount: number
): Promise<MultiSegmentBooking[]> => {
  try {
    // Simulasi data multi-segmen
    const dummySegments: MultiSegmentBooking[] = [
      {
        segments: [
          {
            segmentId: 'segment-1',
            trainId: 101,
            trainName: 'Parahyangan',
            trainType: 'Executive',
            departureTime: '08:00',
            arrivalTime: '12:00',
            duration: '4j 0m',
            origin: 'Bandung',
            destination: 'Cirebon',
            price: 150000,
            availableSeats: 20,
            departureDate: departureDate,
            scheduleId: 'sched-1',
            selectedSeats: [],
            transitStations: getDummyTransitStations()
          },
          {
            segmentId: 'segment-2',
            trainId: 102,
            trainName: 'Argo Bromo',
            trainType: 'Executive',
            departureTime: '14:00',
            arrivalTime: '18:00',
            duration: '4j 0m',
            origin: 'Cirebon',
            destination: 'Surabaya',
            price: 200000,
            availableSeats: 15,
            departureDate: departureDate,
            scheduleId: 'sched-2',
            selectedSeats: [],
            transitStations: getDummyTransitStations()
          }
        ],
        totalPrice: 350000,
        totalDuration: '8j 0m',
        isMultiSegment: true,
        connectionTime: 120 // 2 jam
      },
      {
        segments: [
          {
            segmentId: 'segment-3',
            trainId: 103,
            trainName: 'Gajayana',
            trainType: 'Luxury',
            departureTime: '10:00',
            arrivalTime: '18:00',
            duration: '8j 0m',
            origin: 'Jakarta',
            destination: 'Surabaya',
            price: 500000,
            availableSeats: 10,
            departureDate: departureDate,
            scheduleId: 'sched-3',
            selectedSeats: [],
            transitStations: getDummyTransitStations()
          }
        ],
        totalPrice: 500000,
        totalDuration: '8j 0m',
        isMultiSegment: false
      }
    ];
    
    return dummySegments;
  } catch (error) {
    console.error('Error fetching multi-segment options:', error);
    return [];
  }
};

// --- Komponen TransitSelector ---
const TransitSelector = ({
  transitOptions,
  selectedTransit,
  onSelect,
  loading,
  passengerCount,
  scheduleId,
  error,
  origin,
  destination
}: {
  transitOptions: TransitStation[];
  selectedTransit: TransitStation | null;
  onSelect: (transit: TransitStation | null) => void;
  loading: boolean;
  passengerCount: number;
  scheduleId: string;
  error?: string | null;
  origin: string;
  destination: string;
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FD7E14]"></div>
          <span className="ml-3 text-gray-600">Memuat stasiun transit...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-700">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Anda dapat melanjutkan tanpa transit</p>
        </div>
      </div>
    );
  }

  if (transitOptions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <TransitIcon />
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-bold text-gray-800">Transit Tidak Tersedia</h3>
            <p className="text-gray-600">Tidak ada stasiun transit yang tersedia untuk rute ini</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            Untuk rute {origin} → {destination} saat ini tidak tersedia pilihan transit. 
            Anda dapat melanjutkan dengan tiket langsung.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <TransitIcon />
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-bold text-gray-800">Pilih Transit</h3>
          <p className="text-gray-600">
            {transitOptions.length} stasiun transit tersedia
          </p>
        </div>
      </div>

      {selectedTransit ? (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-bold text-purple-800">Transit Dipilih</h4>
              <p className="text-purple-600">{selectedTransit.station_name}</p>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 border border-red-200 rounded hover:bg-red-50"
            >
              Batalkan Transit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-purple-700">
            <div><span className="font-medium">Tiba:</span> {selectedTransit.arrival_time}</div>
            <div><span className="font-medium">Berangkat:</span> {selectedTransit.departure_time}</div>
            <div><span className="font-medium">Menunggu:</span> {selectedTransit.waiting_minutes} menit</div>
            <div><span className="font-medium">Kursi tersedia:</span> {selectedTransit.available_seats}</div>
            {selectedTransit.additional_price > 0 && (
              <div className="col-span-2">
                <span className="font-medium">Biaya tambahan:</span> Rp {selectedTransit.additional_price.toLocaleString('id-ID')}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600 mb-4">
            Pilih stasiun transit jika ingin turun di tengah perjalanan.
          </p>

          
          
          {transitOptions.map((transit) => (
            <div
              key={transit.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedTransit?.id === transit.id
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-100'
                  : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
              onClick={() => transit.available_seats >= passengerCount ? onSelect(transit) : null}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                    selectedTransit?.id === transit.id
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-400'
                  }`}>
                    {selectedTransit?.id === transit.id && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <h4 className="font-bold text-gray-800">{transit.station_name}</h4>
                </div>
                <div className="text-right">
                  {transit.additional_price > 0 ? (
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        +Rp {transit.additional_price.toLocaleString('id-ID')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transit.available_seats} kursi tersedia
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        Gratis Transit
                      </div>
                      <div className="text-sm text-gray-500">
                        {transit.available_seats} kursi tersedia
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 ml-9">
                <div><span className="font-medium">Tiba:</span> {transit.arrival_time}</div>
                <div><span className="font-medium">Berangkat:</span> {transit.departure_time}</div>
                <div><span className="font-medium">Menunggu:</span> {transit.waiting_minutes} menit</div>
                <div><span className="font-medium">Rute:</span> {transit.previous_station} → {transit.next_station}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Komponen MultiSegmentSelector ---
const MultiSegmentSelector = ({
  multiSegmentOptions,
  selectedMultiSegment,
  onSelect,
  loading,
  passengerCount
}: {
  multiSegmentOptions: MultiSegmentBooking[];
  selectedMultiSegment: MultiSegmentBooking | null;
  onSelect: (segment: MultiSegmentBooking | null) => void;
  loading: boolean;
  passengerCount: number;
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FD7E14]"></div>
          <span className="ml-3 text-gray-600">Memuat opsi multi-segmen...</span>
        </div>
      </div>
    );
  }

  if (multiSegmentOptions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <SegmentIcon />
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-bold text-gray-800">Opsi Perjalanan Multi-Segmen</h3>
          <p className="text-gray-600">
            {multiSegmentOptions.length} opsi perjalanan tersedia
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {multiSegmentOptions.map((option, index) => (
          <div
            key={`multi-segment-${index}`}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedMultiSegment?.segments[0]?.segmentId === option.segments[0]?.segmentId
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/50'
            }`}
            onClick={() => onSelect(option)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                  selectedMultiSegment?.segments[0]?.segmentId === option.segments[0]?.segmentId
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-400'
                }`}>
                  {selectedMultiSegment?.segments[0]?.segmentId === option.segments[0]?.segmentId && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">
                    {option.isMultiSegment ? 'Perjalanan Multi-Segmen' : 'Perjalanan Langsung'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {option.segments.map(seg => seg.trainName).join(' → ')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  Rp {option.totalPrice.toLocaleString('id-ID')}
                </div>
                <div className="text-sm text-gray-500">
                  {option.totalDuration}
                </div>
              </div>
            </div>
            
            <div className="ml-9 space-y-3">
              {option.segments.map((segment, segIndex) => (
                <div key={`segment-${segIndex}`} className="text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs mr-2">
                      {segIndex + 1}
                    </div>
                    <span className="font-medium">{segment.origin}</span>
                    <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{segment.destination}</span>
                    <span className="ml-2 px-2 py-1 text-xs bg-gray-100 rounded">
                      {segment.departureTime} - {segment.arrivalTime}
                    </span>
                  </div>
                  <div className="ml-6 mt-1">
                    <span className="text-xs">{segment.trainName} • {segment.trainType}</span>
                  </div>
                </div>
              ))}
              
              {option.isMultiSegment && option.connectionTime && (
                <div className="ml-6 flex items-center text-yellow-600 text-sm">
                  <ConnectionIcon />
                  <span className="ml-2">
                    Waktu transfer: {option.connectionTime} menit
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {selectedMultiSegment && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-bold text-blue-800">Perjalanan Dipilih</h4>
              <p className="text-blue-600">
                {selectedMultiSegment.segments.length} segmen perjalanan
              </p>
            </div>
            <button
              onClick={() => onSelect(null)}
              className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 border border-red-200 rounded hover:bg-red-50"
            >
              Batalkan Pilihan
            </button>
          </div>
          <div className="space-y-2 text-sm text-blue-700">
            <div><span className="font-medium">Total Harga:</span> Rp {selectedMultiSegment.totalPrice.toLocaleString('id-ID')}</div>
            <div><span className="font-medium">Total Durasi:</span> {selectedMultiSegment.totalDuration}</div>
            <div><span className="font-medium">Jumlah Segmen:</span> {selectedMultiSegment.segments.length}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Komponen Utama ---
const BookingPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State utama
  const [trainDetail, setTrainDetail] = useState<TrainDetail | null>(null);
  const [trainData, setTrainData] = useState<Train | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([createDefaultPassenger(Date.now())]);
  const [passengerCount, setPassengerCount] = useState(1);
  const [contactDetail, setContactDetail] = useState<ContactDetail>({
    fullName: '',
    email: '',
    phoneNumber: '',
    title: 'Tn'
  });
  const [selectedPayment, setSelectedPayment] = useState<string>('bank-transfer');
  const [agreement, setAgreement] = useState(false);
  const [bookingStep, setBookingStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedBookingCode, setGeneratedBookingCode] = useState<string>('');
  const [generatedOrderId, setGeneratedOrderId] = useState<string>('');
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [autoSelectEnabled, setAutoSelectEnabled] = useState(true);
  const [passengerDataFilled, setPassengerDataFilled] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // State untuk promo
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoVoucher | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');
  const [promoError, setPromoError] = useState('');
  const [showPromoList, setShowPromoList] = useState(false);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [availablePromos, setAvailablePromos] = useState<PromoVoucher[]>(DUMMY_PROMO_VOUCHERS);
  
  // State untuk transit
  const [transitStations, setTransitStations] = useState<TransitStation[]>([]);
  const [selectedTransit, setSelectedTransit] = useState<TransitStation | null>(null);
  const [transitLoading, setTransitLoading] = useState(false);
  const [transitError, setTransitError] = useState<string | null>(null);
  const [transitAdditionalPrice, setTransitAdditionalPrice] = useState(0);

  // State untuk multi-segmen
  const [multiSegmentOptions, setMultiSegmentOptions] = useState<MultiSegmentBooking[]>([]);
  const [selectedMultiSegment, setSelectedMultiSegment] = useState<MultiSegmentBooking | null>(null);
  const [multiSegmentLoading, setMultiSegmentLoading] = useState(false);
  const [showMultiSegment, setShowMultiSegment] = useState(false);

  // Ambil parameter dari URL
  const scheduleId = searchParams.get('scheduleId');
  const urlPassengers = parseInt(searchParams.get('passengers') || '1');
  const trainId = parseInt(searchParams.get('trainId') || '1');
  const price = parseInt(searchParams.get('price') || '265000');
  const trainName = searchParams.get('trainName') || 'Parahyangan';
  const trainType = searchParams.get('trainType') || 'Executive';
  const departureTime = searchParams.get('departureTime') || '05:00';
  const origin = searchParams.get('origin') || 'Bandung';
  const destination = searchParams.get('destination') || 'Gambir';
  const departureDateFromUrl = searchParams.get('departureDate');

  const realtimeDepartureDate = getRealtimeDepartureDate(departureDateFromUrl);

  // Perhitungan harga
  const basePrice = trainDetail ? trainDetail.price * passengerCount : 0;
  const adminFee = 5000;
  const insuranceFee = 10000;
  const selectedPaymentMethod = PAYMENT_METHODS.find(method => method.id === selectedPayment);
  const paymentFee = selectedPaymentMethod?.fees || 0;
  
  const seatPriceAdjustment = selectedSeats.reduce((sum, seat) => {
    const basePrice = trainDetail?.price || 265000;
    return sum + (seat.price - basePrice);
  }, 0);
  
  const transitDiscount = selectedTransit ? basePrice * 0.1 : 0;
  
  // Adjust price calculation for multi-segment
  const totalSegmentPrice = selectedMultiSegment 
    ? selectedMultiSegment.totalPrice * passengerCount
    : basePrice;
  
  const subtotal = totalSegmentPrice + seatPriceAdjustment - transitDiscount + transitAdditionalPrice;
  const totalBeforeDiscount = subtotal + adminFee + insuranceFee + paymentFee;
  const grandTotal = totalBeforeDiscount - discountAmount;

  // Generate booking code
  useEffect(() => {
    if (!generatedBookingCode) {
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const bookingCode = `BOOK-${timestamp.toString().slice(-6)}-${randomSuffix}`;
      const orderId = `ORDER-${timestamp}-${randomSuffix}`;
      setGeneratedBookingCode(bookingCode);
      setGeneratedOrderId(orderId);
    }
  }, [generatedBookingCode]);

  const generatePassengerId = () => {
    return Date.now() + Math.floor(Math.random() * 1000);
  };

  // Initialize passengers
  const initializePassengers = (count: number) => {
    const initialPassengers: Passenger[] = [];
    for (let i = 0; i < count; i++) {
      const passenger = createDefaultPassenger(generatePassengerId());
      if (i === 0) passenger.useContactDetail = true;
      initialPassengers.push(passenger);
    }
    return initialPassengers;
  };

  // Load data kereta
  useEffect(() => {
    let isMounted = true;

    const loadTrainData = async () => {
      if (!isMounted) return;
      
      setLoading(true);
      setError(null);

      try {
        const calculateArrivalTime = (depTime: string, duration: string): string => {
          try {
            const [hours, minutes] = depTime.split(':').map(Number);
            const [durHours, durMinutes] = duration.split(/[jh\s]/).map(Number).filter(n => !isNaN(n));
            
            const depDate = new Date();
            depDate.setHours(hours, minutes, 0, 0);
            
            const arrivalDate = new Date(depDate.getTime() + 
              (durHours * 60 * 60 * 1000) + 
              (durMinutes * 60 * 1000));
            
            const arrivalHours = arrivalDate.getHours().toString().padStart(2, '0');
            const arrivalMinutes = arrivalDate.getMinutes().toString().padStart(2, '0');
            
            return `${arrivalHours}:${arrivalMinutes}`;
          } catch {
            return '10:00';
          }
        };
        
        const duration = '5j 0m';
        const arrivalTime = calculateArrivalTime(departureTime, duration);
        
        const dummyData: TrainDetail = {
          trainId,
          trainName,
          trainType,
          departureTime,
          arrivalTime,
          duration,
          origin,
          destination,
          price,
          availableSeats: 25,
          departureDate: realtimeDepartureDate,
          scheduleId: scheduleId || 'dummy-schedule-1',
          originStationId: 'stasiun-bandung',
          destinationStationId: 'stasiun-gambir'
        };
        
        if (isMounted) {
          setTrainDetail(dummyData);
          
          const urlPassengerCount = Math.max(1, Math.min(urlPassengers, 9));
          setPassengerCount(urlPassengerCount);
          
          const initialPassengers = initializePassengers(urlPassengerCount);
          setPassengers(initialPassengers);
          
          // Generate seat data
          const generateSeatData = () => {
            const wagonsConfig = {
              'Executive': [
                { number: '1', name: 'Gerbong 1', class: 'executive', seats: 40, facilities: ['AC', 'Toilet', 'Power Outlet', 'WiFi'] },
                { number: '2', name: 'Gerbong 2', class: 'executive', seats: 40, facilities: ['AC', 'Toilet', 'Power Outlet'] },
              ],
              'Business': [
                { number: '1', name: 'Gerbong 1', class: 'business', seats: 50, facilities: ['AC', 'Toilet', 'Power Outlet'] },
                { number: '2', name: 'Gerbong 2', class: 'business', seats: 50, facilities: ['AC', 'Toilet'] },
              ],
              'Economy': [
                { number: '1', name: 'Gerbong 1', class: 'economy', seats: 60, facilities: ['AC', 'Toilet'] },
                { number: '2', name: 'Gerbong 2', class: 'economy', seats: 60, facilities: ['AC', 'Toilet'] },
              ]
            };
            
            const selectedWagons = wagonsConfig[trainType as keyof typeof wagonsConfig] || wagonsConfig.Executive;
            
            const wagons = selectedWagons.map(wagonConfig => {
              const rows = wagonConfig.class === 'executive' ? 10 : 
                           wagonConfig.class === 'business' ? 10 : 12;
              const columns = wagonConfig.class === 'executive' ? ['A', 'B', 'C', 'D'] :
                             ['A', 'B', 'C', 'D'];
              
              const seats: Seat[] = [];
              for (let row = 1; row <= rows; row++) {
                columns.forEach((column, colIndex) => {
                  const seatNumber = `${column}${row}`;
                  const id = `${wagonConfig.number}-${seatNumber}`;
                  
                  const available = Math.random() > 0.3;
                  const windowSeat = colIndex === 0 || colIndex === columns.length - 1;
                  const forwardFacing = row % 2 === 1;
                  
                  let calculatedPrice = price;
                  if (wagonConfig.class === 'executive') calculatedPrice *= 1.5;
                  if (wagonConfig.class === 'business') calculatedPrice *= 1.2;
                  if (windowSeat) calculatedPrice *= 1.1;
                  if (forwardFacing) calculatedPrice *= 1.05;
                  
                  seats.push({
                    id,
                    number: seatNumber,
                    row,
                    column,
                    available,
                    windowSeat,
                    forwardFacing,
                    price: Math.round(calculatedPrice),
                    wagonNumber: wagonConfig.number,
                    wagonClass: wagonConfig.class
                  });
                });
              }
              
              const availableSeats = seats.filter(seat => seat.available).length;
              
              return {
                number: wagonConfig.number,
                name: wagonConfig.name,
                class: wagonConfig.class,
                facilities: wagonConfig.facilities,
                availableSeats,
                totalSeats: seats.length,
                seats
              };
            });

            const totalAvailableSeats = wagons.reduce((sum, wagon) => sum + wagon.availableSeats, 0);
            
            return {
              wagons,
              totalAvailableSeats
            };
          };

          const seatData = generateSeatData();
          const trainDataObj: Train = {
            trainId: dummyData.trainId,
            trainName: dummyData.trainName,
            trainType: dummyData.trainType,
            departureTime: dummyData.departureTime,
            arrivalTime: dummyData.arrivalTime,
            duration: dummyData.duration,
            origin: dummyData.origin,
            destination: dummyData.destination,
            price: dummyData.price,
            availableSeats: seatData.totalAvailableSeats,
            departureDate: dummyData.departureDate,
            scheduleId: scheduleId || 'dummy-schedule-1',
            wagons: seatData.wagons
          };
          
          setTrainData(trainDataObj);
          
          // Auto-select kursi
          if (autoSelectEnabled) {
            const autoSelectedSeats = autoSelectSeats(trainDataObj, urlPassengerCount);
            setSelectedSeats(autoSelectedSeats);
          }

          // Load multi-segment options
          loadMultiSegmentOptions();
        }
      } catch (error: any) {
        if (isMounted) {
          console.error('Error loading train data:', error);
          setError('Gagal memuat data kereta. Silakan coba lagi atau pilih kereta lain.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTrainData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Load multi-segment options
  const loadMultiSegmentOptions = async () => {
    setMultiSegmentLoading(true);
    try {
      const options = await fetchMultiSegmentOptions(
        origin,
        destination,
        realtimeDepartureDate,
        passengerCount
      );
      setMultiSegmentOptions(options);
      
      // Set default to first option
      if (options.length > 0) {
        setSelectedMultiSegment(options[0]);
      }
    } catch (error) {
      console.error('Error loading multi-segment options:', error);
    } finally {
      setMultiSegmentLoading(false);
    }
  };

  // Load transit stations
  useEffect(() => {
    let isMounted = true;

    const loadTransitStations = async () => {
      if (!trainDetail?.scheduleId || !origin || !destination) {
        if (isMounted) {
          setTransitStations(getDummyTransitStations());
        }
        return;
      }

      if (!isMounted) return;
      
      setTransitLoading(true);
      setTransitError(null);
      
      try {
        const stations = await fetchTransitStations(
          trainDetail.scheduleId,
          origin,
          destination
        );
        
        if (isMounted) {
          setTransitStations(stations.length > 0 ? stations : getDummyTransitStations());
        }
      } catch (error: any) {
        if (isMounted) {
          console.error('Error loading transit:', error);
          setTransitError('Gagal memuat data stasiun transit');
          setTransitStations(getDummyTransitStations());
        }
      } finally {
        if (isMounted) {
          setTransitLoading(false);
        }
      }
    };

    if (trainDetail) {
      loadTransitStations();
    }
    
    return () => {
      isMounted = false;
    };
  }, [trainDetail, origin, destination]);

  // Update jumlah penumpang
  useEffect(() => {
    const maxPassengers = Math.max(1, Math.min(passengerCount, 9));
    
    if (passengers.length < maxPassengers) {
      const newPassengers = [...passengers];
      for (let i = passengers.length; i < maxPassengers; i++) {
        const newPassenger = createDefaultPassenger(generatePassengerId());
        newPassenger.useContactDetail = false;
        newPassengers.push(newPassenger);
      }
      setPassengers(newPassengers);
    } 
    else if (passengers.length > maxPassengers) {
      const newPassengers = passengers.slice(0, maxPassengers);
      setPassengers(newPassengers);
    }
    
    if (passengerCount < 1) {
      setPassengerCount(1);
    } else if (passengerCount > 9) {
      setPassengerCount(9);
    }

    if (autoSelectEnabled && trainData) {
      const autoSelectedSeats = autoSelectSeats(trainData, passengerCount);
      setSelectedSeats(autoSelectedSeats);
    }

    // Reload multi-segment options when passenger count changes
    if (trainDetail) {
      loadMultiSegmentOptions();
    }
  }, [passengerCount, autoSelectEnabled, trainData]);

  // Cek kelengkapan data
  useEffect(() => {
    const allPassengersFilled = passengers.every(passenger => 
      passenger.fullName.trim() !== '' &&
      passenger.idNumber.trim() !== '' &&
      (passenger.useContactDetail || (passenger.phoneNumber.trim() !== '' && passenger.email.trim() !== '' && passenger.email.includes('@')))
    );
    
    const contactDetailFilled = 
      contactDetail.fullName.trim() !== '' &&
      contactDetail.email.trim() !== '' &&
      contactDetail.email.includes('@') &&
      contactDetail.phoneNumber.trim() !== '';
    
    setPassengerDataFilled(allPassengersFilled && contactDetailFilled);
  }, [passengers, contactDetail]);

  // Update kursi penumpang
  useEffect(() => {
    const updatedPassengers = [...passengers];
    
    updatedPassengers.forEach(passenger => {
      passenger.seatNumber = '';
      passenger.seatId = '';
      passenger.wagonNumber = '';
      passenger.wagonClass = '';
    });
    
    selectedSeats.forEach((seat, index) => {
      if (updatedPassengers[index]) {
        updatedPassengers[index].seatNumber = seat.number;
        updatedPassengers[index].seatId = seat.id;
        updatedPassengers[index].wagonNumber = seat.wagonNumber || '';
        updatedPassengers[index].wagonClass = seat.wagonClass || '';
      }
    });
    
    setPassengers(updatedPassengers);
  }, [selectedSeats]);

  // Handle transit selection
  const handleTransitSelect = useCallback((transit: TransitStation | null) => {
    if (transit) {
      if (transit.available_seats < passengerCount) {
        alert(`Hanya tersedia ${transit.available_seats} kursi untuk transit di ${transit.station_name}`);
        return;
      }

      setSelectedTransit(transit);
      const additionalPrice = transit.waiting_minutes * 500;
      setTransitAdditionalPrice(additionalPrice);
      
      const updatedPassengers = passengers.map(passenger => ({
        ...passenger,
        transit_station: transit.station_name,
        transit_arrival: transit.arrival_time,
        transit_departure: transit.departure_time
      }));
      setPassengers(updatedPassengers);
    } else {
      setSelectedTransit(null);
      setTransitAdditionalPrice(0);
      
      const updatedPassengers = passengers.map(passenger => ({
        ...passenger,
        transit_station: undefined,
        transit_arrival: undefined,
        transit_departure: undefined
      }));
      setPassengers(updatedPassengers);
    }
  }, [passengers, passengerCount]);

  // Handle multi-segment selection
  const handleMultiSegmentSelect = (segment: MultiSegmentBooking | null) => {
    setSelectedMultiSegment(segment);
    
    if (segment) {
      // Update train detail with first segment
      const firstSegment = segment.segments[0];
      if (firstSegment) {
        setTrainDetail({
          ...firstSegment,
          scheduleId: firstSegment.scheduleId,
          originStationId: firstSegment.origin.toLowerCase().replace(/\s+/g, '-'),
          destinationStationId: firstSegment.destination.toLowerCase().replace(/\s+/g, '-')
        });
      }
    }
  };

  // Handle perubahan data penumpang
  const handlePassengerChange = (index: number, field: keyof Passenger, value: string | boolean) => {
    const updatedPassengers = passengers.map((passenger, i) => {
      if (i === index) {
        const updatedPassenger = {
          ...passenger,
          [field]: value
        };

        if (field === 'useContactDetail' && value === true) {
          updatedPassenger.fullName = contactDetail.fullName;
          updatedPassenger.email = contactDetail.email;
          updatedPassenger.phoneNumber = contactDetail.phoneNumber;
          updatedPassenger.title = contactDetail.title;
        }

        return updatedPassenger;
      }
      return passenger;
    });
    setPassengers(updatedPassengers);
  };

  // Handle perubahan contact detail
  const handleContactDetailChange = (field: keyof ContactDetail, value: string) => {
    const updatedContactDetail = {
      ...contactDetail,
      [field]: value
    };
    setContactDetail(updatedContactDetail);

    const updatedPassengers = passengers.map(passenger => {
      if (passenger.useContactDetail) {
        const updatedPassenger = { ...passenger };
        
        switch(field) {
          case 'fullName':
            updatedPassenger.fullName = value;
            break;
          case 'email':
            updatedPassenger.email = value;
            break;
          case 'phoneNumber':
            updatedPassenger.phoneNumber = value;
            break;
          case 'title':
            updatedPassenger.title = value;
            break;
        }
        
        return updatedPassenger;
      }
      return passenger;
    });
    setPassengers(updatedPassengers);
  };

  // Salin data contact detail ke penumpang
  const copyContactDetailToPassenger = (index: number) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = {
      ...updatedPassengers[index],
      fullName: contactDetail.fullName,
      email: contactDetail.email,
      phoneNumber: contactDetail.phoneNumber,
      title: contactDetail.title,
      useContactDetail: true
    };
    setPassengers(updatedPassengers);
  };

  // Handle pilih kursi
  const handleSeatSelect = (seat: Seat) => {
    const isAlreadySelected = selectedSeats.some(s => s.id === seat.id);
    
    if (isAlreadySelected) {
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= passengerCount) {
        return;
      }
      
      setSelectedSeats(prev => [...prev, seat]);
      setAutoSelectEnabled(false);
    }
  };

  const handleSeatDeselect = (seatId: string) => {
    setSelectedSeats(prev => prev.filter(s => s.id !== seatId));
  };

  const toggleAutoSelect = () => {
    if (!autoSelectEnabled && trainData) {
      const autoSelectedSeats = autoSelectSeats(trainData, passengerCount);
      setSelectedSeats(autoSelectedSeats);
    }
    setAutoSelectEnabled(!autoSelectEnabled);
  };

  // Validasi form
  const validateStep1 = (): { isValid: boolean; errors: string[] } => {
    const validationErrors: string[] = [];
    
    if (!contactDetail.fullName.trim()) {
      validationErrors.push('Nama lengkap kontak utama harus diisi');
    }
    if (!contactDetail.email.trim() || !contactDetail.email.includes('@')) {
      validationErrors.push('Email kontak utama tidak valid');
    }
    if (!contactDetail.phoneNumber.trim() || contactDetail.phoneNumber.length < 10) {
      validationErrors.push('Nomor telepon kontak utama tidak valid');
    }

    passengers.forEach((passenger, index) => {
      if (!passenger.fullName.trim()) {
        validationErrors.push(`Nama penumpang ${index + 1} harus diisi`);
      }
      if (!passenger.idNumber.trim()) {
        validationErrors.push(`Nomor identitas penumpang ${index + 1} harus diisi`);
      }
      if (passenger.idType === 'ID' && passenger.idNumber.length < 16) {
        validationErrors.push(`Nomor KTP/NIK penumpang ${index + 1} harus 16 digit`);
      }
      
      if (!passenger.useContactDetail) {
        if (!passenger.phoneNumber.trim() || passenger.phoneNumber.length < 10) {
          validationErrors.push(`Nomor telepon penumpang ${index + 1} tidak valid`);
        }
        if (!passenger.email.trim() || !passenger.email.includes('@')) {
          validationErrors.push(`Email penumpang ${index + 1} tidak valid`);
        }
      }
    });
    
    setValidationErrors(validationErrors);
    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    };
  };

  // Handle apply promo code
  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) {
      setPromoError('Masukkan kode promo/voucher');
      return;
    }

    if (!trainDetail) {
      setPromoError('Data kereta tidak tersedia');
      return;
    }

    setIsApplyingPromo(true);
    setPromoError('');
    setPromoMessage('');

    try {
      const validation = validatePromoCode(
        promoCodeInput, 
        trainDetail.price, 
        passengerCount, 
        trainDetail.trainType,
        trainDetail.departureDate
      );

      if (validation.isValid && validation.promo) {
        setAppliedPromo(validation.promo);
        setDiscountAmount(validation.discountAmount);
        setPromoMessage(validation.message);
        setPromoError('');
      } else {
        setAppliedPromo(null);
        setDiscountAmount(0);
        setPromoError(validation.message);
      }
    } catch (error) {
      console.error('Error applying promo:', error);
      setAppliedPromo(null);
      setDiscountAmount(0);
      setPromoError('Terjadi kesalahan saat validasi promo');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setPromoCodeInput('');
    setPromoMessage('');
    setPromoError('');
  };

  const handleSelectPromo = (promo: PromoVoucher) => {
    setPromoCodeInput(promo.promo_code);
    setShowPromoList(false);
  };

  const handleContinueToPayment = () => {
    const step1Validation = validateStep1();
    if (!step1Validation.isValid) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setBookingStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle pembayaran
  const handlePayment = async () => {
    if (isProcessing) return;
    
    console.log('💳 Starting payment process...');
    setIsProcessing(true);
    setError(null);

    try {
      if (!trainDetail || passengers.length === 0) {
        throw new Error('Data perjalanan atau penumpang tidak lengkap');
      }

      // Prepare segment data
      const segmentData = selectedMultiSegment 
        ? selectedMultiSegment.segments.map(segment => ({
            scheduleId: segment.scheduleId,
            origin: segment.origin,
            destination: segment.destination,
            departureTime: segment.departureTime,
            arrivalTime: segment.arrivalTime,
            trainName: segment.trainName,
            trainType: segment.trainType,
            price: segment.price
          }))
        : [{
            scheduleId: trainDetail.scheduleId,
            origin: trainDetail.origin,
            destination: trainDetail.destination,
            departureTime: trainDetail.departureTime,
            arrivalTime: trainDetail.arrivalTime,
            trainName: trainDetail.trainName,
            trainType: trainDetail.trainType,
            price: trainDetail.price
          }];

      const bookingData = {
        scheduleId: trainDetail.scheduleId || 'dummy-schedule-1',
        originStationId: trainDetail.originStationId || 'stasiun-bandung',
        destinationStationId: trainDetail.destinationStationId || 'stasiun-gambir',
        transitStationId: selectedTransit?.station_id,
        transitStationName: selectedTransit?.station_name,
        transitArrival: selectedTransit?.arrival_time,
        transitDeparture: selectedTransit?.departure_time,
        passengerCount,
        passengerDetails: passengers.map(p => ({
          fullName: p.fullName,
          idNumber: p.idNumber,
          email: p.email,
          phoneNumber: p.phoneNumber,
          seatId: p.seatId,
          transitStation: p.transit_station,
          transitArrival: p.transit_arrival,
          transitDeparture: p.transit_departure
        })),
        contactDetails: contactDetail,
        selectedSeats: selectedSeats.map(seat => ({
          id: seat.id,
          number: seat.number,
          price_adjustment: seat.price - (trainDetail?.price || 0)
        })),
        paymentMethod: selectedPayment,
        promoCode: appliedPromo?.promo_code,
        totalAmount: grandTotal,
        discountAmount: discountAmount,
        seatPremium: seatPriceAdjustment,
        transitDiscount: transitDiscount,
        transitAdditionalPrice: transitAdditionalPrice,
        bookingCode: generatedBookingCode,
        orderId: generatedOrderId,
        // Multi-segment data
        isMultiSegment: selectedMultiSegment?.isMultiSegment || false,
        segments: segmentData,
        totalSegments: segmentData.length,
        connectionTime: selectedMultiSegment?.connectionTime
      };

      console.log('📦 Sending booking data to API...');
      
      // Step 1: Buat booking
      const bookingResponse = await createTransitBooking(bookingData);
      console.log('📥 Booking response:', bookingResponse);

      let finalBookingData;
      if (bookingResponse.success) {
        finalBookingData = bookingResponse.booking || bookingResponse;
      } else if (bookingResponse.booking) {
        finalBookingData = bookingResponse.booking;
      } else {
        throw new Error(bookingResponse.error || 'Gagal membuat booking');
      }

      console.log('✅ Booking created:', finalBookingData.booking_code);
      
      // Step 2: Simpan data untuk pembayaran
      const paymentData = {
        bookingCode: finalBookingData.booking_code || generatedBookingCode,
        orderId: finalBookingData.order_id || generatedOrderId,
        amount: finalBookingData.total_amount || grandTotal,
        name: contactDetail.fullName,
        email: contactDetail.email,
        phone: contactDetail.phoneNumber,
        passengerCount: passengerCount,
        paymentMethod: selectedPayment,
        paymentFee: paymentFee,
        seatPremium: seatPriceAdjustment,
        discountAmount: discountAmount,
        promoCode: appliedPromo?.promo_code,
        promoName: appliedPromo?.name,
        trainName: trainDetail.trainName,
        trainType: trainDetail.trainType,
        origin: trainDetail.origin,
        destination: trainDetail.destination,
        departureDate: trainDetail.departureDate,
        departureTime: trainDetail.departureTime,
        transitStation: selectedTransit?.station_name,
        transitArrival: selectedTransit?.arrival_time,
        transitDeparture: selectedTransit?.departure_time,
        transitDiscount: transitDiscount,
        transitAdditionalPrice: transitAdditionalPrice,
        adminFee: adminFee,
        insuranceFee: insuranceFee,
        // Multi-segment data
        isMultiSegment: selectedMultiSegment?.isMultiSegment || false,
        totalSegments: segmentData.length,
        segments: segmentData
      };

      // Simpan ke sessionStorage
      sessionStorage.setItem('currentBooking', JSON.stringify(paymentData));
      sessionStorage.setItem('currentPayment', JSON.stringify(paymentData));
      
      console.log('💾 Payment data saved:', paymentData.bookingCode);
      
      // Step 3: Redirect ke halaman pembayaran
      const queryParams = new URLSearchParams();
      Object.entries(paymentData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const paymentUrl = `/payment?${queryParams.toString()}`;
      console.log('🔗 Redirecting to:', paymentUrl);
      
      router.push(paymentUrl);
      
    } catch (error: any) {
      console.error('💥 Error in payment process:', error);
      
      let errorMessage = 'Terjadi kesalahan saat memproses booking. ';
      
      if (error.message.includes('network') || error.message.includes('Network')) {
        errorMessage += 'Koneksi internet terputus. Silakan coba lagi.';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'Waktu permintaan habis. Silakan coba lagi.';
      } else if (error.message.includes('JSON')) {
        errorMessage += 'Format data tidak valid.';
      } else {
        errorMessage += error.message || 'Silakan coba beberapa saat lagi.';
      }
      
      setError(errorMessage);
      
    } finally {
      setIsProcessing(false);
    }
  };

  // Modal komponen
  const SeatMapModal = () => {
    if (!trainData) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Pilih Kursi</h3>
                <p className="text-gray-600">
                  {trainData.trainName} • {trainData.origin} → {trainData.destination}
                  {selectedTransit && ` • Transit: ${selectedTransit.station_name}`}
                </p>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="auto-select-toggle"
                    checked={autoSelectEnabled}
                    onChange={toggleAutoSelect}
                    className="mr-2"
                  />
                  <label htmlFor="auto-select-toggle" className="text-sm text-gray-600">
                    Auto-select kursi kosong
                  </label>
                </div>
              </div>
              <button 
                onClick={() => setShowSeatMap(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {trainData && (
              <TrainSeatMap
                train={trainData}
                selectedSeats={selectedSeats}
                onSeatSelect={handleSeatSelect}
                onSeatDeselect={handleSeatDeselect}
                maxSeats={passengerCount}
              />
            )}
            
            <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
              <h4 className="font-bold text-lg text-gray-800 mb-4">
                Kursi Terpilih ({selectedSeats.length} dari {passengerCount})
              </h4>
              
              {selectedSeats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedSeats.map((seat, index) => (
                    <div key={`selected-seat-${seat.id}`} className="border border-gray-300 rounded-lg p-4 hover:border-orange-300 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <span className="font-bold text-lg text-gray-800">
                            {seat.number}
                          </span>
                          <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            Gerbong {seat.wagonNumber}
                          </span>
                        </div>
                        <button
                          onClick={() => handleSeatDeselect(seat.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ✕ Hapus
                        </button>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Kelas: <span className="font-medium text-gray-800 capitalize">{seat.wagonClass}</span></div>
                        <div>Penumpang: <span className="font-medium text-gray-800">Penumpang {index + 1}</span></div>
                        <div>Harga: <span className="font-medium text-green-600">Rp {seat.price.toLocaleString('id-ID')}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">Belum ada kursi yang dipilih</p>
                  <p className="text-sm text-gray-400 mt-1">Kursi akan dialokasikan otomatis saat check-in</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowSeatMap(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={() => setShowSeatMap(false)}
                  className="px-6 py-3 bg-[#FD7E14] text-white rounded-lg hover:bg-[#E06700] font-medium"
                >
                  Simpan Pilihan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PromoListModal = () => {    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Daftar Promo & Voucher</h3>
                <p className="text-gray-600">Pilih promo yang sesuai dengan perjalanan Anda</p>
              </div>
              <button 
                onClick={() => setShowPromoList(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
          
            {availablePromos.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TagIcon />
                </div>
                <p className="text-gray-500">Tidak ada promo yang tersedia saat ini</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availablePromos.map((promo) => (
                  <div key={promo.id} className="border border-gray-200 rounded-xl p-5 hover:border-orange-300 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-start justify-between">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center mb-2">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            <TagIcon />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg text-gray-800">{promo.name}</h4>
                            <div className="flex items-center mt-1">
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                                {promo.promo_code}
                              </span>
                              <span className="mx-2 text-gray-400">•</span>
                              <span className="text-sm text-gray-600">
                                {promo.usage_count}/{promo.usage_limit} digunakan
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{promo.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `Rp ${promo.discount_value.toLocaleString('id-ID')}`}
                          </div>
                          <div className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                            Min. beli Rp {promo.min_order_amount.toLocaleString('id-ID')}
                          </div>
                          {promo.max_discount_amount > 0 && promo.discount_type === 'percentage' && (
                            <div className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                              Maks. Rp {promo.max_discount_amount.toLocaleString('id-ID')}
                            </div>
                          )}
                          <div className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                            {!promo.applicable_to || promo.applicable_to.length === 0 
                              ? 'Berlaku untuk semua kelas' 
                              : `Berlaku untuk: ${promo.applicable_to.join(', ')}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <button
                          onClick={() => handleSelectPromo(promo)}
                          className="px-4 py-2 bg-[#FD7E14] text-white rounded-lg hover:bg-[#E06700] font-medium"
                        >
                          Pakai Promo
                        </button>
                        <p className="text-xs text-gray-500 mt-2">
                          Berlaku hingga {formatDate(promo.end_date)}
                        </p>
                      </div>
                    </div>
                    
                    {promo.promo_code === 'FAMILY30' && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          📢 <span className="font-medium">Promo khusus:</span> Diskon {promo.discount_value}% berlaku untuk minimal 3 penumpang
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t">
              <div className="text-center">
                <button
                  onClick={() => setShowPromoList(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data pemesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeftIcon />
            <span className="ml-2 font-medium">Kembali</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Perbaiki data berikut:</h3>
                <ul className="text-red-700 text-sm space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <div className={`flex flex-col items-center ${bookingStep >= 1 ? 'text-[#FD7E14]' : 'text-gray-400'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bookingStep >= 1 ? 'bg-[#FD7E14] text-white' : 'bg-gray-200'}`}>
                  {bookingStep >= 1 ? <CheckIcon /> : '1'}
                </div>
                <span className="mt-2 font-medium">Data Penumpang</span>
              </div>
              
              <div className={`h-1 w-32 ${bookingStep >= 2 ? 'bg-[#FD7E14]' : 'bg-gray-300'}`}></div>
              
              <div className={`flex flex-col items-center ${bookingStep >= 2 ? 'text-[#FD7E14]' : 'text-gray-400'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bookingStep >= 2 ? 'bg-[#FD7E14] text-white' : 'bg-gray-200'}`}>
                  {bookingStep >= 2 ? <CheckIcon /> : '2'}
                </div>
                <span className="mt-2 font-medium">Pembayaran</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">
            {bookingStep === 1 ? 'Data Penumpang' : 'Pembayaran'}
          </h1>
          <p className="text-gray-600 text-center">
            {bookingStep === 1 
              ? 'Lengkapi data penumpang dengan benar' 
              : 'Pilih metode pembayaran yang tersedia'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Multi Segment Toggle */}
            {multiSegmentOptions.length > 1 && bookingStep === 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <SegmentIcon />
                    <div className="ml-3">
                      <h3 className="font-bold text-gray-800">Perjalanan Multi-Segmen</h3>
                      <p className="text-sm text-gray-600">
                        {multiSegmentOptions.length} opsi perjalanan tersedia
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMultiSegment(!showMultiSegment)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      showMultiSegment
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    {showMultiSegment ? 'Sembunyikan Opsi' : 'Lihat Opsi'}
                  </button>
                </div>
              </div>
            )}

            {/* Multi Segment Selector */}
            {showMultiSegment && bookingStep === 1 && (
              <MultiSegmentSelector
                multiSegmentOptions={multiSegmentOptions}
                selectedMultiSegment={selectedMultiSegment}
                onSelect={handleMultiSegmentSelect}
                loading={multiSegmentLoading}
                passengerCount={passengerCount}
              />
            )}

            {/* Train Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Detail Perjalanan</h2>
              
              {selectedMultiSegment?.isMultiSegment ? (
                // Multi-segment display
                <div className="space-y-6">
                  {selectedMultiSegment.segments.map((segment, index) => (
                    <div key={segment.segmentId} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <TrainIcon />
                            </div>
                            <div className="ml-4">
                              <h3 className="font-bold text-lg text-gray-800">{segment.trainName}</h3>
                              <div className="flex items-center mt-1">
                                <span className={`px-2 py-1 text-xs rounded font-medium ${
                                  segment.trainType === 'Executive' ? 'bg-blue-100 text-blue-800' :
                                  segment.trainType === 'Business' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {segment.trainType}
                                </span>
                                <span className="mx-2 text-gray-400">•</span>
                                <span className="text-sm text-gray-600">
                                  Segment {index + 1} of {selectedMultiSegment.segments.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 text-right">
                          <p className="text-2xl font-bold text-[#FD7E14]">
                            Rp {(segment.price).toLocaleString('id-ID')}
                          </p>
                          <p className="text-sm text-gray-500">per penumpang</p>
                        </div>
                      </div>
                      
                      <div className="py-4 border-y">
                        <div className="flex items-center justify-between">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">{segment.departureTime}</p>
                            <p className="text-gray-600 mt-1">{segment.origin}</p>
                          </div>
                          
                          <div className="text-center flex-1 mx-8">
                            <div className="relative">
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-400 rounded-full"></div>
                              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-400 rounded-full"></div>
                              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{segment.duration}</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">{segment.arrivalTime}</p>
                            <p className="text-gray-600 mt-1">{segment.destination}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4">
                        <div>
                          <div className="flex items-center text-gray-600 mb-1">
                            <CalendarIcon />
                            <span className="ml-2 text-sm">Tanggal</span>
                          </div>
                          <p className="font-semibold text-gray-800">
                            {formatDepartureDate(segment.departureDate)}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center text-gray-600 mb-1">
                            <ClockIcon />
                            <span className="ml-2 text-sm">Durasi</span>
                          </div>
                          <p className="font-semibold text-gray-800">{segment.duration}</p>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center justify-end text-gray-600 mb-1">
                            <UserIcon />
                            <span className="ml-2 text-sm">Kursi</span>
                          </div>
                          <p className="font-semibold text-gray-800">{segment.availableSeats} tersedia</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {selectedMultiSegment.connectionTime && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <ConnectionIcon />
                        <div className="ml-3">
                          <h4 className="font-bold text-yellow-800">Waktu Transfer</h4>
                          <p className="text-yellow-700">
                            Anda memiliki {selectedMultiSegment.connectionTime} menit untuk transfer antara segmen
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Single segment display
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <TrainIcon />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-bold text-lg text-gray-800">{trainDetail?.trainName}</h3>
                          <div className="flex items-center mt-1">
                            <span className={`px-2 py-1 text-xs rounded font-medium ${
                              trainDetail?.trainType === 'Executive' ? 'bg-blue-100 text-blue-800' :
                              trainDetail?.trainType === 'Business' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {trainDetail?.trainType}
                            </span>
                            <span className="mx-2 text-gray-400">•</span>
                            <span className="text-sm text-gray-600">
                              {trainData?.availableSeats || trainDetail?.availableSeats} kursi tersedia
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 text-right">
                      <p className="text-2xl font-bold text-[#FD7E14]">
                        Rp {(trainDetail?.price || 0).toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm text-gray-500">per penumpang</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 py-6 border-y">
                    <div>
                      <div className="flex items-center text-gray-600 mb-1">
                        <CalendarIcon />
                        <span className="ml-2 text-sm">Tanggal</span>
                      </div>
                      <p className="font-semibold text-gray-800">
                        {formatDepartureDate(trainDetail?.departureDate || '')}
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-600 mb-1">
                        <ClockIcon />
                        <span className="ml-2 text-sm">Durasi</span>
                      </div>
                      <p className="font-semibold text-gray-800">{trainDetail?.duration || '5j 0m'}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center justify-end text-gray-600 mb-1">
                        <UserIcon />
                        <span className="ml-2 text-sm">Penumpang</span>
                      </div>
                      <p className="font-semibold text-gray-800">{passengerCount} orang</p>
                    </div>
                  </div>
                  
                  <div className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800">{trainDetail?.departureTime || '05:00'}</p>
                        <p className="text-gray-600 mt-1">{trainDetail?.origin}</p>
                      </div>
                      
                      <div className="text-center flex-1 mx-8">
                        <div className="relative">
                          <div className="h-0.5 bg-gray-300 w-full"></div>
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-400 rounded-full"></div>
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-400 rounded-full"></div>
                          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{trainDetail?.duration || '5j 0m'}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800">{trainDetail?.arrivalTime || '10:00'}</p>
                        <p className="text-gray-600 mt-1">{trainDetail?.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Pilihan Kursi */}
              <div className="mt-6 pt-6 border-t">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Pilih Kursi (Opsional)</h4>
                    <p className="text-sm text-gray-500">
                      {selectedSeats.length > 0 
                        ? `${selectedSeats.length} kursi dipilih` 
                        : 'Kursi akan dialokasikan otomatis'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleAutoSelect}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center ${
                        autoSelectEnabled 
                          ? 'bg-green-100 text-green-700 border border-green-300' 
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {autoSelectEnabled ? '✓ Auto-select' : 'Auto-select'}
                    </button>
                    <button
                      onClick={() => setShowSeatMap(true)}
                      className="px-6 py-2.5 bg-[#FD7E14] text-white rounded-lg hover:bg-[#E06700] font-medium flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                      </svg>
                      {selectedSeats.length > 0 ? 'Ubah Kursi' : 'Pilih Kursi'}
                    </button>
                  </div>
                </div>
                
                {selectedSeats.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedSeats.map((seat) => (
                        <div key={`seat-badge-${seat.id}`} 
                          className="px-3 py-2 bg-orange-50 text-orange-800 rounded-lg border border-orange-200 flex items-center">
                          <span className="font-bold">{seat.number}</span>
                          <span className="ml-2 text-sm">(Gerbong {seat.wagonNumber})</span>
                          <span className="ml-2 text-xs bg-orange-100 px-2 py-0.5 rounded">
                            +Rp {(seat.price - (trainDetail?.price || 265000)).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transit Selector */}
            {bookingStep === 1 && trainDetail && !selectedMultiSegment?.isMultiSegment && (
              <TransitSelector
                transitOptions={transitStations}
                selectedTransit={selectedTransit}
                onSelect={handleTransitSelect}
                loading={transitLoading}
                passengerCount={passengerCount}
                scheduleId={trainDetail.scheduleId}
                error={transitError}
                origin={origin}
                destination={destination}
              />
            )}

            {/* Step 1: Passenger Data */}
            {bookingStep === 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Data Penumpang</h2>
                    <p className="text-gray-600 mt-1">Pastikan data sesuai dengan identitas</p>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 flex items-center">
                    <label className="mr-3 text-gray-700 font-medium">Jumlah Penumpang:</label>
                    <div className="relative">
                      <select 
                        value={passengerCount}
                        onChange={(e) => setPassengerCount(Number(e.target.value))}
                        className="border rounded-lg px-4 py-2.5 text-gray-800 appearance-none bg-white pr-10"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                          <option key={`passenger-count-${num}`} value={num}>{num} orang</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Contact Details Section */}
                <div className="mb-10 border-b pb-10">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Contact Details</h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    The contact details will be used to send the e-ticket and for refund purposes.
                  </p>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Title
                    </label>
                    <div className="flex space-x-4">
                      {['Tn', 'Ny', 'Nn'].map(title => (
                        <button
                          key={`contact-title-${title}`}
                          type="button"
                          onClick={() => handleContactDetailChange('title', title)}
                          className={`flex items-center px-4 py-2.5 border rounded-lg transition-colors ${
                            contactDetail.title === title
                              ? 'border-[#FD7E14] bg-orange-50 text-[#FD7E14]'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${
                            contactDetail.title === title
                              ? 'border-[#FD7E14] bg-[#FD7E14]'
                              : 'border-gray-400'
                          }`}>
                            {contactDetail.title === title && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          {title === 'Tn' ? 'Mr.' : title === 'Ny' ? 'Mrs.' : 'Ms.'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name According to ID/Passport *
                    </label>
                    <input 
                      type="text"
                      placeholder="Enter full name"
                      value={contactDetail.fullName}
                      onChange={(e) => handleContactDetailChange('fullName', e.target.value)}
                      className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile Number *
                    </label>
                    <input 
                      type="tel"
                      placeholder="+62 81234567890"
                      value={contactDetail.phoneNumber}
                      onChange={(e) => handleContactDetailChange('phoneNumber', e.target.value)}
                      className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input 
                      type="email"
                      placeholder="email@example.com"
                      value={contactDetail.email}
                      onChange={(e) => handleContactDetailChange('email', e.target.value)}
                      className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      E-ticket will be sent to this email address.
                    </p>
                  </div>
                </div>
                
                {/* Passenger Details Section */}
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Passenger Details</h3>
                  <p className="text-gray-600 mb-6 text-sm">
                    Make sure the data are correct. Please contact PT KAI if there's incorrect data.
                  </p>
                  
                  <div className="space-y-8">
                    {passengers.map((passenger, index) => (
                      <div key={`passenger-${passenger.id}`} className="border rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center">
                            <h4 className="font-bold text-lg text-gray-800">
                              Passenger {index + 1} (Adult)
                            </h4>
                            {index === 0 && (
                              <span className="ml-3 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                {passengerCount === 1 ? 'Kontak Utama' : 'Penumpang 1'}
                              </span>
                            )}
                            {passenger.transit_station && (
                              <span className="ml-3 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                Transit: {passenger.transit_station}
                              </span>
                            )}
                          </div>
                          {index > 0 && passengerCount > 1 && (
                            <button
                              onClick={() => {
                                if (passengerCount > 1) {
                                  const newCount = passengerCount - 1;
                                  setPassengerCount(newCount);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              ✕ Hapus Penumpang
                            </button>
                          )}
                        </div>
                        
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center mb-2">
                                <input
                                  type="checkbox"
                                  id={`use-contact-detail-${index}`}
                                  checked={passenger.useContactDetail}
                                  onChange={(e) => handlePassengerChange(index, 'useContactDetail', e.target.checked)}
                                  className="mr-3 h-5 w-5 text-orange-600 rounded focus:ring-orange-500"
                                />
                                <label htmlFor={`use-contact-detail-${index}`} className="text-gray-700 font-medium">
                                  Gunakan informasi kontak yang sama dengan Contact Details
                                </label>
                              </div>
                              {passenger.useContactDetail ? (
                                <p className="text-sm text-green-600 ml-8">
                                  ✓ Data kontak akan mengikuti Contact Details
                                </p>
                              ) : (
                                <p className="text-sm text-gray-600 ml-8">
                                  Isi data kontak khusus untuk penumpang ini
                                </p>
                              )}
                            </div>
                            
                            {!passenger.useContactDetail && (
                              <button
                                onClick={() => copyContactDetailToPassenger(index)}
                                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                              >
                                Salin dari Kontak
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Passenger Info fields */}
                        <div className="mb-6">
                          <h5 className="font-medium text-gray-700 mb-3">Passenger Info</h5>
                          <div className="flex space-x-4">
                            {['Tn', 'Ny', 'Nn'].map(title => (
                              <button
                                key={`passenger-${index}-title-${title}`}
                                type="button"
                                onClick={() => handlePassengerChange(index, 'title', title)}
                                className={`flex items-center px-4 py-2.5 border rounded-lg transition-colors ${
                                  passenger.title === title
                                    ? 'border-[#FD7E14] bg-orange-50 text-[#FD7E14]'
                                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                }`}
                                disabled={passenger.useContactDetail && title !== contactDetail.title}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${
                                  passenger.title === title
                                    ? 'border-[#FD7E14] bg-[#FD7E14]'
                                    : 'border-gray-400'
                                }`}>
                                  {passenger.title === title && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                {title === 'Tn' ? 'Mr.' : title === 'Ny' ? 'Mrs.' : 'Ms.'}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Full Name */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name According to ID/Passport *
                          </label>
                          <input 
                            type="text"
                            placeholder="According to ID/Passport (without punctuation and degree)"
                            value={passenger.fullName}
                            onChange={(e) => handlePassengerChange(index, 'fullName', e.target.value)}
                            className={`w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                              passenger.useContactDetail ? 'bg-gray-100' : ''
                            }`}
                            required
                            disabled={passenger.useContactDetail}
                          />
                        </div>
                        
                        {/* Identity Info */}
                        <div className="mb-6">
                          <h5 className="font-medium text-gray-700 mb-3">Identity Info</h5>
                          <div className="flex space-x-4">
                            {['ID', 'Passport'].map(docType => (
                              <button
                                key={`passenger-${index}-doctype-${docType}`}
                                type="button"
                                onClick={() => handlePassengerChange(index, 'idType', docType)}
                                className={`flex items-center px-4 py-2.5 border rounded-lg transition-colors ${
                                  passenger.idType === docType
                                    ? 'border-[#FD7E14] bg-orange-50 text-[#FD7E14]'
                                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${
                                  passenger.idType === docType
                                    ? 'border-[#FD7E14] bg-[#FD7E14]'
                                    : 'border-gray-400'
                                }`}>
                                  {passenger.idType === docType && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                {docType}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* ID Number */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {passenger.idType === 'Passport' ? 'Passport Number *' : 'ID Number (16 digit) *'}
                          </label>
                          <input 
                            type="text"
                            placeholder={passenger.idType === 'Passport' ? "Passport Number" : "16 digit ID number"}
                            value={passenger.idNumber}
                            onChange={(e) => handlePassengerChange(index, 'idNumber', e.target.value)}
                            className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                          />
                        </div>
                        
                        {/* Email & Phone (jika tidak menggunakan contact detail) */}
                        {!passenger.useContactDetail && (
                          <div className="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Penumpang *
                              </label>
                              <input 
                                type="email"
                                placeholder="email@example.com"
                                value={passenger.email}
                                onChange={(e) => handlePassengerChange(index, 'email', e.target.value)}
                                className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Telepon Penumpang *
                              </label>
                              <input 
                                type="tel"
                                placeholder="+62 81234567890"
                                value={passenger.phoneNumber}
                                onChange={(e) => handlePassengerChange(index, 'phoneNumber', e.target.value)}
                                className="w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                required
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Transit Info */}
                        {selectedTransit && passenger.transit_station && (
                          <div className="mt-6 pt-6 border-t">
                            <div className="flex items-center mb-3">
                              <TransitIcon />
                              <h5 className="font-medium text-gray-700 ml-2">Informasi Transit</h5>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                              <p className="text-sm text-purple-700">
                                Penumpang akan turun di <span className="font-semibold">{passenger.transit_station}</span>
                              </p>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="text-sm text-purple-600">
                                  <span className="font-medium">Tiba:</span> {passenger.transit_arrival}
                                </div>
                                <div className="text-sm text-purple-600">
                                  <span className="font-medium">Berangkat:</span> {passenger.transit_departure}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {passengerCount < 9 && (
                      <div className="text-center">
                        <button
                          onClick={() => {
                            const newCount = passengerCount + 1;
                            setPassengerCount(newCount);
                          }}
                          className="px-6 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors font-medium"
                        >
                          + Tambah Penumpang
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Agreement */}
                <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                  <div className="flex items-start">
                    <input 
                      type="checkbox"
                      id="agreement"
                      checked={agreement}
                      onChange={(e) => setAgreement(e.target.checked)}
                      className="mt-1 mr-3 h-5 w-5 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <div>
                      <label htmlFor="agreement" className="text-gray-700 font-medium block mb-1">
                        Saya menyetujui syarat dan ketentuan
                      </label>
                      <p className="text-sm text-gray-600">
                        Dengan melanjutkan, saya menyetujui bahwa data yang saya berikan adalah benar 
                        dan memahami bahwa pembatalan tiket akan dikenakan biaya sesuai ketentuan.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Continue Button */}
                <button 
                  onClick={handleContinueToPayment}
                  disabled={!passengerDataFilled || !agreement}
                  className={`mt-8 w-full py-4 text-lg font-semibold rounded-lg transition-all ${
                    !passengerDataFilled || !agreement
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#FD7E14] text-white hover:bg-[#E06700] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
                >
                  Lanjut ke Pembayaran
                </button>
              </div>
            )}

            {/* Step 2: Payment */}
            {bookingStep === 2 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-8">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💳</span>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-gray-800">Pembayaran</h2>
                    <p className="text-gray-600">Pilih metode pembayaran yang tersedia</p>
                  </div>
                </div>
                
                {/* Payment Methods */}
                <div className="space-y-4 mb-8">
                  {PAYMENT_METHODS.map(method => (
                    <div 
                      key={`payment-${method.id}`}
                      className={`border rounded-xl p-5 cursor-pointer transition-all hover:border-orange-300 ${
                        selectedPayment === method.id 
                          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-100' 
                          : 'border-gray-300'
                      }`}
                      onClick={() => setSelectedPayment(method.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                            selectedPayment === method.id ? 'border-orange-500 bg-orange-500' : 'border-gray-400'
                          }`}>
                            {selectedPayment === method.id && (
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                              <span className="text-2xl">{method.icon}</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800">{method.name}</h3>
                              <p className="text-sm text-gray-600">{method.description}</p>
                            </div>
                          </div>
                        </div>
                        
                        {method.fees && method.fees > 0 ? (
                          <span className="text-gray-600 font-medium">
                            +Rp {method.fees.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-green-600 font-medium">Gratis</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setBookingStep(1)}
                    className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Kembali ke Data Penumpang
                  </button>
                  <button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className={`flex-1 bg-[#FD7E14] text-white font-semibold py-3.5 rounded-xl transition-all ${
                      isProcessing 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-[#E06700] shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Memproses...
                      </div>
                    ) : (
                      'Bayar Sekarang'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Ringkasan Pemesanan</h2>
              
              {/* Multi Segment Info */}
              {selectedMultiSegment?.isMultiSegment && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <SegmentIcon />
                      <div className="ml-2">
                        <h4 className="font-bold text-blue-800">Perjalanan Multi-Segmen</h4>
                        <p className="text-xs text-blue-600">{selectedMultiSegment.segments.length} segmen</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Transit Info */}
              {selectedTransit && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <TransitIcon />
                      <div className="ml-2">
                        <h4 className="font-bold text-purple-800">Transit Dipilih</h4>
                        <p className="text-xs text-purple-600">{selectedTransit.station_name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTransitSelect(null)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ✕ Hapus
                    </button>
                  </div>
                </div>
              )}
              
              {/* Promo/Voucher Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-700">Promo & Voucher</h3>
                  <button
                    onClick={() => setShowPromoList(true)}
                    className="text-sm text-[#FD7E14] hover:text-[#E06700] font-medium"
                  >
                    Lihat Promo
                  </button>
                </div>
                
                {/* Applied Promo */}
                {appliedPromo ? (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <TagIcon />
                        <div className="ml-2">
                          <h4 className="font-bold text-green-800">{appliedPromo.name}</h4>
                          <p className="text-xs text-green-600">{appliedPromo.promo_code}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕ Hapus
                      </button>
                    </div>
                    <p className="text-sm text-green-700">{appliedPromo.description}</p>
                    <div className="mt-2 flex items-center">
                      <span className="text-sm font-bold text-green-800">
                        Diskon: -Rp {discountAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Masukkan kode promo"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 border rounded-lg px-4 py-2.5 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoCodeInput.trim()}
                        className={`px-4 py-2.5 bg-[#FD7E14] text-white rounded-lg font-medium ${
                          isApplyingPromo || !promoCodeInput.trim()
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-[#E06700]'
                        }`}
                      >
                        {isApplyingPromo ? '...' : 'Pakai'}
                      </button>
                    </div>
                    
                    {promoMessage && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">{promoMessage}</p>
                      </div>
                    )}
                    
                    {promoError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{promoError}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Fare Breakdown */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {selectedMultiSegment?.isMultiSegment 
                      ? `Tiket (${selectedMultiSegment.segments.length} segmen × ${passengerCount} orang)` 
                      : `Tiket (${passengerCount} orang)`}
                  </span>
                  <span className="font-semibold text-gray-800">
                    Rp {totalSegmentPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                
                {seatPriceAdjustment > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tambahan kursi premium</span>
                    <span className="font-semibold text-green-600">
                      +Rp {seatPriceAdjustment.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                
                {selectedTransit && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Diskon Transit (10%)</span>
                      <span className="font-semibold text-red-600">
                        -Rp {transitDiscount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    {transitAdditionalPrice > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Biaya tambahan transit</span>
                        <span className="font-semibold text-green-600">
                          +Rp {transitAdditionalPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Diskon Promo</span>
                    <span className="font-semibold text-red-600">
                      -Rp {discountAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Biaya Admin</span>
                  <span className="font-semibold text-gray-800">Rp {adminFee.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Asuransi Perjalanan</span>
                  <span className="font-semibold text-gray-800">Rp {insuranceFee.toLocaleString('id-ID')}</span>
                </div>
                
                {paymentFee > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Biaya Pembayaran</span>
                    <span className="font-semibold text-gray-800">
                      +Rp {paymentFee.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">Total</span>
                    <span className="text-2xl font-bold text-[#FD7E14]">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {(discountAmount > 0 || transitDiscount > 0) && (
                    <p className="text-sm text-gray-500 mt-1 text-right">
                      <span className="line-through">Rp {totalBeforeDiscount.toLocaleString('id-ID')}</span>
                      <span className="ml-2 text-green-600">
                        Hemat Rp {(discountAmount + transitDiscount).toLocaleString('id-ID')}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Booking Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Kode Booking</span>
                    <span className="font-mono font-bold text-gray-800">{generatedBookingCode}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Order ID</span>
                    <span className="font-mono text-xs text-gray-600">{generatedOrderId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className="text-sm font-medium text-orange-600">
                      {bookingStep === 1 ? 'Data Penumpang' : 'Pembayaran'}
                    </span>
                  </div>
                  {selectedMultiSegment?.isMultiSegment && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Jumlah Segmen</span>
                      <span className="text-sm font-medium text-blue-600">
                        {selectedMultiSegment.segments.length} segmen
                      </span>
                    </div>
                  )}
                  {selectedTransit && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stasiun Transit</span>
                      <span className="text-sm font-medium text-purple-600">
                        {selectedTransit.station_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showSeatMap && <SeatMapModal />}
      {showPromoList && <PromoListModal />}

      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} TripGo. All rights reserved.</p>
            <p className="mt-2">Pembayaran aman dan terenkripsi</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat halaman pemesanan...</p>
        </div>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}