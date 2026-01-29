// app/booking/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TrainSeatMap } from '@/app/components/TrainSeatMap';
import { useAuth } from '@/app/contexts/AuthContext';

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
  segmentId?: string;
  segmentIndex?: number;
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
  kode_kursi?: string;
  class?: string;
  segmentId?: string;
}

interface Train {
  id?: string;
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
  operator?: string;
  trainNumber?: string;
  originStation?: string;
  destinationStation?: string;
  kode_kereta?: string;
  nama_kereta?: string;
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
  selectedSeats: Seat[];
  schedule_id?: string;
  train_code?: string;
  origin_city?: string;
  destination_city?: string;
  origin_station_id?: string;
  destination_station_id?: string;
  wagons?: Array<{
    number: string;
    name: string;
    class: string;
    facilities: string[];
    availableSeats: number;
    totalSeats: number;
    seats: Seat[];
  }>;
}

interface MultiSegmentBooking {
  segments: Segment[];
  totalPrice: number;
  totalDuration: string;
  isMultiSegment: boolean;
  connectionTime?: number;
}

// --- Tipe untuk Seat Reuse ---
interface SeatOccupancy {
  seatId: string;
  passengerId: string;
  segmentId: string;
  occupied: boolean;
}

interface SeatReuseConfig {
  enableReuse: boolean;
  reuseSegments: string[];
  occupancyData: SeatOccupancy[];
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

const autoSelectSeats = (trainData: Train | null, passengerCount: number, segmentId?: string): Seat[] => {
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
        wagonClass: wagon.class,
        segmentId: segmentId
      });
    }
  }

  return selectedSeats.slice(0, passengerCount);
};

// DUMMY PROMO - FALLBACK DATA
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

