// app/dashboard/page.tsx
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWallet } from '@/app/contexts/WalletContext';
import { supabase } from '@/app/lib/supabaseClient';

// --- Icon Components (Simplified) ---
const UserIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const TrainIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const WalletIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const StarIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;
const HistoryIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TicketIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
const RefreshIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const CalendarIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ClockIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckCircleIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DownloadIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const ReceiptIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const CreditCardIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const ArrowRightIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;

// --- Helper Functions ---
const generateAvatarUrl = (firstName: string, lastName: string) => {
  const name = `${firstName}+${lastName}`.replace(/\s+/g, '+');
  return `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff&size=150`;
};

// Format date helper
const formatDate = (dateString: string | undefined) => {
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
    return dateString;
  }
};

// Format time helper
const formatTime = (timeString: string | undefined) => {
  if (!timeString) return '--:--';
  if (timeString.includes(':')) {
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
  }
  try {
    const date = new Date(timeString);
    if (isNaN(date.getTime())) return timeString;
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return timeString;
  }
};

// Format currency helper
const formatCurrency = (amount: number | undefined) => {
  if (!amount && amount !== 0) return 'Rp0';
  return `Rp${amount.toLocaleString('id-ID')}`;
};

// Booking status mapping
const getBookingStatusConfig = (status: string) => {
  switch (status?.toLowerCase()) {
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

// --- Simple Components ---
const Avatar = ({ firstName, lastName, avatarUrl, size = 42, className = "" }: { 
  firstName: string; 
  lastName: string; 
  avatarUrl?: string; 
  size?: number;
  className?: string;
}) => {
  const avatarSrc = avatarUrl || generateAvatarUrl(firstName, lastName);
  
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarSrc}
      alt={`${firstName} ${lastName}`}
      width={size}
      height={size}
      className={`rounded-full border-2 border-blue-500 ${className}`}
      loading="lazy"
    />
  );
};

