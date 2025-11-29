'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import AdminRoute from '@/app/components/AdminRoute';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, userProfile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Pengguna', href: '/admin/users', icon: '👥' },
    { name: 'Pesanan', href: '/admin/bookings', icon: '🎫' },
    { name: 'Transaksi', href: '/admin/transactions', icon: '💳' },
    { name: 'Notifikasi', href: '/admin/notifications', icon: '🔔' },
    { name: 'Analitik', href: '/admin/analytics', icon: '📈' },
  ];

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-0 z-30 h-full bg-white shadow-lg transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-16'
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b">
              {sidebarOpen && (
                <h1 className="text-xl font-bold text-primary-600">TripGo Admin</h1>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
              >
                {sidebarOpen ? '←' : '→'}
              </button>
            </div>

            {/* Menu */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              ))}
            </nav>

            {/* User Info */}
            <div className="border-t p-4">
              <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {userProfile?.first_name?.[0] || user?.email?.[0] || 'U'}
                  </span>
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userProfile?.first_name || user?.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{userProfile?.role || 'admin'}</p>
                  </div>
                )}
              </div>
              {sidebarOpen && (
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  Keluar
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
          {children}
        </main>
      </div>
    </AdminRoute>
  );
};

export default AdminLayout;

