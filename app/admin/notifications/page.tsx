'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import EmptyState from '@/app/components/EmptyState';

interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  priority: string;
  created_at: string;
  sent_at: string | null;
  data: any;
}

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    user_email: '',
    type: 'system',
    title: '',
    message: '',
    priority: 'medium',
    send_email: false,
    data: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchNotifications();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setMessage({ type: 'error', text: 'Gagal memuat notifikasi' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreate = () => {
    setIsEditMode(false);
    setSelectedNotification(null);
    setFormData({
      user_id: '',
      user_email: '',
      type: 'system',
      title: '',
      message: '',
      priority: 'medium',
      send_email: false,
      data: '',
    });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleEdit = (notification: Notification) => {
    setIsEditMode(true);
    setSelectedNotification(notification);
    
    // Get user email if user_id exists
    let userEmail = '';
    if (notification.user_id) {
      const user = users.find(u => u.id === notification.user_id);
      userEmail = user?.email || '';
    }

    setFormData({
      user_id: notification.user_id || '',
      user_email: userEmail,
      type: notification.type || 'system',
      title: notification.title || '',
      message: notification.message || '',
      priority: notification.priority || 'medium',
      send_email: false,
      data: notification.data ? JSON.stringify(notification.data, null, 2) : '',
    });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus notifikasi ini?')) return;

    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');
      
      setMessage({ type: 'success', text: 'Notifikasi berhasil dihapus' });
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      setMessage({ type: 'error', text: 'Gagal menghapus notifikasi' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      // Parse data if provided
      let parsedData = null;
      if (formData.data.trim()) {
        try {
          parsedData = JSON.parse(formData.data);
        } catch {
          setMessage({ type: 'error', text: 'Invalid JSON format untuk data' });
          setSubmitting(false);
          return;
        }
      }

      const payload: any = {
        user_id: formData.user_id || null,
        type: formData.type,
        title: formData.title,
        message: formData.message,
        priority: formData.priority,
        send_email: formData.send_email,
        data: parsedData,
      };

      if (isEditMode && selectedNotification) {
        // Update notification
        const response = await fetch(`/api/admin/notifications/${selectedNotification.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to update');
        setMessage({ type: 'success', text: 'Notifikasi berhasil diperbarui' });
      } else {
        // Create notification with email support
        const response = await fetch('/api/admin/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send notification');
        }

        const result = await response.json();
        setMessage({
          type: 'success',
          text: `Notifikasi berhasil dikirim${result.email_sent ? ' (Email terkirim)' : ''}`,
        });
      }

      setIsModalOpen(false);
      fetchNotifications();
    } catch (error: any) {
      console.error('Error submitting notification:', error);
      setMessage({ type: 'error', text: error.message || 'Gagal mengirim notifikasi' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUserEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({ ...formData, user_email: email });
    
    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setFormData(prev => ({ ...prev, user_id: user.id, user_email: email }));
    } else {
      setFormData(prev => ({ ...prev, user_id: '', user_email: email }));
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesRead =
      filterRead === 'all' ||
      (filterRead === 'read' && notification.is_read) ||
      (filterRead === 'unread' && !notification.is_read);
    return matchesSearch && matchesType && matchesRead;
  });

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner text="Memuat data notifikasi..." />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Notifikasi</h1>
          <p className="text-gray-600 mt-2">Kelola semua notifikasi pengguna dengan email support</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200 font-semibold"
        >
          + Kirim Notifikasi
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-success-50 text-success-800 border border-success-200'
              : 'bg-error-50 text-error-800 border border-error-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cari</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari judul, pesan..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Tipe</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">Semua Tipe</option>
              <option value="system">System</option>
              <option value="booking">Booking</option>
              <option value="payment">Payment</option>
              <option value="flight">Flight</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter Status</label>
            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">Semua</option>
              <option value="read">Sudah Dibaca</option>
              <option value="unread">Belum Dibaca</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            title="Tidak ada notifikasi"
            description="Mulai dengan mengirim notifikasi baru"
            actionLabel="Kirim Notifikasi"
            onAction={handleCreate}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Judul
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pesan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotifications.map((notification) => {
                  const user = users.find(u => u.id === notification.user_id);
                  return (
                    <tr key={notification.id} className="hover:bg-gray-50 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {notification.user_id ? (
                          <div>
                            <div className="font-medium">{user?.first_name} {user?.last_name}</div>
                            <div className="text-xs text-gray-500">{user?.email || notification.user_id.substring(0, 8)}</div>
                          </div>
                        ) : (
                          <span className="font-medium text-primary-600">Broadcast</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            notification.type === 'system'
                              ? 'bg-purple-100 text-purple-800'
                              : notification.type === 'payment'
                              ? 'bg-success-100 text-success-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {notification.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{notification.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {notification.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            notification.priority === 'urgent'
                              ? 'bg-error-100 text-error-800'
                              : notification.priority === 'high'
                              ? 'bg-warning-100 text-warning-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {notification.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            notification.is_read
                              ? 'bg-success-100 text-success-800'
                              : 'bg-warning-100 text-warning-800'
                          }`}
                        >
                          {notification.is_read ? 'Dibaca' : 'Belum Dibaca'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {notification.sent_at ? (
                          <span className="text-xs text-success-600">✓ Terkirim</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(notification.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(notification)}
                          className="text-primary-600 hover:text-primary-900 mr-4 transition-all duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-error-600 hover:text-error-900 transition-all duration-200"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {isEditMode ? 'Edit Notifikasi' : 'Kirim Notifikasi'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email User (kosongkan untuk broadcast)
                </label>
                <input
                  type="email"
                  value={formData.user_email}
                  onChange={handleUserEmailChange}
                  placeholder="user@example.com atau kosongkan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  list="users-list"
                />
                <datalist id="users-list">
                  {users.map((user) => (
                    <option key={user.id} value={user.email}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipe</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="system">System</option>
                    <option value="booking">Booking</option>
                    <option value="payment">Payment</option>
                    <option value="flight">Flight</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Judul</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pesan</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data (JSON - optional)
                </label>
                <textarea
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  rows={3}
                  placeholder='{"key": "value"}'
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
                />
              </div>
              {!isEditMode && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.send_email}
                    onChange={(e) => setFormData({ ...formData, send_email: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Kirim juga via email (jika user_id tersedia)
                  </label>
                </div>
              )}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {submitting ? 'Mengirim...' : isEditMode ? 'Update' : 'Kirim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationsPage;
