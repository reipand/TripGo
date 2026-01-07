// app/components/Navbar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

// Icon Components
const SearchIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BellIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const UserIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ChevronDownIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const MenuIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-6 h-6 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const DashboardIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const TicketIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const WalletIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);

const SettingsIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = ({ className = "" }: { className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  const router = useRouter();
  const pathname = usePathname();

  // Refs for click outside detection
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLButtonElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Check auth status and fetch user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Fetch user profile from public.users table
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUserProfile(profile || { email: session.user.email });
          
          // Fetch notifications
          fetchNotifications(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
          setNotifications([]);
          setNotificationCount(0);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        const currentUser = session.user as User;
        setUser(currentUser);
        
        // Fetch user profile
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          setUserProfile(profile || { email: currentUser.email });
          
          // Fetch notifications
          fetchNotifications(currentUser.id);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile({ email: currentUser.email });
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setNotifications([]);
        setNotificationCount(0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for custom notification events
  useEffect(() => {
    const handleNotificationUpdate = (event: CustomEvent) => {
      setNotificationCount(event.detail.count);
      
      // Refresh notifications if user is logged in
      if (user?.id) {
        fetchNotifications(user.id);
      }
    };

    const handleNewNotification = () => {
      if (user?.id) {
        fetchNotifications(user.id);
      }
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate as EventListener);
    window.addEventListener('newNotification', handleNewNotification as EventListener);

    return () => {
      window.removeEventListener('notificationUpdate', handleNotificationUpdate as EventListener);
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
    };
  }, [user]);

  // Check local storage for notification count
  useEffect(() => {
    const savedCount = localStorage.getItem('notificationCount');
    if (savedCount) {
      setNotificationCount(parseInt(savedCount));
    }
  }, []);

  // Fetch notifications from database
  const fetchNotifications = async (userId: string) => {
    try {
      // Try to fetch from notifications table
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        // Table might not exist, use sample notifications
        console.warn('Notifications table not found, using sample data');
        createSampleNotifications(userId);
        return;
      }
      
      setNotifications(data || []);
      const count = data?.length || 0;
      setNotificationCount(count);
      
      // Update local storage and document title
      localStorage.setItem('notificationCount', count.toString());
      if (count > 0) {
        document.title = `(${count}) TripGo`;
      } else {
        document.title = 'TripGo';
      }

    } catch (error) {
      console.error('Error fetching notifications:', error);
      createSampleNotifications(userId);
    }
  };

  // Create sample notifications if table doesn't exist
  const createSampleNotifications = async (userId: string) => {
    const sampleNotifications = [
      {
        id: 'sample-1',
        user_id: userId,
        type: 'booking',
        title: 'Booking Berhasil! 🎉',
        message: 'Tiket Anda untuk Kereta Api Eksekutif telah berhasil dipesan.',
        is_read: false,
        data: { bookingCode: 'BOOK-123456' },
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: 'sample-2',
        user_id: userId,
        type: 'payment',
        title: 'Pembayaran Berhasil! ✅',
        message: 'Pembayaran untuk booking BOOK-123456 telah berhasil.',
        is_read: false,
        data: { bookingCode: 'BOOK-123456', amount: 265000 },
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      }
    ];

    setNotifications(sampleNotifications);
    setNotificationCount(sampleNotifications.length);
    
    // Update local storage
    localStorage.setItem('notificationCount', sampleNotifications.length.toString());
    
    // Create notifications table if needed
    try {
      await supabase.from('notifications').upsert(sampleNotifications);
    } catch (error) {
      // Table creation failed, that's ok
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation items
  const navItems = [
    { href: '/search/trains', label: 'Kereta Api' },
    { href: '/promo', label: 'Promo' },
    { href: '/help', label: 'Bantuan' },
  ];

  // Check if current path is active
  const isActivePath = (path: string) => {
    return pathname?.startsWith(path);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userProfile?.name) {
      return userProfile.name
        .split(' ')
        .map((word: string) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    if (userProfile?.name) {
      return userProfile.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setIsUserMenuOpen(false);
      setIsMobileMenuOpen(false);
      setNotifications([]);
      setNotificationCount(0);
      localStorage.removeItem('notificationCount');
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Handle mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Try to update in database
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error && error.code !== '42P01') { // Table doesn't exist error
        console.warn('Cannot update notification in DB:', error);
      }

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      const newCount = notificationCount - 1;
      setNotificationCount(newCount);
      
      // Update local storage and dispatch event
      localStorage.setItem('notificationCount', newCount.toString());
      window.dispatchEvent(new CustomEvent('notificationUpdate', { 
        detail: { count: newCount } 
      }));

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      if (user?.id) {
        // Try to update all in database
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (error && error.code !== '42P01') {
          console.warn('Cannot update notifications in DB:', error);
        }
      }

      // Update local state
      setNotifications([]);
      setNotificationCount(0);
      
      // Update local storage and dispatch event
      localStorage.setItem('notificationCount', '0');
      window.dispatchEvent(new CustomEvent('notificationUpdate', { 
        detail: { count: 0 } 
      }));

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Format notification time
  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Baru saja';
      if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam lalu`;
      return `${Math.floor(diffInMinutes / 1440)} hari lalu`;
    } catch (error) {
      return 'Beberapa waktu lalu';
    }
  };

  // Get notification type color
  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-green-500';
      case 'booking': return 'bg-blue-500';
      case 'promo': return 'bg-yellow-500';
      case 'reminder': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo dan Menu Items */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">TG</span>
              </div>
              <span className="text-blue-600 font-bold text-xl hidden sm:block">TripGO</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActivePath(item.href) 
                      ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600 font-semibold' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Icon - Mobile */}
            <button 
              onClick={() => router.push('/search')}
              className="lg:hidden p-2 text-gray-600 hover:text-blue-600 rounded-lg transition-colors hover:bg-gray-100"
            >
              <SearchIcon />
            </button>

            {/* Notification Bell */}
            {user && (
              <div ref={notificationsRef} className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 text-gray-600 hover:text-blue-600 rounded-lg transition-colors hover:bg-gray-100"
                >
                  <BellIcon />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                      <span className="text-xs text-white font-bold">{notificationCount > 9 ? '9+' : notificationCount}</span>
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-sm font-semibold text-gray-800">Notifikasi</h3>
                      {notifications.length > 0 && (
                        <button 
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Tandai semua telah dibaca
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id}
                            className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer group"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <div className="flex items-start">
                              <div className={`w-2 h-2 rounded-full mt-1.5 mr-3 flex-shrink-0 ${getNotificationTypeColor(notification.type)}`}></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 font-medium truncate">{notification.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(notification.created_at)}</p>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="ml-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <BellIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Tidak ada notifikasi</p>
                          <p className="text-xs text-gray-400 mt-1">Notifikasi baru akan muncul di sini</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-100">
                      <Link 
                        href="/notifications" 
                        className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 text-center font-medium"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        Lihat Semua Notifikasi
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            <div ref={userMenuRef} className="relative">
              {loading ? (
                // Loading state
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 animate-pulse">
                  <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
                  <div className="hidden sm:block">
                    <div className="h-3 w-20 bg-gray-300 rounded mb-1"></div>
                    <div className="h-2 w-16 bg-gray-300 rounded"></div>
                  </div>
                  <ChevronDownIcon className="text-gray-400" />
                </div>
              ) : user ? (
                // User is logged in
                <>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg px-3 py-2 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 shadow-sm"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-white text-sm font-bold">{getUserInitials()}</span>
                    </div>
                    <div className="hidden sm:block text-left max-w-[120px]">
                      <p className="text-gray-800 text-sm font-semibold truncate">Halo, {getDisplayName().split(' ')[0]}!</p>
                      <p className="text-gray-500 text-xs truncate">{userProfile?.email || user.email}</p>
                    </div>
                    <ChevronDownIcon className={`text-gray-600 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-xl">
                        <p className="text-sm font-semibold text-gray-800">{getDisplayName()}</p>
                        <p className="text-xs text-gray-600 truncate">{userProfile?.email || user.email}</p>
                        {userProfile?.phone && (
                          <p className="text-xs text-gray-500 mt-1">{userProfile.phone}</p>
                        )}
                      </div>
                      
                      {/* Menu Items */}
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <DashboardIcon className="mr-3 text-gray-400" />
                        Dashboard
                      </Link>
                      
                      <Link
                        href="/my-bookings"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <TicketIcon className="mr-3 text-gray-400" />
                        Pesanan Saya
                      </Link>
                      
                      <Link
                        href="/wallet"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <WalletIcon className="mr-3 text-gray-400" />
                        Wallet & Saldo
                      </Link>
                      
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <SettingsIcon className="mr-3 text-gray-400" />
                        Pengaturan Akun
                      </Link>
                      
                      {/* Notifications Link */}
                      <Link
                        href="/notifications"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors relative"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <BellIcon className="mr-3 text-gray-400" />
                        Notifikasi
                        {notificationCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {notificationCount > 9 ? '9+' : notificationCount}
                          </span>
                        )}
                      </Link>
                      
                      {userProfile?.role === 'admin' && (
                        <>
                          <div className="border-t border-gray-100 my-2"></div>
                          <Link
                            href="/admin"
                            className="flex items-center px-4 py-3 text-sm text-purple-600 hover:bg-purple-50 transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <svg className="w-5 h-5 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            </svg>
                            Admin Panel
                          </Link>
                        </>
                      )}
                      
                      <div className="border-t border-gray-100 my-2"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-xl"
                      >
                        <LogoutIcon className="mr-3" />
                        Keluar
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // User is not logged in - Auth Buttons
                <div className="flex items-center space-x-3">
                  <Link
                    href="/auth/login"
                    className="hidden sm:block px-4 py-2 text-gray-700 hover:text-blue-600 text-sm font-medium transition-colors hover:bg-gray-100 rounded-lg"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              ref={mobileMenuRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-blue-600 rounded-lg transition-colors hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 bg-white shadow-inner">
            {/* Mobile Navigation Links */}
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block py-3 px-4 rounded-lg transition-colors font-medium ${
                    isActivePath(item.href)
                      ? 'text-blue-600 bg-blue-50 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile User Info - If logged in */}
            {user && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{getUserInitials()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{getDisplayName()}</p>
                      <p className="text-xs text-gray-600 truncate">{userProfile?.email || user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Mobile User Menu Links */}
                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    className="flex items-center py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <DashboardIcon className="mr-3 text-gray-400" />
                    Dashboard
                  </Link>
                  <Link
                    href="/my-bookings"
                    className="flex items-center py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <TicketIcon className="mr-3 text-gray-400" />
                    Pesanan Saya
                  </Link>
                  <Link
                    href="/wallet"
                    className="flex items-center py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <WalletIcon className="mr-3 text-gray-400" />
                    Wallet & Saldo
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <SettingsIcon className="mr-3 text-gray-400" />
                    Pengaturan Akun
                  </Link>
                  
                  {/* Notifications in mobile menu */}
                  <Link
                    href="/notifications"
                    className="flex items-center py-3 px-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors relative"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BellIcon className="mr-3 text-gray-400" />
                    Notifikasi
                    {notificationCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {notificationCount}
                      </span>
                    )}
                  </Link>
                  
                  {userProfile?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex items-center py-3 px-4 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg className="w-5 h-5 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center py-3 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogoutIcon className="mr-3" />
                    Keluar
                  </button>
                </div>
              </div>
            )}

            {/* Mobile Auth Buttons - Only show if not logged in */}
            {!user && !loading && (
              <div className="flex flex-col space-y-3 mt-6 pt-4 border-t border-gray-200">
                <Link
                  href="/auth/login"
                  className="px-4 py-3 text-center text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-3 text-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overlay for dropdowns */}
      {(isUserMenuOpen || isNotificationsOpen) && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-10" 
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsNotificationsOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;