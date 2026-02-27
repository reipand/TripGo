'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import AdminLayout from '@/app/admin/layout';
import { supabase } from '@/app/lib/supabaseClient';
import {
  Search,
  Filter,
  Bell,
  Send,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  XCircle
} from 'lucide-react';

interface Notification {
  id: string;
  user_id: string;
  type: 'booking' | 'payment' | 'reminder' | 'promo' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  data: any;
  booking_id: string | null;
  booking_code: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export default function AdminNotifications() {
  useAdminRoute();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [newNotification, setNewNotification] = useState({
    type: 'system' as Notification['type'],
    title: '',
    message: '',
    target: 'all' // all, specific_user, user_group
  });
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    sent: 0
  });

  const itemsPerPage = 10;

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('notifications')
        .select(`
          *,
          users:user_id (name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%,booking_code.ilike.%${searchTerm}%`);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (readFilter !== 'all') {
        query = query.eq('is_read', readFilter === 'read');
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error: queryError, count } = await query.range(from, to);

      if (queryError) throw queryError;

      // Transform data
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        user_name: item.users?.name,
        user_email: item.users?.email
      }));

      setNotifications(transformedData);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: total } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      const { count: unread } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get notifications sent by admin (type = system)
      const { count: sent } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'system');

      setStats({
        total: total || 0,
        unread: unread || 0,
        today: todayCount || 0,
        sent: sent || 0
      });

    } catch (err) {
      console.error('Error fetching notification stats:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [currentPage, typeFilter, readFilter, searchTerm]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      fetchNotifications();
      fetchStats();
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      fetchNotifications();
      fetchStats();
      setShowDeleteModal(false);
      setNotificationToDelete(null);
    } catch (err) {
      console.error('Error deleting notification:', err);
      alert('Failed to delete notification');
    }
  };

  const sendNotification = async () => {
    try {
      // Implement sending logic here
      // For now, just create a notification in the database
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: null, // System notification
          type: newNotification.type,
          title: newNotification.title,
          message: newNotification.message,
          is_read: false,
          data: { sent_by_admin: true }
        }]);

      if (error) throw error;

      setShowSendModal(false);
      setNewNotification({
        type: 'system',
        title: '',
        message: '',
        target: 'all'
      });

      fetchNotifications();
      fetchStats();

      alert('Notification sent successfully');
    } catch (err) {
      console.error('Error sending notification:', err);
      alert('Failed to send notification');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-100 text-blue-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800';
      case 'promo':
        return 'bg-purple-100 text-purple-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
              <p className="text-gray-600 mt-2">Manage system notifications and alerts</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSendModal(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Send Notification</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.total}</h3>
            <p className="text-gray-600 text-sm">Notifications</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-sm text-gray-500">Unread</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.unread}</h3>
            <p className="text-gray-600 text-sm">Unread</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Sent</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.sent}</h3>
            <p className="text-gray-600 text-sm">System Notifications</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">Today</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.today}</h3>
            <p className="text-gray-600 text-sm">Today</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="booking">Booking</option>
              <option value="payment">Payment</option>
              <option value="reminder">Reminder</option>
              <option value="promo">Promo</option>
              <option value="system">System</option>
            </select>

            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setReadFilter('all');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 text-red-800">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Notifications Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No notifications found</p>
                        <p className="mt-1">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  notifications.map((notification) => (
                    <tr key={notification.id} className={`hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{notification.title}</div>
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </div>
                          {notification.booking_code && (
                            <div className="text-xs text-gray-500 mt-1">
                              Booking: {notification.booking_code}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {notification.user_name ? (
                          <div>
                            <div className="font-medium text-gray-900">{notification.user_name}</div>
                            <div className="text-sm text-gray-600">{notification.user_email}</div>
                          </div>
                        ) : (
                          <div className="text-gray-500">System</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {notification.is_read ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              <span className="text-sm">Read</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-blue-600">
                              <Bell className="w-4 h-4 mr-1" />
                              <span className="text-sm">Unread</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(notification.created_at)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={notification.is_read ? 'Mark as unread' : 'Mark as read'}
                          >
                            {notification.is_read ? (
                              <Bell className="w-4 h-4" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setNotificationToDelete(notification.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Send Notification</h3>
                  <p className="text-sm text-gray-600">Create and send a new system notification</p>
                </div>
              </div>
              <button
                onClick={() => setShowSendModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Type
                </label>
                <select
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="system">System</option>
                  <option value="promo">Promo</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <select
                  value={newNotification.target}
                  onChange={(e) => setNewNotification({ ...newNotification, target: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="all">All Users</option>
                  <option value="specific_user">Specific User</option>
                  <option value="user_group">User Group</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter notification title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter notification message"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendNotification}
                disabled={!newNotification.title || !newNotification.message}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Delete Notification</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this notification?
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setNotificationToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => notificationToDelete && deleteNotification(notificationToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}