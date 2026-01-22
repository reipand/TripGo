// app/admin/test/page.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

export default function AdminTestPage() {
  const { 
    user, 
    userProfile, 
    loading, 
    isInitialized, 
    isAdmin, 
    isSuperAdmin,
    fetchUserProfile 
  } = useAuth();

  useEffect(() => {
    console.log('=== ADMIN TEST PAGE ===');
    console.log('User:', user?.email);
    console.log('User Profile:', userProfile);
    console.log('Role:', userProfile?.role);
    console.log('isAdmin:', isAdmin);
    console.log('isSuperAdmin:', isSuperAdmin);
    console.log('Loading:', loading);
    console.log('Initialized:', isInitialized);
    console.log('======================');
  }, [user, userProfile, loading, isInitialized, isAdmin, isSuperAdmin]);

  const handleRefresh = async () => {
    console.log('Manually refreshing profile...');
    await fetchUserProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auth data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Access Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* User Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">User Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-mono text-gray-800">{user?.email || 'Not logged in'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-mono text-sm text-gray-600 truncate">{user?.id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Auth Status</p>
                <p className={`inline-block px-2 py-1 rounded text-xs ${user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user ? 'Authenticated' : 'Not Authenticated'}
                </p>
              </div>
            </div>
          </div>

          {/* Role Info Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Role Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Database Role</p>
                <div className={`inline-block px-3 py-1 rounded-full font-medium ${
                  userProfile?.role === 'admin' || userProfile?.role === 'super_admin'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {userProfile?.role || 'Not loaded'}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">isAdmin (from context)</p>
                <p className={`font-semibold ${isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                  {isAdmin ? '✅ TRUE' : '❌ FALSE'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">isSuperAdmin (from context)</p>
                <p className={`font-semibold ${isSuperAdmin ? 'text-green-600' : 'text-red-600'}`}>
                  {isSuperAdmin ? '✅ TRUE' : '❌ FALSE'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Has Admin Access</p>
                <p className={`font-semibold ${isAdmin || isSuperAdmin ? 'text-green-600' : 'text-red-600'}`}>
                  {isAdmin || isSuperAdmin ? '✅ YES' : '❌ NO'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
            >
              Refresh Profile
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
            >
              Reload Page
            </button>
            <button
              onClick={() => window.location.href = '/admin/dashboard'}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
            >
              Try Admin Dashboard
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
            >
              Go to User Dashboard
            </button>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-900 text-white rounded-xl p-6 font-mono text-sm">
          <h3 className="font-bold mb-3">Debug Information</h3>
          <pre className="whitespace-pre-wrap overflow-auto">
            {JSON.stringify({
              timestamp: new Date().toISOString(),
              user: {
                email: user?.email,
                id: user?.id,
                metadata: user?.user_metadata
              },
              profile: userProfile,
              computed: {
                isAdmin,
                isSuperAdmin,
                hasRoleAdmin: userProfile ? ['admin', 'super_admin'].includes(userProfile.role) : false
              },
              state: {
                loading,
                isInitialized
              }
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}