// FUNGSI VALIDASI PROMO YANG DIPERBAIKI UNTUK MULTI SEGMENT
const validatePromoCode = async (
  promoCode: string,
  // Parameter untuk single segment
  basePrice: number,
  passengerCount: number,
  trainType: string,
  departureDate: string,
  // Parameter untuk multi segment
  multiSegmentData?: {
    segments: Segment[];
    totalPrice: number;
    passengerCount: number;
  }
): Promise<{ isValid: boolean; promo?: PromoVoucher; discountAmount: number; message: string }> => {

  try {
    // Tentukan total harga yang akan divalidasi
    let totalPrice: number;
    let trainTypeForValidation: string;

    if (multiSegmentData) {
      // Untuk multi segment, gunakan total harga dari semua segment
      totalPrice = multiSegmentData.totalPrice;
      trainTypeForValidation = 'Multi-Segment';
    } else {
      // Untuk single segment, gunakan harga biasa
      totalPrice = basePrice * passengerCount;
      trainTypeForValidation = trainType;
    }

    console.log('🔄 Validating promo:', {
      promoCode,
      totalPrice,
      trainType: trainTypeForValidation,
      passengerCount: multiSegmentData?.passengerCount || passengerCount,
      departureDate,
      isMultiSegment: !!multiSegmentData,
      segmentCount: multiSegmentData?.segments.length || 1
    });

    // Validasi promo berdasarkan kondisi
    const foundPromo = DUMMY_PROMO_VOUCHERS.find(promo => 
      promo.promo_code === promoCode && 
      promo.is_active &&
      new Date(promo.end_date) >= new Date() &&
      new Date(promo.start_date) <= new Date()
    );

    if (!foundPromo) {
      return {
        isValid: false,
        discountAmount: 0,
        message: 'Kode promo tidak valid atau sudah tidak berlaku'
      };
    }

    // Validasi minimum order amount
    if (totalPrice < foundPromo.min_order_amount) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Minimal pembelian Rp ${foundPromo.min_order_amount.toLocaleString('id-ID')}`
      };
    }

    // Validasi khusus untuk promo FAMILY30 (minimal 3 penumpang)
    if (foundPromo.promo_code === 'FAMILY30') {
      const actualPassengerCount = multiSegmentData?.passengerCount || passengerCount;
      if (actualPassengerCount < 3) {
        return {
          isValid: false,
          discountAmount: 0,
          message: 'Promo FAMILY30 hanya untuk minimal 3 penumpang'
        };
      }
    }

    // Validasi applicable_to (jika ada)
    if (foundPromo.applicable_to && foundPromo.applicable_to.length > 0) {
      const applicableTypes = foundPromo.applicable_to;
      
      if (multiSegmentData) {
        // Untuk multi segment, cek apakah semua segment memenuhi syarat
        const allSegmentsValid = multiSegmentData.segments.every(segment => 
          applicableTypes.includes(segment.trainType)
        );
        
        if (!allSegmentsValid) {
          return {
            isValid: false,
            discountAmount: 0,
            message: `Promo hanya berlaku untuk kelas: ${applicableTypes.join(', ')}`
          };
        }
      } else if (!applicableTypes.includes(trainTypeForValidation)) {
        return {
          isValid: false,
          discountAmount: 0,
          message: `Promo hanya berlaku untuk kelas: ${applicableTypes.join(', ')}`
        };
      }
    }

    // Hitung jumlah diskon
    let discountAmount = 0;

    if (foundPromo.discount_type === 'percentage') {
      discountAmount = (totalPrice * foundPromo.discount_value) / 100;
      
      // Batasi dengan max_discount_amount jika ada
      if (foundPromo.max_discount_amount > 0 && discountAmount > foundPromo.max_discount_amount) {
        discountAmount = foundPromo.max_discount_amount;
      }
    } else if (foundPromo.discount_type === 'fixed') {
      discountAmount = foundPromo.discount_value;
    }

    // Pastikan diskon tidak melebihi total harga
    if (discountAmount > totalPrice) {
      discountAmount = totalPrice;
    }

    console.log('✅ Promo validated successfully:', {
      promo: foundPromo.name,
      totalPrice,
      discountAmount,
      discountType: foundPromo.discount_type
    });

    return {
      isValid: true,
      promo: foundPromo,
      discountAmount,
      message: `Diskon ${foundPromo.discount_type === 'percentage' ? foundPromo.discount_value + '%' : 'Rp ' + foundPromo.discount_value.toLocaleString('id-ID')} berhasil diterapkan`
    };

  } catch (error) {
    console.error('Error validating promo:', error);
    return {
      isValid: false,
      discountAmount: 0,
      message: 'Terjadi kesalahan saat validasi promo'
    };
  }
};

// Fungsi untuk mencatat penggunaan promo
const recordPromoUsage = async (promoId: string, bookingId: string, discountAmount: number) => {
  try {
    const response = await fetch('/api/promotions/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        promotionId: promoId,
        bookingId: bookingId,
        discountAmount: discountAmount
      }),
    });

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error recording promo usage:', error);
    return false;
  }
};

// --- Helper functions ---
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}j ${mins}m`;
};

const isWindowSeat = (seatNumber: string): boolean => {
  const column = seatNumber.match(/[A-Z]/)?.[0];
  return column === 'A' || column === 'D';
};

const calculateSeatPrice = (basePrice: number, wagonClass: string, seatNumber: string): number => {
  let price = basePrice;

  switch (wagonClass) {
    case 'executive': price *= 1.5; break;
    case 'business': price *= 1.2; break;
    case 'economy': price *= 1.0; break;
    default: price *= 1.0;
  }

  if (isWindowSeat(seatNumber)) {
    price *= 1.1;
  }

  return Math.round(price);
};

// Fungsi untuk generate data kursi realistis KAI
const generateRealisticSeatData = (
  trainType: string, 
  basePrice: number, 
  wagonCount: number = 3
) => {
  // Konfigurasi wagon berdasarkan kelas
  const wagonConfigs = {
    'Executive': {
      seatsPerWagon: 40,
      columns: ['A', 'B', 'C', 'D'],
      classes: ['executive', 'executive_premium'],
      facilities: ['AC', 'Toilet', 'Power Outlet', 'WiFi', 'Meal Service'],
      priceMultiplier: 1.5
    },
    'Business': {
      seatsPerWagon: 50,
      columns: ['A', 'B', 'C', 'D', 'E'],
      classes: ['business'],
      facilities: ['AC', 'Toilet', 'Power Outlet'],
      priceMultiplier: 1.2
    },
    'Economy': {
      seatsPerWagon: 60,
      columns: ['A', 'B', 'C', 'D', 'E'],
      classes: ['economy'],
      facilities: ['AC', 'Toilet'],
      priceMultiplier: 1.0
    },
    'Premium': {
      seatsPerWagon: 30,
      columns: ['A', 'B', 'C', 'D', 'E'],
      classes: ['premium'],
      facilities: ['AC', 'Toilet', 'Power Outlet', 'WiFi', 'Meal Service', 'Entertainment'],
      priceMultiplier: 2.0
    }
  };

  const config = wagonConfigs[trainType as keyof typeof wagonConfigs] || wagonConfigs.Executive;
  const wagons = [];

  for (let wagonNum = 1; wagonNum <= wagonCount; wagonNum++) {
    const seats: Seat[] = [];
    const rows = Math.ceil(config.seatsPerWagon / config.columns.length);
    
    for (let row = 1; row <= rows; row++) {
      config.columns.forEach((column, colIndex) => {
        const seatNumber = `${column}${row}`;
        const id = `${trainType}-wagon-${wagonNum}-${seatNumber}`;
        
        const available = Math.random() > 0.2;
        const windowSeat = column === 'A' || column === config.columns[config.columns.length - 1];
        const forwardFacing = row % 2 === 1;
        
        let price = Math.round(basePrice * config.priceMultiplier);
        
        if (windowSeat) price = Math.round(price * 1.15);
        if (row <= 3) price = Math.round(price * 1.1);
        if (forwardFacing) price = Math.round(price * 1.05);
        if (Math.random() > 0.8) price = Math.round(price * 0.95);

        seats.push({
          id,
          number: seatNumber,
          row,
          column,
          available,
          windowSeat,
          forwardFacing,
          price,
          wagonNumber: wagonNum.toString().padStart(2, '0'),
          wagonClass: config.classes[0],
          kode_kursi: `${trainType.substring(0, 3).toUpperCase()}${wagonNum.toString().padStart(2, '0')}${seatNumber}`
        });
      });
    }

    const availableSeats = seats.filter(seat => seat.available).length;
    
    wagons.push({
      number: wagonNum.toString().padStart(2, '0'),
      name: `Gerbong ${wagonNum.toString().padStart(2, '0')}`,
      class: config.classes[0],
      facilities: config.facilities,
      availableSeats,
      totalSeats: seats.length,
      seats
    });
  }

  return wagons;
};

// Load seat data dari API atau fallback
const loadSeatData = async (scheduleId: string, passengerCount: number, trainDetail?: TrainDetail, origin?: string, destination?: string) => {
  try {
    const queryParams = new URLSearchParams();
    if (origin) queryParams.set('departure', origin);
    if (destination) queryParams.set('arrival', destination);

    const response = await fetch(`/api/schedules/${scheduleId}/seats?${queryParams.toString()}`);

    if (response.ok) {
      const seatData = await response.json();

      if (seatData.success) {
        const wagons = seatData.data.wagons.map((wagon: any) => ({
          number: wagon.coach_code,
          name: `Gerbong ${wagon.coach_code}`,
          class: wagon.class_type,
          facilities: wagon.facilities || [],
          availableSeats: wagon.available_seats,
          totalSeats: wagon.total_seats,
          seats: wagon.seats.map((seat: any) => ({
            id: seat.id,
            number: seat.seat_number,
            row: parseInt(seat.seat_number.match(/\d+/)?.[0] || '0'),
            column: seat.seat_number.match(/[A-Z]/)?.[0] || 'A',
            available: seat.status === 'available',
            windowSeat: isWindowSeat(seat.seat_number),
            forwardFacing: Math.random() > 0.5,
            price: calculateSeatPrice(trainDetail?.price || 265000, wagon.class_type, seat.seat_number),
            wagonNumber: wagon.coach_code,
            wagonClass: wagon.class_type,
            kode_kursi: seat.seat_code || `${wagon.coach_code}-${seat.seat_number}`
          }))
        }));

        const totalAvailableSeats = wagons.reduce((sum: number, wagon: any) => sum + wagon.availableSeats, 0);

        return {
          wagons,
          totalAvailableSeats
        };
      }
    }

    // Fallback ke data realistis KAI
    const trainType = trainDetail?.trainType || 'Executive';
    const basePrice = trainDetail?.price || 265000;
    
    let wagonCount = 3;
    if (trainType === 'Executive') wagonCount = 4;
    if (trainType === 'Premium') wagonCount = 3;
    if (trainType === 'Business') wagonCount = 5;
    if (trainType === 'Economy') wagonCount = 6;

    const wagons = generateRealisticSeatData(trainType, basePrice, wagonCount);
    const totalAvailableSeats = wagons.reduce((sum, wagon) => sum + wagon.availableSeats, 0);

    return {
      wagons,
      totalAvailableSeats
    };

  } catch (error) {
    console.error('Error loading seat data:', error);
    const wagons = generateRealisticSeatData('Executive', 265000, 2);
    return {
      wagons,
      totalAvailableSeats: wagons.reduce((sum, wagon) => sum + wagon.availableSeats, 0)
    };
  }
};

// Load seat data untuk segment tertentu
const loadSeatDataForSegment = async (segment: Segment, passengerCount: number) => {
  try {
    if (!segment.scheduleId) {
      return {
        wagons: [],
        totalAvailableSeats: 0
      };
    }

    const seatData = await loadSeatData(
      segment.scheduleId,
      passengerCount,
      {
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
      },
      segment.origin,
      segment.destination
    );

    return seatData;
  } catch (error) {
    console.error(`Error loading seat data for segment ${segment.segmentId}:`, error);
    return {
      wagons: [],
      totalAvailableSeats: 0
    };
  }
};

// Fungsi untuk mendapatkan opsi multi-segment rute Bandung-Gambir
const getBandungGambirMultiSegmentOptions = (
  departureDate: string,
  passengerCount: number
): MultiSegmentBooking[] => {
  return [
    // Opsi 1: Perjalanan langsung (Argo Parahyangan)
    {
      segments: [{
        segmentId: 'segment-bdg-gmr-direct',
        trainId: 101,
        trainName: 'Argo Parahyangan',
        trainType: 'Executive',
        departureTime: '05:00',
        arrivalTime: '09:30',
        duration: '4j 30m',
        origin: 'Bandung',
        destination: 'Gambir',
        price: 250000,
        availableSeats: 35,
        departureDate: departureDate,
        scheduleId: 'schedule-bdg-gmr-0500',
        selectedSeats: []
      }],
      totalPrice: 250000 * passengerCount,
      totalDuration: '4j 30m',
      isMultiSegment: false,
      connectionTime: 0
    },
    
    // Opsi 2: Multi-segment dengan transit di Cirebon
    {
      segments: [
        {
          segmentId: 'segment-bdg-cbn',
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
          segmentId: 'segment-cbn-gmr',
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
      totalPrice: 250000 * passengerCount,
      totalDuration: '6j 0m',
      isMultiSegment: true,
      connectionTime: 90 // 1.5 jam transit di Cirebon
    },
    
    // Opsi 3: Multi-segment dengan transit di Purwakarta
    {
      segments: [
        {
          segmentId: 'segment-bdg-pwk',
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
          segmentId: 'segment-pwk-gmr',
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
      totalPrice: 250000 * passengerCount,
      totalDuration: '4j 0m',
      isMultiSegment: true,
      connectionTime: 75 // 1.25 jam transit di Purwakarta
    }
  ];
};

// Fungsi untuk mengupdate seat occupancy
const updateSeatOccupancy = (seats: Seat[], segmentId: string, passengerIds: string[], selectedSeatIds: string[]): Seat[] => {
  return seats.map(seat => {
    const isSelected = selectedSeatIds.includes(seat.id);
    return {
      ...seat,
      segmentId,
      occupancy: isSelected ? {
        seatId: seat.id,
        passengerId: passengerIds[selectedSeatIds.indexOf(seat.id)] || '',
        segmentId,
        occupied: true
      } : undefined
    };
  });
};

// Fungsi untuk membersihkan occupancy
const clearSegmentOccupancy = (seats: Seat[], segmentId: string): Seat[] => {
  return seats.map(seat => ({
    ...seat,
    segmentId,
    occupancy: undefined
  }));
};

// --- Komponen MultiSegmentSelector (DIPERBAIKI) ---
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
          <span className="ml-3 text-gray-600">Memuat opsi perjalanan...</span>
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
          <h3 className="text-xl font-bold text-gray-800">Opsi Perjalanan</h3>
          <p className="text-gray-600">
            {multiSegmentOptions.length} opsi perjalanan tersedia
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {multiSegmentOptions.map((option, index) => (
          <div
            key={`multi-segment-${index}`}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedMultiSegment?.segments[0]?.segmentId === option.segments[0]?.segmentId
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
              : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            onClick={() => onSelect(option)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${selectedMultiSegment?.segments[0]?.segmentId === option.segments[0]?.segmentId
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-400'
                  }`}>
                  {selectedMultiSegment?.segments[0]?.segmentId === option.segments[0]?.segmentId && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">
                    {option.isMultiSegment ? 'Perjalanan dengan Transit' : 'Perjalanan Langsung'}
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
                    Waktu transit: {option.connectionTime} menit
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
                {selectedMultiSegment.isMultiSegment 
                  ? `${selectedMultiSegment.segments.length} kereta • ${selectedMultiSegment.totalDuration}`
                  : "Perjalanan langsung"}
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
            <div><span className="font-medium">Jumlah Kereta:</span> {selectedMultiSegment.segments.length}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Komponen PromoListModal ---
const PromoListModal = ({
  trainDetail,
  selectedMultiSegment,
  passengerCount,
  onClose,
  onSelectPromo
}: {
  trainDetail: TrainDetail | null;
  selectedMultiSegment: MultiSegmentBooking | null;
  passengerCount: number;
  onClose: () => void;
  onSelectPromo: (promo: PromoVoucher) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [availablePromosList, setAvailablePromosList] = useState<PromoVoucher[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPromos = async () => {
      setLoading(true);
      setError(null);

      try {
        // Hitung total harga berdasarkan single atau multi segment
        let totalPrice = 0;
        
        if (selectedMultiSegment?.isMultiSegment) {
          totalPrice = selectedMultiSegment.totalPrice;
        } else if (trainDetail) {
          totalPrice = trainDetail.price * passengerCount;
        }

        // Filter promo yang sesuai
        const applicablePromos = DUMMY_PROMO_VOUCHERS.filter(promo => {
          // Cek status aktif dan tanggal
          if (!promo.is_active) return false;
          if (new Date(promo.end_date) < new Date()) return false;
          if (new Date(promo.start_date) > new Date()) return false;

          // Cek minimum order amount
          if (totalPrice < promo.min_order_amount) return false;

          // Cek kondisi khusus untuk FAMILY30
          if (promo.promo_code === 'FAMILY30' && passengerCount < 3) return false;

          return true;
        });

        setAvailablePromosList(applicablePromos);

        if (applicablePromos.length === 0) {
          setError('Tidak ada promo yang tersedia untuk perjalanan ini');
        }

      } catch (error) {
        console.error('Error loading promotions:', error);
        setError('Terjadi kesalahan saat memuat promo');
        setAvailablePromosList([]);
      } finally {
        setLoading(false);
      }
    };

    loadPromos();
  }, [trainDetail, selectedMultiSegment, passengerCount]);

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
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Info perjalanan */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-800">Detail Perjalanan</p>
                {selectedMultiSegment?.isMultiSegment ? (
                  <p className="text-sm text-blue-600">
                    {selectedMultiSegment.segments.length} kereta • {passengerCount} penumpang • 
                    Total: Rp {selectedMultiSegment.totalPrice.toLocaleString('id-ID')}
                  </p>
                ) : trainDetail ? (
                  <p className="text-sm text-blue-600">
                    {trainDetail.trainName} • {passengerCount} penumpang • 
                    Total: Rp {(trainDetail.price * passengerCount).toLocaleString('id-ID')}
                  </p>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-700">
                  💡 Promo berlaku untuk semua kereta
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
              <p className="text-gray-500">Memuat promo...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <InfoIcon />
              </div>
              <p className="text-gray-500 mb-2">{error}</p>
              <p className="text-sm text-gray-400">
                Coba gunakan kode promo lainnya
              </p>
            </div>
          ) : availablePromosList.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TagIcon />
              </div>
              <p className="text-gray-500">Tidak ada promo yang tersedia saat ini</p>
              <p className="text-sm text-gray-400 mt-2">
                Coba lagi nanti atau gunakan kode promo lainnya
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {availablePromosList.map((promo) => (
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
                          Berlaku untuk semua kelas
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <button
                        onClick={() => onSelectPromo(promo)}
                        className="px-4 py-2 bg-[#FD7E14] text-white rounded-lg hover:bg-[#E06700] font-medium"
                      >
                        Pakai Promo
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Berlaku hingga {formatDate(promo.end_date)}
                      </p>
                    </div>
                  </div>

                  {promo.promo_code === 'FAMILY30' && passengerCount < 3 && (
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
                onClick={onClose}
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

// --- Komponen SegmentSeatMapModal untuk multi-segment ---
const SegmentSeatMapModal = ({
  segment,
  passengerCount,
  selectedSeats,
  onSeatSelect,
  onSeatDeselect,
  onClose,
  autoSelectEnabled,
  toggleAutoSelect,
  seatReuseConfig
}: {
  segment: Segment;
  passengerCount: number;
  selectedSeats: Seat[];
  onSeatSelect: (seat: Seat) => void;
  onSeatDeselect: (seatId: string) => void;
  onClose: () => void;
  autoSelectEnabled: boolean;
  toggleAutoSelect: () => void;
  seatReuseConfig?: SeatReuseConfig;
}) => {
  const trainData: Train | null = segment.wagons ? {
    trainId: segment.trainId,
    trainName: segment.trainName,
    trainType: segment.trainType,
    departureTime: segment.departureTime,
    arrivalTime: segment.arrivalTime,
    duration: segment.duration,
    origin: segment.origin,
    destination: segment.destination,
    price: segment.price,
    availableSeats: segment.wagons.reduce((sum, wagon) => sum + wagon.availableSeats, 0),
    departureDate: segment.departureDate,
    scheduleId: segment.scheduleId,
    wagons: segment.wagons
  } : null;

  const segmentSelectedSeats = selectedSeats.filter(seat => seat.segmentId === segment.segmentId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Pilih Kursi - {segment.trainName}</h3>
              <p className="text-gray-600">
                {segment.origin} → {segment.destination} • {segment.departureTime} - {segment.arrivalTime}
              </p>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id={`auto-select-toggle-${segment.segmentId}`}
                  checked={autoSelectEnabled}
                  onChange={toggleAutoSelect}
                  className="mr-2"
                />
                <label htmlFor={`auto-select-toggle-${segment.segmentId}`} className="text-sm text-gray-600">
                  Auto-select kursi kosong
                </label>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {trainData ? (
            <>
              <TrainSeatMap
                train={trainData}
                selectedSeats={segmentSelectedSeats}
                onSeatSelect={onSeatSelect}
                onSeatDeselect={onSeatDeselect}
                maxSeats={passengerCount}
                currentSegmentId={segment.segmentId}
                seatReuseConfig={seatReuseConfig}
              />

              <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
                <h4 className="font-bold text-lg text-gray-800 mb-4">
                  Kursi Terpilih untuk Kereta Ini ({segmentSelectedSeats.length} dari {passengerCount})
                </h4>

                {segmentSelectedSeats.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segmentSelectedSeats.map((seat, index) => (
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
                            onClick={() => onSeatDeselect(seat.id)}
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
                    <p className="text-gray-500">Belum ada kursi yang dipilih untuk kereta ini</p>
                    <p className="text-sm text-gray-400 mt-1">Kursi akan dialokasikan otomatis saat check-in</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Simpan Pilihan
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Data kursi tidak tersedia untuk kereta ini</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Komponen Utama ---
const BookingPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

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

  // State untuk multi-segmen
  const [multiSegmentOptions, setMultiSegmentOptions] = useState<MultiSegmentBooking[]>([]);
  const [selectedMultiSegment, setSelectedMultiSegment] = useState<MultiSegmentBooking | null>(null);
  const [multiSegmentLoading, setMultiSegmentLoading] = useState(false);
  const [showMultiSegmentSelector, setShowMultiSegmentSelector] = useState(false);
  const [selectedSegmentForSeatMap, setSelectedSegmentForSeatMap] = useState<Segment | null>(null);

  // State untuk seat reuse
  const [seatReuseData, setSeatReuseData] = useState<Record<string, SeatOccupancy[]>>({});

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
  
  // Parameter multi-segment
  const isMultiSegmentParam = searchParams.get('isMultiSegment') === 'true';
  const segmentsParam = searchParams.get('segments');
  const totalPriceParam = searchParams.get('totalPrice');
  const connectionTimeParam = searchParams.get('connectionTime');

  const realtimeDepartureDate = getRealtimeDepartureDate(departureDateFromUrl);

  // Fungsi untuk mengupdate seat reuse data
  const updateSeatReuseForSegment = (segmentId: string, seats: Seat[], passengerIds: string[]) => {
    const selectedSeatIds = selectedSeats
      .filter(seat => seat.segmentId === segmentId)
      .map(seat => seat.id);
    
    const updatedSeats = updateSeatOccupancy(seats, segmentId, passengerIds, selectedSeatIds);
    
    setSeatReuseData(prev => ({
      ...prev,
      [segmentId]: updatedSeats.map(seat => seat.occupancy).filter(Boolean) as SeatOccupancy[]
    }));
  };

  // Fungsi untuk mendapatkan seat reuse config
  const getSeatReuseConfig = (segmentId?: string): SeatReuseConfig => {
    return {
      enableReuse: true,
      reuseSegments: selectedMultiSegment?.segments.map(s => s.segmentId) || [],
      occupancyData: segmentId ? seatReuseData[segmentId] : []
    };
  };

  // Update saat seat dipilih untuk multi-segment
  const handleSegmentSeatSelectWithReuse = (seat: Seat, segmentId: string) => {
    const seatWithSegment = { ...seat, segmentId };
    const isAlreadySelected = selectedSeats.some(s => s.id === seat.id && s.segmentId === segmentId);

    if (isAlreadySelected) {
      setSelectedSeats(prev => prev.filter(s => !(s.id === seat.id && s.segmentId === segmentId)));
      
      // Update seat reuse data
      if (selectedMultiSegment?.isMultiSegment) {
        const segment = selectedMultiSegment.segments.find(s => s.segmentId === segmentId);
        if (segment?.wagons) {
          const passengerIds = passengers
            .filter(p => p.segmentId === segmentId)
            .map(p => p.id.toString());
          
          const updatedSeats = clearSegmentOccupancy(
            segment.wagons.flatMap(w => w.seats),
            segmentId
          );
          
          // Update wagons dengan occupancy yang dibersihkan
          const updatedSegments = selectedMultiSegment.segments.map(s => {
            if (s.segmentId === segmentId) {
              return {
                ...s,
                wagons: s.wagons.map(wagon => ({
                  ...wagon,
                  seats: updatedSeats.filter(seat => 
                    seat.wagonNumber === wagon.number
                  )
                }))
              };
            }
            return s;
          });
          
          setSelectedMultiSegment({
            ...selectedMultiSegment,
            segments: updatedSegments
          });
        }
      }
    } else {
      // Hitung jumlah kursi yang sudah dipilih untuk segment ini
      const segmentSeatsCount = selectedSeats.filter(s => s.segmentId === segmentId).length;
      if (segmentSeatsCount >= passengerCount) {
        return;
      }

      setSelectedSeats(prev => [...prev, seatWithSegment]);
      setAutoSelectEnabled(false);
      
      // Update seat reuse data
      if (selectedMultiSegment?.isMultiSegment) {
        const segment = selectedMultiSegment.segments.find(s => s.segmentId === segmentId);
        if (segment?.wagons) {
          const passengerIds = passengers
            .filter(p => p.segmentId === segmentId)
            .map(p => p.id.toString());
          
          const selectedSeatIds = [...selectedSeats, seatWithSegment]
            .filter(s => s.segmentId === segmentId)
            .map(s => s.id);
          
          const updatedSeats = updateSeatOccupancy(
            segment.wagons.flatMap(w => w.seats),
            segmentId,
            passengerIds,
            selectedSeatIds
          );
          
          // Update wagons dengan occupancy baru
          const updatedSegments = selectedMultiSegment.segments.map(s => {
            if (s.segmentId === segmentId) {
              return {
                ...s,
                wagons: s.wagons.map(wagon => ({
                  ...wagon,
                  seats: updatedSeats.filter(seat => 
                    seat.wagonNumber === wagon.number
                  )
                }))
              };
            }
            return s;
          });
          
          setSelectedMultiSegment({
            ...selectedMultiSegment,
            segments: updatedSegments
          });
        }
      }
    }
  };

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

  // Fungsi utama untuk mengambil opsi multi-segment
  const fetchMultiSegmentOptions = async (
    origin: string,
    destination: string,
    departureDate: string,
    passengerCount: number
  ): Promise<MultiSegmentBooking[]> => {
    try {
      // Jika rute adalah Bandung-Gambir, gunakan data khusus
      const normalizedOrigin = origin.toLowerCase();
      const normalizedDest = destination.toLowerCase();
      
      if ((normalizedOrigin.includes('bandung') && normalizedDest.includes('gambir')) ||
          (normalizedOrigin.includes('gambir') && normalizedDest.includes('bandung'))) {
        return getBandungGambirMultiSegmentOptions(departureDate, passengerCount);
      }

      // Untuk rute lainnya, coba ambil dari API
      const response = await fetch(
        `/api/multi-segment?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${departureDate}&passengers=${passengerCount}`,
        {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.options && Array.isArray(data.options)) {
          return data.options.map((option: any) => ({
            segments: option.segments.map((seg: any, index: number) => ({
              segmentId: seg.segmentId || seg.id || `segment-${Date.now()}-${index}`,
              trainId: seg.trainId || index + 1,
              trainName: seg.trainName || `Kereta ${index + 1}`,
              trainType: seg.trainType || 'Executive',
              departureTime: seg.departureTime || '08:00',
              arrivalTime: seg.arrivalTime || '10:00',
              duration: seg.duration || '2j 0m',
              origin: seg.origin || origin,
              destination: seg.destination || destination,
              price: seg.price || 265000,
              availableSeats: seg.availableSeats || 20,
              departureDate: seg.departureDate || departureDate,
              scheduleId: seg.scheduleId || `schedule-${Date.now()}-${index}`,
              selectedSeats: [],
              schedule_id: seg.schedule_id || seg.scheduleId,
              train_code: seg.train_code || `T${index + 1}`,
              origin_city: seg.origin_city || seg.origin,
              destination_city: seg.destination_city || seg.destination
            })),
            totalPrice: option.totalPrice || (option.segments?.reduce((sum: number, seg: any) => sum + (seg.price || 0), 0) || 0),
            totalDuration: option.totalDuration || '5j 0m',
            isMultiSegment: option.isMultiSegment || (option.segments?.length > 1 || false),
            connectionTime: option.connectionTime || 30
          }));
        }
      }

      // Fallback untuk rute lainnya
      return [
        {
          segments: [{
            segmentId: 'segment-direct-fallback',
            trainId: 1,
            trainName: 'Kereta Eksekutif',
            trainType: 'Executive',
            departureTime: '08:00',
            arrivalTime: '12:00',
            duration: '4j 0m',
            origin: origin,
            destination: destination,
            price: 300000,
            availableSeats: 30,
            departureDate: departureDate,
            scheduleId: 'schedule-fallback-1',
            selectedSeats: []
          }],
          totalPrice: 300000 * passengerCount,
          totalDuration: '4j 0m',
          isMultiSegment: false,
          connectionTime: 0
        }
      ];
      
    } catch (error) {
      console.error('Error fetching multi-segment options:', error);
      // Fallback untuk rute Bandung-Gambir atau lainnya
      if (origin.toLowerCase().includes('bandung') && destination.toLowerCase().includes('gambir')) {
        return getBandungGambirMultiSegmentOptions(departureDate, passengerCount);
      }
      return [
        {
          segments: [{
            segmentId: 'segment-error-fallback',
            trainId: 999,
            trainName: 'Kereta Ekonomi',
            trainType: 'Economy',
            departureTime: '08:00',
            arrivalTime: '16:00',
            duration: '8j 0m',
            origin: origin,
            destination: destination,
            price: 150000,
            availableSeats: 50,
            departureDate: departureDate,
            scheduleId: 'schedule-error',
            selectedSeats: []
          }],
          totalPrice: 150000 * passengerCount,
          totalDuration: '8j 0m',
          isMultiSegment: false,
          connectionTime: 0
        }
      ];
    }
  };

  // Load data kereta dari database
  useEffect(() => {
    let isMounted = true;

    const loadTrainData = async () => {
      if (!isMounted) return;

      setLoading(true);
      setError(null);

      try {
        // Jika sudah ada multi-segment yang dipilih, skip loading biasa
        if (selectedMultiSegment?.isMultiSegment) {
          setLoading(false);
          return;
        }

        // Load data schedule jika ada
        if (scheduleId && scheduleId !== 'dummy-schedule-1') {
          const response = await fetch(`/api/schedules/${scheduleId}`);

          if (response.ok) {
            const scheduleData = await response.json();

            if (scheduleData.success) {
              const data = scheduleData.data;

              const trainDetail: TrainDetail = {
                trainId: data.train_id,
                trainName: data.kereta.nama_kereta,
                trainType: data.kereta.tipe_kereta,
                departureTime: data.departure_time,
                arrivalTime: data.arrival_time,
                duration: formatDuration(data.duration_minutes),
                origin: data.origin_station?.nama_stasiun || origin,
                destination: data.destination_station?.nama_stasiun || destination,
                price: data.price || price,
                availableSeats: data.available_seats || 25,
                departureDate: data.travel_date || realtimeDepartureDate,
                scheduleId: data.id,
                trainCode: data.kereta.kode_kereta,
                originCity: data.origin_station?.city,
                destinationCity: data.destination_station?.city
              };

              if (isMounted) {
                setTrainDetail(trainDetail);

                const urlPassengerCount = Math.max(1, Math.min(urlPassengers, 9));
                setPassengerCount(urlPassengerCount);

                const initialPassengers = initializePassengers(urlPassengerCount);
                setPassengers(initialPassengers);

                const seatData = await loadSeatData(data.id, urlPassengerCount, trainDetail, origin, destination);

                const trainDataObj: Train = {
                  trainId: trainDetail.trainId,
                  trainName: trainDetail.trainName,
                  trainType: trainDetail.trainType,
                  departureTime: trainDetail.departureTime,
                  arrivalTime: trainDetail.arrivalTime,
                  duration: trainDetail.duration,
                  origin: trainDetail.origin,
                  destination: trainDetail.destination,
                  price: trainDetail.price,
                  availableSeats: seatData.totalAvailableSeats,
                  departureDate: trainDetail.departureDate,
                  scheduleId: data.id,
                  wagons: seatData.wagons
                };

                setTrainData(trainDataObj);

                if (autoSelectEnabled) {
                  const autoSelectedSeats = autoSelectSeats(trainDataObj, urlPassengerCount);
                  setSelectedSeats(autoSelectedSeats);
                }

                // Load multi-segment options
                loadMultiSegmentOptions();
                return;
              }
            }
          }
        }

        // Fallback ke data dummy
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

          const seatData = await loadSeatData('dummy-schedule-1', urlPassengerCount, dummyData);

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
    if (selectedMultiSegment?.isMultiSegment) return;
    
    setMultiSegmentLoading(true);
    try {
      const options = await fetchMultiSegmentOptions(
        origin,
        destination,
        realtimeDepartureDate,
        passengerCount
      );
      setMultiSegmentOptions(options);
    } catch (error) {
      console.error('Error loading multi-segment options:', error);
    } finally {
      setMultiSegmentLoading(false);
    }
  };

  // Load seat data untuk multi-segment
  useEffect(() => {
    const loadSeatsForMultiSegment = async () => {
      if (!selectedMultiSegment?.isMultiSegment) return;

      const updatedSegments = [...selectedMultiSegment.segments];
      
      for (let i = 0; i < updatedSegments.length; i++) {
        const segment = updatedSegments[i];
        const seatData = await loadSeatDataForSegment(segment, passengerCount);
        
        updatedSegments[i] = {
          ...segment,
          wagons: seatData.wagons
        };
      }
      
      setSelectedMultiSegment({
        ...selectedMultiSegment,
        segments: updatedSegments
      });
    };

    if (selectedMultiSegment?.isMultiSegment) {
      loadSeatsForMultiSegment();
    }
  }, [selectedMultiSegment?.isMultiSegment, passengerCount]);

  // FUNGSI UNTUK APPLY PROMO YANG DIPERBAIKI
  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) {
      setPromoError('Masukkan kode promo/voucher');
      return;
    }

    if (!trainDetail && !selectedMultiSegment) {
      setPromoError('Data perjalanan tidak tersedia');
      return;
    }

    setIsApplyingPromo(true);
    setPromoError('');
    setPromoMessage('');

    try {
      let validationResult;

      if (selectedMultiSegment?.isMultiSegment) {
        // Validasi untuk multi segment
        validationResult = await validatePromoCode(
          promoCodeInput,
          0, // basePrice tidak digunakan untuk multi segment
          0, // passengerCount akan diambil dari multiSegmentData
          '', // trainType tidak digunakan untuk multi segment
          '', // departureDate tidak digunakan untuk multi segment
          {
            segments: selectedMultiSegment.segments,
            totalPrice: selectedMultiSegment.totalPrice,
            passengerCount: passengerCount
          }
        );
      } else if (trainDetail) {
        // Validasi untuk single segment
        validationResult = await validatePromoCode(
          promoCodeInput,
          trainDetail.price,
          passengerCount,
          trainDetail.trainType,
          trainDetail.departureDate
        );
      } else {
        setPromoError('Data perjalanan tidak tersedia');
        return;
      }

      if (validationResult.isValid && validationResult.promo) {
        setAppliedPromo(validationResult.promo);
        setDiscountAmount(validationResult.discountAmount);
        setPromoMessage(validationResult.message);
        setPromoError('');
        
        console.log('✅ Promo berhasil diterapkan:', {
          promo: validationResult.promo.name,
          discountAmount: validationResult.discountAmount,
          message: validationResult.message
        });
      } else {
        setAppliedPromo(null);
        setDiscountAmount(0);
        setPromoError(validationResult.message);
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
    setTimeout(() => {
      handleApplyPromo();
    }, 100);
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

  // Perhitungan harga yang benar untuk multi segment
  const calculateTotalPrice = () => {
    if (selectedMultiSegment?.isMultiSegment) {
      return selectedMultiSegment.totalPrice;
    } else if (trainDetail) {
      return trainDetail.price * passengerCount;
    }
    return 0;
  };

  const basePrice = calculateTotalPrice();
  const adminFee = 5000;
  const insuranceFee = 10000;
  const selectedPaymentMethod = PAYMENT_METHODS.find(method => method.id === selectedPayment);
  const paymentFee = selectedPaymentMethod?.fees || 0;

  // Hitung seat price adjustment dengan benar
  const calculateSeatPriceAdjustment = () => {
    let adjustment = 0;
    
    selectedSeats.forEach(seat => {
      if (selectedMultiSegment?.isMultiSegment && seat.segmentId) {
        const segment = selectedMultiSegment.segments.find(s => s.segmentId === seat.segmentId);
        const basePrice = segment?.price || 0;
        adjustment += (seat.price - basePrice);
      } else if (trainDetail) {
        adjustment += (seat.price - trainDetail.price);
      }
    });
    
    return adjustment;
  };

  const seatPriceAdjustment = calculateSeatPriceAdjustment();
  const subtotal = basePrice + seatPriceAdjustment;
  const totalBeforeDiscount = subtotal + adminFee + insuranceFee + paymentFee;
  const grandTotal = totalBeforeDiscount - discountAmount;

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

    // Auto-select seats untuk single segment
    if (autoSelectEnabled && trainData && !selectedMultiSegment?.isMultiSegment) {
      const autoSelectedSeats = autoSelectSeats(trainData, passengerCount);
      setSelectedSeats(autoSelectedSeats);
    }

    // Auto-select seats untuk multi-segment
    if (autoSelectEnabled && selectedMultiSegment?.isMultiSegment) {
      const allSelectedSeats: Seat[] = [];
      
      selectedMultiSegment.segments.forEach(segment => {
        if (segment.wagons) {
          const trainDataObj: Train = {
            trainId: segment.trainId,
            trainName: segment.trainName,
            trainType: segment.trainType,
            departureTime: segment.departureTime,
            arrivalTime: segment.arrivalTime,
            duration: segment.duration,
            origin: segment.origin,
            destination: segment.destination,
            price: segment.price,
            availableSeats: segment.wagons.reduce((sum, wagon) => sum + wagon.availableSeats, 0),
            departureDate: segment.departureDate,
            scheduleId: segment.scheduleId,
            wagons: segment.wagons
          };
          
          const autoSelectedSeats = autoSelectSeats(trainDataObj, passengerCount, segment.segmentId);
          allSelectedSeats.push(...autoSelectedSeats);
        }
      });
      
      setSelectedSeats(allSelectedSeats);
    }

    // Load multi-segment options jika perlu
    if (trainDetail && !selectedMultiSegment?.isMultiSegment) {
      loadMultiSegmentOptions();
    }
  }, [passengerCount, autoSelectEnabled, trainData, selectedMultiSegment]);

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

  // Update kursi penumpang untuk multi-segment
  useEffect(() => {
    if (selectedMultiSegment?.isMultiSegment) {
      const updatedPassengers = [...passengers];
      
      // Reset semua data kursi
      updatedPassengers.forEach(passenger => {
        passenger.seatNumber = '';
        passenger.seatId = '';
        passenger.wagonNumber = '';
        passenger.wagonClass = '';
        passenger.segmentId = undefined;
        passenger.segmentIndex = undefined;
      });
      
      // Distribusikan kursi ke penumpang
      const segmentSeats: Record<string, Seat[]> = {};
      
      // Kelompokkan kursi berdasarkan segment
      selectedSeats.forEach(seat => {
        if (seat.segmentId) {
          if (!segmentSeats[seat.segmentId]) {
            segmentSeats[seat.segmentId] = [];
          }
          segmentSeats[seat.segmentId].push(seat);
        }
      });
      
      // Assign kursi ke penumpang untuk setiap segment
      Object.entries(segmentSeats).forEach(([segmentId, seats], segmentIndex) => {
        seats.forEach((seat, seatIndex) => {
          if (updatedPassengers[seatIndex]) {
            updatedPassengers[seatIndex].seatNumber = seat.number;
            updatedPassengers[seatIndex].seatId = seat.id;
            updatedPassengers[seatIndex].wagonNumber = seat.wagonNumber || '';
            updatedPassengers[seatIndex].wagonClass = seat.wagonClass || '';
            updatedPassengers[seatIndex].segmentId = segmentId;
            updatedPassengers[seatIndex].segmentIndex = segmentIndex;
          }
        });
      });
      
      setPassengers(updatedPassengers);
    } else {
      // Update kursi untuk single segment
      const updatedPassengers = [...passengers];

      updatedPassengers.forEach(passenger => {
        passenger.seatNumber = '';
        passenger.seatId = '';
        passenger.wagonNumber = '';
        passenger.wagonClass = '';
        passenger.segmentId = undefined;
        passenger.segmentIndex = undefined;
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
    }
  }, [selectedSeats]);

  // Handle multi-segment selection
  const handleMultiSegmentSelect = async (segment: MultiSegmentBooking | null) => {
    if (segment) {
      // Load seat data untuk setiap segment
      const updatedSegments = [...segment.segments];
      
      for (let i = 0; i < updatedSegments.length; i++) {
        const seg = updatedSegments[i];
        const seatData = await loadSeatDataForSegment(seg, passengerCount);
        
        updatedSegments[i] = {
          ...seg,
          wagons: seatData.wagons
        };
      }
      
      setSelectedMultiSegment({
        ...segment,
        segments: updatedSegments
      });
      
      // Reset data train detail untuk multi-segment
      setTrainDetail(null);
      setTrainData(null);
      
      // Reset promo karena total harga berubah
      setAppliedPromo(null);
      setDiscountAmount(0);
      setPromoCodeInput('');
      setPromoError('');
      
    } else {
      setSelectedMultiSegment(null);
      // Kembali ke data single segment
      if (trainData) {
        const autoSelectedSeats = autoSelectSeats(trainData, passengerCount);
        setSelectedSeats(autoSelectedSeats);
      }
      
      // Reset promo
      setAppliedPromo(null);
      setDiscountAmount(0);
      setPromoCodeInput('');
      setPromoError('');
    }
    setShowMultiSegmentSelector(false);
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

        switch (field) {
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

  // Handle pilih kursi untuk single segment
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

  // Handle pilih kursi untuk multi-segment
  const handleSegmentSeatSelect = (seat: Seat, segmentId: string) => {
    const seatWithSegment = { ...seat, segmentId };
    const isAlreadySelected = selectedSeats.some(s => s.id === seat.id && s.segmentId === segmentId);

    if (isAlreadySelected) {
      setSelectedSeats(prev => prev.filter(s => !(s.id === seat.id && s.segmentId === segmentId)));
    } else {
      // Hitung jumlah kursi yang sudah dipilih untuk segment ini
      const segmentSeatsCount = selectedSeats.filter(s => s.segmentId === segmentId).length;
      if (segmentSeatsCount >= passengerCount) {
        return;
      }

      setSelectedSeats(prev => [...prev, seatWithSegment]);
      setAutoSelectEnabled(false);
    }
  };

  const handleSeatDeselect = (seatId: string) => {
    setSelectedSeats(prev => prev.filter(s => s.id !== seatId));
  };

  const toggleAutoSelect = () => {
    if (!autoSelectEnabled) {
      if (selectedMultiSegment?.isMultiSegment) {
        // Auto-select untuk semua segment
        const allSelectedSeats: Seat[] = [];
        
        selectedMultiSegment.segments.forEach(segment => {
          if (segment.wagons) {
            const trainDataObj: Train = {
              trainId: segment.trainId,
              trainName: segment.trainName,
              trainType: segment.trainType,
              departureTime: segment.departureTime,
              arrivalTime: segment.arrivalTime,
              duration: segment.duration,
              origin: segment.origin,
              destination: segment.destination,
              price: segment.price,
              availableSeats: segment.wagons.reduce((sum, wagon) => sum + wagon.availableSeats, 0),
              departureDate: segment.departureDate,
              scheduleId: segment.scheduleId,
              wagons: segment.wagons
            };
            
            const autoSelectedSeats = autoSelectSeats(trainDataObj, passengerCount, segment.segmentId);
            allSelectedSeats.push(...autoSelectedSeats);
          }
        });
        
        setSelectedSeats(allSelectedSeats);
      } else if (trainData) {
        const autoSelectedSeats = autoSelectSeats(trainData, passengerCount);
        setSelectedSeats(autoSelectedSeats);
      }
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

  // Handle pembayaran dengan multi-segment
  const handlePayment = async () => {
    if (isProcessing) return;

    console.log('💳 Preparing payment redirect...');
    setIsProcessing(true);
    setError(null);

    try {
      // Validasi data
      if (!trainDetail && !selectedMultiSegment) {
        throw new Error('Data perjalanan tidak lengkap');
      }

      if (passengers.length === 0) {
        throw new Error('Data penumpang tidak lengkap');
      }

      // Siapkan data untuk payment page
      const paymentData = {
        bookingCode: generatedBookingCode,
        orderId: generatedOrderId,
        amount: grandTotal,
        name: contactDetail.fullName,
        email: contactDetail.email,
        phone: contactDetail.phoneNumber,
        passengerCount: passengerCount,
        paymentMethod: selectedPayment,
        
        // Train details
        trainName: selectedMultiSegment?.isMultiSegment 
          ? `${selectedMultiSegment.segments.length} Segmen` 
          : (trainDetail?.trainName || ''),
        trainType: selectedMultiSegment?.isMultiSegment 
          ? 'Multi-Segmen' 
          : (trainDetail?.trainType || ''),
        origin: selectedMultiSegment?.isMultiSegment 
          ? selectedMultiSegment.segments[0]?.origin 
          : (trainDetail?.origin || ''),
        destination: selectedMultiSegment?.isMultiSegment 
          ? selectedMultiSegment.segments[selectedMultiSegment.segments.length - 1]?.destination 
          : (trainDetail?.destination || ''),
        departureDate: selectedMultiSegment?.isMultiSegment 
          ? selectedMultiSegment.segments[0]?.departureDate 
          : (trainDetail?.departureDate || ''),
        departureTime: selectedMultiSegment?.isMultiSegment 
          ? selectedMultiSegment.segments[0]?.departureTime 
          : (trainDetail?.departureTime || ''),
        isMultiSegment: selectedMultiSegment?.isMultiSegment || false,
        
        // Pricing breakdown
        basePrice: basePrice,
        seatPremium: seatPriceAdjustment,
        adminFee: adminFee,
        insuranceFee: insuranceFee,
        paymentFee: paymentFee,
        
        // Promo data if applicable
        promoCode: appliedPromo?.promo_code || '',
        promoName: appliedPromo?.name || '',
        discountAmount: discountAmount,
        
        // Passenger details
        passengerDetails: passengers.map(p => ({
          fullName: p.fullName,
          email: p.email,
          phoneNumber: p.phoneNumber,
          seatNumber: p.seatNumber,
          segmentId: p.segmentId
        })),
        
        // Multi-segment data
        segments: selectedMultiSegment?.isMultiSegment ? selectedMultiSegment.segments : [],
        connectionTime: selectedMultiSegment?.connectionTime || 0
      };

      // Simpan data ke sessionStorage untuk payment page
      console.log('💾 Saving payment data:', paymentData);
      sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
      
      // Simpan juga ke localStorage untuk redundancy
      localStorage.setItem('tempBookingData', JSON.stringify(paymentData));

      // Build query parameters untuk payment page
      const queryParams = new URLSearchParams();
      queryParams.append('bookingCode', generatedBookingCode);
      queryParams.append('orderId', generatedOrderId);
      queryParams.append('amount', grandTotal.toString());
      queryParams.append('name', encodeURIComponent(contactDetail.fullName));
      queryParams.append('email', encodeURIComponent(contactDetail.email || ''));
      queryParams.append('phone', encodeURIComponent(contactDetail.phoneNumber || ''));
      queryParams.append('passengerCount', passengerCount.toString());
      queryParams.append('paymentMethod', selectedPayment);
      queryParams.append('paymentFee', paymentFee.toString());

      // Train details
      if (selectedMultiSegment?.isMultiSegment) {
        queryParams.append('trainName', `${selectedMultiSegment.segments.length} Segmen`);
        queryParams.append('trainType', 'Multi-Segmen');
        queryParams.append('origin', selectedMultiSegment.segments[0]?.origin || '');
        queryParams.append('destination', selectedMultiSegment.segments[selectedMultiSegment.segments.length - 1]?.destination || '');
        queryParams.append('departureDate', selectedMultiSegment.segments[0]?.departureDate || '');
        queryParams.append('departureTime', selectedMultiSegment.segments[0]?.departureTime || '');
        queryParams.append('isMultiSegment', 'true');
      } else {
        queryParams.append('trainName', trainDetail?.trainName || '');
        queryParams.append('trainType', trainDetail?.trainType || '');
        queryParams.append('origin', trainDetail?.origin || '');
        queryParams.append('destination', trainDetail?.destination || '');
        queryParams.append('departureDate', trainDetail?.departureDate || '');
        queryParams.append('departureTime', trainDetail?.departureTime || '');
        queryParams.append('isMultiSegment', 'false');
      }

      // Pricing
      queryParams.append('basePrice', basePrice.toString());
      queryParams.append('seatPremium', seatPriceAdjustment.toString());
      queryParams.append('adminFee', adminFee.toString());
      queryParams.append('insuranceFee', insuranceFee.toString());

      // Promo
      if (appliedPromo) {
        queryParams.append('promoCode', appliedPromo.promo_code);
        queryParams.append('promoName', appliedPromo.name);
        queryParams.append('discountAmount', discountAmount.toString());
      }

      const paymentUrl = `/payment?${queryParams.toString()}`;
      console.log('🔗 Redirecting to payment page:', paymentUrl);

      // Redirect langsung tanpa membuat booking dulu
      // Booking akan dibuat nanti di payment page setelah pembayaran berhasil
      router.push(paymentUrl);

    } catch (error: any) {
      console.error('💥 Error preparing payment:', error);
      setError(error.message || 'Terjadi kesalahan saat menyiapkan pembayaran.');
      setIsProcessing(false);
    }
  };

  // Modal komponen untuk single segment
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
                currentSegmentId={selectedMultiSegment?.isMultiSegment ? 'single-segment' : undefined}
                seatReuseConfig={selectedMultiSegment?.isMultiSegment ? getSeatReuseConfig() : undefined}
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
            {/* Tipe Perjalanan Selector */}
            {multiSegmentOptions.length > 0 && bookingStep === 1 && !selectedMultiSegment?.isMultiSegment && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <SegmentIcon />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-gray-800 text-lg">Pilih Jenis Perjalanan</h3>
                      <p className="text-sm text-gray-600">
                        Tersedia opsi perjalanan langsung atau dengan transit kereta
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMultiSegmentSelector(true)}
                    className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium flex items-center justify-center"
                  >
                    <SegmentIcon />
                    <span className="ml-2">Lihat Opsi Perjalanan Lainnya</span>
                  </button>
                </div>

                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-700 text-sm">
                    💡 <span className="font-medium">Tips:</span> Pilih "Lihat Opsi Perjalanan Lainnya" untuk melihat alternatif perjalanan dengan transit di stasiun lain
                  </p>
                </div>
              </div>
            )}

            {/* Multi Segment Selector Modal */}
            {showMultiSegmentSelector && bookingStep === 1 && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">Pilih Jenis Perjalanan</h3>
                        <p className="text-gray-600">Pilih opsi perjalanan yang paling sesuai</p>
                      </div>
                      <button
                        onClick={() => setShowMultiSegmentSelector(false)}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                      >
                        ✕
                      </button>
                    </div>

                    <MultiSegmentSelector
                      multiSegmentOptions={multiSegmentOptions}
                      selectedMultiSegment={selectedMultiSegment}
                      onSelect={handleMultiSegmentSelect}
                      loading={multiSegmentLoading}
                      passengerCount={passengerCount}
                    />

                    <div className="mt-6 pt-6 border-t">
                      <div className="text-center">
                        <button
                          onClick={() => setShowMultiSegmentSelector(false)}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Multi Segment Details Display */}
            {selectedMultiSegment?.isMultiSegment && bookingStep === 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <SegmentIcon />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-gray-800">Detail Perjalanan dengan Transit</h3>
                      <p className="text-gray-600">
                        {selectedMultiSegment.segments.length} kereta • {selectedMultiSegment.totalDuration}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMultiSegmentSelect(null)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 border border-red-200 rounded hover:bg-red-50"
                  >
                    Ubah ke Perjalanan Langsung
                  </button>
                </div>

                <div className="space-y-6">
                  {selectedMultiSegment.segments.map((segment, index) => {
                    const segmentSeats = selectedSeats.filter(seat => seat.segmentId === segment.segmentId);
                    const isSeatSelected = segmentSeats.length > 0;
                    
                    return (
                      <div key={`segment-detail-${segment.segmentId}`} className="border border-gray-300 rounded-lg p-6 hover:border-blue-300 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center mb-4">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                <span className="font-bold text-blue-600">{index + 1}</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-lg text-gray-800">{segment.trainName}</h4>
                                <div className="flex items-center mt-1">
                                  <span className={`px-2 py-1 text-xs rounded font-medium ${segment.trainType === 'Executive' ? 'bg-blue-100 text-blue-800' :
                                    segment.trainType === 'Business' ? 'bg-green-100 text-green-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                    {segment.trainType}
                                  </span>
                                  <span className="mx-2 text-gray-400">•</span>
                                  <span className="text-sm text-gray-600">
                                    {segment.origin} → {segment.destination}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-center">
                                  <p className="text-xl font-bold text-gray-800">{segment.departureTime}</p>
                                  <p className="text-gray-600 text-sm mt-1">{segment.origin}</p>
                                </div>
                                
                                <div className="flex-1 mx-6">
                                  <div className="relative">
                                    <div className="h-1 bg-gray-300 w-full"></div>
                                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-400 rounded-full"></div>
                                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-400 rounded-full"></div>
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-500 text-center mt-2">{segment.duration}</p>
                                </div>

                                <div className="text-center">
                                  <p className="text-xl font-bold text-gray-800">{segment.arrivalTime}</p>
                                  <p className="text-gray-600 text-sm mt-1">{segment.destination}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Tanggal:</span>
                                  <p className="font-semibold text-gray-800">{formatDate(segment.departureDate)}</p>
                                </div>
                                <div className="text-center">
                                  <span className="font-medium">Kursi:</span>
                                  <p className="font-semibold text-green-600">{segment.availableSeats} tersedia</p>
                                </div>
                                <div className="text-right">
                                  <span className="font-medium">Harga:</span>
                                  <p className="font-semibold text-[#FD7E14]">Rp {segment.price.toLocaleString('id-ID')}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="lg:w-1/3">
                            <div className="border-l lg:border-l-0 lg:border-t pt-4 lg:pt-0 lg:pl-6">
                              <h5 className="font-medium text-gray-700 mb-3">Kursi Terpilih untuk Kereta Ini</h5>
                              
                              {isSeatSelected ? (
                                <div className="space-y-2">
                                  {segmentSeats.map((seat, seatIndex) => (
                                    <div key={`seat-${segment.segmentId}-${seat.id}`} 
                                      className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                      <div>
                                        <span className="font-bold text-lg text-gray-800">{seat.number}</span>
                                        <span className="ml-2 text-sm text-gray-600">(Gerbong {seat.wagonNumber})</span>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xs text-gray-500">Penumpang {seatIndex + 1}</div>
                                        <div className="text-sm font-medium text-green-600">
                                          +Rp {(seat.price - segment.price).toLocaleString('id-ID')}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                                  <p className="text-gray-500 text-sm">Belum ada kursi dipilih</p>
                                  <p className="text-xs text-gray-400 mt-1">Kursi akan dialokasikan otomatis</p>
                                </div>
                              )}
                              
                              <button
                                onClick={() => setSelectedSegmentForSeatMap(segment)}
                                className="mt-4 w-full px-4 py-2.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium flex items-center justify-center"
                              >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                                </svg>
                                {isSeatSelected ? 'Ubah Kursi' : 'Pilih Kursi'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Connection Time Info */}
                  {selectedMultiSegment.connectionTime && selectedMultiSegment.connectionTime > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <ConnectionIcon />
                        <div className="ml-3">
                          <h4 className="font-bold text-yellow-800">Waktu Tunggu Antara Kereta</h4>
                          <p className="text-yellow-700">
                            Anda memiliki <span className="font-bold">{selectedMultiSegment.connectionTime} menit</span> untuk 
                            pindah kereta di stasiun transit. Pastikan tiba tepat waktu!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Single Segment Train Summary */}
            {!selectedMultiSegment?.isMultiSegment && trainDetail && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Detail Perjalanan</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <TrainIcon />
                        </div>
                        <div className="ml-4">
                          <h3 className="font-bold text-lg text-gray-800">{trainDetail.trainName}</h3>
                          <div className="flex items-center mt-1">
                            <span className={`px-2 py-1 text-xs rounded font-medium ${trainDetail.trainType === 'Executive' ? 'bg-blue-100 text-blue-800' :
                              trainDetail.trainType === 'Business' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {trainDetail.trainType}
                            </span>
                            <span className="mx-2 text-gray-400">•</span>
                            <span className="text-sm text-gray-600">
                              {trainData?.availableSeats || trainDetail.availableSeats} kursi tersedia
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 text-right">
                      <p className="text-2xl font-bold text-[#FD7E14]">
                        Rp {trainDetail.price.toLocaleString('id-ID')}
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
                        {formatDepartureDate(trainDetail.departureDate)}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center text-gray-600 mb-1">
                        <ClockIcon />
                        <span className="ml-2 text-sm">Durasi</span>
                      </div>
                      <p className="font-semibold text-gray-800">{trainDetail.duration}</p>
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
                        <p className="text-2xl font-bold text-gray-800">{trainDetail.departureTime}</p>
                        <p className="text-gray-600 mt-1">{trainDetail.origin}</p>
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
                        <p className="text-xs text-gray-500 mt-2">{trainDetail.duration}</p>
                      </div>

                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800">{trainDetail.arrivalTime}</p>
                        <p className="text-gray-600 mt-1">{trainDetail.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pilih Kursi Section */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Pilih Kursi (Opsional)</h4>
                      <p className="text-sm text-gray-500">
                        {selectedSeats.length > 0
                          ? `${selectedSeats.length} kursi dipilih untuk kereta ini`
                          : 'Kursi akan dialokasikan otomatis saat check-in'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="auto-select-toggle"
                          checked={autoSelectEnabled}
                          onChange={toggleAutoSelect}
                          className="mr-2"
                        />
                        <label htmlFor="auto-select-toggle" className="text-sm text-gray-600">
                          Pilih kursi otomatis
                        </label>
                      </div>
                      <button
                        onClick={() => setShowSeatMap(true)}
                        className="px-6 py-2.5 bg-[#FD7E14] text-white rounded-lg hover:bg-[#E06700] font-medium flex items-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5z" />
                        </svg>
                        {selectedSeats.length > 0 ? 'Ubah Kursi' : 'Pilih Kursi'}
                      </button>
                    </div>
                  </div>

                  {selectedSeats.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedSeats.map((seat, seatIndex) => (
                          <div key={`seat-badge-${seat.id}-${seatIndex}`}
                            className="px-3 py-2 bg-orange-50 text-orange-800 rounded-lg border border-orange-200 flex items-center">
                            <span className="font-bold">{seat.number}</span>
                            <span className="ml-2 text-sm text-gray-600">(Gerbong {seat.wagonNumber})</span>
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
                          className={`flex items-center px-4 py-2.5 border rounded-lg transition-colors ${contactDetail.title === title
                            ? 'border-[#FD7E14] bg-orange-50 text-[#FD7E14]'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${contactDetail.title === title
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
                            {passenger.segmentId && selectedMultiSegment?.isMultiSegment && (
                              <span className="ml-3 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Kereta {passenger.segmentIndex ? passenger.segmentIndex + 1 : 1}
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
                                className={`flex items-center px-4 py-2.5 border rounded-lg transition-colors ${passenger.title === title
                                  ? 'border-[#FD7E14] bg-orange-50 text-[#FD7E14]'
                                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                  }`}
                                disabled={passenger.useContactDetail && title !== contactDetail.title}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${passenger.title === title
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
                            className={`w-full border rounded-lg px-4 py-3 text-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent ${passenger.useContactDetail ? 'bg-gray-100' : ''
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
                                className={`flex items-center px-4 py-2.5 border rounded-lg transition-colors ${passenger.idType === docType
                                  ? 'border-[#FD7E14] bg-orange-50 text-[#FD7E14]'
                                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
                                  }`}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 ${passenger.idType === docType
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

                        {/* Multi-Segment Info */}
                        {selectedMultiSegment?.isMultiSegment && passenger.segmentId && (
                          <div className="mt-6 pt-6 border-t">
                            <div className="flex items-center mb-3">
                              <SegmentIcon />
                              <h5 className="font-medium text-gray-700 ml-2">Informasi Kereta</h5>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-lg">
                              <p className="text-sm text-blue-700">
                                Penumpang akan menggunakan <span className="font-semibold">
                                  {selectedMultiSegment.segments.find(s => s.segmentId === passenger.segmentId)?.trainName}
                                </span>
                              </p>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="text-sm text-blue-600">
                                  <span className="font-medium">Kursi:</span> {passenger.seatNumber || 'Belum dipilih'}
                                </div>
                                <div className="text-sm text-blue-600">
                                  <span className="font-medium">Gerbong:</span> {passenger.wagonNumber || '-'}
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
                  className={`mt-8 w-full py-4 text-lg font-semibold rounded-lg transition-all ${!passengerDataFilled || !agreement
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
                      className={`border rounded-xl p-5 cursor-pointer transition-all hover:border-orange-300 ${selectedPayment === method.id
                        ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-100'
                        : 'border-gray-300'
                        }`}
                      onClick={() => setSelectedPayment(method.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${selectedPayment === method.id ? 'border-orange-500 bg-orange-500' : 'border-gray-400'
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
                    className={`flex-1 bg-[#FD7E14] text-white font-semibold py-3.5 rounded-xl transition-all ${isProcessing
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Ringkasan</h2>
                <div className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {bookingStep === 1 ? 'Step 1 dari 2' : 'Step 2 dari 2'}
                </div>
              </div>

              {/* Informasi Perjalanan */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-700 mb-3">Perjalanan</h3>
                {selectedMultiSegment?.isMultiSegment ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jenis:</span>
                      <span className="font-medium text-blue-600">Dengan Transit Kereta</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jumlah Kereta:</span>
                      <span className="font-medium">{selectedMultiSegment.segments.length} kereta</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Durasi:</span>
                      <span className="font-medium">{selectedMultiSegment.totalDuration}</span>
                    </div>
                    {selectedMultiSegment.connectionTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Waktu Transit:</span>
                        <span className="font-medium">{selectedMultiSegment.connectionTime} menit</span>
                      </div>
                    )}
                  </div>
                ) : trainDetail ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jenis:</span>
                      <span className="font-medium text-green-600">Langsung</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kereta:</span>
                      <span className="font-medium">{trainDetail.trainName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Durasi:</span>
                      <span className="font-medium">{trainDetail.duration}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Informasi Penumpang */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-700 mb-3">Penumpang</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah:</span>
                    <span className="font-medium">{passengerCount} orang</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kursi dipilih:</span>
                    <span className="font-medium">{selectedSeats.length} kursi</span>
                  </div>
                  {selectedMultiSegment?.isMultiSegment && (
                    <div className="text-sm text-blue-600">
                      • Kursi dapat berbeda per kereta
                    </div>
                  )}
                </div>
              </div>

              {/* Promo Section */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-700 mb-3">Promo & Voucher</h3>
                {appliedPromo ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-green-800">{appliedPromo.name}</span>
                      <button
                        onClick={handleRemovePromo}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-sm text-green-700">{appliedPromo.promo_code}</div>
                    <div className="text-sm font-bold text-green-800 mt-1">
                      -Rp {discountAmount.toLocaleString('id-ID')}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Berlaku untuk semua kereta
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Kode promo"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm text-gray-800"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={isApplyingPromo || !promoCodeInput.trim()}
                        className={`px-3 py-2 bg-[#FD7E14] text-white rounded-lg text-sm font-medium ${isApplyingPromo || !promoCodeInput.trim()
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-[#E06700]'
                          }`}
                      >
                        {isApplyingPromo ? '...' : 'Pakai'}
                      </button>
                    </div>
                    <button
                      onClick={() => setShowPromoList(true)}
                      className="text-sm text-[#FD7E14] hover:text-[#E06700] font-medium w-full text-center"
                    >
                      Lihat promo tersedia
                    </button>
                  </div>
                )}
                {promoError && (
                  <div className="mt-2 text-sm text-red-600">
                    {promoError}
                  </div>
                )}
                {promoMessage && (
                  <div className="mt-2 text-sm text-green-600">
                    {promoMessage}
                  </div>
                )}
              </div>

              {/* Rincian Harga */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-700 mb-3">Rincian Harga</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiket {selectedMultiSegment?.isMultiSegment ? `(${selectedMultiSegment.segments.length} kereta)` : ''}:</span>
                    <span className="font-semibold">Rp {basePrice.toLocaleString('id-ID')}</span>
                  </div>

                  {seatPriceAdjustment > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tambahan kursi:</span>
                      <span className="font-semibold text-green-600">+Rp {seatPriceAdjustment.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Biaya admin:</span>
                    <span className="font-semibold">Rp {adminFee.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Asuransi:</span>
                    <span className="font-semibold">Rp {insuranceFee.toLocaleString('id-ID')}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Diskon promo:</span>
                      <span className="font-semibold text-red-600">-Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-800">Total</span>
                      <span className="text-2xl font-bold text-[#FD7E14]">
                        Rp {grandTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informasi Booking */}
              <div className="border-t pt-6">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Kode Booking</div>
                    <div className="font-mono font-bold text-gray-800 text-lg">{generatedBookingCode}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Status</div>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${bookingStep === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {bookingStep === 1 ? 'Data Penumpang' : 'Pembayaran'}
                    </div>
                  </div>
                  {selectedMultiSegment?.isMultiSegment && (
                    <div className="text-sm text-blue-600">
                      ⓘ Tiket berlaku untuk semua kereta dalam perjalanan
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
      {showPromoList && (
        <PromoListModal
          trainDetail={trainDetail}
          selectedMultiSegment={selectedMultiSegment}
          passengerCount={passengerCount}
          onClose={() => setShowPromoList(false)}
          onSelectPromo={handleSelectPromo}
        />
      )}
      {selectedSegmentForSeatMap && (
        <SegmentSeatMapModal
          segment={selectedSegmentForSeatMap}
          passengerCount={passengerCount}
          selectedSeats={selectedSeats.filter(seat => seat.segmentId === selectedSegmentForSeatMap.segmentId)}
          onSeatSelect={(seat) => handleSegmentSeatSelectWithReuse(seat, selectedSegmentForSeatMap.segmentId)}
          onSeatDeselect={handleSeatDeselect}
          onClose={() => setSelectedSegmentForSeatMap(null)}
          autoSelectEnabled={autoSelectEnabled}
          toggleAutoSelect={toggleAutoSelect}
          seatReuseConfig={getSeatReuseConfig(selectedSegmentForSeatMap.segmentId)}
        />
      )}

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