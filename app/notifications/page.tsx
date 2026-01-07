// app/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';

interface Notification {
  id: string;
  user_id: string;
  type: 'booking' | 'payment' | 'reminder' | 'promo' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  data?: any;
  created_at: string;
  booking_id?: string;
  booking_code?: string;
  schedule?: {
    train_name: string;
    departure_time: string;
    origin_station: string;
  };
}

type NotificationFilter = 'all' | 'unread' | 'booking' | 'payment' | 'promo';

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [hasUnread, setHasUnread] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    if (!user) {
      setLoading(false);
      setNotifications([]);
      setFilteredNotifications([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading notifications for user:', user.id);
      
      // 1. Coba load dari database notifications
      let { data: dbNotifications, error: dbError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (dbError) {
        console.warn('⚠️ No notifications table, generating sample data');
        // Generate sample notifications jika tabel tidak ada
        dbNotifications = await generateSampleNotifications(user.id);
      } else if (!dbNotifications || dbNotifications.length === 0) {
        // Generate notifications jika belum ada
        dbNotifications = await generateSampleNotifications(user.id);
      }

      // Process notifications
      const processedNotifications: Notification[] = await Promise.all(
        (dbNotifications || []).map(async (notif: any) => {
          let schedule = undefined;
          
          // Jika ada booking_id, coba ambil data schedule
          if (notif.booking_id) {
            try {
              const { data: bookingData } = await supabase
                .from('bookings')
                .select('schedule_id, departure_time, origin, train_name')
                .eq('id', notif.booking_id)
                .single();
                
              if (bookingData) {
                schedule = {
                  train_name: bookingData.train_name || 'Kereta Api',
                  departure_time: bookingData.departure_time || '--:--',
                  origin_station: bookingData.origin || 'Stasiun'
                };
              }
            } catch (err) {
              console.warn('Error fetching booking data:', err);
            }
          }

          return {
            id: notif.id || `notif-${Date.now()}-${Math.random()}`,
            user_id: notif.user_id || user.id,
            type: notif.type || 'system',
            title: notif.title || 'Notifikasi',
            message: notif.message || '',
            is_read: notif.is_read || false,
            data: notif.data || {},
            created_at: notif.created_at || new Date().toISOString(),
            booking_id: notif.booking_id,
            booking_code: notif.booking_code,
            schedule
          };
        })
      );

      console.log('✅ Notifications loaded:', processedNotifications.length);
      setNotifications(processedNotifications);
      setFilteredNotifications(processedNotifications);
      
      // Check for unread notifications
      const unreadCount = processedNotifications.filter(n => !n.is_read).length;
      setHasUnread(unreadCount > 0);
      
      // Update badge count
      updateNotificationBadge(unreadCount);

    } catch (err: any) {
      console.error('❌ Error loading notifications:', err);
      setError(err.message || 'Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  // Generate sample notifications
  const generateSampleNotifications = async (userId: string) => {
    const sampleNotifications = [
      {
        id: 'notif-1',
        user_id: userId,
        type: 'booking',
        title: 'Booking Berhasil! 🎉',
        message: 'Tiket Anda untuk Kereta Api Eksekutif telah berhasil dipesan. Kode booking: BOOK-123456',
        is_read: false,
        data: { bookingCode: 'BOOK-123456' },
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 menit lalu
        booking_code: 'BOOK-123456'
      },
      {
        id: 'notif-2',
        user_id: userId,
        type: 'payment',
        title: 'Pembayaran Berhasil! ✅',
        message: 'Pembayaran untuk booking BOOK-123456 telah berhasil. Tiket Anda aktif.',
        is_read: true,
        data: { bookingCode: 'BOOK-123456', amount: 265000 },
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 menit lalu
        booking_code: 'BOOK-123456'
      },
      {
        id: 'notif-3',
        user_id: userId,
        type: 'reminder',
        title: 'Pengingat Keberangkatan 🔔',
        message: 'Kereta Api Anda akan berangkat besok pukul 08:00. Jangan lupa check-in!',
        is_read: false,
        data: { departureTime: '08:00', date: '2025-12-26' },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 jam lalu
      },
      {
        id: 'notif-4',
        user_id: userId,
        type: 'promo',
        title: 'Promo Spesial! 🎁',
        message: 'Dapatkan diskon 20% untuk booking berikutnya dengan kode: TRIPGO20',
        is_read: false,
        data: { promoCode: 'TRIPGO20', discount: '20%' },
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 hari lalu
      },
      {
        id: 'notif-5',
        user_id: userId,
        type: 'system',
        title: 'Selamat Datang di TripGo! 👋',
        message: 'Terima kasih telah bergabung. Nikmati pengalaman booking kereta yang mudah dan cepat.',
        is_read: true,
        data: {},
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 hari lalu
      }
    ];

    // Simpan ke database jika tabel ada
    try {
      await supabase
        .from('notifications')
        .upsert(sampleNotifications, { onConflict: 'id' });
    } catch (err) {
      console.log('Sample notifications not saved to DB');
    }

    return sampleNotifications;
  };

  // Update notification badge
  const updateNotificationBadge = (count: number) => {
    // Update document title
    if (count > 0) {
      document.title = `(${count}) Notifikasi - TripGo`;
    } else {
      document.title = 'Notifikasi - TripGo';
    }

    // Simpan ke localStorage untuk navbar badge
    localStorage.setItem('notificationCount', count.toString());
    
    // Dispatch custom event untuk update navbar
    window.dispatchEvent(new CustomEvent('notificationUpdate', { 
      detail: { count } 
    }));
  };

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      
      setFilteredNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );

      // Update in database
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      // Update badge count
      const newUnreadCount = notifications.filter(n => !n.is_read && n.id !== notificationId).length;
      setHasUnread(newUnreadCount > 0);
      updateNotificationBadge(newUnreadCount);

    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      setFilteredNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );

      // Update in database
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      // Update badge
      setHasUnread(false);
      updateNotificationBadge(0);

    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setFilteredNotifications(prev => prev.filter(notif => notif.id !== notificationId));

      // Delete from database
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      // Update badge count
      const remainingNotifications = notifications.filter(n => n.id !== notificationId);
      const unreadCount = remainingNotifications.filter(n => !n.is_read).length;
      setHasUnread(unreadCount > 0);
      updateNotificationBadge(unreadCount);

    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus semua notifikasi?')) return;

    try {
      // Clear from database
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id);

      // Update local state
      setNotifications([]);
      setFilteredNotifications([]);
      setHasUnread(false);
      updateNotificationBadge(0);

    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  // Filter notifications
  const filterNotifications = (filter: NotificationFilter) => {
    setActiveFilter(filter);
    
    if (filter === 'all') {
      setFilteredNotifications(notifications);
      return;
    }
    
    if (filter === 'unread') {
      setFilteredNotifications(notifications.filter(n => !n.is_read));
      return;
    }
    
    setFilteredNotifications(notifications.filter(n => n.type === filter));
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return (
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'payment':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'reminder':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'promo':
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking': return 'border-l-orange-500';
      case 'payment': return 'border-l-green-500';
      case 'reminder': return 'border-l-blue-500';
      case 'promo': return 'border-l-purple-500';
      default: return 'border-l-gray-500';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Load notifications on mount
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setLoading(false);
      return;
    }

    loadNotifications();
    
    // Setup real-time subscription
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time notification update:', payload);
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authLoading]);

  // Create test notification
  const createTestNotification = async () => {
    if (!user) return;

    const testNotification = {
      user_id: user.id,
      type: 'system' as const,
      title: 'Test Notification',
      message: 'Ini adalah notifikasi test untuk memastikan sistem berjalan dengan baik.',
      is_read: false,
      data: { test: true },
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('notifications')
        .insert([testNotification]);

      if (error) throw error;
      
      alert('Test notification created!');
      loadNotifications();
      
    } catch (err) {
      console.error('Error creating test notification:', err);
      alert('Gagal membuat notifikasi test');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat notifikasi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Anda Belum Login</h2>
          <p className="text-gray-500 mb-6">Silakan login untuk melihat notifikasi</p>
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="block w-full bg-[#FD7E14] text-white font-semibold py-3 rounded-lg hover:bg-[#E06700] transition-colors text-center"
            >
              Login Sekarang
            </Link>
            <Link
              href="/"
              className="block w-full border border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Notifikasi</h1>
              <p className="text-gray-600 text-sm">
                {filteredNotifications.length} pesan
                {hasUnread && <span className="text-[#FD7E14] ml-2">• {notifications.filter(n => !n.is_read).length} belum dibaca</span>}
              </p>
            </div>
            
            <div className="flex gap-2">
              {hasUnread && (
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Tandai Semua Sudah Dibaca
                </button>
              )}
              
              <button
                onClick={() => createTestNotification()}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                title="Buat Notifikasi Test"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => filterNotifications('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-[#FD7E14] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => filterNotifications('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeFilter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            Belum Dibaca
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="bg-white text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {notifications.filter(n => !n.is_read).length}
              </span>
            )}
          </button>
          <button
            onClick={() => filterNotifications('booking')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'booking'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            Booking
          </button>
          <button
            onClick={() => filterNotifications('payment')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'payment'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            Pembayaran
          </button>
          <button
            onClick={() => filterNotifications('promo')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'promo'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            Promo
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-red-600">{error}</p>
            </div>
            <button
              onClick={loadNotifications}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Tidak Ada Notifikasi</h3>
            <p className="text-gray-500 mb-6">
              {activeFilter === 'all' 
                ? 'Belum ada notifikasi untuk Anda' 
                : `Tidak ada notifikasi dengan filter "${activeFilter}"`}
            </p>
            {activeFilter !== 'all' && (
              <button
                onClick={() => filterNotifications('all')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Lihat Semua Notifikasi
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Clear All Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={clearAllNotifications}
                className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus Semua
              </button>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl shadow-sm border-l-4 ${getNotificationColor(notification.type)} ${
                    !notification.is_read ? 'border-2 border-blue-200' : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {notification.title}
                            {!notification.is_read && (
                              <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatTime(notification.created_at)}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-2">
                          {notification.message}
                        </p>

                        {/* Extra Info */}
                        {notification.schedule && (
                          <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-500 mb-2">
                            <div className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{notification.schedule.train_name} • {notification.schedule.departure_time} dari {notification.schedule.origin_station}</span>
                            </div>
                          </div>
                        )}

                        {notification.booking_code && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200">
                              {notification.booking_code}
                            </span>
                            <Link
                              href={`/booking/confirmation?bookingCode=${notification.booking_code}`}
                              className="text-xs text-[#FD7E14] hover:underline"
                            >
                              Lihat Detail
                            </Link>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Tandai Sudah Dibaca
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs text-gray-500 hover:text-red-600"
                          >
                            Hapus
                          </button>
                          
                          {/* Action Buttons berdasarkan type */}
                          {notification.type === 'booking' && notification.booking_code && (
                            <Link
                              href={`/payment?bookingCode=${notification.booking_code}`}
                              className="text-xs text-green-600 hover:text-green-800"
                            >
                              Lanjutkan Pembayaran →
                            </Link>
                          )}
                          
                          {notification.type === 'promo' && notification.data?.promoCode && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(notification.data.promoCode);
                                alert(`Kode promo ${notification.data.promoCode} disalin!`);
                              }}
                              className="text-xs text-purple-600 hover:text-purple-800"
                            >
                              Salin Kode
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination/Info */}
            <div className="mt-6 text-center text-gray-500 text-sm">
              <p>Menampilkan {filteredNotifications.length} dari {notifications.length} notifikasi</p>
              {notifications.length > 50 && (
                <p className="mt-1">
                  <button className="text-[#FD7E14] hover:underline">
                    Muat lebih banyak...
                  </button>
                </p>
              )}
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/my-bookings"
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-[#FD7E14] hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Booking Saya</h4>
                <p className="text-sm text-gray-500">Lihat semua tiket dan booking</p>
              </div>
            </div>
          </Link>

          <Link
            href="/search/trains"
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-[#FD7E14] hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Pesan Tiket</h4>
                <p className="text-sm text-gray-500">Booking kereta baru</p>
              </div>
            </div>
          </Link>

          <Link
            href="/promo"
            className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:border-[#FD7E14] hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Promo</h4>
                <p className="text-sm text-gray-500">Lihat promo dan diskon</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}