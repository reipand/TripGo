'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/contexts/AuthContext';
import { useWallet } from '@/app/contexts/WalletContext';
import { supabase } from '@/app/lib/supabaseClient';


// --- Icon Components ---
const UserIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const PlaneIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const WalletIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const StarIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>;
const HistoryIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TicketIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>;
const BellIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
const RefreshIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

// --- Helper Functions ---
const generateAvatarUrl = (firstName: string, lastName: string) => {
  const name = `${firstName}+${lastName}`.replace(/\s+/g, '+');
  return `https://ui-avatars.com/api/?name=${name}&background=0D8ABC&color=fff&size=150`;
};

// --- Reusable Components ---
const colorClassMap = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
  },
  yellow: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
  },
} as const;

const StatCard = ({ title, value, icon, color, subtitle }: { title: string; value: string; icon: React.ReactNode; color: keyof typeof colorClassMap; subtitle?: string }) => {
  const c = colorClassMap[color] || colorClassMap.gray;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4 hover:shadow-md transition-shadow duration-300">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${c.bg} ${c.text}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

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
    />
  );
};

const BookingCard = ({ booking }: { booking: any }) => {
    const statusClassMap: Record<string, string> = {
        confirmed: 'bg-green-100 text-green-800 border border-green-200',
        pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        cancelled: 'bg-red-100 text-red-800 border border-red-200',
        completed: 'bg-blue-100 text-blue-800 border border-blue-200',
        paid: 'bg-green-100 text-green-800 border border-green-200',
        waiting_payment: 'bg-orange-100 text-orange-800 border border-orange-200',
    };
    
    const statusClass = statusClassMap[booking.status] || 'bg-gray-100 text-gray-800 border border-gray-200';
    const statusLabel = (booking.status || '').toString();
    
    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            confirmed: 'Terkonfirmasi',
            pending: 'Menunggu',
            cancelled: 'Dibatalkan',
            completed: 'Selesai',
            paid: 'Sudah Bayar',
            waiting_payment: 'Menunggu Pembayaran',
        };
        return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', { 
                weekday: 'short',
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
            });
        } catch {
            return 'Tanggal tidak valid';
        }
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } catch {
            return '--:--';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="p-6">
                {/* Header dengan status dan tanggal */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <PlaneIcon />
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-gray-900">Kereta Api</h4>
                            <p className="text-sm text-gray-500">#{booking.order_id || booking.id?.slice(-8) || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                            {getStatusText(statusLabel)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(booking.created_at)}</p>
                    </div>
                </div>
                
                {/* Rute penerbangan */}
                <div className="flex items-center justify-between my-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{booking.origin_code || 'CGK'}</p>
                        <p className="text-sm text-gray-500">{booking.origin_city || 'Jakarta'}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatTime(booking.departure_time || booking.created_at)}</p>
                    </div>
                    <div className="flex-1 px-4">
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                            <span>Langsung</span>
                            <span>{booking.duration || '1j 30m'}</span>
                        </div>
                        <div className="relative">
                            <div className="w-full h-0.5 bg-gray-200"></div>
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <PlaneIcon />
                            </div>
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{booking.destination_code || 'DPS'}</p>
                        <p className="text-sm text-gray-500">{booking.destination_city || 'Denpasar'}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatTime(booking.arrival_time || booking.created_at)}</p>
                    </div>
                </div>

                {/* Info tambahan */}
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between text-sm">
                    <div>
                        <p className="text-gray-500">Penumpang</p>
                        <p className="font-medium text-gray-800">{booking.passenger_count || 1} orang</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Maskapai</p>
                        <p className="font-medium text-gray-800">{booking.airline || 'Garuda Indonesia'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500">Total Harga</p>
                        <p className="font-bold text-orange-500 text-lg">
                            Rp {(booking.total_amount || 0).toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t flex space-x-3">
                {(booking.status === 'confirmed' || booking.status === 'paid') && (
                    <Link 
                        href={`/ticket/${booking.id}`} 
                        className="flex-1 text-center bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        <TicketIcon />
                        <span>Lihat E-Ticket</span>
                    </Link>
                )}
                {booking.status === 'waiting_payment' && (
                    <Link 
                        href={`/payment/${booking.id}`} 
                        className="flex-1 text-center bg-orange-500 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
                    >
                        <WalletIcon />
                        <span>Bayar Sekarang</span>
                    </Link>
                )}
                <button className="flex-1 bg-white text-gray-700 py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors border border-gray-300">
                    Detail Pesanan
                </button>
                {booking.status === 'pending' && (
                    <button className="flex-1 bg-white text-red-600 py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors border border-gray-300">
                        Batalkan
                    </button>
                )}
            </div>
        </div>
    );
};

const SkeletonBookingCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                    <div className="h-5 w-24 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
            </div>
            <div className="text-right">
                <div className="h-6 w-20 bg-gray-200 rounded-full mb-1"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
        </div>
        <div className="flex items-center justify-between my-6">
            <div className="text-center">
                <div className="h-7 w-12 bg-gray-200 rounded mx-auto mb-1"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
            <div className="flex-1 px-4">
                <div className="flex items-center justify-between text-xs mb-1">
                    <div className="h-3 w-12 bg-gray-200 rounded"></div>
                    <div className="h-3 w-8 bg-gray-200 rounded"></div>
                </div>
                <div className="relative">
                    <div className="w-full h-0.5 bg-gray-200"></div>
                </div>
            </div>
            <div className="text-center">
                <div className="h-7 w-12 bg-gray-200 rounded mx-auto mb-1"></div>
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div>
                <div className="h-4 w-16 bg-gray-200 rounded mb-1"></div>
                <div className="h-5 w-20 bg-gray-200 rounded"></div>
            </div>
            <div>
                <div className="h-4 w-16 bg-gray-200 rounded mb-1"></div>
                <div className="h-5 w-24 bg-gray-200 rounded"></div>
            </div>
            <div className="text-right">
                <div className="h-4 w-12 bg-gray-200 rounded mb-1"></div>
                <div className="h-6 w-24 bg-gray-200 rounded"></div>
            </div>
        </div>
    </div>
);

// Guest/Demo Components
const GuestStatCard = ({ title, value, icon, color, subtitle }: { title: string; value: string; icon: React.ReactNode; color: keyof typeof colorClassMap; subtitle?: string }) => {
  const c = colorClassMap[color] || colorClassMap.gray;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4 hover:shadow-md transition-shadow duration-300 opacity-80">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${c.bg} ${c.text}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

const GuestBookingCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 opacity-70">
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <PlaneIcon />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-gray-900">Kereta Api</h4>
                        <p className="text-sm text-gray-500">#DEMO123</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        Demo
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Contoh pesanan</p>
                </div>
            </div>
            
            <div className="flex items-center justify-between my-6">
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">CGK</p>
                    <p className="text-sm text-gray-500">Jakarta</p>
                    <p className="text-xs text-gray-400 mt-1">08:00</p>
                </div>
                <div className="flex-1 px-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Langsung</span>
                        <span>1j 30m</span>
                    </div>
                    <div className="relative">
                        <div className="w-full h-0.5 bg-gray-200"></div>
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <PlaneIcon />
                        </div>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">DPS</p>
                    <p className="text-sm text-gray-500">Denpasar</p>
                    <p className="text-xs text-gray-400 mt-1">09:30</p>
                </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between text-sm">
                <div>
                    <p className="text-gray-500">Penumpang</p>
                    <p className="font-medium text-gray-800">1 orang</p>
                </div>
                <div>
                    <p className="text-gray-500">Maskapai</p>
                    <p className="font-medium text-gray-800">Garuda Indonesia</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-500">Total Harga</p>
                    <p className="font-bold text-orange-500 text-lg">
                        Rp 1.500.000
                    </p>
                </div>
            </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t flex space-x-3">
            <button className="flex-1 text-center bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                <TicketIcon />
                <span>Lihat E-Ticket</span>
            </button>
            <button className="flex-1 bg-white text-gray-700 py-2.5 px-4 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors border border-gray-300">
                Detail Pesanan
            </button>
        </div>
    </div>
);

