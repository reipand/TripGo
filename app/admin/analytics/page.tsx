'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface Analytics {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  bookingsByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  topUsers: { email: string; total_bookings: number; total_spent: number }[];
}

const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch bookings count
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Fetch total revenue
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount, status')
        .eq('status', 'confirmed');

      const revenue = bookings?.reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0;

      // Fetch bookings by status
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('status');

      const statusCounts: Record<string, number> = {};
      allBookings?.forEach((b) => {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      });

      const bookingsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      }));

      // Fetch revenue by month (simplified - in production use proper date grouping)
      const { data: revenueBookings } = await supabase
        .from('bookings')
        .select('total_amount, created_at, status')
        .eq('status', 'confirmed')
        .order('created_at', { ascending: true });

      const monthlyRevenue: Record<string, number> = {};
      revenueBookings?.forEach((b) => {
        const month = new Date(b.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(b.total_amount || 0);
      });

      const revenueByMonth = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        revenue,
      }));

      // Fetch top users
      const { data: userBookings } = await supabase
        .from('bookings')
        .select('user_id, total_amount, status')
        .eq('status', 'confirmed');

      const userStats: Record<string, { email: string; total_bookings: number; total_spent: number }> = {};
      
      for (const booking of userBookings || []) {
        if (!booking.user_id) continue;
        
        if (!userStats[booking.user_id]) {
          const { data: user } = await supabase
            .from('users')
            .select('email')
            .eq('id', booking.user_id)
            .single();
          
          userStats[booking.user_id] = {
            email: user?.email || 'Unknown',
            total_bookings: 0,
            total_spent: 0,
          };
        }
        
        userStats[booking.user_id].total_bookings += 1;
        userStats[booking.user_id].total_spent += Number(booking.total_amount || 0);
      }

      const topUsers = Object.values(userStats)
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 5);

      setAnalytics({
        totalUsers: usersCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue: revenue,
        bookingsByStatus,
        revenueByMonth,
        topUsers,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner text="Memuat analytics..." />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <p className="text-gray-600">Tidak ada data analytics</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Statistik dan analisis lengkap</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'year')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
        >
          <option value="week">Minggu Ini</option>
          <option value="month">Bulan Ini</option>
          <option value="year">Tahun Ini</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-primary-500">
          <p className="text-sm text-gray-600 font-medium">Total Pengguna</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{analytics.totalUsers}</p>
          <p className="text-xs text-gray-500 mt-1">Pengguna terdaftar</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-success-500">
          <p className="text-sm text-gray-600 font-medium">Total Pesanan</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{analytics.totalBookings}</p>
          <p className="text-xs text-gray-500 mt-1">Pesanan keseluruhan</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-warning-500">
          <p className="text-sm text-gray-600 font-medium">Total Pendapatan</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(analytics.totalRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Dari pesanan confirmed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bookings by Status */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pesanan per Status</h2>
          <div className="space-y-4">
            {analytics.bookingsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      item.status === 'confirmed'
                        ? 'bg-success-500'
                        : item.status === 'pending'
                        ? 'bg-warning-500'
                        : 'bg-error-500'
                    }`}
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">{item.status}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'confirmed'
                          ? 'bg-success-500'
                          : item.status === 'pending'
                          ? 'bg-warning-500'
                          : 'bg-error-500'
                      }`}
                      style={{
                        width: `${(item.count / analytics.totalBookings) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top 5 Pengguna</h2>
          <div className="space-y-4">
            {analytics.topUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Belum ada data</p>
            ) : (
              analytics.topUsers.map((user, index) => (
                <div key={user.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500">{user.total_bookings} pesanan</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(user.total_spent)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pendapatan per Bulan</h2>
        {analytics.revenueByMonth.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada data pendapatan</p>
        ) : (
          <div className="space-y-4">
            {analytics.revenueByMonth.map((item) => {
              const maxRevenue = Math.max(...analytics.revenueByMonth.map((r) => r.revenue));
              return (
                <div key={item.month} className="flex items-center space-x-4">
                  <div className="w-24 text-sm text-gray-700">{item.month}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-warning-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-300"
                      style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(item.revenue)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;

