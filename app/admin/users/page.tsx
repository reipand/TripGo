// app/admin/users/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Key,
  RefreshCw,
  DollarSign,
  Ticket,
  Loader2
} from 'lucide-react';
import { supabase } from '@/app/lib/supabaseClient';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'super_admin' | 'admin' | 'staff' | 'user';
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  booking_count?: number;
  total_spent?: number;
  metadata?: Record<string, any>;
}

interface ApiResponse {
  [x: string]: string;
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function AdminUsers() {
  useAdminRoute(); // Protect route
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userToUpdateRole, setUserToUpdateRole] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>('user');
  const [stats, setStats] = useState({
    total: 0,
    super_admin: 0,
    admin: 0,
    staff: 0,
    user: 0,
    active: 0,
    inactive: 0,
    totalBookings: 0,
    totalRevenue: 0
  });

  const itemsPerPage = 10;

 // Update the fetchUsers function to add debugging:
const fetchUsers = async () => {
  try {
    setLoading(true);
    setError(null);

    // Get Supabase session for debugging
    const { data: { session } } = await supabase.auth.getSession();
    
    console.log('Session:', session);
    console.log('User ID:', session?.user?.id);
    console.log('User Profile from context:', userProfile);

    if (!session) {
      throw new Error('No active session. Please login.');
    }

    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    if (searchTerm) {
      params.set('search', searchTerm);
    }

    if (roleFilter !== 'all') {
      params.set('role', roleFilter);
    }

    if (statusFilter !== 'all') {
      params.set('isActive', statusFilter === 'active' ? 'true' : 'false');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };

    console.log('Making request to /api/admin/users with token:', session.access_token?.substring(0, 20) + '...');

    const response = await fetch(`/api/admin/users?${params.toString()}`, {
      method: 'GET',
      headers
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized. Please login again.');
      } else if (response.status === 403) {
        throw new Error('Forbidden. You do not have admin privileges.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch users');
    }

    setUsers(data.data);
    setTotalCount(data.pagination.total);
    setTotalPages(data.pagination.totalPages);
    calculateStats(data.data);

  } catch (err: any) {
    console.error('Error fetching users:', err);
    setError(err.message || 'Failed to load users. Please check your connection.');
    
    if (err.message.includes('Unauthorized') || err.message.includes('401')) {
      router.push('/login?redirect=/admin/users');
    }
  } finally {
    setLoading(false);
  }
};

  // Calculate statistics from users data
  const calculateStats = (userList: User[]) => {
    const stats = {
      total: totalCount || userList.length,
      super_admin: userList.filter(u => u.role === 'super_admin').length,
      admin: userList.filter(u => u.role === 'admin').length,
      staff: userList.filter(u => u.role === 'staff').length,
      user: userList.filter(u => u.role === 'user').length,
      active: userList.filter(u => u.is_active).length,
      inactive: userList.filter(u => !u.is_active).length,
      totalBookings: userList.reduce((sum, u) => sum + (u.booking_count || 0), 0),
      totalRevenue: userList.reduce((sum, u) => sum + (u.total_spent || 0), 0)
    };
    
    setStats(stats);
  };

  useEffect(() => {
    if (!authLoading) {
      fetchUsers();
    }
  }, [currentPage, roleFilter, statusFilter, searchTerm, authLoading]);
// Add this function and call it in useEffect
const checkUserRole = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user?.id) {
      // Directly check the database
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, role, is_active')
        .eq('id', session.user.id)
        .single();
      
      console.log('Database user check:', { userData, error });
      
      if (userData) {
        console.log('User role:', userData.role);
        console.log('Is admin?', ['super_admin', 'admin'].includes(userData.role));
      }
    }
  } catch (error) {
    console.error('Error checking user role:', error);
  }
};

// Call it in useEffect
useEffect(() => {
  if (!authLoading) {
    checkUserRole();
    fetchUsers();
  }
}, [currentPage, roleFilter, statusFilter, searchTerm, authLoading]);
  // Handle user status toggle via API
 // Update toggleUserStatus function:
const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        is_active: !currentStatus
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update user status');
    }

    // Refresh data
    fetchUsers();
    alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
  } catch (err: any) {
    console.error('Error updating user status:', err);
    alert('Failed to update user status: ' + (err.message || 'Unknown error'));
  }
};

