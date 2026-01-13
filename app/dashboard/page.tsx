// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';

// --- Icon Components (Updated with better accessibility) ---
const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const TrainIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CoinIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TicketIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ReceiptIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// --- Helper Functions ---
const generateAvatarUrl = (firstName: string, lastName: string) => {
  const name = `${firstName}+${lastName}`.replace(/\s+/g, '+');
  return `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff&size=150`;
};

// Format date helper
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Tanggal tidak tersedia';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return dateString;
  }
};

// Format time helper
const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return '--:--';
  
  if (timeString.includes(':')) {
    const parts = timeString.split(':');
    return `${parts[0]?.padStart(2, '0')}:${parts[1]?.padStart(2, '0')}`;
  }
  
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString;
    
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.warn('Time formatting error:', error);
    return timeString;
  }
};

// Format currency helper
const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Format coin helper
const formatCoin = (coins: number): string => {
  return coins.toLocaleString('id-ID');
};

// Booking status mapping
const getBookingStatusConfig = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  
  switch (statusLower) {
    case 'confirmed':
    case 'paid':
    case 'completed':
      return {
        label: 'Dikonfirmasi',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircleIcon />
      };
    case 'pending':
    case 'waiting_payment':
      return {
        label: 'Menunggu Pembayaran',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <ClockIcon />
      };
    case 'active':
      return {
        label: 'Aktif',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <CheckCircleIcon />
      };
    case 'cancelled':
    case 'failed':
      return {
        label: 'Dibatalkan',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircleIcon />
      };
    case 'expired':
      return {
        label: 'Kadaluarsa',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <ClockIcon />
      };
    default:
      return {
        label: status || 'Unknown',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: null
      };
  }
};

// --- Interface untuk Booking ---
interface Booking {
  id: string;
  booking_code: string;
  booking_date: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'expired' | 'confirmed' | 'waiting_payment' | 'active';
  passenger_count: number;
  order_id?: string;
  passenger_name?: string;
  passenger_email?: string;
  passenger_phone?: string;
  train_name?: string;
  train_type?: string;
  origin?: string;
  destination?: string;
  departure_date?: string;
  departure_time?: string;
  arrival_time?: string;
  payment_status?: string;
  payment_method?: string;
  payment_date?: string;
}

// --- Interface untuk Trip Coin ---
interface TripCoinTransaction {
  id: string;
  user_id: string;
  booking_id: string;
  booking_code: string;
  amount: number;
  description: string;
  transaction_type: 'earn' | 'redeem' | 'bonus';
  created_at: string;
}

