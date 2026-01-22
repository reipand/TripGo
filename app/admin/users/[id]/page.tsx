// app/admin/users/[id]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Ticket,
  DollarSign,
  Clock,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

// Interfaces
interface UserDetail {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: 'super_admin' | 'admin' | 'staff' | 'user';
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  booking_count?: number;
  total_spent?: number;
  formatted_dates?: {
    created_at: string;
    last_login: string;
  };
}

interface Booking {
  id: string;
  booking_number: string;
  status: string;
  total_price: number;
  departure_date: string;
  created_at: string;
}

interface BookingStats {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  totalSpent: number;
  averageSpent: number;
}

interface ApiResponse {
  success: boolean;
  data?: UserDetail;
  error?: string;
}

interface BookingsApiResponse {
  success: boolean;
  data?: Booking[];
  error?: string;
}

export default function UserDetailPage() {
  useAdminRoute();
  const router = useRouter();
  const params = useParams();
  const { userProfile, getToken } = useAuth();
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'activity' | 'settings'>('overview');
  const [bookingStats, setBookingStats] = useState<BookingStats>({
    total: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    totalSpent: 0,
    averageSpent: 0
  });

  const userId = params.id as string;

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get authentication token
      const token = getToken?.();
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Fetch user data from API
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized access. Please login again.');
        } else if (response.status === 404) {
          throw new Error('User not found');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const result: ApiResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to load user details');
      }

      setUser(result.data);

      // Fetch user bookings from API
      const bookingsResponse = await fetch(`/api/admin/bookings?user_id=${userId}&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!bookingsResponse.ok) {
        console.warn('Failed to fetch bookings:', bookingsResponse.status);
        setBookings([]);
        setBookingStats({
          total: 0,
          completed: 0,
          pending: 0,
          cancelled: 0,
          totalSpent: 0,
          averageSpent: 0
        });
      } else {
        const bookingsResult: BookingsApiResponse = await bookingsResponse.json();
        if (bookingsResult.success && bookingsResult.data) {
          const processedBookings: Booking[] = bookingsResult.data.map(booking => ({
            id: booking.id,
            booking_number: booking.booking_number || `BOOK-${booking.id.substring(0, 8)}`,
            status: booking.status || 'pending',
            total_price: booking.total_price || 0,
            departure_date: booking.departure_date || booking.created_at,
            created_at: booking.created_at
          }));
          setBookings(processedBookings);
          calculateBookingStats(processedBookings);
        } else {
          setBookings([]);
          setBookingStats({
            total: 0,
            completed: 0,
            pending: 0,
            cancelled: 0,
            totalSpent: 0,
            averageSpent: 0
          });
        }
      }

    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError(err.message || 'Failed to load user details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, getToken]);

  const calculateBookingStats = (bookingsData: Booking[]) => {
    const stats: BookingStats = {
      total: bookingsData.length,
      completed: bookingsData.filter(b => 
        b.status === 'completed' || b.status === 'success' || b.status === 'confirmed'
      ).length,
      pending: bookingsData.filter(b => b.status === 'pending' || b.status === 'processing').length,
      cancelled: bookingsData.filter(b => b.status === 'cancelled' || b.status === 'failed').length,
      totalSpent: bookingsData.reduce((sum, b) => sum + (b.total_price || 0), 0),
      averageSpent: 0
    };
    
    stats.averageSpent = stats.total > 0 ? stats.totalSpent / stats.total : 0;
    setBookingStats(stats);
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId, fetchUserDetails]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserDetails();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'staff':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'confirmed':
        return 'Completed';
      case 'pending':
      case 'processing':
        return 'Pending';
      case 'cancelled':
      case 'failed':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = getToken?.();
      if (!token) {
        alert('Authentication required');
        return;
      }
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        alert('User deleted successfully');
        router.push('/admin/users');
      } else {
        const result = await response.json();
        alert(result.error || 'Failed to delete user');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting user');
    }
  };

  // Calculate display stats using both API data and calculated stats
  const displayStats = {
    total: user?.booking_count || bookingStats.total,
    totalSpent: user?.total_spent || bookingStats.totalSpent,
    averageSpent: bookingStats.averageSpent,
    completed: bookingStats.completed,
    pending: bookingStats.pending,
    cancelled: bookingStats.cancelled
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </button>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading User</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchUserDetails}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </button>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <User className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-yellow-800 mb-2">User Not Found</h2>
          <p className="text-yellow-600">The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-800">{user.name || 'No Name'}</h1>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {user.role?.replace('_', ' ').toUpperCase() || 'USER'}
                </span>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-1 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-600">
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {userProfile?.role === 'super_admin' && user.id !== userProfile?.id && (
              <button
                onClick={() => router.push(`/admin/users/${userId}/edit`)}
                className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit User</span>
              </button>
            )}
            
            <button
              onClick={() => router.push(`/admin/bookings?userId=${userId}`)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Ticket className="w-4 h-4" />
              <span>View Bookings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{displayStats.total}</h3>
          <p className="text-gray-600 text-sm">Bookings</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Spent</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            {formatCurrency(displayStats.totalSpent)}
          </h3>
          <p className="text-gray-600 text-sm">Total Amount</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Average</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            {formatCurrency(displayStats.averageSpent)}
          </h3>
          <p className="text-gray-600 text-sm">Per Booking</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Last Activity</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            {user.formatted_dates?.last_login 
              ? user.formatted_dates.last_login.split(',')[0] 
              : user.last_login 
                ? formatDate(user.last_login).split(',')[0] 
                : 'Never'}
          </h3>
          <p className="text-gray-600 text-sm">Last Login</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'bookings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Recent Bookings ({bookings.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Account Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* User Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user.email}</p>
                      <span className={`inline-flex items-center text-xs ${user.email_verified ? 'text-green-600' : 'text-red-600'}`}>
                        {user.email_verified ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Not Verified
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {user.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{user.phone}</p>
                        <span className={`inline-flex items-center text-xs ${user.phone_verified ? 'text-green-600' : 'text-red-600'}`}>
                          {user.phone_verified ? 'Verified' : 'Not Verified'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Account Created</p>
                      <p className="font-medium">
                        {user.formatted_dates?.created_at || formatDate(user.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="font-medium">
                        {user.formatted_dates?.last_login || formatDate(user.last_login)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Stats */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-lg font-bold text-green-600">{displayStats.completed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 rounded-full h-2" 
                      style={{ width: `${displayStats.total > 0 ? (displayStats.completed / displayStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-lg font-bold text-yellow-600">{displayStats.pending}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 rounded-full h-2" 
                      style={{ width: `${displayStats.total > 0 ? (displayStats.pending / displayStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Cancelled</span>
                    <span className="text-lg font-bold text-red-600">{displayStats.cancelled}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 rounded-full h-2" 
                      style={{ width: `${displayStats.total > 0 ? (displayStats.cancelled / displayStats.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h3>
            
            {bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {booking.booking_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(booking.departure_date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {formatCurrency(booking.total_price)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No bookings found</p>
                <p className="mt-1">This user hasn't made any bookings yet.</p>
              </div>
            )}
            
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push(`/admin/bookings?userId=${userId}`)}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
              >
                View All Bookings →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Account Status</p>
                  <p className="text-sm text-gray-600">
                    {user.is_active 
                      ? 'This account is active and can login normally' 
                      : 'This account is deactivated and cannot login'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Email Verification</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.email_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.email_verified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>

                {user.phone && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Phone Verification</p>
                        <p className="text-sm text-gray-600">{user.phone}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.phone_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.phone_verified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {userProfile?.role === 'super_admin' && user.id !== userProfile?.id && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Danger Zone</h3>
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-red-800">Delete Account</p>
                      <p className="text-sm text-red-600">
                        Once deleted, this user's data cannot be recovered.
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteUser}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                    >
                      Delete User
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}