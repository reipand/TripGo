'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { isAdmin } from '@/app/lib/rbac';

interface AdminRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiredPermission?: 'users' | 'bookings' | 'flights' | 'trains' | 'payments' | 'reports';
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard',
  requiredPermission
}) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (loading || !user) {
        setCheckingAccess(true);
        return;
      }

      try {
        const admin = await isAdmin(user.id);
        if (admin) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
          router.push(redirectTo);
        }
      } catch (error) {
        console.error('Error checking admin access:', error);
        setHasAccess(false);
        router.push(redirectTo);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccess();
  }, [user, userProfile, loading, router, redirectTo]);

  if (loading || checkingAccess || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memverifikasi akses admin...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Akses ditolak. Halaman ini hanya untuk admin.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
