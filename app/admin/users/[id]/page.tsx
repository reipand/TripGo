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
  RefreshCw,
  AlertCircle,
  Clock // ADD THIS
} from 'lucide-react';

// Interfaces
interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

interface ApiResponse {
  success: boolean;
  data?: UserDetail;
  error?: string;
}

export default function UserDetailPage() {
  useAdminRoute();
  const router = useRouter();
  const params = useParams();
  const { userProfile, getToken } = useAuth();
  
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  const userId = params.id as string;

  const fetchUserDetails = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    console.log('Fetching user details for ID:', userId);

    // Try multiple ways to get the token
    let token: string | null = null;
    
    // Method 1: Use getToken from AuthContext
    if (typeof getToken === 'function') {
      token = await getToken();
      console.log('Token from getToken:', token ? `Found (length: ${token.length})` : 'Not found');
    }
    
    // Method 2: Try localStorage with different keys
    if (!token) {
      console.log('Trying to get token from localStorage...');
      
      // Try multiple possible storage keys
      const possibleKeys = [
        'supabase.auth.token',
        'sb-auth-token',
        'auth-token',
        'access_token',
        'token'
      ];
      
      for (const key of possibleKeys) {
        try {
          const stored = localStorage.getItem(key);
          console.log(`Key "${key}":`, stored ? 'Exists' : 'Not found');
          
          if (stored) {
            // Try to parse as JSON
            try {
              const parsed = JSON.parse(stored);
              console.log(`Parsed ${key}:`, { 
                type: typeof parsed,
                hasCurrentSession: !!parsed?.currentSession,
                hasAccessToken: !!parsed?.access_token,
                hasCurrentAccessToken: !!parsed?.currentSession?.access_token,
                hasToken: !!parsed?.token,
                keys: Object.keys(parsed || {})
              });
              
              // Extract token from various possible structures
              token = parsed?.currentSession?.access_token || 
                      parsed?.access_token || 
                      parsed?.token ||
                      parsed;
                      
              if (token && typeof token === 'string') {
                console.log(`Token found from ${key}, length: ${token.length}`);
                break;
              }
            } catch (parseError) {
              // If it's not JSON, it might be a plain token string
              if (typeof stored === 'string' && stored.length > 100) {
                token = stored;
                console.log(`Plain token found from ${key}, length: ${token.length}`);
                break;
              }
            }
          }
        } catch (e) {
          console.error(`Error reading key ${key}:`, e);
          continue;
        }
      }
    }
    
    // Method 3: Try to get from cookies as last resort
    if (!token) {
      console.log('Checking cookies...');
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name.includes('token') || name.includes('access')) {
          token = value;
          console.log(`Token found in cookie ${name}, length: ${token.length}`);
          break;
        }
      }
    }

    // If still no token, check if we're in a valid session
    if (!token) {
      console.error('No token found after all attempts');
      
      // Check if user is actually logged in
      if (userProfile) {
        console.log('User profile exists but no token found:', userProfile);
        // Try to redirect to refresh token
        window.location.href = `/auth/refresh?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      
      // Redirect to login
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('auth-token');
      
      router.push('/auth/login?redirect=' + encodeURIComponent(`/admin/users/${userId}`));
      return;
    }

    console.log('Making API call with token length:', token.length);
    
    // Fetch user data dari API dengan Authorization header
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store',
      credentials: 'include' // Include cookies if using cookie-based auth
    });

    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        console.log('API error data:', errorData);
        errorMessage = errorData.error || errorData.message || errorMessage;
        
        // If token is invalid/expired, clear and redirect
        if (response.status === 401 || errorData.code === 'UNAUTHORIZED') {
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('sb-auth-token');
          localStorage.removeItem('auth-token');
          
          // Clear all localStorage items starting with supabase or sb
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase') || key.startsWith('sb-')) {
              localStorage.removeItem(key);
            }
          });
          
          router.push('/auth/login?redirect=' + encodeURIComponent(`/admin/users/${userId}`));
          return;
        }
      } catch (e) {
        console.log('Could not read error response as JSON');
      }
      
      if (response.status === 403) {
        throw new Error('You do not have permission to view this user.');
      } else if (response.status === 404) {
        throw new Error('User not found');
      } else {
        throw new Error(errorMessage);
      }
    }

    const result: ApiResponse = await response.json();
    console.log('API result success:', result.success);

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to load user details');
    }

    setUser(result.data);
    console.log('User data set successfully');

  } catch (err: any) {
    console.error('Error fetching user details:', err);
    
    // Don't set error if we're redirecting
    if (err.message.includes('redirect')) {
      return;
    }
    
    setError(err.message || 'Failed to load user details');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [userId, getToken, router, userProfile]); // Added userProfile to dependencies

  useEffect(() => {
    if (userId) {
      console.log('Component mounted, fetching user details...');
      fetchUserDetails();
    }
  }, [userId, fetchUserDetails]);

  const handleRefresh = () => {
    console.log('Refreshing user details...');
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

  const getRoleDisplay = (role: string) => {
    return role?.replace('_', ' ').toUpperCase() || 'USER';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading user details...</p>
        {refreshing && <p className="text-sm text-gray-500 mt-2">Refreshing...</p>}
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
          <div className="space-y-3">
            <button
              onClick={fetchUserDetails}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg mx-2"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/auth/login?redirect=' + encodeURIComponent(`/admin/users/${userId}`))}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mx-2"
            >
              Login Again
            </button>
          </div>
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
          <button
            onClick={() => router.push('/admin/users')}
            className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
          >
            Return to Users List
          </button>
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
                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-800">{user.name || user.email || 'No Name'}</h1>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleDisplay(user.role)}
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
          </div>
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

            {/* Additional Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">User ID</p>
                    <p className="font-mono text-sm">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(user.updated_at)}</p>
                  </div>
                </div>
              </div>
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
                      onClick={async () => {
                        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                          return;
                        }
                        try {
                          const token = await getToken?.();
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
                      }}
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