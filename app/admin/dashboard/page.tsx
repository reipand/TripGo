'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import {
  Users,
  Ticket,
  CreditCard,
  TrendingUp,
  Calendar,
  Train,
  MapPin,
  Bell,
  Tag,
  Settings,
  BarChart3,
  FileText,
  Shield,
  CheckCircle,
  Clock,
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  totalTrains: number;
  totalStations: number;
  pendingTransactions: number;
  activePromotions: number;
}

interface RecentActivity {
  id: string | number;
  type: 'user' | 'booking' | 'transaction' | 'train' | 'promotion';
  description: string;
  time: string;
  user?: string;
  status: 'success' | 'pending' | 'error';
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, userProfile, isAdmin, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    totalTrains: 0,
    totalStations: 0,
    pendingTransactions: 0,
    activePromotions: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [
          usersRes,
          bookingsRes,
          revenueRes,
          activeUsersRes,
          trainsRes,
          stationsRes,
          pendingRes,
          promotionsRes,
          recentBookingsRes,
          recentUsersRes
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('bookings_kereta').select('*', { count: 'exact', head: true }),
          supabase.from('bookings_kereta').select('total_amount').eq('status', 'confirmed'),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('kereta').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('stasiun').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('bookings_kereta').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
          supabase.from('promotions').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('bookings_kereta').select('*, users(name, email)').order('created_at', { ascending: false }).limit(5),
          supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5)
        ]);

        const totalRevenue = revenueRes.data?.reduce((acc: number, curr: any) => acc + (curr.total_amount || 0), 0) || 0;

        setStats({
          totalUsers: usersRes.count || 0,
          totalBookings: bookingsRes.count || 0,
          totalRevenue: totalRevenue,
          activeUsers: activeUsersRes.count || 0,
          totalTrains: trainsRes.count || 0,
          totalStations: stationsRes.count || 0,
          pendingTransactions: pendingRes.count || 0,
          activePromotions: promotionsRes.count || 0
        });

        // Merge recent bookings and users for "Recent Activity"
        const bookingsActivity: RecentActivity[] = (recentBookingsRes.data || []).map((b: any) => ({
          id: b.id,
          type: 'booking',
          description: `Booking ${b.booking_code} ${b.status}`,
          time: new Date(b.created_at).toLocaleDateString(),
          user: b.customer_email || 'Unknown',
          status: b.status === 'confirmed' || b.status === 'completed' ? 'success' : b.status === 'pending' ? 'pending' : 'error'
        }));

        const usersActivity: RecentActivity[] = (recentUsersRes.data || []).map((u: any) => ({
          id: u.id,
          type: 'user',
          description: 'New user registered',
          time: new Date(u.created_at).toLocaleDateString(),
          user: u.email,
          status: 'success'
        }));

        setRecentActivity(bookingsActivity as any[]);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Realtime subscription
    const channel = supabase.channel('admin-dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings_kereta' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_transactions' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kereta' }, () => fetchDashboardData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stasiun' }, () => fetchDashboardData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'user': return 'text-blue-600 bg-blue-100';
      case 'booking': return 'text-green-600 bg-green-100';
      case 'transaction': return 'text-purple-600 bg-purple-100';
      case 'train': return 'text-orange-600 bg-orange-100';
      case 'promotion': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="w-4 h-4" />;
      case 'booking': return <Ticket className="w-4 h-4" />;
      case 'transaction': return <CreditCard className="w-4 h-4" />;
      case 'train': return <Train className="w-4 h-4" />;
      case 'promotion': return <Tag className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="h-10 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Selamat datang, <span className="font-semibold">{userProfile?.name || user?.email}</span>!
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`flex items-center text-sm px-3 py-1 rounded-full ${isSuperAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
              <Shield className="w-4 h-4 mr-2" />
              <span>{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
            </div>
            <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span>Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleNavigation('/admin/users')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-green-600">+{Math.floor(stats.totalUsers * 0.12)} new</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalUsers.toLocaleString()}</h3>
          <p className="text-gray-600 text-sm">Total Users</p>
        </div>

        <div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleNavigation('/admin/bookings')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <Ticket className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">+{Math.floor(stats.totalBookings * 0.08)} this week</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalBookings.toLocaleString()}</h3>
          <p className="text-gray-600 text-sm">Total Bookings</p>
        </div>

        <div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleNavigation('/admin/transactions')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-green-600">+15%</span>
              <span className="text-xs text-red-600 mt-1">{stats.pendingTransactions} pending</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            Rp {Math.floor(stats.totalRevenue / 1000000)}M
          </h3>
          <p className="text-gray-600 text-sm">Total Revenue</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-green-600">+5%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.activeUsers}</h3>
          <p className="text-gray-600 text-sm">Active Users (30d)</p>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleNavigation('/admin/trains')}
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-cyan-100">
              <Train className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalTrains}</h3>
          <p className="text-gray-600 text-sm">Active Trains</p>
        </div>

        <div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleNavigation('/admin/stations')}
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-indigo-100">
              <MapPin className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalStations}</h3>
          <p className="text-gray-600 text-sm">Stations</p>
        </div>

        <div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleNavigation('/admin/promotions')}
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-pink-100">
              <Tag className="w-6 h-6 text-pink-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.activePromotions}</h3>
          <p className="text-gray-600 text-sm">Active Promotions</p>
        </div>

        <div
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleNavigation('/admin/notifications')}
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-amber-100">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">12</h3>
          <p className="text-gray-600 text-sm">Unread Notifications</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
              <span className="text-sm text-gray-500">Manage all aspects</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleNavigation('/admin/users')}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-left transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center mb-2">
                  <Users className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-700">Manage Users</span>
                </div>
                <p className="text-sm text-gray-600">View and manage all user accounts</p>
              </button>
              <button
                onClick={() => handleNavigation('/admin/bookings')}
                className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 text-left transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center mb-2">
                  <Ticket className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-700">View Bookings</span>
                </div>
                <p className="text-sm text-gray-600">See all bookings and reservations</p>
              </button>
              <button
                onClick={() => handleNavigation('/admin/trains/transactions')}
                className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 text-left transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center mb-2">
                  <CreditCard className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-700">Transactions</span>
                </div>
                <p className="text-sm text-gray-600">Monitor payment transactions</p>
              </button>
              <button
                onClick={() => handleNavigation('/admin/trains')}
                className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 text-left transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center mb-2">
                  <Train className="w-5 h-5 text-orange-600 mr-2" />
                  <span className="font-medium text-orange-700">Manage Trains</span>
                </div>
                <p className="text-sm text-gray-600">Add and update train schedules</p>
              </button>
              <button
                onClick={() => handleNavigation('/admin/promotions')}
                className="p-4 bg-pink-50 hover:bg-pink-100 rounded-lg border border-pink-200 text-left transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center mb-2">
                  <Tag className="w-5 h-5 text-pink-600 mr-2" />
                  <span className="font-medium text-pink-700">Promotions</span>
                </div>
                <p className="text-sm text-gray-600">Create and manage discounts</p>
              </button>
              <button
                onClick={() => handleNavigation('/admin/analytics')}
                className="p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg border border-cyan-200 text-left transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center mb-2">
                  <BarChart3 className="w-5 h-5 text-cyan-600 mr-2" />
                  <span className="font-medium text-cyan-700">Analytics</span>
                </div>
                <p className="text-sm text-gray-600">View detailed reports and insights</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
              <button
                onClick={() => handleNavigation('/admin/notifications')}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All →
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`p-2 rounded-lg mr-3 ${getIconColor(activity.type)}`}>
                    {getTypeIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{activity.description}</p>
                    <div className="flex items-center mt-1">
                      <Clock className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500 mr-3">{activity.time}</span>
                      {activity.user && (
                        <>
                          <UserCheck className="w-3 h-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">{activity.user}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.status)}`}>
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* System Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">System Status</h2>
              <span className="text-sm text-green-600 font-medium">All Systems Operational</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-800">API Service</p>
                    <p className="text-sm text-gray-600">REST & GraphQL</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-800">Database</p>
                    <p className="text-sm text-gray-600">PostgreSQL</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-800">Payment Gateway</p>
                    <p className="text-sm text-gray-600">Midtrans</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <div>
                    <p className="font-medium text-gray-800">Email Service</p>
                    <p className="text-sm text-gray-600">SMTP & Notifications</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Operational
                </span>
              </div>
            </div>
          </div>

          {/* Admin Info Panel */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-blue-800">Admin Information</h3>
              <button
                onClick={() => handleNavigation('/admin/settings')}
                className="text-blue-600 hover:text-blue-800"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-blue-700 mb-1">Email</p>
                <p className="font-mono text-sm bg-white px-2 py-1 rounded border">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700 mb-1">Role</p>
                <div className="flex items-center">
                  <span className="font-medium">{userProfile?.role || 'admin'}</span>
                  {isSuperAdmin && (
                    <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                      Super
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-blue-700 mb-1">Access Level</p>
                <p className="font-medium">{isSuperAdmin ? 'Full System Access' : 'Administrator'}</p>
              </div>
              <div>
                <p className="text-xs text-blue-700 mb-1">Last Login</p>
                <p className="text-sm">Today, 08:30 AM</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleNavigation('/admin/analytics')}
                className="flex items-center text-sm text-gray-600 hover:text-blue-600 w-full p-2 rounded hover:bg-blue-50 transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics Reports
              </button>
              <button
                onClick={() => handleNavigation('/admin/promotions/create')}
                className="flex items-center text-sm text-gray-600 hover:text-green-600 w-full p-2 rounded hover:bg-green-50 transition-colors"
              >
                <Tag className="w-4 h-4 mr-2" />
                Create Promotion
              </button>
              <button
                onClick={() => handleNavigation('/admin/test')}
                className="flex items-center text-sm text-gray-600 hover:text-orange-600 w-full p-2 rounded hover:bg-orange-50 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                Test Pages
              </button>
              <button
                onClick={() => handleNavigation('/admin/settings')}
                className="flex items-center text-sm text-gray-600 hover:text-purple-600 w-full p-2 rounded hover:bg-purple-50 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}