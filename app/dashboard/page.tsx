// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';

// --- Icon Components ---
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

// --- Interfaces ---
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

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  buttonText?: string;
  disabled?: boolean;
}

interface BookingCardProps {
  booking: Booking;
  showActions?: boolean;
  compact?: boolean;
}

// --- Helper Functions ---
const safeJsonParse = <T,>(jsonString: string | null, fallback: T): T => {
  if (!jsonString || jsonString.trim() === '') return fallback;
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('JSON parsing error:', error);
    return fallback;
  }
};

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage get error:', error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('localStorage set error:', error);
      return false;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage remove error:', error);
    }
  }
};

const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.warn('sessionStorage get error:', error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      sessionStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('sessionStorage set error:', error);
      return false;
    }
  },
  
  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('sessionStorage remove error:', error);
    }
  }
};

const generateAvatarUrl = (firstName: string, lastName: string) => {
  const name = `${firstName}+${lastName}`.replace(/\s+/g, '+');
  return `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff&size=150`;
};

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

const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatCoin = (coins: number): string => {
  return coins.toLocaleString('id-ID');
};

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

// --- Simple Components ---
const Avatar: React.FC<{
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  size?: number;
  className?: string;
}> = React.memo(({ 
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
          const target = e.target as HTMLImageElement;
          const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=0D8ABC&color=fff&size=${size}`;
        }}
      />
    </div>
  );
});
Avatar.displayName = 'Avatar';

const SkeletonCard: React.FC = React.memo(() => (
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
));
SkeletonCard.displayName = 'SkeletonCard';

const ErrorDisplay: React.FC<{ 
  message: string; 
  onRetry?: () => void;
  title?: string;
}> = React.memo(({ message, onRetry, title = 'Gagal Memuat' }) => (
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
));
ErrorDisplay.displayName = 'ErrorDisplay';

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}> = React.memo(({ icon, title, description, action }) => (
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
));
EmptyState.displayName = 'EmptyState';

const CoinCounter: React.FC<{ coins: number; showAnimation?: boolean }> = React.memo(({ coins, showAnimation = false }) => (
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
));
CoinCounter.displayName = 'CoinCounter';

// --- Main Dashboard Component ---
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
  
  // Refs untuk cleanup
  const isMounted = useRef<boolean>(true);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    isMounted.current = false;
    
    // Clear all timeouts
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    if (pendingRefreshIntervalRef.current) {
      clearInterval(pendingRefreshIntervalRef.current);
      pendingRefreshIntervalRef.current = null;
    }
    
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    
    // Abort fetch requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Initial load effect
  useEffect(() => {
    if (user && !loading && bookings.length === 0 && isMounted.current) {
      fetchBookings();
    }
  }, [user, loading, bookings.length]);

  // Memoized calculations
  const calculateTripCoins = useCallback((bookingsData: Booking[]): number => {
    if (!user || !bookingsData || bookingsData.length === 0) return 0;
    
    const validBookings = bookingsData.filter(booking => 
      ['paid', 'confirmed', 'completed'].includes(booking.status)
    );
    
    let totalCoins = 0;
    validBookings.forEach(booking => {
      totalCoins += Math.floor((booking.total_amount || 0) / 10000);
    });
    
    if (validBookings.length > 0) {
      totalCoins += 100;
    }
    
    totalCoins += Math.floor(validBookings.length / 5) * 50;
    
    return totalCoins;
  }, [user]);

  const generateCoinTransactions = useCallback((bookingsData: Booking[]): TripCoinTransaction[] => {
    if (!user || !bookingsData || bookingsData.length === 0) return [];
    
    const transactions: TripCoinTransaction[] = [];
    const validBookings = bookingsData.filter(booking => 
      ['paid', 'confirmed', 'completed'].includes(booking.status)
    );
    
    validBookings.forEach((booking, index) => {
      const coinsEarned = Math.floor((booking.total_amount || 0) / 10000);
      
      if (coinsEarned > 0) {
        transactions.push({
          id: `transaction-${booking.id}-${Date.now()}-${index}`,
          user_id: user.id,
          booking_id: booking.id,
          booking_code: booking.booking_code,
          amount: coinsEarned,
          description: `Pembelian tiket ${booking.train_name || 'Kereta'} ${booking.origin ? `(${booking.origin} → ${booking.destination})` : ''}`,
          transaction_type: 'earn',
          created_at: booking.booking_date
        });
      }
      
      if (index === 0) {
        transactions.push({
          id: `bonus-first-${booking.id}-${Date.now()}`,
          user_id: user.id,
          booking_id: booking.id,
          booking_code: booking.booking_code,
          amount: 100,
          description: 'Bonus pertama kali memesan tiket',
          transaction_type: 'bonus',
          created_at: booking.booking_date
        });
      }
      
      if ((index + 1) % 5 === 0) {
        transactions.push({
          id: `bonus-multiplier-${booking.id}-${Date.now()}`,
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
    
    return transactions.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [user]);

  // Update Trip Coins
  useEffect(() => {
    if (user && bookings.length > 0 && isMounted.current) {
      const newCoins = calculateTripCoins(bookings);
      const oldCoins = tripCoins;
      
      if (newCoins > oldCoins) {
        setCoinAnimation(true);
        animationTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            setCoinAnimation(false);
          }
        }, 1000);
      }
      
      setTripCoins(newCoins);
      setCoinTransactions(generateCoinTransactions(bookings));
    } else if (!user && isMounted.current) {
      setTripCoins(0);
      setCoinTransactions([]);
    }
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [bookings, user, calculateTripCoins, generateCoinTransactions, tripCoins]);

 // Fetch bookings dengan abort controller
const fetchBookings = useCallback(async (forceRefresh = false) => {
  if (!user || !isMounted.current) {
    if (isMounted.current) {
      setBookings([]);
      setLoading(false);
    }
    return;
  }
  
  // Prevent multiple simultaneous requests
  if (loading && !forceRefresh) {
    console.log('Fetch already in progress, skipping...');
    return;
  }
  
  // Abort previous request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort('New request started');
  }
  
  // Create new abort controller
  abortControllerRef.current = new AbortController();
  const signal = abortControllerRef.current.signal;
  
  try {
    setLoading(true);
    setBookingsError(null);
    
    let allBookings: Booking[] = [];
    
    // Check sessionStorage for new bookings from payment
    const paymentSuccess = safeSessionStorage.getItem('paymentSuccess');
    const newBookingData = safeSessionStorage.getItem('newBookingData');
    
    if (paymentSuccess === 'true' && newBookingData) {
      try {
        const parsedData = safeJsonParse<any>(newBookingData, {});
        
        if (parsedData && typeof parsedData === 'object') {
          const newBooking: Booking = {
            id: `temp-${Date.now()}`,
            booking_code: parsedData.bookingCode || `BOOK-${Date.now()}`,
            booking_date: parsedData.paymentDate || new Date().toISOString(),
            total_amount: parsedData.totalAmount || 0,
            status: 'paid',
            passenger_count: parsedData.passengerCount || 1,
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
          
          // Clear session storage
          safeSessionStorage.removeItem('paymentSuccess');
          safeSessionStorage.removeItem('newBookingData');
          safeSessionStorage.removeItem('newBookingCode');
        }
      } catch (error) {
        console.warn('Error processing session storage data:', error);
      }
    }
    
    // Check if we should fetch from database
    const shouldFetchFromDB = forceRefresh || allBookings.length === 0;
    
    // Helper function for retry logic
    const fetchWithRetry = async (queryFn: () => Promise<any>, maxRetries = 2): Promise<any> => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Add exponential backoff delay for retries
          if (attempt > 0) {
            const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
            console.log(`Retry attempt ${attempt} after ${delay}ms`);
          }
          
          return await queryFn();
        } catch (error: any) {
          if (error.name === 'AbortError' || attempt === maxRetries) {
            throw error;
          }
          console.warn(`Query attempt ${attempt + 1} failed:`, error.message);
        }
      }
      throw new Error('All retry attempts failed');
    };
    
    if (shouldFetchFromDB && isMounted.current) {
      try {
        // Check if signal is already aborted
        if (signal.aborted) {
          console.log('Request was aborted before query execution');
          return;
        }
        
        const email = user.email;
        
        // Create a single optimized query with proper error handling
        const executeQuery = async () => {
          // Set a longer timeout for the query itself
          const queryTimeout = 20000; // 20 seconds for database query
          
          const queryPromise = (async () => {
            try {
              // Build base query
              let query = supabase
                .from('bookings_kereta')
                .select('id, booking_code, created_at, total_amount, status, passenger_count, passenger_name, train_name, origin, destination')
                .order('created_at', { ascending: false })
                .limit(8); // Reduced limit for faster response
              
              // Add filters
              if (email) {
                // Use OR for both conditions
                query = query.or(`passenger_email.eq.${email},user_id.eq.${user.id}`);
              } else {
                query = query.eq('user_id', user.id);
              }
              
              const { data, error } = await query;
              
              if (error) {
                throw error;
              }
              
              return data || [];
            } catch (error: any) {
              console.error('Supabase query error:', error);
              throw error;
            }
          })();
          
          // Race between query and timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Database query timeout')), queryTimeout);
          });
          
          return Promise.race([queryPromise, timeoutPromise]) as Promise<any[]>;
        };
        
        // Execute query with retry logic
        const dbBookings = await fetchWithRetry(executeQuery);
        
        if (!Array.isArray(dbBookings)) {
          console.error('Invalid response from database:', dbBookings);
          throw new Error('Invalid response format from database');
        }
        
        // Process and deduplicate bookings
        const uniqueDbBookings = Array.from(
          new Map(dbBookings.map(item => [item.booking_code, item])).values()
        );
        
        const processedDbBookings = uniqueDbBookings.map((booking): Booking => ({
          id: booking.id || `db-${booking.booking_code}`,
          booking_code: booking.booking_code,
          booking_date: booking.created_at || new Date().toISOString(),
          total_amount: booking.total_amount || 0,
          status: (booking.status || 'pending').toLowerCase() as Booking['status'],
          passenger_count: booking.passenger_count || 1,
          passenger_name: booking.passenger_name,
          train_name: booking.train_name,
          origin: booking.origin,
          destination: booking.destination
        }));
        
        // Merge with existing bookings
        const existingCodes = new Set(allBookings.map(b => b.booking_code));
        const uniqueDbBookingsFiltered = processedDbBookings.filter(b => 
          !existingCodes.has(b.booking_code)
        );
        
        allBookings = [...allBookings, ...uniqueDbBookingsFiltered];
        
      } catch (dbError: any) {
        if (dbError.name === 'AbortError') {
          console.log('Database fetch was aborted');
          return;
        }
        
        console.error('Database query failed:', dbError);
        
        // Don't throw error here, continue with cached data
      }
    }
    
    // Load from cache if we don't have enough data
    if (allBookings.length === 0) {
      const savedBookings = safeLocalStorage.getItem('myBookings');
      if (savedBookings) {
        try {
          const cacheData = safeJsonParse<{bookings: Booking[], timestamp: number}>(savedBookings, {bookings: [], timestamp: 0});
          if (Array.isArray(cacheData.bookings) && cacheData.bookings.length > 0) {
            // Check cache age (5 minutes)
            const cacheAge = Date.now() - cacheData.timestamp;
            if (cacheAge < 5 * 60 * 1000) {
              allBookings = [...cacheData.bookings];
              console.log('Using cached bookings:', allBookings.length);
            } else {
              console.log('Cache expired, not using');
            }
          }
        } catch (error) {
          console.warn('Error parsing cache:', error);
        }
      }
    }
    
    // Filter out invalid bookings
    const validBookings = allBookings.filter(booking => {
      // Skip manual pending bookings with zero amount
      if (booking.id?.startsWith('manual-') && booking.status === 'pending' && booking.total_amount === 0) {
        return false;
      }
      return true;
    });
    
    // Deduplicate and sort
    const uniqueBookings = Array.from(
      new Map(validBookings.map(item => [item.booking_code, item])).values()
    )
    .sort((a, b) => 
      new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
    )
    .slice(0, 15); // Limit to 15 bookings for performance
    
    // Update state if component is still mounted
    if (isMounted.current) {
      setBookings(uniqueBookings);
      
      // Cache to localStorage
      try {
        const cacheData = {
          bookings: uniqueBookings,
          timestamp: Date.now(),
          version: '1.0'
        };
        safeLocalStorage.setItem('myBookings', JSON.stringify(cacheData));
      } catch (error) {
        console.warn('Failed to cache bookings:', error);
      }
    }
    
  } catch (mainError: any) {
    if (mainError.name === 'AbortError') {
      console.log('Request was aborted');
      return;
    }
    
    console.error('Error loading bookings:', mainError);
    
    if (isMounted.current) {
      let errorMessage = 'Gagal memuat data pesanan';
      
      if (mainError.message === 'Request timeout' || mainError.message === 'Database query timeout') {
        errorMessage = 'Waktu permintaan habis. Coba refresh halaman atau periksa koneksi internet Anda.';
      } else if (mainError?.code === '42P01') {
        errorMessage = 'Sistem pesanan sedang dalam maintenance';
      } else if (mainError?.message?.includes('network') || mainError?.message?.includes('fetch') || mainError?.message?.includes('Failed to fetch')) {
        errorMessage = 'Koneksi internet bermasalah. Pastikan Anda terhubung ke internet.';
      } else if (mainError?.message?.includes('jwt')) {
        errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
        // Clear auth data if JWT is invalid
        safeLocalStorage.removeItem('myBookings');
      } else if (mainError?.message?.includes('invalid') || mainError?.message?.includes('Invalid')) {
        errorMessage = 'Data tidak valid diterima dari server.';
      } else {
        errorMessage = mainError?.message || 'Terjadi kesalahan tidak terduga. Silakan coba lagi.';
      }
      
      setBookingsError(errorMessage);
      
      // Fallback to cache even on error
      const savedBookings = safeLocalStorage.getItem('myBookings');
      if (savedBookings) {
        try {
          const cacheData = safeJsonParse<{bookings: Booking[], timestamp: number}>(savedBookings, {bookings: [], timestamp: 0});
          if (Array.isArray(cacheData.bookings)) {
            setBookings(cacheData.bookings.slice(0, 10));
          }
        } catch (error) {
          console.warn('Error loading from cache:', error);
        }
      }
    }
  } finally {
    if (isMounted.current) {
      setLoading(false);
      // Clear abort controller reference
      abortControllerRef.current = null;
    }
  }
}, [user, loading]);

  // Memoized filtered bookings
  const { activeBookings, historyBookings, paidBookings, pendingBookings } = useMemo(() => {
    const active = bookings.filter(booking => 
      ['pending', 'waiting_payment', 'confirmed', 'paid', 'active'].includes(booking.status)
    );
    
    const history = bookings.filter(booking => 
      ['cancelled', 'failed', 'expired'].includes(booking.status)
    );
    
    const paid = bookings.filter(booking => 
      booking.payment_status === 'paid' || booking.status === 'paid' || booking.status === 'confirmed'
    );
    
    const pending = bookings.filter(booking => 
      booking.status === 'pending' || booking.status === 'waiting_payment' || booking.payment_status === 'pending'
    );
    
    return { activeBookings: active, historyBookings: history, paidBookings: paid, pendingBookings: pending };
  }, [bookings]);

  const recentCoinTransactions = useMemo(() => {
    return coinTransactions.slice(0, 3);
  }, [coinTransactions]);

  // Handle refresh
const handleRefresh = useCallback(async () => {
  if (refreshing || !user || !isMounted.current) return;
  
  setRefreshing(true);
  try {
    // Clear cache before refresh
    safeLocalStorage.removeItem('myBookings');
    await fetchBookings(true);
  } catch (error) {
    console.error('Refresh error:', error);
  } finally {
    // Always stop refreshing after 2 seconds max
    const timeout = setTimeout(() => {
      if (isMounted.current) {
        setRefreshing(false);
      }
    }, 2000);
    
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = timeout;
  }
}, [refreshing, user, fetchBookings]);

  // Setup auto-refresh hanya untuk pending bookings
  useEffect(() => {
    if (!user?.id || !isMounted.current) {
      return;
    }
    
    const hasPendingBookings = bookings.some(b => 
      b.status === 'pending' || b.status === 'waiting_payment' || b.payment_status === 'pending'
    );
    
    if (hasPendingBookings) {
      if (pendingRefreshIntervalRef.current) {
        clearInterval(pendingRefreshIntervalRef.current);
      }
      
      pendingRefreshIntervalRef.current = setInterval(() => {
        if (isMounted.current && !loading) {
          fetchBookings();
        }
      }, 30000); // 30 detik
    } else {
      if (pendingRefreshIntervalRef.current) {
        clearInterval(pendingRefreshIntervalRef.current);
        pendingRefreshIntervalRef.current = null;
      }
    }
    
    return () => {
      if (pendingRefreshIntervalRef.current) {
        clearInterval(pendingRefreshIntervalRef.current);
        pendingRefreshIntervalRef.current = null;
      }
    };
  }, [user?.id, bookings, loading, fetchBookings]);

  // Event handlers
  // Dalam DashboardPage component, perbaiki handleLogout
const handleLogout = useCallback(async () => {
  try {
    console.log('[Dashboard] Starting logout process...');
    
    // Call signOut from AuthContext
    if (signOut) {
      await signOut();
      console.log('[Dashboard] AuthContext signOut completed');
    }
    
    // Clear all localStorage data
    console.log('[Dashboard] Clearing localStorage...');
    safeLocalStorage.removeItem('myBookings');
    safeLocalStorage.removeItem('userProfile');
    safeLocalStorage.removeItem('tripCoins');
    
    // Clear sessionStorage
    console.log('[Dashboard] Clearing sessionStorage...');
    safeSessionStorage.removeItem('paymentSuccess');
    safeSessionStorage.removeItem('newBookingData');
    safeSessionStorage.removeItem('newBookingCode');
    
    // Clear all cookies related to Supabase
    console.log('[Dashboard] Clearing Supabase cookies...');
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      'supabase-auth-token',
      'supabase-refresh-token'
    ];
    
    cookieNames.forEach(cookieName => {
      try {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      } catch (error) {
        console.warn(`Failed to clear cookie ${cookieName}:`, error);
      }
    });
    
    // Cleanup before redirect
    cleanup();
    
    console.log('[Dashboard] Redirecting to login page...');
    
    // Force redirect with replace to prevent going back
    window.location.href = '/auth/login';
    
  } catch (error) {
    console.error('[Dashboard] Logout error:', error);
    
    // Fallback: try to redirect anyway
    try {
      window.location.href = '/auth/login';
    } catch (fallbackError) {
      console.error('[Dashboard] Fallback redirect failed:', fallbackError);
      alert('Logout gagal. Silakan refresh halaman dan coba lagi.');
    }
  }
}, [signOut, cleanup, router]);

  const handleLogin = useCallback(() => {
    router.push('/auth/login');
  }, [router]);

  const handleSignUp = useCallback(() => {
    router.push('/auth/register');
  }, [router]);

  const handleViewBookingDetails = useCallback((bookingId: string) => {
    router.push(`/booking/detail/${bookingId}`);
  }, [router]);

  const handleDownloadTicket = useCallback((booking: Booking) => {
    console.log('Download ticket for booking:', booking.booking_code);
    alert(`Tiket untuk booking ${booking.booking_code} sedang diproses...`);
  }, []);

  const handleViewCoinHistory = useCallback(() => {
    if (!user) {
      alert('Silakan login untuk melihat riwayat coin');
      return;
    }
    // Navigate to coin history page
    router.push('/dashboard/coin-history');
  }, [user, router]);

  const handleViewMyBookings = useCallback(() => {
    if (!user) {
      alert('Silakan login untuk melihat booking');
      return;
    }
    router.push('/my-bookings');
  }, [user, router]);

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

  // Memoized stats
  const stats = useMemo(() => {
    if (!user) {
      return [
        {
          title: 'Total Pesanan',
          value: '0',
          subtitle: 'Login untuk melihat',
          icon: <TicketIcon />,
          color: 'blue' as const
        },
        {
          title: 'Pesanan Aktif',
          value: '0',
          subtitle: 'Belum ada pesanan',
          icon: <TrainIcon />,
          color: 'green' as const
        },
        {
          title: 'Trip Coins',
          value: '0',
          subtitle: 'Login untuk mendapatkan coin',
          icon: <CoinIcon />,
          color: 'yellow' as const
        },
        {
          title: 'Pembayaran Lunas',
          value: '0',
          subtitle: 'Login untuk melihat',
          icon: <CheckCircleIcon />,
          color: 'purple' as const
        }
      ];
    }
    
    return [
      {
        title: 'Total Pesanan',
        value: bookings.length.toString(),
        subtitle: 'Semua waktu',
        icon: <TicketIcon />,
        color: 'blue' as const
      },
      {
        title: 'Pesanan Aktif',
        value: activeBookings.length.toString(),
        subtitle: `${pendingBookings.length} menunggu`,
        icon: <TrainIcon />,
        color: 'green' as const
      },
      {
        title: 'Trip Coins',
        value: formatCoin(tripCoins),
        subtitle: `${coinTransactions.length} transaksi`,
        icon: <CoinIcon />,
        color: 'yellow' as const
      },
      {
        title: 'Pembayaran Lunas',
        value: paidBookings.length.toString(),
        subtitle: 'Pembayaran berhasil',
        icon: <CheckCircleIcon />,
        color: 'purple' as const
      }
    ];
  }, [user, bookings.length, activeBookings.length, pendingBookings.length, tripCoins, coinTransactions.length, paidBookings.length]);

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

  // Booking Card Component
  const BookingCard = React.memo(function BookingCard({ 
    booking, 
    showActions = true,
    compact = false 
  }: BookingCardProps) {
    const statusConfig = getBookingStatusConfig(booking.status || booking.payment_status || 'pending');
    
    const handleViewDetails = useCallback(() => {
      handleViewBookingDetails(booking.id);
    }, [booking.id, handleViewBookingDetails]);
    
    const handleDownload = useCallback(() => {
      handleDownloadTicket(booking);
    }, [booking, handleDownloadTicket]);
    
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

        {booking.passenger_name && !compact && (
          <div className="mb-3">
            <p className="text-gray-600 text-sm mb-1">Penumpang:</p>
            <div className="px-3 py-1.5 bg-gray-100 rounded-lg inline-block">
              <p className="text-sm font-medium text-gray-800 truncate">{booking.passenger_name}</p>
              <p className="text-xs text-gray-500">{booking.passenger_count} orang</p>
            </div>
          </div>
        )}

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

        {showActions && (
          <div className="flex justify-between items-center pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 truncate flex-1 min-w-0">
              <p className="truncate">{formatDate(booking.booking_date)}</p>
            </div>
            <div className="flex gap-2 ml-3 shrink-0">
              <button
                onClick={handleViewDetails}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
              >
                Detail
              </button>
              {(booking.status === 'paid' || booking.status === 'confirmed' || booking.payment_status === 'paid') && (
                <button
                  onClick={handleDownload}
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
  });

  // StatCard Component
  const StatCard = React.memo(function StatCard({
    title,
    value,
    icon,
    color,
    subtitle
  }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }) {
    return (
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
  });

  // Quick Action Card
  const QuickActionCard = React.memo(function QuickActionCard({
    title,
    description,
    icon,
    color,
    onClick,
    buttonText = 'Akses',
    disabled = false
  }: QuickActionCardProps) {
    const handleClick = useCallback(() => {
      if (!disabled) onClick();
    }, [disabled, onClick]);
    
    return (
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
          onClick={handleClick}
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
  });

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