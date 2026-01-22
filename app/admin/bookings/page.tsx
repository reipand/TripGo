// app/admin/bookings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Ticket,
  Calendar,
  User,
  Train,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpDown,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

interface Booking {
  id: string;
  booking_code: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  train_name: string;
  train_code: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  class_type: string;
  passenger_count: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string;
  booking_date: string;
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      booking_code: 'BK00123',
      passenger_name: 'John Doe',
      passenger_email: 'john@example.com',
      passenger_phone: '+62 812-3456-7890',
      train_name: 'Argo Bromo',
      train_code: 'ARB-101',
      origin: 'Gambir',
      destination: 'Surabaya',
      departure_date: '2024-01-15',
      departure_time: '08:00',
      arrival_time: '14:00',
      class_type: 'Executive',
      passenger_count: 2,
      total_amount: 800000,
      status: 'confirmed',
      payment_status: 'paid',
      payment_method: 'Bank Transfer',
      booking_date: '2024-01-10'
    },
    {
      id: '2',
      booking_code: 'BK00124',
      passenger_name: 'Jane Smith',
      passenger_email: 'jane@example.com',
      passenger_phone: '+62 813-4567-8901',
      train_name: 'Taksaka',
      train_code: 'TKS-202',
      origin: 'Yogyakarta',
      destination: 'Jakarta',
      departure_date: '2024-01-16',
      departure_time: '10:30',
      arrival_time: '16:30',
      class_type: 'Business',
      passenger_count: 1,
      total_amount: 450000,
      status: 'pending',
      payment_status: 'pending',
      payment_method: 'Credit Card',
      booking_date: '2024-01-11'
    },
    {
      id: '3',
      booking_code: 'BK00125',
      passenger_name: 'Robert Johnson',
      passenger_email: 'robert@example.com',
      passenger_phone: '+62 814-5678-9012',
      train_name: 'Gajayana',
      train_code: 'GJN-303',
      origin: 'Malang',
      destination: 'Jakarta',
      departure_date: '2024-01-17',
      departure_time: '14:00',
      arrival_time: '21:00',
      class_type: 'Executive',
      passenger_count: 3,
      total_amount: 1200000,
      status: 'paid',
      payment_status: 'paid',
      payment_method: 'E-Wallet',
      booking_date: '2024-01-12'
    },
    {
      id: '4',
      booking_code: 'BK00126',
      passenger_name: 'Sarah Wilson',
      passenger_email: 'sarah@example.com',
      passenger_phone: '+62 815-6789-0123',
      train_name: 'Sembrani',
      train_code: 'SMB-404',
      origin: 'Surabaya',
      destination: 'Jakarta',
      departure_date: '2024-01-18',
      departure_time: '19:00',
      arrival_time: '05:00',
      class_type: 'Premium',
      passenger_count: 2,
      total_amount: 1500000,
      status: 'cancelled',
      payment_status: 'refunded',
      payment_method: 'Bank Transfer',
      booking_date: '2024-01-13'
    },
    {
      id: '5',
      booking_code: 'BK00127',
      passenger_name: 'Michael Brown',
      passenger_email: 'michael@example.com',
      passenger_phone: '+62 816-7890-1234',
      train_name: 'Bima',
      train_code: 'BIM-505',
      origin: 'Jakarta',
      destination: 'Surabaya',
      departure_date: '2024-01-19',
      departure_time: '21:00',
      arrival_time: '06:00',
      class_type: 'Economy',
      passenger_count: 4,
      total_amount: 1600000,
      status: 'completed',
      payment_status: 'paid',
      payment_method: 'Credit Card',
      booking_date: '2024-01-14'
    },
  ]);

  const [filteredBookings, setFilteredBookings] = useState<Booking[]>(bookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 5;

  // Stats data
  const stats = {
    total: 125,
    today: 8,
    pending: 12,
    revenue: 25000000
  };

  // Filter and search bookings
  useEffect(() => {
    let result = bookings;

    // Search filter
    if (searchTerm) {
      result = result.filter(booking =>
        booking.booking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.passenger_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.passenger_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.train_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(booking => booking.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      switch (dateFilter) {
        case 'today':
          result = result.filter(booking => booking.booking_date === today);
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          result = result.filter(booking => new Date(booking.booking_date) >= weekAgo);
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          result = result.filter(booking => new Date(booking.booking_date) >= monthAgo);
          break;
      }
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime();
        case 'oldest':
          return new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime();
        case 'amount_high':
          return b.total_amount - a.total_amount;
        case 'amount_low':
          return a.total_amount - b.total_amount;
        default:
          return 0;
      }
    });

    setFilteredBookings(result);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateFilter, sortBy, bookings]);

  // Get paginated data
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  // Get status badge style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
              <p className="text-gray-600 mt-1">Manage and monitor all train bookings</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <Link
                href="/admin/bookings/create"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Booking</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            <p className="text-gray-600 text-sm">Bookings</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Today</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.today}</h3>
            <p className="text-gray-600 text-sm">New Bookings</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pending}</h3>
            <p className="text-gray-600 text-sm">Awaiting Confirmation</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Revenue</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.revenue)}
            </h3>
            <p className="text-gray-600 text-sm">Total Revenue</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_high">Amount: High to Low</option>
                <option value="amount_low">Amount: Low to High</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Additional Filters (Collapsible) */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passenger Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Any"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Any"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBookings(bookings.map(b => b.id));
                        } else {
                          setSelectedBookings([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Passenger
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Train Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBookings([...selectedBookings, booking.id]);
                          } else {
                            setSelectedBookings(selectedBookings.filter(id => id !== booking.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-blue-600">{booking.booking_code}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(booking.booking_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{booking.passenger_name}</div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Mail className="w-3 h-3 mr-1" />
                          {booking.passenger_email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {booking.passenger_phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {booking.train_code} - {booking.train_name}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {booking.origin} → {booking.destination}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Class: {booking.class_type} • {booking.passenger_count} pax
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatDate(booking.departure_date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.departure_time} - {booking.arrival_time}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        <div className="text-xs text-gray-500">
                          Payment: {booking.payment_status}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {formatCurrency(booking.total_amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.payment_method}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/bookings/${booking.id}/edit`}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
                    {Math.min(currentPage * itemsPerPage, filteredBookings.length)}
                  </span> of{' '}
                  <span className="font-medium">{filteredBookings.length}</span> bookings
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

        {/* Bulk Actions Bar */}
        {selectedBookings.length > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-4">
            <span className="text-sm">
              {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded text-sm">
                Confirm Selected
              </button>
              <button className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 rounded text-sm">
                Mark as Paid
              </button>
              <button className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm">
                Cancel Selected
              </button>
              <button
                onClick={() => setSelectedBookings([])}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

  );
}