// app/components/AdminRouteProtection.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';

interface AdminRouteProtectionProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin' | 'staff';
}

export default function AdminRouteProtection({ 
  children, 
  requiredRole = 'admin' 
}: AdminRouteProtectionProps) {
  const { userProfile, loading, isAdmin, isSuperAdmin, isStaff } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && userProfile) {
      const hasAccess = checkAccess(userProfile.role, requiredRole);
      
      if (!hasAccess) {
        console.warn(`[AdminRouteProtection] Access denied for role ${userProfile.role} to ${pathname}`);
        
        // Redirect ke dashboard yang sesuai
        let redirectPath = '/dashboard';
        if (isAdmin || isSuperAdmin) {
          redirectPath = '/admin/dashboard';
        } else if (isStaff) {
          redirectPath = '/staff/dashboard';
        }
        
        router.push(redirectPath);
      }
    }
  }, [userProfile, loading, router, pathname, requiredRole, isAdmin, isSuperAdmin, isStaff]);

  const checkAccess = (userRole: string, requiredRole: string) => {
    const userRoleLower = userRole.toLowerCase();
    const requiredRoleLower = requiredRole.toLowerCase();
    
    if (requiredRoleLower === 'super_admin') {
      return userRoleLower === 'super_admin';
    }
    
    if (requiredRoleLower === 'admin') {
      return userRoleLower === 'admin' || userRoleLower === 'super_admin';
    }
    
    if (requiredRoleLower === 'staff') {
      return userRoleLower === 'staff' || userRoleLower === 'admin' || userRoleLower === 'super_admin';
    }
    
    return false;
  };

  // Show loading or nothing while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memeriksa akses...</p>
        </div>
      </div>
    );
  }

  // Check if user has access
  if (userProfile) {
    const hasAccess = checkAccess(userProfile.role, requiredRole);
    
    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Akses Ditolak</h2>
            <p className="text-gray-600 mb-4">
              Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}