// --- Dashboard Page ---
export default function DashboardPage() {
    const router = useRouter();
    const { user, userProfile, signOut, loading: authLoading } = useAuth();
    const { 
        wallet,
        balance: walletBalance, 
        isLoading: walletLoading,
        formatBalance,
        refreshWallet,
        getTransactions
    } = useWallet();
    
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [bookings, setBookings] = useState<any[]>([]);
    const [points] = useState(user ? 1250 : 0); // Changed to const since not updated
    const [bookingsError, setBookingsError] = useState<string | null>(null);
    const [notifications] = useState(user ? 3 : 0); // Changed to const
    const [refreshing, setRefreshing] = useState(false);
    const [navigationBlocked, setNavigationBlocked] = useState(false);

    // Prevent unwanted navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (navigationBlocked) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        const handleClick = (e: MouseEvent) => {
            // Check if click is on a Link component
            const target = e.target as HTMLElement;
            const link = target.closest('a');
            
            if (link && link.getAttribute('href') === '/') {
                e.preventDefault();
                e.stopPropagation();
                console.log('Navigation to home blocked');
                return false;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('click', handleClick, true);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('click', handleClick, true);
        };
    }, [navigationBlocked]);

    // Fetch bookings hanya untuk user yang login
    const fetchBookings = useCallback(async () => {
        if (!user) {
            setBookings([]);
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            setBookingsError(null);
            
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            setBookings(data || []);
            
        } catch (error: any) {
            console.error('❌ Error fetching bookings:', error);
            
            let errorMessage = 'Gagal memuat data pesanan';
            if (error?.code === '42P01') {
                errorMessage = 'Sistem pesanan sedang dalam maintenance';
            } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
                errorMessage = 'Koneksi internet bermasalah';
            } else {
                errorMessage = error?.message || 'Terjadi kesalahan tidak terduga';
            }
            
            setBookingsError(errorMessage);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Enhanced navigation handler
    const handleNavigation = useCallback((path: string) => {
        if (navigationBlocked) return;
        
        // Prevent navigation to dashboard if already on dashboard
        if (path === '/dashboard' || path === '/') {
            console.log('Navigation to dashboard blocked');
            return;
        }
        
        router.push(path);
    }, [router, navigationBlocked]);

    // Enhanced tab switching
    const handleTabSwitch = useCallback((tabId: string) => {
        if (!user && (tabId === 'bookings' || tabId === 'wallet' || tabId === 'profile')) {
            handleNavigation('/auth/login');
            return;
        }
        
        // Prevent setting same tab
        if (activeTab === tabId) return;
        
        setActiveTab(tabId);
    }, [user, activeTab, handleNavigation]);

    const handleRefresh = async () => {
        if (refreshing) return;
        
        setRefreshing(true);
        if (user) {
            await fetchBookings();
            await refreshWallet();
        }
        setTimeout(() => setRefreshing(false), 1000);
    };

    // Setup realtime subscription hanya untuk user yang login
    useEffect(() => {
        let subscription: any;

        const setupRealtime = async () => {
            if (!user?.id) return;

            try {
                await fetchBookings();

                subscription = supabase
                    .channel('dashboard-bookings')
                    .on(
                        'postgres_changes',
                        { 
                            event: '*', 
                            schema: 'public', 
                            table: 'bookings', 
                            filter: `user_id=eq.${user.id}` 
                        },
                        (payload) => {
                            fetchBookings();
                        }
                    )
                    .subscribe();

            } catch (error) {
                console.error('❌ Error setting up realtime:', error);
            }
        };

        setupRealtime();

        return () => {
            if (subscription) {
                supabase.removeChannel(subscription);
            }
        };
    }, [user?.id, fetchBookings]);

    const handleLogout = async () => {
        try {
            setNavigationBlocked(true);
            await signOut();
            // Use replace instead of push to prevent back navigation
            router.replace('/');
        } catch (error) {
            console.error('❌ Error during logout:', error);
            setNavigationBlocked(false);
        }
    };

    const handleLogin = () => {
        handleNavigation('/auth/login');
    };

    const handleSignUp = () => {
        handleNavigation('/auth/register');
    };

    const handleTopUp = () => {
        if (!user) {
            handleNavigation('/auth/login');
            return;
        }
        handleNavigation('/payment/topup');
    };

    // Enhanced Link component to prevent unwanted navigation
    const SafeLink = ({ 
        href, 
        children, 
        onClick, 
        className = "",
        ...props 
    }: {
        href: string;
        children: React.ReactNode;
        onClick?: () => void;
        className?: string;
    } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
            // Prevent navigation to home/dashboard if it's causing issues
            if (href === '/' || href === '/dashboard') {
                e.preventDefault();
                console.log('Navigation prevented for:', href);
                return;
            }
            
            if (onClick) {
                onClick();
            }
        };

        return (
            <Link 
                href={href} 
                onClick={handleClick}
                className={className}
                {...props}
            >
                {children}
            </Link>
        );
    };

    // User data untuk guest dan logged in user
    const userData = useMemo(() => {
        if (user) {
            return {
                firstName: userProfile?.first_name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User',
                lastName: userProfile?.last_name || user?.user_metadata?.last_name || '',
                avatarUrl: userProfile?.avatar_url || user?.user_metadata?.avatar_url,
                email: user?.email || '',
                phone: userProfile?.phone || user?.user_metadata?.phone || '-',
                joinDate: userProfile?.created_at || user?.created_at,
            };
        } else {
            return {
                firstName: 'Guest',
                lastName: 'User',
                avatarUrl: '',
                email: 'guest@example.com',
                phone: '-',
                joinDate: new Date().toISOString(),
            };
        }
    }, [user, userProfile]);

    // Statistik untuk guest dan logged in user
    const stats = useMemo(() => [
        {
            title: 'Total Pesanan',
            value: user ? bookings.length.toString() : '0',
            subtitle: user ? 'Semua waktu' : 'Login untuk melihat',
            icon: <TicketIcon />,
            color: 'blue' as const
        },
        {
            title: 'Saldo Dompet',
            value: user ? (walletLoading ? 'Loading...' : formatBalance()) : 'Rp 0',
            subtitle: user ? (walletLoading ? 'Memuat...' : 'Tersedia') : 'Login untuk top up',
            icon: <WalletIcon />,
            color: 'green' as const
        },
        {
            title: 'Trip Points',
            value: points.toLocaleString('id-ID'),
            subtitle: user ? 'Poin terkumpul' : 'Login untuk mendapatkan',
            icon: <StarIcon />,
            color: 'yellow' as const
        },
        {
            title: 'Pesanan Aktif',
            value: user ? bookings.filter(b => b.status === 'confirmed' || b.status === 'paid').length.toString() : '0',
            subtitle: user ? `${bookings.filter(b => b.status === 'pending' || b.status === 'waiting_payment').length} menunggu` : 'Belum ada pesanan',
            icon: <PlaneIcon />,
            color: 'red' as const
        }
    ], [user, bookings, walletLoading, formatBalance, points]);

    // Tampilkan loading state hanya untuk auth loading (bukan untuk guest)
    if (authLoading && !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    {/* Logo - menggunakan button bukan Link untuk mencegah navigasi */}
                    <button 
                        onClick={() => {
                            // Hanya reset ke tab overview tanpa navigasi
                            if (activeTab !== 'overview') {
                                setActiveTab('overview');
                                window.scrollTo(0, 0);
                            }
                        }}
                        className="flex items-center space-x-3 focus:outline-none"
                    >
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">T</span>
                        </div>
                        <span className="font-bold text-2xl text-gray-800 hidden sm:block">TripGo</span>
                    </button>
                    
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <button 
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className={`p-2 text-gray-600 hover:text-blue-600 transition-colors ${refreshing ? 'animate-spin' : ''}`}
                                    title="Refresh data"
                                >
                                    <RefreshIcon />
                                </button>
                                <button 
                                    className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                    title="Notifikasi"
                                >
                                    <BellIcon />
                                    {notifications > 0 && (
                                        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                                    )}
                                </button>
                                <div className="flex items-center space-x-3">
                                    <Avatar 
                                        firstName={userData.firstName}
                                        lastName={userData.lastName}
                                        avatarUrl={userData.avatarUrl}
                                        size={42}
                                    />
                                    <div className="hidden md:block text-left">
                                        <p className="font-semibold text-gray-800 text-sm">{userData.firstName} {userData.lastName}</p>
                                        <p className="text-xs text-gray-500">{userData.email}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <button 
                                    onClick={handleLogin}
                                    className="px-4 py-2 text-gray-700 font-medium hover:text-blue-600 transition-colors"
                                >
                                    Masuk
                                </button>
                                <button 
                                    onClick={handleSignUp}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    Daftar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <aside className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-24">
                            {/* User Profile Summary */}
                            <div className="text-center mb-6 pb-6 border-b border-gray-200">
                                <Avatar 
                                    firstName={userData.firstName}
                                    lastName={userData.lastName}
                                    avatarUrl={userData.avatarUrl}
                                    size={80}
                                    className="border-4 border-blue-100 mx-auto mb-4"
                                />
                                <h3 className="font-bold text-lg text-gray-800">{userData.firstName} {userData.lastName}</h3>
                                <p className="text-gray-500 text-sm">{userData.email}</p>
                                <div className="flex items-center justify-center space-x-4 mt-3">
                                    <div className="text-center">
                                        <p className="font-bold text-gray-800">{points}</p>
                                        <p className="text-xs text-gray-500">Points</p>
                                    </div>
                                    <div className="w-px h-6 bg-gray-300"></div>
                                    <div className="text-center">
                                        <p className="font-bold text-gray-800">{user ? bookings.length : 0}</p>
                                        <p className="text-xs text-gray-500">Trips</p>
                                    </div>
                                </div>
                                {!user && (
                                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <p className="text-yellow-700 text-sm">
                                            <strong>Mode Guest:</strong> Login untuk akses penuh
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-1">
                                {[
                                    { id: 'overview', label: 'Overview', icon: <UserIcon /> },
                                    { id: 'bookings', label: 'Pesanan Saya', icon: <PlaneIcon /> },
                                    { id: 'history', label: 'Riwayat', icon: <HistoryIcon /> },
                                    { id: 'wallet', label: 'Dompet & Top Up', icon: <WalletIcon /> },
                                    { id: 'profile', label: 'Pengaturan Akun', icon: <SettingsIcon /> },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleTabSwitch(item.id)}
                                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                            activeTab === item.id 
                                                ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                                                : 'text-gray-600 hover:bg-gray-50'
                                        } ${!user && (item.id === 'bookings' || item.id === 'wallet' || item.id === 'profile') ? 'opacity-60' : ''}`}
                                        disabled={activeTab === item.id}
                                    >
                                        {item.icon}
                                        <span className="font-medium">{item.label}</span>
                                        {!user && (item.id === 'bookings' || item.id === 'wallet' || item.id === 'profile') && (
                                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Login</span>
                                        )}
                                    </button>
                                ))}
                                <hr className="my-3 border-gray-200"/>
                                {user ? (
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <LogoutIcon />
                                        <span className="font-medium">Keluar</span>
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleLogin}
                                        className="w-full flex items-center space-x-3 px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                    >
                                        <UserIcon />
                                        <span className="font-medium">Login untuk Akses Penuh</span>
                                    </button>
                                )}
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="lg:col-span-9">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                                            {user ? `Selamat Datang, ${userData.firstName}! 🚆` : 'Selamat Datang di TripGo! 🚆'}
                                        </h1>
                                        <p className="text-gray-600 mt-1">
                                            {new Date().toLocaleDateString('id-ID', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                        {!user && (
                                            <p className="text-blue-600 mt-2 text-sm">
                                                Anda sedang dalam mode guest. Login untuk akses penuh semua fitur.
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex space-x-3 w-full sm:w-auto">
                                        <button 
                                            onClick={handleRefresh}
                                            disabled={refreshing}
                                            className={`p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
                                        >
                                            <RefreshIcon />
                                        </button>
                                        <SafeLink 
                                            href="/search/trains"
                                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 w-full sm:w-auto justify-center"
                                        >
                                            <PlaneIcon />
                                            <span>Pesan Tiket Baru</span>
                                        </SafeLink>
                                    </div>
                                </div>
                                
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                    {stats.map((stat, index) => (
                                        user ? (
                                            <StatCard
                                                key={index}
                                                title={stat.title}
                                                value={stat.value}
                                                subtitle={stat.subtitle}
                                                icon={stat.icon}
                                                color={stat.color}
                                            />
                                        ) : (
                                            <GuestStatCard
                                                key={index}
                                                title={stat.title}
                                                value={stat.value}
                                                subtitle={stat.subtitle}
                                                icon={stat.icon}
                                                color={stat.color}
                                            />
                                        )
                                    ))}
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Aksi Cepat</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                        {[
                                            { label: 'Pesan Tiket', icon: '🚆', href: '/search/trains', color: 'blue' },
                                            { label: 'Top Up', icon: '💳', href: user ? '/payment/topup' : '/auth/login', color: 'green' },
                                            { label: 'Riwayat', icon: '📜', onClick: () => handleTabSwitch('history'), color: 'yellow' },
                                            { label: 'Bantuan', icon: '❓', href: '/help', color: 'purple' },
                                        ].map((action, index) => (
                                            action.href ? (
                                                <SafeLink
                                                    key={index}
                                                    href={action.href}
                                                    onClick={action.onClick}
                                                    className={`flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all group
                                                        ${action.color === 'blue' ? 'hover:border-blue-300 hover:bg-blue-50' : ''}
                                                        ${action.color === 'green' ? 'hover:border-green-300 hover:bg-green-50' : ''}
                                                        ${action.color === 'yellow' ? 'hover:border-yellow-300 hover:bg-yellow-50' : ''}
                                                        ${action.color === 'purple' ? 'hover:border-purple-300 hover:bg-purple-50' : ''}
                                                        ${!user && action.label !== 'Pesan Tiket' && action.label !== 'Bantuan' ? 'opacity-70' : ''}
                                                    `}
                                                >
                                                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</span>
                                                    <span className="font-medium text-gray-700 text-sm text-center">{action.label}</span>
                                                    {!user && action.label !== 'Pesan Tiket' && action.label !== 'Bantuan' && (
                                                        <span className="text-xs text-gray-500 mt-1">Login dulu</span>
                                                    )}
                                                </SafeLink>
                                            ) : (
                                                <button
                                                    key={index}
                                                    onClick={action.onClick}
                                                    className={`flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all group
                                                        ${action.color === 'blue' ? 'hover:border-blue-300 hover:bg-blue-50' : ''}
                                                        ${action.color === 'green' ? 'hover:border-green-300 hover:bg-green-50' : ''}
                                                        ${action.color === 'yellow' ? 'hover:border-yellow-300 hover:bg-yellow-50' : ''}
                                                        ${action.color === 'purple' ? 'hover:border-purple-300 hover:bg-purple-50' : ''}
                                                    `}
                                                >
                                                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</span>
                                                    <span className="font-medium text-gray-700 text-sm text-center">{action.label}</span>
                                                </button>
                                            )
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Bookings Preview */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-semibold text-gray-800">
                                            {user ? 'Pesanan Terbaru' : 'Contoh Pesanan'}
                                        </h3>
                                        {user && bookings.length > 0 && (
                                            <button 
                                                onClick={() => handleTabSwitch('bookings')}
                                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                            >
                                                Lihat Semua
                                            </button>
                                        )}
                                    </div>
                                    
                                    {!user ? (
                                        <div className="space-y-4">
                                            <GuestBookingCard />
                                            <div className="text-center py-4">
                                                <p className="text-gray-500 mb-4">Login untuk melihat pesanan Anda yang sebenarnya</p>
                                                <button 
                                                    onClick={handleLogin}
                                                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2 text-sm"
                                                >
                                                    <UserIcon />
                                                    <span>Login Sekarang</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : loading ? (
                                        <div className="space-y-4">
                                            <SkeletonBookingCard />
                                            <SkeletonBookingCard />
                                        </div>
                                    ) : bookingsError ? (
                                        <div className="text-center py-8 bg-yellow-50 rounded-xl">
                                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Gagal Memuat Pesanan</h4>
                                            <p className="text-gray-500 mb-4 text-sm">
                                                {bookingsError}
                                            </p>
                                            <button 
                                                onClick={fetchBookings}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                                            >
                                                Coba Lagi
                                            </button>
                                        </div>
                                    ) : bookings.length > 0 ? (
                                        <div className="space-y-4">
                                            {bookings.slice(0, 2).map(booking => (
                                                <BookingCard key={booking.id} booking={booking} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <PlaneIcon />
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Belum Ada Pesanan</h4>
                                            <p className="text-gray-500 mb-4 text-sm">Mulai petualangan Anda dengan memesan tiket pertama!</p>
                                            <SafeLink 
                                            href="/search/trains"
                                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-2 text-sm"
                                            >
                                            <PlaneIcon />
                                            <span>Cari Kereta</span>
                                            </SafeLink>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bookings Tab - Hanya untuk user yang login */}
                        {activeTab === 'bookings' && (
                            <div>
                                {!user ? (
                                    <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
                                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <UserIcon />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Login Diperlukan</h2>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                            Anda perlu login untuk melihat riwayat pesanan Anda. 
                                            Login atau daftar sekarang untuk mengakses semua fitur TripGo.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                            <button 
                                                onClick={handleLogin}
                                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                            >
                                                Login Sekarang
                                            </button>
                                            <button 
                                                onClick={handleSignUp}
                                                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                                            >
                                                Daftar Akun Baru
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Pesanan Saya</h1>
                                            <div className="flex space-x-2 w-full sm:w-auto">
                                                <button 
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                                                    onClick={() => setActiveTab('bookings')}
                                                >
                                                    Semua
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {loading ? (
                                            <div className="grid grid-cols-1 gap-6">
                                                <SkeletonBookingCard />
                                                <SkeletonBookingCard />
                                                <SkeletonBookingCard />
                                            </div>
                                        ) : bookingsError ? (
                                            <div className="text-center bg-yellow-50 rounded-2xl shadow-sm border border-yellow-200 p-8 sm:p-16">
                                                <div className="w-20 h-20 sm:w-32 sm:h-32 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                                    <svg className="w-10 h-10 sm:w-16 sm:h-16 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Gagal Memuat Pesanan</h3>
                                                <p className="text-gray-500 max-w-md mx-auto mb-6 text-sm sm:text-base">
                                                    {bookingsError}
                                                </p>
                                                <button 
                                                    onClick={fetchBookings}
                                                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-3 text-sm sm:text-base"
                                                >
                                                    <RefreshIcon />
                                                    <span>Refresh Halaman</span>
                                                </button>
                                            </div>
                                        ) : bookings.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-6">
                                                {bookings.map(booking => (
                                                    <BookingCard key={booking.id} booking={booking} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-16">
                                                <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                                    <PlaneIcon />
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Belum Ada Pesanan</h3>
                                                <p className="text-gray-500 max-w-md mx-auto mb-6 text-sm sm:text-base">
                                                    Anda belum memiliki pesanan aktif. Mari mulai petualangan Anda dengan mencari tiket kereta terbaik!
                                                </p>
                                                <SafeLink 
                                                    href="/search/trains"
                                                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors inline-flex items-center space-x-3 text-sm sm:text-base"
                                                >
                                                    <PlaneIcon />
                                                    <span>Cari Kereta</span>
                                                </SafeLink>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Wallet Tab - Hanya untuk user yang login */}
                        {activeTab === 'wallet' && (
                            <div className="space-y-8">
                                {!user ? (
                                    <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
                                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <WalletIcon />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Akses Dompet TripGo</h2>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                            Login untuk mengakses fitur dompet digital TripGo. 
                                            Top up saldo, kelola pembayaran, dan nikmati kemudahan bertransaksi.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                            <button 
                                                onClick={handleLogin}
                                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                            >
                                                Login Sekarang
                                            </button>
                                            <button 
                                                onClick={handleSignUp}
                                                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                                            >
                                                Daftar Akun Baru
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dompet & Top Up</h1>
                                        
                                        {/* Balance Card */}
                                        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl shadow-xl p-6 sm:p-8 text-white relative overflow-hidden">
                                            <div className="relative z-10">
                                                <p className="text-blue-100 text-sm opacity-90">Saldo TripGo Wallet</p>
                                                <p className="text-3xl sm:text-5xl font-bold mt-2 mb-4">
                                                    {walletLoading ? (
                                                        <div className="flex items-center space-x-2">
                                                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-white"></div>
                                                            <span className="text-lg sm:text-xl">Memuat...</span>
                                                        </div>
                                                    ) : (
                                                        formatBalance()
                                                    )}
                                                </p>
                                                <div className="flex items-center space-x-4 text-blue-200 text-sm sm:text-base">
                                                    <div className="flex items-center space-x-1">
                                                        <StarIcon />
                                                        <span>{points.toLocaleString('id-ID')} Points</span>
                                                    </div>
                                                    <div className="w-px h-4 bg-blue-400"></div>
                                                    <span>Member Gold</span>
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-8 -right-8 w-32 h-32 sm:w-40 sm:h-40 bg-white bg-opacity-10 rounded-full"></div>
                                            <div className="absolute -top-8 -left-8 w-24 h-24 sm:w-32 sm:h-32 bg-white bg-opacity-5 rounded-full"></div>
                                        </div>

                                        {/* Quick Top Up */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Top Up Cepat</h3>
                                            <p className="text-gray-500 mb-6 text-sm sm:text-base">Pilih nominal atau masukkan jumlah custom</p>
                                            
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                                                {[100000, 250000, 500000, 1000000].map((amount) => (
                                                    <button
                                                        key={amount}
                                                        onClick={() => handleNavigation(`/payment/topup?amount=${amount}`)}
                                                        className="p-3 sm:p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                                    >
                                                        <p className="font-bold text-gray-800 text-base sm:text-lg group-hover:text-blue-600">
                                                            Rp {amount.toLocaleString('id-ID')}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                                                <button 
                                                    onClick={handleTopUp}
                                                    className="flex-1 bg-orange-500 text-white font-bold py-3 sm:py-4 px-6 rounded-xl hover:bg-orange-600 transition-colors text-base sm:text-lg text-center"
                                                >
                                                    Top Up Custom
                                                </button>
                                                <button 
                                                    onClick={() => handleTabSwitch('history')}
                                                    className="px-6 bg-white border border-gray-300 text-gray-700 font-semibold py-3 sm:py-4 rounded-xl hover:bg-gray-50 transition-colors text-sm sm:text-base"
                                                >
                                                    Riwayat Top Up
                                                </button>
                                            </div>
                                        </div>

                                        {/* Promo Section */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-6">Promo & Benefit</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                {[
                                                    { title: 'Cashback 10%', desc: 'Untuk top up pertama', code: 'WELCOME10' },
                                                    { title: 'Bonus 5%', desc: 'Min. top up Rp 500rb', code: 'TOPUP5' },
                                                    { title: 'Gratis Biaya Admin', desc: 'Top up via Transfer Bank', code: 'NOADMIN' },
                                                    { title: 'Double Points', desc: 'Khusus member premium', code: '2XPOINTS' },
                                                ].map((promo, index) => (
                                                    <div key={index} className="border border-orange-200 bg-orange-50 rounded-xl p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-orange-800 text-sm sm:text-base">{promo.title}</h4>
                                                                <p className="text-orange-600 text-xs sm:text-sm">{promo.desc}</p>
                                                            </div>
                                                            <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                                                                {promo.code}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Profile Tab - Hanya untuk user yang login */}
                        {activeTab === 'profile' && (
                            <div className="space-y-8">
                                {!user ? (
                                    <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
                                        <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <SettingsIcon />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Kelola Akun Anda</h2>
                                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                            Login untuk mengatur profil, preferensi, dan pengaturan akun TripGo Anda.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                            <button 
                                                onClick={handleLogin}
                                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                                            >
                                                Login Sekarang
                                            </button>
                                            <button 
                                                onClick={handleSignUp}
                                                className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
                                            >
                                                Daftar Akun Baru
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Pengaturan Akun</h1>
                                        
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                                            <form className="space-y-8">
                                                {/* Photo Section */}
                                                <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-8">
                                                    <Avatar 
                                                        firstName={userData.firstName}
                                                        lastName={userData.lastName}
                                                        avatarUrl={userData.avatarUrl}
                                                        size={100}
                                                        className="border-4 border-blue-100 rounded-2xl"
                                                    />
                                                    <div className="text-center sm:text-left">
                                                        <h3 className="font-semibold text-gray-800 text-lg mb-2">Foto Profil</h3>
                                                        <div className="flex space-x-3 justify-center sm:justify-start">
                                                            <button 
                                                                type="button"
                                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                                                            >
                                                                Unggah Foto Baru
                                                            </button>
                                                            <button 
                                                                type="button"
                                                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-300 transition-colors"
                                                            >
                                                                Hapus
                                                            </button>
                                                        </div>
                                                        <p className="text-gray-500 text-sm mt-2">Format: JPG, PNG (max. 2MB)</p>
                                                    </div>
                                                </div>

                                                <hr className="border-gray-200"/>

                                                {/* Personal Info */}
                                                <div>
                                                    <h3 className="font-semibold text-gray-800 text-lg mb-6">Informasi Pribadi</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Depan</label>
                                                            <input 
                                                                type="text" 
                                                                defaultValue={userData.firstName} 
                                                                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nama Belakang</label>
                                                            <input 
                                                                type="text" 
                                                                defaultValue={userData.lastName} 
                                                                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contact Info */}
                                                <div>
                                                    <h3 className="font-semibold text-gray-800 text-lg mb-6">Kontak</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Email</label>
                                                            <input 
                                                                type="email" 
                                                                defaultValue={userData.email} 
                                                                disabled 
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500" 
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                                                            <input 
                                                                type="tel" 
                                                                defaultValue={userData.phone} 
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
                                                    <button 
                                                        type="button"
                                                        className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors order-2 sm:order-1"
                                                    >
                                                        Batalkan
                                                    </button>
                                                    <button 
                                                        type="submit"
                                                        className="bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors order-1 sm:order-2"
                                                    >
                                                        Simpan Perubahan
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Riwayat Perjalanan</h1>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <HistoryIcon />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Fitur Segera Hadir!</h3>
                                    <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
                                        Kami sedang menyiapkan halaman riwayat perjalanan untuk Anda. 
                                        Di sini nantinya Anda dapat melihat semua perjalanan yang telah selesai.
                                    </p>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}