// --- Simple Components ---
interface AvatarProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  size?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  firstName, 
  lastName, 
  avatarUrl, 
  size = 42, 
  className = "" 
}) => {
  const avatarSrc = avatarUrl || generateAvatarUrl(firstName, lastName);
  
  return (
    <div className={`relative ${className}`}>
      <img
        src={avatarSrc}
        alt={`${firstName} ${lastName}`}
        width={size}
        height={size}
        className="rounded-full border-2 border-blue-500 object-cover"
        loading="lazy"
        onError={(e) => {
          // Fallback ke placeholder jika gambar gagal load
          const target = e.target as HTMLImageElement;
          const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=0D8ABC&color=fff&size=${size}`;
        }}
      />
    </div>
  );
};

// Skeleton Loading Component
const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
    </div>
    <div className="h-3 bg-gray-200 rounded mb-3"></div>
    <div className="h-8 bg-gray-200 rounded mb-4"></div>
    <div className="flex justify-between">
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
    </div>
  </div>
);

// Error Display Component
const ErrorDisplay: React.FC<{ 
  message: string; 
  onRetry?: () => void;
  title?: string;
}> = ({ message, onRetry, title = 'Gagal Memuat' }) => (
  <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6 text-center">
    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-500 mb-4 text-sm">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
      >
        Coba Lagi
      </button>
    )}
  </div>
);

// Empty State Component
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}> = ({ icon, title, description, action }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-500 mb-6 text-sm sm:text-base">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
      >
        {action.icon}
        <span>{action.label}</span>
      </button>
    )}
  </div>
);

// Animated Coin Counter Component
const CoinCounter: React.FC<{ coins: number; showAnimation?: boolean }> = ({ coins, showAnimation = false }) => (
  <div className="relative inline-flex items-center">
    <div className={`flex items-center space-x-2 ${showAnimation ? 'animate-bounce' : ''}`}>
      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center">
        <CoinIcon />
      </div>
      <div className="text-left">
        <div className="text-xl sm:text-2xl font-bold text-yellow-600">
          {formatCoin(coins)}
          <span className="text-sm font-normal ml-1">coins</span>
        </div>
      </div>
    </div>
    {showAnimation && (
      <div className="absolute -top-2 -right-2">
        <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
      </div>
    )}
  </div>
);

// --- Dashboard Page (Optimized) ---
export default function DashboardPage() {
  const router = useRouter();
  const { user, userProfile, signOut, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [tripCoins, setTripCoins] = useState<number>(0);
  const [coinAnimation, setCoinAnimation] = useState<boolean>(false);
  const [coinTransactions, setCoinTransactions] = useState<TripCoinTransaction[]>([]);
  
  const notifications = useRef<number>(3);
  const isMounted = useRef<boolean>(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  // Fungsi untuk menghitung Trip Coins dari bookings
  const calculateTripCoins = useCallback((bookingsData: Booking[]): number => {
    if (!user || !bookingsData || bookingsData.length === 0) return 0;
    
    const validBookings = bookingsData.filter(booking => 
      ['paid', 'confirmed', 'completed'].includes(booking.status)
    );
    
    // Hitung coin: 1 coin per Rp 10,000 total_amount (bulatkan ke bawah)
    let totalCoins = 0;
    validBookings.forEach(booking => {
      const coinsFromBooking = Math.floor((booking.total_amount || 0) / 10000);
      totalCoins += coinsFromBooking;
    });
    
    // Bonus 100 coins untuk first booking
    if (validBookings.length > 0) {
      totalCoins += 100;
    }
    
    // Bonus 50 coins untuk setiap 5 booking
    const bookingMultiplierBonus = Math.floor(validBookings.length / 5) * 50;
    totalCoins += bookingMultiplierBonus;
    
    return totalCoins;
  }, [user]);

  // Fungsi untuk generate transaksi coin dari bookings
  const generateCoinTransactions = useCallback((bookingsData: Booking[]): TripCoinTransaction[] => {
    if (!user || !bookingsData || bookingsData.length === 0) return [];
    
    const transactions: TripCoinTransaction[] = [];
    const validBookings = bookingsData.filter(booking => 
      ['paid', 'confirmed', 'completed'].includes(booking.status)
    );
    
    // Generate transaction untuk setiap booking
    validBookings.forEach((booking, index) => {
      const coinsEarned = Math.floor((booking.total_amount || 0) / 10000);
      
      // Transaksi untuk booking
      if (coinsEarned > 0) {
        transactions.push({
          id: `transaction-${booking.id}`,
          user_id: user.id,
          booking_id: booking.id,
          booking_code: booking.booking_code,
          amount: coinsEarned,
          description: `Pembelian tiket ${booking.train_name || 'Kereta'} ${booking.origin ? `(${booking.origin} → ${booking.destination})` : ''}`,
          transaction_type: 'earn',
          created_at: booking.booking_date
        });
      }
      
      // Bonus first booking
      if (index === 0) {
        transactions.push({
          id: `bonus-first-${booking.id}`,
          user_id: user.id,
          booking_id: booking.id,
          booking_code: booking.booking_code,
          amount: 100,
          description: 'Bonus pertama kali memesan tiket',
          transaction_type: 'bonus',
          created_at: booking.booking_date
        });
      }
      
      // Bonus setiap 5 booking
      if ((index + 1) % 5 === 0) {
        transactions.push({
          id: `bonus-multiplier-${booking.id}`,
          user_id: user.id,
          booking_id: booking.id,
          booking_code: booking.booking_code,
          amount: 50,
          description: 'Bonus loyalitas setiap 5 pesanan',
          transaction_type: 'bonus',
          created_at: booking.booking_date
        });
      }
    });
    
    // Sort by date descending
    return transactions.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Initial load effect
  useEffect(() => {
    if (user && !loading && bookings.length === 0) {
      fetchBookings();
    }
  }, [user, loading, bookings.length]);

  // Update Trip Coins ketika bookings berubah
  useEffect(() => {
    if (user && bookings.length > 0) {
      const newCoins = calculateTripCoins(bookings);
      const oldCoins = tripCoins;
      
      if (newCoins > oldCoins) {
        // Trigger coin animation jika coins bertambah
        setCoinAnimation(true);
        setTimeout(() => setCoinAnimation(false), 1000);
      }
      
      setTripCoins(newCoins);
      setCoinTransactions(generateCoinTransactions(bookings));
    } else if (!user) {
      // Reset untuk guest
      setTripCoins(0);
      setCoinTransactions([]);
    }
  }, [bookings, user, calculateTripCoins, generateCoinTransactions]);

  // Optimized fetch bookings
  const fetchBookings = useCallback(async (forceRefresh = false) => {
    if (!user || !isMounted.current) {
      setBookings([]);
      setLoading(false);
      return;
    }
    
    // Skip jika sudah loading
    if (loading && !forceRefresh) return;
    
    try {
      setLoading(true);
      setBookingsError(null);
      
      console.log('🔄 Fetching bookings for dashboard:', user.email || user.id);
      
      let allBookings: Booking[] = [];
      
      // Check sessionStorage for new bookings from payment
      try {
        const paymentSuccess = sessionStorage.getItem('paymentSuccess');
        const newBookingData = sessionStorage.getItem('newBookingData');
        
        if (paymentSuccess === 'true' && newBookingData) {
          console.log('🎯 Found new booking from payment success');
          const parsedData = JSON.parse(newBookingData);
          
          const newBooking: Booking = {
            id: `temp-${Date.now()}`,
            booking_code: parsedData.bookingCode || `BOOK-${Date.now()}`,
            booking_date: parsedData.paymentDate || new Date().toISOString(),
            total_amount: parsedData.totalAmount || 0,
            status: 'paid',
            passenger_count: 1,
            order_id: parsedData.orderId,
            passenger_name: parsedData.passengerName,
            passenger_email: parsedData.passengerEmail,
            passenger_phone: parsedData.passengerPhone,
            train_name: parsedData.trainName || 'Kereta Api',
            train_type: parsedData.trainType,
            origin: parsedData.origin,
            destination: parsedData.destination,
            departure_date: parsedData.departureDate,
            departure_time: parsedData.departureTime,
            payment_status: 'paid',
            payment_method: parsedData.paymentMethod,
            payment_date: parsedData.paymentDate
          };
          
          allBookings.push(newBooking);
          
          // Clear sessionStorage
          sessionStorage.removeItem('paymentSuccess');
          sessionStorage.removeItem('newBookingData');
          sessionStorage.removeItem('newBookingCode');
        }
      } catch (sessionError) {
        console.warn('⚠️ Session storage error:', sessionError);
      }
      
      // Try database fetch if forceRefresh or no cache
      const shouldFetchFromDB = forceRefresh || allBookings.length === 0;
      
      if (shouldFetchFromDB) {
        console.log('📡 Querying Supabase for bookings...');
        
        try {
          const email = user.email;
          let dbBookings: any[] = [];
          
          // Query by email
          if (email) {
            const { data: bookingsByEmail, error: emailError } = await supabase
              .from('bookings_kereta')
              .select('*')
              .eq('passenger_email', email)
              .order('created_at', { ascending: false })
              .limit(20);
              
            if (emailError) {
              console.warn('⚠️ Error fetching by email:', emailError);
            } else if (bookingsByEmail) {
              console.log(`✅ Found ${bookingsByEmail.length} bookings by email`);
              dbBookings = [...dbBookings, ...bookingsByEmail];
            }
          }
          
          // Query by user_id
          const { data: bookingsByUserId, error: userIdError } = await supabase
            .from('bookings_kereta')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);
            
          if (userIdError) {
            console.warn('⚠️ Error fetching by user_id:', userIdError);
          } else if (bookingsByUserId) {
            console.log(`✅ Found ${bookingsByUserId.length} bookings by user_id`);
            dbBookings = [...dbBookings, ...bookingsByUserId];
          }
          
          // Remove duplicates
          const uniqueDbBookings = Array.from(
            new Map(dbBookings.map(item => [item.booking_code, item])).values()
          );
          
          console.log(`📊 Total unique DB bookings: ${uniqueDbBookings.length}`);
          
          const processedDbBookings = uniqueDbBookings.map((booking): Booking => ({
            id: booking.id || `db-${booking.booking_code}`,
            booking_code: booking.booking_code,
            booking_date: booking.created_at || booking.booking_date || new Date().toISOString(),
            total_amount: booking.total_amount || 0,
            status: (booking.status || 'pending').toLowerCase() as Booking['status'],
            passenger_count: booking.passenger_count || 1,
            order_id: booking.order_id,
            passenger_name: booking.passenger_name,
            passenger_email: booking.passenger_email,
            passenger_phone: booking.passenger_phone,
            train_name: booking.train_name,
            train_type: booking.train_type,
            origin: booking.origin,
            destination: booking.destination,
            departure_date: booking.departure_date,
            departure_time: booking.departure_time,
            arrival_time: booking.arrival_time,
            payment_status: booking.payment_status,
            payment_method: booking.payment_method,
            payment_date: booking.payment_date
          }));
          
          const existingCodes = allBookings.map(b => b.booking_code);
          const uniqueDbBookingsFiltered = processedDbBookings.filter(b => 
            !existingCodes.includes(b.booking_code)
          );
          
          allBookings = [...allBookings, ...uniqueDbBookingsFiltered];
        } catch (dbError: any) {
          console.error('❌ Database query failed:', dbError);
        }
      } else {
        // Load from localStorage cache
        try {
          const savedBookings = localStorage.getItem('myBookings');
          if (savedBookings) {
            const parsedBookings = JSON.parse(savedBookings);
            if (Array.isArray(parsedBookings) && parsedBookings.length > 0) {
              console.log('📂 Loaded from localStorage:', parsedBookings.length);
              
              const existingCodes = allBookings.map(b => b.booking_code);
              const uniqueBookingsFromLocal = parsedBookings.filter((b: Booking) => 
                !existingCodes.includes(b.booking_code)
              );
              
              allBookings = [...allBookings, ...uniqueBookingsFromLocal];
            }
          }
        } catch (localStorageError) {
          console.warn('⚠️ localStorage error:', localStorageError);
        }
      }
      
      // Filter out placeholder bookings
      const validBookings = allBookings.filter(booking => {
        if (booking.id?.startsWith('manual-') && booking.status === 'pending' && booking.total_amount === 0) {
          return false;
        }
        return true;
      });
      
      // Remove duplicates and sort by date
      const uniqueBookings = Array.from(
        new Map(validBookings.map(item => [item.booking_code, item])).values()
      ).sort((a, b) => 
        new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
      );
      
      console.log(`🎉 Total valid bookings: ${uniqueBookings.length}`);
      
      if (isMounted.current) {
        setBookings(uniqueBookings);
        
        // Cache to localStorage
        try {
          localStorage.setItem('myBookings', JSON.stringify(uniqueBookings));
          console.log('💾 Saved to localStorage');
        } catch (storageError) {
          console.warn('⚠️ Failed to save to localStorage:', storageError);
        }
      }
      
    } catch (mainError: any) {
      console.error('❌ Error loading bookings:', mainError);
      
      if (isMounted.current) {
        let errorMessage = 'Gagal memuat data pesanan';
        if (mainError?.code === '42P01') {
          errorMessage = 'Sistem pesanan sedang dalam maintenance';
        } else if (mainError?.message?.includes('network') || mainError?.message?.includes('fetch')) {
          errorMessage = 'Koneksi internet bermasalah';
        } else {
          errorMessage = mainError?.message || 'Terjadi kesalahan tidak terduga';
        }
        
        setBookingsError(errorMessage);
        
        // Fallback to localStorage
        try {
          const savedBookings = localStorage.getItem('myBookings');
          if (savedBookings) {
            const parsedBookings = JSON.parse(savedBookings);
            if (Array.isArray(parsedBookings) && parsedBookings.length > 0) {
              setBookings(parsedBookings);
              setBookingsError(null); // Clear error jika fallback berhasil
            }
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [user, loading]);

  // Filter bookings for different categories
  const activeBookings = useMemo(() => {
    return bookings.filter(booking => 
      ['pending', 'waiting_payment', 'confirmed', 'paid', 'active'].includes(booking.status)
    );
  }, [bookings]);

  const historyBookings = useMemo(() => {
    return bookings.filter(booking => 
      ['cancelled', 'failed', 'expired'].includes(booking.status)
    );
  }, [bookings]);

  const paidBookings = useMemo(() => {
    return bookings.filter(booking => 
      booking.payment_status === 'paid' || booking.status === 'paid' || booking.status === 'confirmed'
    );
  }, [bookings]);

  const pendingBookings = useMemo(() => {
    return bookings.filter(booking => 
      booking.status === 'pending' || booking.status === 'waiting_payment' || booking.payment_status === 'pending'
    );
  }, [bookings]);

  // Filter coin transactions (hanya 5 terbaru)
  const recentCoinTransactions = useMemo(() => {
    return coinTransactions.slice(0, 5);
  }, [coinTransactions]);

  // Debounced refresh
  const handleRefresh = useCallback(async () => {
    if (refreshing || !user) return;
    
    setRefreshing(true);
    try {
      await fetchBookings(true);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      refreshTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          setRefreshing(false);
        }
      }, 1000);
    }
  }, [refreshing, user, fetchBookings]);

  // Setup auto-refresh for pending bookings
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      const hasPendingBookings = bookings.some(b => 
        b.status === 'pending' || b.status === 'waiting_payment' || b.payment_status === 'pending'
      );
      
      if (hasPendingBookings) {
        console.log('🔄 Auto-refreshing for pending bookings');
        fetchBookings();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [user?.id, bookings, fetchBookings]);

  // Event listener untuk update dari payment success
  useEffect(() => {
    const handleBookingUpdated = (event: CustomEvent) => {
      console.log('📢 Booking update event received:', event.detail);
      fetchBookings(true);
    };

    window.addEventListener('bookingUpdated', handleBookingUpdated as EventListener);
    
    return () => {
      window.removeEventListener('bookingUpdated', handleBookingUpdated as EventListener);
    };
  }, [fetchBookings]);

  // Handle navigation functions
  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  }, [signOut, router]);

  const handleLogin = useCallback(() => {
    router.push('/auth/login');
  }, [router]);

  const handleSignUp = useCallback(() => {
    router.push('/auth/register');
  }, [router]);

  const handleViewCoinHistory = useCallback(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    // Arahkan ke tab khusus atau modal untuk melihat history coin
    alert('Fitur riwayat coin akan tersedia segera!');
  }, [router, user]);

  const handleViewBookingDetails = useCallback((bookingId: string) => {
    router.push(`/booking/detail/${bookingId}`);
  }, [router]);

  const handleViewMyBookings = useCallback(() => {
    router.push('/my-bookings');
  }, [router]);

  const handleDownloadTicket = useCallback((booking: Booking) => {
    console.log('Download ticket for booking:', booking.booking_code);
    alert(`Tiket untuk booking ${booking.booking_code} sedang diproses...`);
  }, []);

  // Memoized user data
  const userData = useMemo(() => {
    if (user) {
      return {
        firstName: userProfile?.first_name || 
                  user?.user_metadata?.first_name || 
                  user?.email?.split('@')[0] || 
                  'User',
        lastName: userProfile?.last_name || 
                 user?.user_metadata?.last_name || 
                 '',
        avatarUrl: userProfile?.avatar_url || 
                  user?.user_metadata?.avatar_url,
        email: user?.email || '',
        phone: userProfile?.phone || 
              user?.user_metadata?.phone || 
              '-',
      };
    } else {
      return {
        firstName: 'Guest',
        lastName: 'User',
        avatarUrl: '',
        email: 'guest@example.com',
        phone: '-',
      };
    }
  }, [user, userProfile]);

  // Memoized stats - REVISED: Menghapus wallet dan menambahkan Trip Coins
  const stats = useMemo(() => {
    const baseStats = [
      {
        title: 'Total Pesanan',
        value: user ? bookings.length.toString() : '0',
        subtitle: user ? 'Semua waktu' : 'Login untuk melihat',
        icon: <TicketIcon />,
        color: 'blue' as const
      },
      {
        title: 'Pesanan Aktif',
        value: user ? activeBookings.length.toString() : '0',
        subtitle: user ? `${pendingBookings.length} menunggu` : 'Belum ada pesanan',
        icon: <TrainIcon />,
        color: 'green' as const
      },
      {
        title: 'Trip Coins',
        value: user ? formatCoin(tripCoins) : '0',
        subtitle: user ? `${coinTransactions.length} transaksi` : 'Login untuk mendapatkan coin',
        icon: <CoinIcon />,
        color: 'yellow' as const
      },
      {
        title: 'Pembayaran Lunas',
        value: user ? paidBookings.length.toString() : '0',
        subtitle: user ? 'Pembayaran berhasil' : 'Login untuk melihat',
        icon: <CheckCircleIcon />,
        color: 'purple' as const
      }
    ];

    return baseStats;
  }, [user, bookings, activeBookings, pendingBookings, tripCoins, coinTransactions, paidBookings]);

  // StatCard Component
  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
          color === 'blue' ? 'bg-blue-100 text-blue-600' :
          color === 'green' ? 'bg-green-100 text-green-600' :
          color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
          color === 'purple' ? 'bg-purple-100 text-purple-600' :
          'bg-orange-100 text-orange-600'
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 text-sm truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  // Booking Card Component
  interface BookingCardProps {
    booking: Booking;
    showActions?: boolean;
    compact?: boolean;
  }

  const BookingCard: React.FC<BookingCardProps> = ({ 
    booking, 
    showActions = true,
    compact = false 
  }) => {
    const statusConfig = getBookingStatusConfig(booking.status || booking.payment_status || 'pending');
    
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow ${compact ? 'mb-3' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h4 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                {booking.train_name || 'Kereta Api'} {booking.train_type ? `(${booking.train_type})` : ''}
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color} flex items-center gap-1 shrink-0`}>
                {statusConfig.icon}
                <span className="truncate">{statusConfig.label}</span>
              </span>
            </div>
            <p className="text-gray-500 text-xs sm:text-sm truncate">#{booking.booking_code}</p>
          </div>
          <div className="text-right ml-2 shrink-0">
            <p className="font-bold text-orange-600 text-base sm:text-lg">
              {formatCurrency(booking.total_amount)}
            </p>
            <p className="text-gray-400 text-xs">{formatDate(booking.booking_date)}</p>
          </div>
        </div>

        {/* Route Information */}
        {(booking.origin || booking.destination) && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {booking.origin || 'Kota Asal'} → {booking.destination || 'Kota Tujuan'}
                </p>
                <p className="text-gray-600 text-xs">
                  {booking.departure_date && formatDate(booking.departure_date)}
                </p>
              </div>
              {(booking.departure_time || booking.arrival_time) && (
                <div className="text-right ml-2 shrink-0">
                  <p className="text-sm font-medium text-gray-800 whitespace-nowrap">
                    {formatTime(booking.departure_time)} - {formatTime(booking.arrival_time)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Passenger Info */}
        {booking.passenger_name && !compact && (
          <div className="mb-3">
            <p className="text-gray-600 text-sm mb-1">Penumpang:</p>
            <div className="px-3 py-1.5 bg-gray-100 rounded-lg inline-block">
              <p className="text-sm font-medium text-gray-800 truncate">{booking.passenger_name}</p>
              <p className="text-xs text-gray-500">{booking.passenger_count} orang</p>
            </div>
          </div>
        )}

        {/* Coin Earned Badge */}
        {['paid', 'confirmed', 'completed'].includes(booking.status) && booking.total_amount > 0 && (
          <div className="mb-3">
            <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
              <CoinIcon />
              <span className="text-sm font-medium text-yellow-700">
                +{Math.floor(booking.total_amount / 10000)} Trip Coins
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 truncate flex-1 min-w-0">
              <p className="truncate">{formatDate(booking.booking_date)}</p>
            </div>
            <div className="flex gap-2 ml-3 shrink-0">
              <button
                onClick={() => handleViewBookingDetails(booking.id)}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
              >
                Detail
              </button>
              {(booking.status === 'paid' || booking.status === 'confirmed' || booking.payment_status === 'paid') && (
                <button
                  onClick={() => handleDownloadTicket(booking)}
                  className="px-3 py-1.5 text-xs sm:text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <DownloadIcon />
                  <span className="hidden sm:inline">Tiket</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Quick Action Card
  interface QuickActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
    buttonText?: string;
    disabled?: boolean;
  }

  const QuickActionCard: React.FC<QuickActionCardProps> = ({
    title,
    description,
    icon,
    color,
    onClick,
    buttonText = 'Akses',
    disabled = false
  }) => (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-start mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 shrink-0 ${
          color === 'blue' ? 'bg-blue-100 text-blue-600' :
          color === 'green' ? 'bg-green-100 text-green-600' :
          color === 'orange' ? 'bg-orange-100 text-orange-600' :
          'bg-purple-100 text-purple-600'
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-800 truncate">{title}</h4>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full mt-3 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
          disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'text-white bg-blue-600 hover:bg-blue-700'
        }`}
      >
        <span>{buttonText}</span>
        <ArrowRightIcon />
      </button>
    </div>
  );

  // Navigation tabs
  const navTabs = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: <UserIcon />, disabled: false },
    { id: 'mybooking', label: 'My Booking', icon: <CalendarIcon />, disabled: !user },
    { id: 'history', label: 'History', icon: <HistoryIcon />, disabled: !user },
    { id: 'bookings', label: 'Semua Pesanan', icon: <TrainIcon />, disabled: !user },
    { id: 'profile', label: 'Pengaturan', icon: <SettingsIcon />, disabled: false },
  ], [user]);

  // Loading state
  if (authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setActiveTab('overview')}
              className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
              aria-label="TripGo Dashboard"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">T</span>
              </div>
              <span className="font-bold text-xl sm:text-2xl text-gray-800 hidden sm:block">TripGo</span>
            </button>
            
            <div className="flex items-center space-x-3">
              {/* Trip Coins Display in Header */}
              {user && (
                <div className="hidden sm:block">
                  <button 
                    onClick={handleViewCoinHistory}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <CoinCounter coins={tripCoins} showAnimation={coinAnimation} />
                  </button>
                </div>
              )}
              
              {user ? (
                <>
                  <button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`p-1.5 sm:p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      refreshing ? 'animate-spin text-blue-600' : 'text-gray-600 hover:text-blue-600'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="Refresh data"
                    title="Refresh data"
                  >
                    <RefreshIcon />
                  </button>
                  <div className="flex items-center space-x-2">
                    <Avatar 
                      firstName={userData.firstName}
                      lastName={userData.lastName}
                      avatarUrl={userData.avatarUrl}
                      size={36}
                    />
                    <div className="hidden sm:block text-left">
                      <p className="font-semibold text-gray-800 text-sm truncate max-w-[120px]">
                        {userData.firstName}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleLogin}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-gray-700 hover:text-blue-600 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Masuk
                  </button>
                  <button 
                    onClick={handleSignUp}
                    className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Daftar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 sticky top-20">
              <div className="text-center mb-4 sm:mb-6 pb-4 border-b border-gray-200">
                <Avatar 
                  firstName={userData.firstName}
                  lastName={userData.lastName}
                  avatarUrl={userData.avatarUrl}
                  size={60}
                  className="border-2 border-blue-100 mx-auto mb-3"
                />
                <h3 className="font-bold text-gray-800 truncate">{userData.firstName} {userData.lastName}</h3>
                <p className="text-gray-500 text-sm truncate">{userData.email}</p>
                
                {/* Trip Coins Display in Sidebar */}
                {user && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col items-center">
                      <CoinCounter coins={tripCoins} showAnimation={coinAnimation} />
                      <button 
                        onClick={handleViewCoinHistory}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Lihat riwayat coin
                      </button>
                    </div>
                  </div>
                )}
                
                {!user && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-yellow-700 text-xs">
                      <strong>Mode Guest:</strong> Login untuk akses penuh
                    </p>
                  </div>
                )}
              </div>

              <nav className="space-y-1">
                {navTabs.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && setActiveTab(item.id)}
                    disabled={item.disabled}
                    className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                      activeTab === item.id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                    } ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                    aria-current={activeTab === item.id ? 'page' : undefined}
                  >
                    {item.icon}
                    <span className="font-medium text-sm sm:text-base flex-1">{item.label}</span>
                    <ChevronRightIcon className={`transition-transform ${
                      activeTab === item.id ? 'translate-x-0' : '-translate-x-1 opacity-0'
                    }`} />
                  </button>
                ))}
                
                <hr className="my-2 border-gray-200"/>
                
                {user ? (
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 sm:space-x-3 px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogoutIcon />
                    <span className="font-medium text-sm sm:text-base">Keluar</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleLogin}
                    className="w-full flex items-center space-x-2 sm:space-x-3 px-3 py-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <UserIcon />
                    <span className="font-medium text-sm sm:text-base">Login</span>
                  </button>
                )}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                    {user ? `Halo, ${userData.firstName}!` : 'Selamat Datang di TripGo!'}
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {new Date().toLocaleDateString('id-ID', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {stats.map((stat, index) => (
                    <StatCard
                      key={index}
                      title={stat.title}
                      value={stat.value}
                      subtitle={stat.subtitle}
                      icon={stat.icon}
                      color={stat.color}
                    />
                  ))}
                </div>

                {/* Recent Bookings Section */}
                {user && bookings.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-800 text-lg">Pesanan Terbaru</h3>
                      <button
                        onClick={handleViewMyBookings}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        Lihat semua
                        <ArrowRightIcon />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {bookings.slice(0, 3).map(booking => (
                        <BookingCard key={booking.id} booking={booking} showActions={true} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Coin Transactions */}
                {user && recentCoinTransactions.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-gray-800 text-lg">Trip Coins Terbaru</h3>
                      <button
                        onClick={handleViewCoinHistory}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      >
                        Riwayat lengkap
                        <ArrowRightIcon />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {recentCoinTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm truncate">{transaction.description}</p>
                            <p className="text-gray-500 text-xs truncate">
                              {formatDate(transaction.created_at)} • #{transaction.booking_code}
                            </p>
                          </div>
                          <div className={`ml-2 shrink-0 flex items-center gap-1 ${
                            transaction.transaction_type === 'earn' ? 'text-green-600' : 
                            transaction.transaction_type === 'bonus' ? 'text-purple-600' : 
                            'text-red-600'
                          }`}>
                            <span className="text-sm font-semibold">
                              {transaction.transaction_type === 'redeem' ? '-' : '+'}{transaction.amount}
                            </span>
                            <CoinIcon />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuickActionCard
                      title="Cari & Pesan Kereta"
                      description="Temukan dan pesan tiket kereta dengan mudah, dapatkan Trip Coins!"
                      icon={<TrainIcon />}
                      color="blue"
                      onClick={() => router.push('/search/trains')}
                      buttonText="Pesan Sekarang"
                    />
                    {user ? (
                      <>
                        <QuickActionCard
                          title="Lihat Semua Booking"
                          description="Kelola semua pesanan dan tiket Anda"
                          icon={<CalendarIcon />}
                          color="green"
                          onClick={handleViewMyBookings}
                          buttonText="Lihat Booking"
                        />
                        <QuickActionCard
                          title="Info Trip Coins"
                          description="Lihat cara mendapatkan dan menggunakan Trip Coins"
                          icon={<CoinIcon />}
                          color="yellow"
                          onClick={handleViewCoinHistory}
                          buttonText="Info Coins"
                        />
                        <QuickActionCard
                          title="Pengaturan Akun"
                          description="Kelola profil dan preferensi Anda"
                          icon={<SettingsIcon />}
                          color="purple"
                          onClick={() => setActiveTab('profile')}
                          buttonText="Pengaturan"
                        />
                      </>
                    ) : (
                      <QuickActionCard
                        title="Login atau Daftar"
                        description="Akses penuh fitur TripGo dengan akun Anda"
                        icon={<UserIcon />}
                        color="green"
                        onClick={handleLogin}
                        buttonText="Login/Daftar"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* My Booking Tab */}
            {activeTab === 'mybooking' && (
              <div>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Booking</h1>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{activeBookings.length} pesanan aktif</span>
                    {pendingBookings.length > 0 && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        {pendingBookings.length} menunggu
                      </span>
                    )}
                  </div>
                </div>
                
                {!user ? (
                  <EmptyState
                    icon={<UserIcon />}
                    title="Login Diperlukan"
                    description="Login untuk melihat booking aktif Anda."
                    action={{
                      label: "Login Sekarang",
                      onClick: handleLogin,
                      icon: <ArrowRightIcon />
                    }}
                  />
                ) : loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : bookingsError ? (
                  <ErrorDisplay 
                    message={bookingsError}
                    onRetry={() => fetchBookings(true)}
                  />
                ) : activeBookings.length > 0 ? (
                  <div className="space-y-4">
                    {activeBookings.map(booking => (
                      <BookingCard key={booking.id} booking={booking} showActions={true} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<CalendarIcon />}
                    title="Belum Ada Booking Aktif"
                    description="Mulai petualangan Anda dengan memesan tiket kereta dan dapatkan Trip Coins!"
                    action={{
                      label: "Cari & Pesan Kereta",
                      onClick: () => router.push('/search/trains'),
                      icon: <TrainIcon />
                    }}
                  />
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">History</h1>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{historyBookings.length} riwayat pesanan</span>
                  </div>
                </div>
                
                {!user ? (
                  <EmptyState
                    icon={<UserIcon />}
                    title="Login Diperlukan"
                    description="Login untuk melihat riwayat pesanan Anda."
                    action={{
                      label: "Login Sekarang",
                      onClick: handleLogin,
                      icon: <ArrowRightIcon />
                    }}
                  />
                ) : loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : bookingsError ? (
                  <ErrorDisplay 
                    message={bookingsError}
                    onRetry={() => fetchBookings(true)}
                  />
                ) : historyBookings.length > 0 ? (
                  <div className="space-y-4">
                    {historyBookings.map(booking => (
                      <BookingCard key={booking.id} booking={booking} showActions={true} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<HistoryIcon />}
                    title="Belum Ada Riwayat"
                    description="Anda belum memiliki riwayat pesanan."
                    action={{
                      label: "Cari Kereta",
                      onClick: () => router.push('/search/trains'),
                      icon: <TrainIcon />
                    }}
                  />
                )}
              </div>
            )}

            {/* All Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Semua Pesanan</h1>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{bookings.length} total pesanan</span>
                  </div>
                </div>
                
                {!user ? (
                  <EmptyState
                    icon={<UserIcon />}
                    title="Login Diperlukan"
                    description="Login untuk melihat semua pesanan kereta Anda."
                    action={{
                      label: "Login Sekarang",
                      onClick: handleLogin,
                      icon: <ArrowRightIcon />
                    }}
                  />
                ) : loading ? (
                  <div className="space-y-4">
                    {[1, 2].map(i => (
                      <SkeletonCard key={i} />
                    ))}
                  </div>
                ) : bookingsError ? (
                  <ErrorDisplay 
                    message={bookingsError}
                    onRetry={() => fetchBookings(true)}
                  />
                ) : bookings.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button 
                        onClick={() => setActiveTab('mybooking')}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Aktif: {activeBookings.length}
                      </button>
                      <button 
                        onClick={() => setActiveTab('history')}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        Riwayat: {historyBookings.length}
                      </button>
                      <button 
                        onClick={() => router.push('/my-bookings')}
                        className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-1"
                      >
                        Lihat Detail
                        <ArrowRightIcon />
                      </button>
                    </div>
                    {bookings.map(booking => (
                      <BookingCard key={booking.id} booking={booking} showActions={true} />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<TrainIcon />}
                    title="Belum Ada Pesanan"
                    description="Mulai petualangan Anda dengan memesan tiket kereta pertama dan dapatkan Trip Coins!"
                    action={{
                      label: "Cari Kereta",
                      onClick: () => router.push('/search/trains'),
                      icon: <TrainIcon />
                    }}
                  />
                )}
              </div>
            )}

            {/* Profile Settings Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Pengaturan Akun</h1>
                
                {!user ? (
                  <EmptyState
                    icon={<SettingsIcon />}
                    title="Kelola Akun"
                    description="Login untuk mengatur profil dan pengaturan akun TripGo."
                    action={{
                      label: "Login Sekarang",
                      onClick: handleLogin,
                      icon: <ArrowRightIcon />
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Profile Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                      <div className="flex items-center space-x-4 mb-6">
                        <Avatar 
                          firstName={userData.firstName}
                          lastName={userData.lastName}
                          avatarUrl={userData.avatarUrl}
                          size={60}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">{userData.firstName} {userData.lastName}</h3>
                          <p className="text-gray-500 text-sm truncate">{userData.email}</p>
                          <div className="mt-2">
                            <CoinCounter coins={tripCoins} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input 
                            type="email" 
                            defaultValue={userData.email} 
                            disabled 
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 focus:outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
                          <input 
                            type="tel" 
                            defaultValue={userData.phone} 
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" 
                            placeholder="Masukkan nomor telepon"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    </div>

                    {/* Trip Coins Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                      <h3 className="font-semibold text-gray-800 mb-4">Info Trip Coins</h3>
                      <div className="space-y-4">
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CoinIcon />
                            <h4 className="font-semibold text-yellow-800">Cara Mendapatkan Trip Coins:</h4>
                          </div>
                          <ul className="space-y-2 text-sm text-yellow-700">
                            <li className="flex items-start gap-2">
                              <span className="font-medium">•</span>
                              <span>1 coin per Rp 10,000 dari total pembelian tiket</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-medium">•</span>
                              <span>Bonus 100 coins untuk pembelian pertama</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-medium">•</span>
                              <span>Bonus 50 coins setiap 5 pesanan berhasil</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CoinIcon />
                            <h4 className="font-semibold text-blue-800">Manfaat Trip Coins:</h4>
                          </div>
                          <ul className="space-y-2 text-sm text-blue-700">
                            <li className="flex items-start gap-2">
                              <span className="font-medium">•</span>
                              <span>Dapat ditukar dengan diskon pembelian tiket</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-medium">•</span>
                              <span>Tingkatkan level keanggotaan</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-medium">•</span>
                              <span>Fitur eksklusif akan segera hadir!</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Account Actions Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                      <h3 className="font-semibold text-gray-800 mb-4">Aksi Akun</h3>
                      <div className="space-y-3">
                        <button
                          onClick={handleRefresh}
                          disabled={refreshing}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={refreshing ? 'animate-spin' : ''}>
                              <RefreshIcon />
                            </div>
                            <span>Refresh Data</span>
                          </div>
                          <span className="text-gray-400">↻</span>
                        </button>
                        <button
                          onClick={() => router.push('/privacy-policy')}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          <div className="flex items-center space-x-3">
                            <ReceiptIcon />
                            <span>Kebijakan Privasi</span>
                          </div>
                          <span className="text-gray-400">→</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-between p-3 text-left text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <div className="flex items-center space-x-3">
                            <LogoutIcon />
                            <span>Keluar Akun</span>
                          </div>
                          <span className="text-red-400">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">T</span>
                </div>
                <span className="font-bold text-xl text-gray-800">TripGo</span>
              </div>
              <p className="text-gray-500 text-sm mt-2">Platform pemesanan tiket kereta terpercaya</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/terms" className="text-gray-600 hover:text-blue-600 text-sm">
                Syarat & Ketentuan
              </Link>
              <Link href="/privacy-policy" className="text-gray-600 hover:text-blue-600 text-sm">
                Kebijakan Privasi
              </Link>
              <Link href="/help" className="text-gray-600 hover:text-blue-600 text-sm">
                Bantuan
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-blue-600 text-sm">
                Kontak
              </Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} TripGo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}