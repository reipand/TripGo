'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import { realtimeManager } from '@/app/lib/realtimeClient';
import { AdminStatsCards } from '@/app/components/admin/stats-cards';
import { RecentBookings } from '@/app/components/admin/recent-bookings';
import { RevenueChart } from '@/app/components/admin/revenue-chart';
import { TopRoutes } from '@/app/components/admin/top-routes';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  useAdminRoute();
  const { userProfile, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingPayments: 0,
    todayRevenue: 0,
    availableTrains: 0,
    scheduledTrips: 0
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Parallel data fetching
      const [
        bookingsTotal,
        bookingsToday,
        revenueTotal,
        usersActive,
        paymentsPending,
        recentTx,
        revenueChart
      ] = await Promise.all([
        supabase.from('bookings_kereta').select('*', { count: 'exact', head: true }),
        supabase.from('bookings_kereta').select('*', { count: 'exact', head: true }).gte('booking_date', todayStr),
        supabase.from('bookings_kereta').select('total_amount').eq('status', 'confirmed'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('bookings_kereta').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
        supabase.from('bookings_kereta').select('*').order('booking_date', { ascending: false }).limit(10),
        supabase.from('bookings_kereta').select('booking_date, total_amount').eq('status', 'confirmed').gte('booking_date', thirtyDaysAgo)
      ]);

      const totalRevenue = revenueTotal.data?.reduce((acc: any, curr: { total_amount: any; }) => acc + (curr.total_amount || 0), 0) || 0;

      setStats({
        totalBookings: bookingsTotal.count || 0,
        todayBookings: bookingsToday.count || 0,
        totalRevenue: totalRevenue,
        activeUsers: usersActive.count || 0,
        pendingPayments: paymentsPending.count || 0,
        todayRevenue: 0, // Calculate if needed
        availableTrains: 0,
        scheduledTrips: 0
      });

      setRecentBookings(recentTx.data || []);
      setRevenueData(revenueChart.data || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();

      // Realtime subscription
      // We can reuse realtimeManager or setup specific channel here
      // For simplicity, let's subscribe to 'bookings_kereta' changes
      // Realtime subscription for multiple tables
      const channel = supabase.channel('admin-dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings_kereta' }, () => {
          fetchData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          fetchData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kereta' }, () => {
          // If we add train stats later
          fetchData();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Selamat datang kembali, <strong>{userProfile?.name || 'Admin'}</strong>!</p>
        </header>

        <AdminStatsCards stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Pendapatan 30 Hari Terakhir</h2>
            <RevenueChart data={revenueData} />
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Rute Terpopuler</h2>
            <TopRoutes data={[]} /> {/* Placeholder for now */}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Booking Terbaru</h2>
            <Link href="/admin/bookings" className="text-blue-600 hover:underline text-sm font-medium">Lihat Semua</Link>
          </div>
          <RecentBookings bookings={recentBookings} />
        </div>
      </div>
    </div>
  );
}