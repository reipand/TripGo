'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from './contexts/LoadingContext';
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

const AdminDashboard = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
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
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch bookings with time filter
      const { data: bookings, count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .gte('created_at', startDate.toISOString());

      // Calculate booking stats
      const bookingStats = {
        pending: bookings?.filter(b => b.status === 'pending').length || 0,
        confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
        completed: bookings?.filter(b => b.status === 'completed').length || 0,
        cancelled: bookings?.filter(b => b.status === 'cancelled').length || 0,
      };

      // Calculate revenue from confirmed and completed bookings
      const revenueBookings = bookings?.filter(b => 
        b.status === 'confirmed' || b.status === 'completed'
      ) || [];
      
      const revenue = revenueBookings.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

      // Fetch pending transactions
      const { count: pendingCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch recent bookings
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(8);

      // Fetch top destinations
      const { data: destinations } = await supabase
        .from('bookings')
        .select('destination')
        .not('destination', 'is', null)
        .limit(5);

      const destinationCounts = destinations?.reduce((acc: any, curr) => {
        acc[curr.destination] = (acc[curr.destination] || 0) + 1;
        return acc;
      }, {});

      const topDestinations = Object.entries(destinationCounts || {})
        .map(([name, count]) => ({ name, count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5);

      // Calculate growth (simplified)
      const monthlyGrowth = 12.5; // This would come from your analytics

      setStats({
        totalUsers: usersCount || 0,
        totalBookings: bookingsCount || 0,
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
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner text="Memuat dashboard..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-1">
            Selamat datang, {userProfile?.first_name || user?.email}!
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Terakhir diperbarui: {new Date().toLocaleTimeString('id-ID')}
          </p>
        </div>
        
        {/* Time Range Filter */}
        <div className="flex items-center space-x-2 bg-white rounded-lg border p-1">
          {(['today', 'week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                timeRange === range
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {range === 'today' ? 'Hari Ini' : 
               range === 'week' ? 'Minggu Ini' : 
               range === 'month' ? 'Bulan Ini' : 'Tahun Ini'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pengguna</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <span>↑ 5.2%</span>
                <span className="text-gray-400 ml-1">dari bulan lalu</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-blue-600">👥</span>
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pesanan</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBookings}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <span>↑ 12.5%</span>
                <span className="text-gray-400 ml-1">dari bulan lalu</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-green-600">🎫</span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pendapatan</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(stats.totalRevenue)}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <span>↑ 8.3%</span>
                <span className="text-gray-400 ml-1">dari bulan lalu</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-purple-600">💰</span>
            </div>
          </div>
        </div>

        {/* Pending Transactions */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingTransactions}</p>
              <p className="text-xs text-gray-500 mt-1">Perlu konfirmasi</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <span className="text-2xl text-orange-600">⏳</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Charts and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Status */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Pesanan</h3>
          <div className="space-y-4">
            {Object.entries(stats.bookingStats).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getStatusIcon(status)}</span>
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status === 'confirmed' ? 'Terkonfirmasi' :
                     status === 'completed' ? 'Selesai' :
                     status === 'pending' ? 'Menunggu' :
                     status === 'cancelled' ? 'Dibatalkan' : status}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Destinations */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Destinasi Populer</h3>
          <div className="space-y-3">
            {stats.topDestinations.map((destination, index) => (
              <div key={destination.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{destination.name}</span>
                </div>
                <span className="text-sm text-gray-500">{destination.count} pesanan</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistik Cepat</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rata-rata Pesanan/Hari</span>
              <span className="font-semibold text-gray-900">
                {Math.round(stats.totalBookings / 30)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Konversi Pesanan</span>
              <span className="font-semibold text-green-600">68%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rating Kepuasan</span>
              <span className="font-semibold text-yellow-600">4.8/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Pesanan Terbaru</h3>
            <button 
              onClick={fetchStats}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Refresh Data
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destinasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{booking.order_id || booking.id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">
                        {booking.profiles?.first_name} {booking.profiles?.last_name}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {booking.profiles?.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.destination || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(Number(booking.total_amount || 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {getStatusIcon(booking.status)} {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
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
  );
};

export default AdminDashboard;