// --- Dashboard Page (Optimized) ---
export default function DashboardPage() {
    const router = useRouter();
    const { user, userProfile, signOut, loading: authLoading } = useAuth();
    const { 
        formatBalance,
        refreshWallet
    } = useWallet();
    
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [bookingsError, setBookingsError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    
    // Use refs for values that don't need re-renders
    const points = useRef(1250);
    const notifications = useRef(3);
    const isMounted = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Optimized fetch dari berbagai sumber (mirip dengan my-bookings)
    const fetchBookings = useCallback(async () => {
        if (!user || !isMounted.current) {
            setBookings([]);
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            setBookingsError(null);
            
            console.log('🔄 Fetching bookings for dashboard:', user.email || user.id);
            
            let allBookings: Booking[] = [];
            
            // 1. Cek sessionStorage untuk booking baru dari payment
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
            
            // 2. Coba dari localStorage
            try {
                const savedBookings = localStorage.getItem('myBookings');
                if (savedBookings) {
                    const parsedBookings = JSON.parse(savedBookings);
                    if (Array.isArray(parsedBookings) && parsedBookings.length > 0) {
                        console.log('📂 Loaded from localStorage:', parsedBookings.length);
                        
                        const existingCodes = allBookings.map(b => b.booking_code);
                        const uniqueBookingsFromLocal = parsedBookings.filter((b: any) => 
                            !existingCodes.includes(b.booking_code)
                        );
                        
                        allBookings = [...allBookings, ...uniqueBookingsFromLocal];
                    }
                }
            } catch (localStorageError) {
                console.warn('⚠️ localStorage error:', localStorageError);
            }
            
            // 3. Coba dari database (Supabase) - bookings_kereta
            try {
                console.log('📡 Querying Supabase for bookings...');
                
                const email = user.email;
                let dbBookings: any[] = [];
                
                if (email) {
                    const { data: bookingsByEmail, error: emailError } = await supabase
                        .from('bookings_kereta')
                        .select('*')
                        .eq('passenger_email', email)
                        .order('created_at', { ascending: false })
                        .limit(20);
                        
                    if (!emailError && bookingsByEmail && bookingsByEmail.length > 0) {
                        console.log(`✅ Found ${bookingsByEmail.length} bookings by email`);
                        dbBookings = [...dbBookings, ...bookingsByEmail];
                    }
                }
                
                const { data: bookingsByUserId, error: userIdError } = await supabase
                    .from('bookings_kereta')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(20);
                    
                if (!userIdError && bookingsByUserId && bookingsByUserId.length > 0) {
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
                console.warn('⚠️ Database query failed:', dbError.message);
            }
            
            // Remove empty manual bookings (placeholder)
            const validBookings = allBookings.filter(booking => {
                if (booking.id?.startsWith('manual-') && booking.status === 'pending' && booking.total_amount === 0) {
                    return false;
                }
                return true;
            });
            
            const uniqueBookings = Array.from(
                new Map(validBookings.map(item => [item.booking_code, item])).values()
            );
            
            // Sort by date (newest first)
            uniqueBookings.sort((a, b) => 
                new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
            );
            
            console.log(`🎉 Total valid bookings: ${uniqueBookings.length}`);
            
            if (isMounted.current) {
                setBookings(uniqueBookings);
            }
            
            // Simpan ke localStorage untuk cache
            try {
                localStorage.setItem('myBookings', JSON.stringify(uniqueBookings));
                console.log('💾 Saved to localStorage');
            } catch (storageError) {
                console.warn('⚠️ Failed to save to localStorage:', storageError);
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
                setBookings([]);
                
                // Fallback ke localStorage
                try {
                    const savedBookings = localStorage.getItem('myBookings');
                    if (savedBookings) {
                        const parsedBookings = JSON.parse(savedBookings);
                        if (Array.isArray(parsedBookings) && parsedBookings.length > 0) {
                            setBookings(parsedBookings);
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
    }, [user]);

    // Filter bookings untuk My Booking (active bookings)
    const activeBookings = useMemo(() => {
        return bookings.filter(booking => 
            ['pending', 'waiting_payment', 'confirmed', 'paid', 'active'].includes(booking.status)
        );
    }, [bookings]);

    // Filter bookings untuk History (completed/cancelled)
    const historyBookings = useMemo(() => {
        return bookings.filter(booking => 
            ['cancelled', 'failed', 'expired'].includes(booking.status)
        );
    }, [bookings]);

    // Filter bookings untuk Paid/Confirmed
    const paidBookings = useMemo(() => {
        return bookings.filter(booking => 
            booking.payment_status === 'paid' || booking.status === 'paid' || booking.status === 'confirmed'
        );
    }, [bookings]);

    // Filter bookings untuk Pending
    const pendingBookings = useMemo(() => {
        return bookings.filter(booking => 
            booking.status === 'pending' || booking.status === 'waiting_payment' || booking.payment_status === 'pending'
        );
    }, [bookings]);

    // Debounced refresh
    const handleRefresh = useCallback(async () => {
        if (refreshing || !user) return;
        
        setRefreshing(true);
        try {
            await Promise.all([
                fetchBookings(),
                refreshWallet()
            ]);
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            setTimeout(() => {
                if (isMounted.current) {
                    setRefreshing(false);
                }
            }, 1000);
        }
    }, [refreshing, user, fetchBookings, refreshWallet]);

    // Setup realtime subscription
    useEffect(() => {
        if (!user?.id) return;

        // Set interval untuk auto-refresh jika ada booking pending
        const interval = setInterval(() => {
            const hasPendingBookings = bookings.some(b => 
                b.status === 'pending' || b.status === 'waiting_payment' || b.payment_status === 'pending'
            );
            
            if (hasPendingBookings) {
                console.log('🔄 Auto-refreshing for pending bookings');
                fetchBookings();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [user?.id, bookings, fetchBookings]);

    // Event listener untuk update dari payment success
    useEffect(() => {
        const handleBookingUpdated = (event: CustomEvent) => {
            console.log('📢 Booking update event received in dashboard:', event.detail);
            fetchBookings();
        };

        window.addEventListener('bookingUpdated', handleBookingUpdated as EventListener);
        
        return () => {
            window.removeEventListener('bookingUpdated', handleBookingUpdated as EventListener);
        };
    }, [fetchBookings]);

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/');
        } catch (error) {
            console.error('❌ Error during logout:', error);
        }
    };

    const handleLogin = () => {
        router.push('/auth/login');
    };

    const handleSignUp = () => {
        router.push('/auth/register');
    };

    const handleTopUp = () => {
        if (!user) {
            router.push('/auth/login');
            return;
        }
        router.push('/payment/topup');
    };

    const handleViewBookingDetails = (bookingId: string) => {
        router.push(`/booking/detail/${bookingId}`);
    };

    const handleViewMyBookings = () => {
        router.push('/my-bookings');
    };

    const handleDownloadTicket = (booking: Booking) => {
        // Implement ticket download logic
        console.log('Download ticket for booking:', booking.booking_code);
        alert(`Tiket untuk booking ${booking.booking_code} sedang diproses...`);
    };

    // User data memoized
    const userData = useMemo(() => {
        if (user) {
            return {
                firstName: userProfile?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User',
                lastName: userProfile?.last_name || user?.user_metadata?.last_name || '',
                avatarUrl: userProfile?.avatar_url || user?.user_metadata?.avatar_url,
                email: user?.email || '',
                phone: userProfile?.phone || user?.user_metadata?.phone || '-',
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

    // Stats memoized
    const stats = useMemo(() => {
        return [
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
                title: 'Trip Points',
                value: points.current.toLocaleString('id-ID'),
                subtitle: user ? 'Poin terkumpul' : 'Login untuk mendapatkan',
                icon: <StarIcon />,
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
    }, [user, bookings, activeBookings, pendingBookings, paidBookings]);

    // Simplified StatCard
    const StatCard = ({ title, value, icon, color, subtitle }: { 
        title: string; 
        value: string; 
        icon: React.ReactNode; 
        color: string; 
        subtitle?: string 
    }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 sm:space-x-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
                    color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    color === 'green' ? 'bg-green-100 text-green-600' :
                    color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-purple-100 text-purple-600'
                }`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <p className="text-gray-500 text-sm">{title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
                </div>
            </div>
        </div>
    );

    // Booking Card Component yang disederhanakan
    const BookingCard = ({ booking, showActions = true }: { 
        booking: Booking; 
        showActions?: boolean 
    }) => {
        const statusConfig = getBookingStatusConfig(booking.status || booking.payment_status || 'pending');
        
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                                {booking.train_name || 'Kereta Api'} {booking.train_type ? `(${booking.train_type})` : ''}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.color} flex items-center gap-1`}>
                                {statusConfig.icon}
                                <span className="truncate">{statusConfig.label}</span>
                            </span>
                        </div>
                        <p className="text-gray-500 text-xs sm:text-sm">#{booking.booking_code}</p>
                    </div>
                    <div className="text-right ml-2">
                        <p className="font-bold text-orange-600 text-base sm:text-lg">
                            {formatCurrency(booking.total_amount)}
                        </p>
                        <p className="text-gray-400 text-xs">{formatDate(booking.booking_date)}</p>
                    </div>
                </div>
                

                {/* Route Information */}
                {(booking.origin || booking.destination) && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800 text-sm truncate">
                                    {booking.origin || 'Kota Asal'} → {booking.destination || 'Kota Tujuan'}
                                </p>
                                <p className="text-gray-600 text-xs">
                                    {booking.departure_date && formatDate(booking.departure_date)}
                                </p>
                            </div>
                            {(booking.departure_time || booking.arrival_time) && (
                                <div className="text-right ml-2">
                                    <p className="text-sm font-medium text-gray-800">
                                        {formatTime(booking.departure_time)} - {formatTime(booking.arrival_time)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Passenger Info */}
                {booking.passenger_name && (
                    <div className="mb-3">
                        <p className="text-gray-600 text-sm mb-1">Penumpang:</p>
                        <div className="px-3 py-1.5 bg-gray-100 rounded-lg inline-block">
                            <p className="text-sm font-medium text-gray-800">{booking.passenger_name}</p>
                            <p className="text-xs text-gray-500">{booking.passenger_count} orang</p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {showActions && (
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                            <p className="truncate">{formatDate(booking.booking_date)}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleViewBookingDetails(booking.id)}
                                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                                Detail
                            </button>
                            {(booking.status === 'paid' || booking.status === 'confirmed' || booking.payment_status === 'paid') && (
                                <button
                                    onClick={() => handleDownloadTicket(booking)}
                                    className="px-3 py-1.5 text-xs sm:text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1"
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
    const QuickActionCard = ({ 
        title, 
        description, 
        icon, 
        color, 
        onClick,
        buttonText = 'Akses'
    }: { 
        title: string; 
        description: string; 
        icon: React.ReactNode; 
        color: string;
        onClick: () => void;
        buttonText?: string;
    }) => (
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                    color === 'blue' ? 'bg-blue-100 text-blue-600' :
                    color === 'green' ? 'bg-green-100 text-green-600' :
                    color === 'orange' ? 'bg-orange-100 text-orange-600' :
                    'bg-purple-100 text-purple-600'
                }`}>
                    {icon}
                </div>
                <div>
                    <h4 className="font-semibold text-gray-800">{title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{description}</p>
                </div>
            </div>
            <button
                onClick={onClick}
                className="w-full mt-3 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
                <span>{buttonText}</span>
                <ArrowRightIcon />
            </button>
        </div>
    );

    // Tampilkan loading state minimal
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
            {/* Simplified Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
                <div className="container mx-auto px-4 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                        <button 
                            onClick={() => activeTab !== 'overview' && setActiveTab('overview')}
                            className="flex items-center space-x-2 focus:outline-none"
                        >
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm sm:text-lg">T</span>
                            </div>
                            <span className="font-bold text-xl sm:text-2xl text-gray-800 hidden sm:block">TripGo</span>
                        </button>
                        
                        <div className="flex items-center space-x-3">
                            {user ? (
                                <>
                                    <button 
                                        onClick={handleRefresh}
                                        disabled={refreshing}
                                        className={`p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 ${refreshing ? 'animate-spin' : ''}`}
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
                                        className="px-3 py-1.5 sm:px-4 sm:py-2 text-gray-700 hover:text-blue-600 text-sm"
                                    >
                                        Masuk
                                    </button>
                                    <button 
                                        onClick={handleSignUp}
                                        className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm"
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
                    {/* Updated Sidebar */}
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
                                
                                {!user && (
                                    <div className="mt-3 p-2 bg-yellow-50 rounded border border-yellow-200">
                                        <p className="text-yellow-700 text-xs">
                                            <strong>Mode Guest:</strong> Login untuk akses penuh
                                        </p>
                                    </div>
                                )}
                            </div>

                            <nav className="space-y-1">
                                {[
                                    { id: 'overview', label: 'Overview', icon: <UserIcon /> },
                                    { id: 'mybooking', label: 'My Booking', icon: <CalendarIcon /> },
                                    { id: 'history', label: 'History', icon: <HistoryIcon /> },
                                    { id: 'bookings', label: 'Semua Pesanan', icon: <TrainIcon /> },
                                    // { id: 'wallet', label: 'Dompet', icon: <WalletIcon /> },
                                    { id: 'profile', label: 'Pengaturan', icon: <SettingsIcon /> },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        disabled={!user && (item.id !== 'overview')}
                                        className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                                            activeTab === item.id 
                                                ? 'bg-blue-50 text-blue-600' 
                                                : 'text-gray-600 hover:bg-gray-50'
                                        } ${!user && (item.id !== 'overview') ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {item.icon}
                                        <span className="font-medium text-sm sm:text-base">{item.label}</span>
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
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
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

                                {/* Quick Actions */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                                    <h3 className="font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <QuickActionCard
                                            title="Cari & Pesan Kereta"
                                            description="Temukan dan pesan tiket kereta dengan mudah"
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
                                                {/* <QuickActionCard
                                                    title="Top Up Saldo"
                                                    description="Isi saldo untuk pembayaran yang lebih mudah"
                                                    icon={<CreditCardIcon />}
                                                    color="orange"
                                                    onClick={handleTopUp}
                                                    buttonText="Top Up"
                                                /> */}
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

                        {/* My Booking Tab - Active Bookings */}
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
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <UserIcon />
                                        </div>
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">Login Diperlukan</h2>
                                        <p className="text-gray-600 mb-6 text-sm sm:text-base">
                                            Login untuk melihat booking aktif Anda.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <button 
                                                onClick={handleLogin}
                                                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                            >
                                                Login Sekarang
                                            </button>
                                            <button 
                                                onClick={handleSignUp}
                                                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                            >
                                                Daftar
                                            </button>
                                        </div>
                                    </div>
                                ) : loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                                                <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
                                                <div className="h-4 w-1/2 bg-gray-200 rounded mb-3"></div>
                                                <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : bookingsError ? (
                                    <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 sm:p-6 text-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Gagal Memuat</h3>
                                        <p className="text-gray-500 mb-4 text-sm">{bookingsError}</p>
                                        <button 
                                            onClick={fetchBookings}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            Coba Lagi
                                        </button>
                                    </div>
                                ) : activeBookings.length > 0 ? (
                                    <div className="space-y-4">
                                        {activeBookings.map(booking => (
                                            <BookingCard key={booking.id} booking={booking} showActions={true} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CalendarIcon />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">Belum Ada Booking Aktif</h3>
                                        <p className="text-gray-500 mb-6 text-sm sm:text-base">
                                            Mulai petualangan Anda dengan memesan tiket kereta!
                                        </p>
                                        <Link 
                                            href="/search/trains"
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                                        >
                                            <TrainIcon />
                                            <span>Cari & Pesan Kereta</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* History Tab - Completed/Cancelled Bookings */}
                        {activeTab === 'history' && (
                            <div>
                                <div className="flex justify-between items-center mb-4 sm:mb-6">
                                    <h1 className="text-xl sm:text-2xl font-bold text-gray-800">History</h1>
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">{historyBookings.length} riwayat pesanan</span>
                                    </div>
                                </div>
                                
                                {!user ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <UserIcon />
                                        </div>
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">Login Diperlukan</h2>
                                        <p className="text-gray-600 mb-6 text-sm sm:text-base">
                                            Login untuk melihat riwayat pesanan Anda.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <button 
                                                onClick={handleLogin}
                                                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                            >
                                                Login Sekarang
                                            </button>
                                            <button 
                                                onClick={handleSignUp}
                                                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                            >
                                                Daftar
                                            </button>
                                        </div>
                                    </div>
                                ) : loading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                                                <div className="h-6 w-3/4 bg-gray-200 rounded mb-4"></div>
                                                <div className="h-4 w-1/2 bg-gray-200 rounded mb-3"></div>
                                                <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : bookingsError ? (
                                    <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 sm:p-6 text-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Gagal Memuat</h3>
                                        <p className="text-gray-500 mb-4 text-sm">{bookingsError}</p>
                                        <button 
                                            onClick={fetchBookings}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            Coba Lagi
                                        </button>
                                    </div>
                                ) : historyBookings.length > 0 ? (
                                    <div className="space-y-4">
                                        {historyBookings.map(booking => (
                                            <BookingCard key={booking.id} booking={booking} showActions={true} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <HistoryIcon />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">Belum Ada Riwayat</h3>
                                        <p className="text-gray-500 mb-6 text-sm sm:text-base">
                                            Anda belum memiliki riwayat pesanan.
                                        </p>
                                        <Link 
                                            href="/search/trains"
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                                        >
                                            <TrainIcon />
                                            <span>Cari Kereta</span>
                                        </Link>
                                    </div>
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
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <UserIcon />
                                        </div>
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">Login Diperlukan</h2>
                                        <p className="text-gray-600 mb-6 text-sm sm:text-base">
                                            Login untuk melihat semua pesanan kereta Anda.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                            <button 
                                                onClick={handleLogin}
                                                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                            >
                                                Login Sekarang
                                            </button>
                                            <button 
                                                onClick={handleSignUp}
                                                className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                            >
                                                Daftar
                                            </button>
                                        </div>
                                    </div>
                                ) : loading ? (
                                    <div className="space-y-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                                                <div className="h-4 w-3/4 bg-gray-200 rounded mb-3"></div>
                                                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : bookingsError ? (
                                    <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4 sm:p-6 text-center">
                                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                            </svg>
                                        </div>
                                        <h3 className="font-semibold text-gray-800 mb-2">Gagal Memuat</h3>
                                        <p className="text-gray-500 mb-4 text-sm">{bookingsError}</p>
                                        <button 
                                            onClick={fetchBookings}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            Coba Lagi
                                        </button>
                                    </div>
                                ) : bookings.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <button 
                                                onClick={() => setActiveTab('mybooking')}
                                                className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200 transition-colors"
                                            >
                                                Aktif: {activeBookings.length}
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('history')}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                Riwayat: {historyBookings.length}
                                            </button>
                                            <button 
                                                onClick={() => router.push('/my-bookings')}
                                                className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 transition-colors flex items-center gap-1"
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
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <TrainIcon />
                                        </div>
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">Belum Ada Pesanan</h3>
                                        <p className="text-gray-500 mb-6 text-sm sm:text-base">
                                            Mulai petualangan Anda dengan memesan tiket kereta pertama!
                                        </p>
                                        <Link 
                                            href="/search/trains"
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
                                        >
                                            <TrainIcon />
                                            <span>Cari Kereta</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Profile Settings Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-4 sm:space-y-6">
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Pengaturan Akun</h1>
                                
                                {!user ? (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <SettingsIcon />
                                        </div>
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">Kelola Akun</h2>
                                        <p className="text-gray-600 mb-6 text-sm sm:text-base">
                                            Login untuk mengatur profil dan pengaturan akun TripGo.
                                        </p>
                                        <button 
                                            onClick={handleLogin}
                                            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                        >
                                            Login Sekarang
                                        </button>
                                    </div>
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
                                                <div>
                                                    <h3 className="font-semibold text-gray-800">{userData.firstName} {userData.lastName}</h3>
                                                    <p className="text-gray-500 text-sm">{userData.email}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                                    <input 
                                                        type="email" 
                                                        defaultValue={userData.email} 
                                                        disabled 
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Telepon</label>
                                                    <input 
                                                        type="tel" 
                                                        defaultValue={userData.phone} 
                                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="mt-6 pt-6 border-t border-gray-200">
                                                <button
                                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                                >
                                                    Simpan Perubahan
                                                </button>
                                            </div>
                                        </div>

                                        {/* Account Actions Card */}
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                                            <h3 className="font-semibold text-gray-800 mb-4">Aksi Akun</h3>
                                            <div className="space-y-3">
                                                <button
                                                    onClick={handleRefresh}
                                                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <RefreshIcon />
                                                        <span>Refresh Data</span>
                                                    </div>
                                                    <span className="text-gray-400">↻</span>
                                                </button>
                                                <button
                                                    onClick={() => router.push('/privacy-policy')}
                                                    className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <ReceiptIcon />
                                                        <span>Kebijakan Privasi</span>
                                                    </div>
                                                    <span className="text-gray-400">→</span>
                                                </button>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center justify-between p-3 text-left text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
        </div>
    );
}