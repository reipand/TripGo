// app/components/layout/AdminSidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home,
  Users,
  Ticket,
  CreditCard,
  Tag,
  BarChart3,
  Activity,
  Server,
  Bell,
  Database,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plane,
  Train,
  Calendar,
  HelpCircle,
  BookOpen,
  Gift,
  Info,
  MessageSquare,
  MapPin,
  PieChart,
  AlertCircle,
  Lock
} from 'lucide-react';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  badge?: number;
  isSection?: boolean;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      path: '/admin/dashboard'
    },
    {
      title: 'OVERVIEW',
      icon: null,
      isSection: true,
      children: [
        {
          title: 'Bookings',
          icon: <Home className="w-5 h-5" />,
          path: '/admin/bookings',
          badge: 12 // Bookings
        },
        {
          title: 'Trains',
          icon: <Train className="w-5 h-5" />,
          path: '/admin/trains',
          badge: 24
        },
         {
          title: 'Stations',
          icon: <MapPin className="w-5 h-5" />,
          path: '/admin/stations',
          badge: 24
        },
        {
          title: 'Users',
          icon: <Users className="w-5 h-5" />,
          path: '/admin/users',
          badge: 24
        }
      ]
    },
    {
      title: 'MANAGEMENT',
      icon: null,
      isSection: true,
      children: [
        {
          title: 'Transactions',
          icon: <CreditCard className="w-5 h-5" />,
          path: '/admin/transactions'
        },
        {
          title: 'Promotions',
          icon: <Tag className="w-5 h-5" />,
          path: '/admin/promotions',
          badge: 5
        }
      ]
    },
    {
      title: 'ANALYTICS',
      icon: null,
      isSection: true,
      children: [
        {
          title: 'Analytics',
          icon: <BarChart3 className="w-5 h-5" />,
          path: '/admin/analytics'
        },
        {
          title: 'Activity',
          icon: <Activity className="w-5 h-5" />,
          path: '/admin/activity'
        },
        {
          title: 'Systems',
          icon: <Server className="w-5 h-5" />,
          path: '/admin/systems'
        },
        {
          title: 'Notifications',
          icon: <Bell className="w-5 h-5" />,
          path: '/admin/notifications',
          badge: 3
        },
        {
          title: 'Database',
          icon: <Database className="w-5 h-5" />,
          path: '/admin/database'
        },
        {
          title: 'Security',
          icon: <Shield className="w-5 h-5" />,
          path: '/admin/security'
        }
      ]
    }
  ];

  const productMenu = [
    { title: 'Pesawat', icon: <Plane className="w-4 h-4" />, path: '#' },
    { title: 'Kereta Api', icon: <Train className="w-4 h-4" />, path: '#' },
    { title: 'To Do', icon: <Calendar className="w-4 h-4" />, path: '#' },
  ];

  const otherMenu = [
    { title: 'Pusat Bantuan', icon: <HelpCircle className="w-4 h-4" />, path: '#' },
    { title: 'Blog', icon: <BookOpen className="w-4 h-4" />, path: '#' },
    { title: 'Promo', icon: <Gift className="w-4 h-4" />, path: '#' },
    { title: 'Tentang Kami', icon: <Info className="w-4 h-4" />, path: '#' },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: 'f', path: '#' },
    { name: 'Instagram', icon: 'ig', path: '#' },
    { name: 'LinkedIn', icon: 'in', path: '#' }
  ];

  const isActive = (path: string) => pathname === path;

  const renderMenuItem = (item: MenuItem, index: number) => {
    // Render section headers
    if (item.isSection) {
      return (
        <div key={index} className="mb-4">
          {!collapsed && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">
              {item.title}
            </h3>
          )}
          <div className="space-y-1">
            {item.children?.map((child, childIndex) => renderChildItem(child, childIndex))}
          </div>
        </div>
      );
    }

    // Render regular menu items
    if (item.path) {
      return (
        <Link 
          key={index} 
          href={item.path}
          className={`block mb-1 ${collapsed ? 'px-3' : 'px-4'}`}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} py-3 rounded-lg transition-all duration-200 ${
            isActive(item.path) 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
          }`}>
            <div className="flex items-center">
              <span className={`${isActive(item.path) ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="ml-3 text-sm font-medium">{item.title}</span>}
            </div>
            {!collapsed && item.badge && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </div>
        </Link>
      );
    }

    return null;
  };

  const renderChildItem = (item: MenuItem, index: number) => {
    if (!item.path) return null;

    return (
      <Link 
        key={index} 
        href={item.path}
        className={`block ${collapsed ? 'px-3' : 'px-4'}`}
      >
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} py-2.5 rounded-lg transition-all duration-200 ${
          isActive(item.path) 
            ? 'bg-blue-50 text-blue-600' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
        }`}>
          <div className="flex items-center">
            <span className={`${isActive(item.path) ? 'text-blue-600' : 'text-gray-500'}`}>
              {item.icon}
            </span>
            {!collapsed && <span className="ml-3 text-sm">{item.title}</span>}
          </div>
          {!collapsed && item.badge && (
            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <div className={`flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-800">TripGo Admin</h1>
              <p className="text-sm text-gray-500 mt-1">Management System</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
        {collapsed && (
          <div className="flex justify-center mt-4">
            <div className="bg-blue-600 text-white rounded-lg p-2">
              <Home className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation - Main Content */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1">
          {menuItems.map((item, index) => renderMenuItem(item, index))}
        </nav>

        {/* Settings Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className={collapsed ? 'px-3' : 'px-4'}>
            <Link 
              href="/admin/settings"
              className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors`}
            >
              <div className="flex items-center">
                <Settings className="w-5 h-5 text-gray-500" />
                {!collapsed && <span className="ml-3 text-sm">Settings</span>}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}