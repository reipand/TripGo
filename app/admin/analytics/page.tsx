'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import AdminLayout from '@/app/admin/layout';
import { supabase } from '@/app/lib/supabaseClient';
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  Download,
  Filter,
  DollarSign,
  Ticket,
  Train,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';

export default function AdminAnalytics() {
  useAdminRoute(); // Protect route
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y
  const [analyticsData, setAnalyticsData] = useState({
    revenue: {
      total: 0,
      growth: 0,
      dailyAverage: 0,
      data: [] as { date: string; amount: number }[]
    },
    bookings: {
      total: 0,
      growth: 0,
      successful: 0,
      cancelled: 0,
      data: [] as { date: string; count: number }[]
    },
    users: {
      total: 0,
      growth: 0,
      new: 0,
      active: 0,
      data: [] as { date: string; count: number }[]
    },
    trains: {
      total: 0,
      occupancy: 0,
      popular: [] as { name: string; bookings: number }[]
    },
    topRoutes: [] as { route: string; bookings: number; revenue: number }[],
    paymentMethods: [] as { method: string; percentage: number; count: number }[]
  });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const days = parseInt(timeRange.replace('d', '').replace('y', '') || '30');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch revenue data
      const { data: revenueData } = await supabase
        .from('bookings_kereta')
        .select('total_amount, booking_date, payment_status')
        .eq('payment_status', 'paid')
        .gte('booking_date', startDate.toISOString())
        .order('booking_date', { ascending: true });

      // Fetch bookings data
      const { data: bookingsData } = await supabase
        .from('bookings_kereta')
        .select('id, booking_date, status')
        .gte('booking_date', startDate.toISOString());

      // Fetch users data
      const { data: usersData } = await supabase
        .from('users')
        .select('id, created_at, last_login')
        .gte('created_at', startDate.toISOString());

      // Fetch trains data
      const { data: trainsData } = await supabase
        .from('kereta')
        .select('*');

      // Process revenue data
      const revenueByDate = revenueData?.reduce((acc: any, booking) => {
        const date = new Date(booking.booking_date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (booking.total_amount || 0);
        return acc;
      }, {});

      const revenueChartData = Object.entries(revenueByDate || {}).map(([date, amount]) => ({
        date,
        amount: amount as number
      }));

      // Process bookings data
      const bookingsByDate = bookingsData?.reduce((acc: any, booking) => {
        const date = new Date(booking.booking_date).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const bookingsChartData = Object.entries(bookingsByDate || {}).map(([date, count]) => ({
        date,
        count: count as number
      }));

      // Process users data
      const usersByDate = usersData?.reduce((acc: any, user) => {
        const date = new Date(user.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const usersChartData = Object.entries(usersByDate || {}).map(([date, count]) => ({
        date,
        count: count as number
      }));

      // Calculate statistics
      const totalRevenue = revenueData?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
      const totalBookings = bookingsData?.length || 0;
      const successfulBookings = bookingsData?.filter(b => b.status === 'confirmed' || b.status === 'paid').length || 0;
      const newUsers = usersData?.length || 0;
      const totalUsers = (await supabase.from('users').select('*', { count: 'exact' })).count || 0;

      setAnalyticsData({
        revenue: {
          total: totalRevenue,
          growth: 12.5, // Example growth percentage
          dailyAverage: totalRevenue / days,
          data: revenueChartData
        },
        bookings: {
          total: totalBookings,
          growth: 8.3,
          successful: successfulBookings,
          cancelled: bookingsData?.filter(b => b.status === 'cancelled').length || 0,
          data: bookingsChartData
        },
        users: {
          total: totalUsers,
          growth: 15.2,
          new: newUsers,
          active: usersData?.filter(u => u.last_login && new Date(u.last_login) > startDate).length || 0,
          data: usersChartData
        },
        trains: {
          total: trainsData?.length || 0,
          occupancy: 78.5,
          popular: [
            { name: 'Argo Wilis', bookings: 245 },
            { name: 'Taksaka', bookings: 189 },
            { name: 'Gajayana', bookings: 156 }
          ]
        },
        topRoutes: [
          { route: 'Jakarta - Bandung', bookings: 456, revenue: 125000000 },
          { route: 'Jakarta - Surabaya', bookings: 389, revenue: 198000000 },
          { route: 'Bandung - Yogyakarta', bookings: 267, revenue: 89000000 }
        ],
        paymentMethods: [
          { method: 'Bank Transfer', percentage: 45, count: 567 },
          { method: 'Credit Card', percentage: 30, count: 378 },
          { method: 'E-Wallet', percentage: 20, count: 252 },
          { method: 'Virtual Account', percentage: 5, count: 63 }
        ]
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2">Performance insights and key metrics</p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 px-4 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <span className={`text-sm font-medium ${analyticsData.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analyticsData.revenue.growth >= 0 ? '+' : ''}{analyticsData.revenue.growth}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {formatCurrency(analyticsData.revenue.total)}
            </h3>
            <p className="text-gray-600 text-sm">Total Revenue</p>
            <p className="text-xs text-gray-500 mt-2">
              Avg: {formatCurrency(analyticsData.revenue.dailyAverage)}/day
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Ticket className="w-6 h-6 text-green-600" />
              </div>
              <span className={`text-sm font-medium ${analyticsData.bookings.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analyticsData.bookings.growth >= 0 ? '+' : ''}{analyticsData.bookings.growth}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {analyticsData.bookings.total.toLocaleString()}
            </h3>
            <p className="text-gray-600 text-sm">Total Bookings</p>
            <p className="text-xs text-gray-500 mt-2">
              {analyticsData.bookings.successful} successful
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className={`text-sm font-medium ${analyticsData.users.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analyticsData.users.growth >= 0 ? '+' : ''}{analyticsData.users.growth}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {analyticsData.users.total.toLocaleString()}
            </h3>
            <p className="text-gray-600 text-sm">Total Users</p>
            <p className="text-xs text-gray-500 mt-2">
              {analyticsData.users.new} new this period
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-orange-100">
                <Train className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-green-600">
                {analyticsData.trains.occupancy}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">
              {analyticsData.trains.total}
            </h3>
            <p className="text-gray-600 text-sm">Active Trains</p>
            <p className="text-xs text-gray-500 mt-2">
              {analyticsData.trains.occupancy}% occupancy rate
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Revenue Trend</h2>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 flex flex-col justify-end">
              {analyticsData.revenue.data.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No revenue data for selected period</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-end space-x-1 h-48">
                  {analyticsData.revenue.data.slice(-14).map((item, index) => {
                    const maxAmount = Math.max(...analyticsData.revenue.data.map(d => d.amount));
                    const height = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 rounded-t-lg transition-all duration-300 hover:bg-blue-600"
                          style={{ height: `${height}%` }}
                          title={`${formatCurrency(item.amount)} - ${item.date}`}
                        />
                        <span className="text-xs text-gray-500 mt-2 truncate">
                          {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bookings Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Bookings Trend</h2>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64">
              {analyticsData.bookings.data.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No bookings data for selected period</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-end space-x-1 h-48">
                  {analyticsData.bookings.data.slice(-14).map((item, index) => {
                    const maxCount = Math.max(...analyticsData.bookings.data.map(d => d.count));
                    const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-green-500 rounded-t-lg transition-all duration-300 hover:bg-green-600"
                          style={{ height: `${height}%` }}
                          title={`${item.count} bookings - ${item.date}`}
                        />
                        <span className="text-xs text-gray-500 mt-2 truncate">
                          {new Date(item.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Routes */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Top Routes</h2>
              <Train className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analyticsData.topRoutes.map((route, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-800">{route.route}</p>
                    <p className="text-sm text-gray-600">{route.bookings.toLocaleString()} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(route.revenue)}</p>
                    <p className="text-sm text-gray-600">revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Payment Methods</h2>
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analyticsData.paymentMethods.map((method, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{method.method}</span>
                    <span className="text-sm font-semibold text-gray-900">{method.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {method.count.toLocaleString()} transactions
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Trains */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Popular Trains</h2>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {analyticsData.trains.popular.map((train, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Train className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{train.name}</p>
                      <p className="text-sm text-gray-600">{train.bookings.toLocaleString()} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      #{index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}