// Update updateUserRole function:
const updateUserRole = async () => {
  if (!userToUpdateRole) return;

  try {
    if (userToUpdateRole.id === userProfile?.id) {
      alert('You cannot change your own role');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/admin/users/${userToUpdateRole.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        role: newRole
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update user role');
    }

    // Refresh data
    fetchUsers();
    setShowRoleModal(false);
    setUserToUpdateRole(null);
    alert('User role updated successfully');
  } catch (err: any) {
    console.error('Error updating user role:', err);
    alert('Failed to update user role: ' + (err.message || 'Unknown error'));
  }
};

// Update deleteUser function:
const deleteUser = async (userId: string) => {
  try {
    if (userId === userProfile?.id) {
      alert('You cannot delete your own account');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete user');
    }

    // Refresh data
    fetchUsers();
    setShowDeleteModal(false);
    setUserToDelete(null);
    alert('User deleted successfully');
  } catch (err: any) {
    console.error('Error deleting user:', err);
    alert('Failed to delete user: ' + (err.message || 'Unknown error'));
  }
};

  // Get role badge color
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

  // Format date
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Users Management</h1>
            <p className="text-gray-600 mt-2">Manage user accounts and permissions</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            {userProfile?.role === 'super_admin' && (
              <button
                onClick={() => router.push('/admin/users/create')}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.total}</h3>
          <p className="text-gray-600 text-sm">Registered Users</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Active</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.active}</h3>
          <p className="text-gray-600 text-sm">Active Users</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Admins</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.super_admin + stats.admin}</h3>
          <p className="text-gray-600 text-sm">Admin Users</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <Ticket className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Bookings</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.totalBookings}</h3>
          <p className="text-gray-600 text-sm">Total Bookings</p>
        </div>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-cyan-100">
              <Calendar className="w-6 h-6 text-cyan-600" />
            </div>
            <span className="text-sm text-gray-500">This Month</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            {users.filter(u => {
              try {
                const createdDate = new Date(u.created_at);
                const now = new Date();
                return createdDate.getMonth() === now.getMonth() && 
                       createdDate.getFullYear() === now.getFullYear();
              } catch (e) {
                return false;
              }
            }).length}
          </h3>
          <p className="text-gray-600 text-sm">New Registrations</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-pink-100">
              <DollarSign className="w-6 h-6 text-pink-600" />
            </div>
            <span className="text-sm text-gray-500">Revenue</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            {formatCurrency(stats.totalRevenue)}
          </h3>
          <p className="text-gray-600 text-sm">Total Spent</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-indigo-100">
              <Key className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-500">Verification</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            {users.filter(u => u.email_verified).length}
          </h3>
          <p className="text-gray-600 text-sm">Email Verified</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="user">User</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Users</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
                >
                  Try Again →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 mb-6">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading users from database...</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {userProfile?.role === 'super_admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(users.map(u => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                      />
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity & Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="mt-1">Try adjusting your search or filters</p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setRoleFilter('all');
                            setStatusFilter('all');
                            setCurrentPage(1);
                          }}
                          className="mt-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      {userProfile?.role === 'super_admin' && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="font-semibold text-blue-600">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name || 'No Name'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{user.email_verified ? 'Verified' : 'Not Verified'}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role?.replace('_', ' ').toUpperCase() || 'USER'}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-xs text-gray-600">
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            Joined: {formatDate(user.created_at)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Last Login: {formatDate(user.last_login)}
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-2">
                            <div className="flex items-center">
                              <Ticket className="w-3 h-3 mr-1" />
                              <span>{user.booking_count || 0} bookings</span>
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="w-3 h-3 mr-1" />
                              <span>{formatCurrency(user.total_spent || 0)}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {userProfile?.role === 'super_admin' && (
                            <>
                              <button
                                onClick={() => {
                                  setUserToUpdateRole(user);
                                  setNewRole(user.role);
                                  setShowRoleModal(true);
                                }}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Change Role"
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => toggleUserStatus(user.id, user.is_active)}
                                className={`p-2 rounded-lg transition-colors ${user.is_active ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                                title={user.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {user.is_active ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                              
                              {user.id !== userProfile?.id && (
                                <button
                                  onClick={() => {
                                    setUserToDelete(user.id);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalCount)}
                  </span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}