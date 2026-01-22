'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  Home,
  Ticket,
  Users,
  CreditCard,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Train,
  Tag,
  MapPin,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Search,
  UserCog
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Navigation dengan struktur submenu untuk Users
  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/admin/dashboard', 
      icon: LayoutDashboard,
      subItems: null 
    },
    { 
      name: 'Bookings', 
      href: '/admin/bookings', 
      icon: Ticket,
      subItems: null 
    },
    { 
      name: 'Trains', 
      href: '/admin/trains', 
      icon: Train,
      subItems: null 
    },
    { 
      name: 'Users', 
      href: '#', 
      icon: Users,
      subItems: [
        { name: 'Transactions', href: '/admin/transactions', icon: CreditCard },
        { name: 'Notifications', href: '/admin/notifications', icon: Bell },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Promotions', href: '/admin/promotions', icon: Tag },
        { name: 'Stations', href: '/admin/stations', icon: MapPin },
      ]
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  // Cek apakah menu aktif
  const isMenuActive = (item: any) => {
    if (item.subItems) {
      return item.subItems.some((subItem: any) => 
        pathname === subItem.href || pathname.startsWith(subItem.href + '/')
      );
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    for (const item of navigation) {
      if (item.subItems) {
        for (const subItem of item.subItems) {
          if (pathname === subItem.href || pathname.startsWith(subItem.href + '/')) {
            return subItem.name;
          }
        }
      }
      if (item.href !== '#' && (pathname === item.href || pathname.startsWith(item.href + '/'))) {
        return item.name;
      }
    }
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50">
    
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navbar */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {getCurrentPageTitle()}
                </h1>
                <p className="text-sm text-gray-500">
                  TripGO Admin Panel
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 bg-gray-100 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 lg:w-64"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              {/* User profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-gray-900">
                    Halo, {user?.email?.split('@')[0] || 'Admin'}!
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                    {user?.email}
                  </p>
                </div>
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="font-semibold text-blue-700">
                    {user?.email?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="min-h-[calc(100vh-140px)] p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
            <div>
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} TripGO Admin. All rights reserved.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">System Online</span>
              </div>
              <span className="text-sm text-gray-500">v2.0.0</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Close dropdowns when clicking outside */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;