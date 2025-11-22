'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useLoading } from '@/app/contexts/LoadingContext';
import { supabase } from '@/app/lib/supabaseClient';

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  pendingTransactions: number;
  monthlyGrowth: number;
  bookingStats: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  recentBookings: any[];
  topDestinations: any[];
}

interface Booking {
  id: string;
  order_id?: string;
  destination?: string;
  status: string;
  total_amount: number;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const LoadingSpinner = ({ text = "Memuat..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
    <p className="text-gray-600">{text}</p>
  </div>
);

const AdminDashboard = () => {
  const { user, userProfile } = useAuth();
  const { setLoading } = useLoading();
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingTransactions: 0,
    monthlyGrowth: 0,
    bookingStats: {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    },
    recentBookings: [],
    topDestinations: [],
  });

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setIsLoading(true);
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Fetch users count
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch bookings with time filter
      const { data: bookings, count: bookingsCount, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (bookingsError) throw bookingsError;

      // Calculate booking stats
      const bookingStats = {
        pending: bookings?.filter((b: Booking) => b.status === 'pending').length || 0,
        confirmed: bookings?.filter((b: Booking) => b.status === 'confirmed').length || 0,
        completed: bookings?.filter((b: Booking) => b.status === 'completed').length || 0,
        cancelled: bookings?.filter((b: Booking) => b.status === 'cancelled').length || 0,
      };

      // Calculate revenue from confirmed and completed bookings
      const revenueBookings = bookings?.filter((b: Booking) => 
        b.status === 'confirmed' || b.status === 'completed'
      ) || [];
      
      const revenue = revenueBookings.reduce((sum: number, b: Booking) => 
        sum + Number(b.total_amount || 0), 0
      );

      // Fetch pending transactions
      const { count: pendingCount, error: pendingError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Fetch recent bookings with user profiles
      const { data: recentBookings, error: recentError } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(8) as { data: Booking[] | null; error: any };

      if (recentError) throw recentError;

      // Fetch top destinations
      const { data: destinations, error: destinationsError } = await supabase
        .from('bookings')
        .select('destination')
        .not('destination', 'is', null)
        .limit(10);

      if (destinationsError) throw destinationsError;

      const destinationCounts = destinations?.reduce((acc: any, curr) => {
        if (curr.destination) {
          acc[curr.destination] = (acc[curr.destination] || 0) + 1;
        }
        return acc;
      }, {});

      const topDestinations = Object.entries(destinationCounts || {})
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate growth based on previous period
      const previousPeriodStats = await getPreviousPeriodStats(startDate);
      const currentBookings = bookingsCount || 0;
      const previousBookings = previousPeriodStats.totalBookings;
      const monthlyGrowth = previousBookings > 0 
        ? ((currentBookings - previousBookings) / previousBookings) * 100 
        : currentBookings > 0 ? 100 : 0;

      setStats({
        totalUsers: usersCount || 0,
        totalBookings: currentBookings,
        totalRevenue: revenue,
        pendingTransactions: pendingCount || 0,
        monthlyGrowth,
        bookingStats,
        recentBookings: recentBookings || [],
        topDestinations,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const getPreviousPeriodStats = async (startDate: Date) => {
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    
    switch (timeRange) {
      case 'today':
        previousStartDate.setDate(previousStartDate.getDate() - 1);
        break;
      case 'week':
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case 'month':
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        break;
      case 'year':
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        break;
    }

    const { count: previousBookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', previousEndDate.toISOString());

    return {
      totalBookings: previousBookingsCount || 0,
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '✅';
      case 'completed':
        return '🎉';
      case 'pending':
        return '⏳';
      case 'cancelled':
        return '❌';
      default:
        return '📝';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Terkonfirmasi';
      case 'completed':
        return 'Selesai';
      case 'pending':
        return 'Menunggu';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Memuat dashboard admin..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard Admin</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Selamat datang, {userProfile?.first_name || user?.email}!
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}
            </p>
          </div>
          
          {/* Time Range Filter */}
          <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-1">
            {(['today', 'week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {range === 'today' ? 'Hari Ini' : 
                 range === 'week' ? 'Minggu' : 
                 range === 'month' ? 'Bulan' : 'Tahun'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Users */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pengguna</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <span>↑ 5.2%</span>
                  <span className="text-gray-400 ml-1">dari bulan lalu</span>
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <span className="text-xl sm:text-2xl text-blue-600">👥</span>
              </div>
            </div>
          </div>

          {/* Total Bookings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pesanan</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalBookings.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <span>↑ {stats.monthlyGrowth.toFixed(1)}%</span>
                  <span className="text-gray-400 ml-1">dari periode lalu</span>
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <span className="text-xl sm:text-2xl text-green-600">🎫</span>
              </div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <span>↑ 8.3%</span>
                  <span className="text-gray-400 ml-1">dari bulan lalu</span>
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <span className="text-xl sm:text-2xl text-purple-600">💰</span>
              </div>
            </div>
          </div>

          {/* Pending Transactions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                  {stats.pendingTransactions}
                </p>
                <p className="text-xs text-gray-500 mt-1">Perlu konfirmasi</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <span className="text-xl sm:text-2xl text-orange-600">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row - Charts and Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Booking Status */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Pesanan</h3>
            <div className="space-y-3">
              {Object.entries(stats.bookingStats).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getStatusIcon(status)}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {getStatusText(status)}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Destinations */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Destinasi Populer</h3>
            <div className="space-y-3">
              {stats.topDestinations.map((destination, index) => (
                <div key={destination.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {destination.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {destination.count} pesanan
                  </span>
                </div>
              ))}
              {stats.topDestinations.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Belum ada data destinasi
                </p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik Cepat</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Rata-rata Pesanan/Hari</span>
                <span className="font-semibold text-gray-900">
                  {Math.round(stats.totalBookings / (timeRange === 'today' ? 1 : 
                    timeRange === 'week' ? 7 : 
                    timeRange === 'month' ? 30 : 365))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Konversi Pesanan</span>
                <span className="font-semibold text-green-600">
                  {stats.totalBookings > 0 ? Math.round((stats.bookingStats.confirmed / stats.totalBookings) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pendapatan Rata-rata</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(stats.totalBookings > 0 ? stats.totalRevenue / stats.totalBookings : 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Pesanan Terbaru</h3>
              <button 
                onClick={fetchStats}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
              >
                <span>🔄</span>
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentBookings.map((booking: Booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{booking.order_id || booking.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <div>
                        <div className="font-medium">
                          {booking.profiles?.first_name} {booking.profiles?.last_name}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {booking.profiles?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(Number(booking.total_amount || 0))}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusIcon(booking.status)} {getStatusText(booking.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(booking.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {stats.recentBookings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <p className="text-gray-500 text-lg">Belum ada pesanan</p>
              <p className="text-gray-400 text-sm mt-1">
                Pesanan yang dibuat akan muncul di sini
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;