// app/admin/users/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  CheckCircle,
  XCircle,
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function EditUserPage() {
  useAdminRoute();
  const router = useRouter();
  const params = useParams();
  const { userProfile } = useAuth();
  
  const userId = params.id as string;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as 'super_admin' | 'admin' | 'staff' | 'user',
    is_active: true
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [originalUser, setOriginalUser] = useState<any>(null);

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true);
      setErrors({});
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found');

      setOriginalUser(data);
      
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        role: data.role || 'user',
        is_active: data.is_active !== false
      });

    } catch (err: any) {
      console.error('Error fetching user:', err);
      setErrors({ fetch: err.message || 'Failed to load user data' });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId, fetchUserData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !/^[\d+\-() ]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Check if user is trying to edit themselves
    if (userProfile?.id === userId && 
        (formData.role !== originalUser?.role || formData.is_active !== originalUser?.is_active)) {
      setErrors({ 
        submit: 'You cannot change your own role or deactivate your own account.' 
      });
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      // Update user in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name,
          phone: formData.phone || null,
          role: formData.role,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/admin/users/${userId}`);
      }, 2000);

    } catch (err: any) {
      console.error('Error updating user:', err);
      setErrors({ submit: err.message || 'Failed to update user' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleResetPassword = async () => {
    if (!confirm('Send password reset email to this user?')) return;
    
    try {
      // Note: You'll need to implement this endpoint in your API
      // For now, just show a success message
      alert('Password reset functionality would be implemented here.');
      
      // Example implementation with Supabase Auth:
      // const { error } = await supabase.auth.admin.resetPasswordForEmail(user.email);
      // if (error) throw error;
      
      // alert('Password reset email sent successfully');

    } catch (err: any) {
      alert('Error: ' + (err.message || 'Failed to send reset email'));
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you absolutely sure? This will permanently delete this user and all associated data.')) {
      return;
    }

    if (userProfile?.id === userId) {
      alert('You cannot delete your own account.');
      return;
    }

    try {
      // First, check if user has any bookings
      const { count: bookingCount } = await supabase
        .from('bookings_kereta')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (bookingCount && bookingCount > 0) {
        alert('Cannot delete user with active bookings. Consider deactivating instead.');
        return;
      }

      // Delete the user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      alert('User deleted successfully');
      router.push('/admin/users');

    } catch (err: any) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userProfile || userProfile.role !== 'super_admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">You don't have permission to edit users.</p>
        </div>
      </div>
    );
  }

  if (errors.fetch) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.push('/admin/users')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </button>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading User</h2>
          <p className="text-red-600 mb-4">{errors.fetch}</p>
          <button
            onClick={fetchUserData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push(`/admin/users/${userId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to User Details
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit User</h1>
            <p className="text-gray-600 mt-2">Update user information and permissions</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-100">
            <User className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">User Updated Successfully</h3>
              <p className="text-sm text-green-700 mt-1">
                User information has been updated and will be redirected...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.submit && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Updating User</h3>
              <p className="text-sm text-red-700 mt-1">{errors.submit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Full Name *
                  </div>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Address *
                  </div>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  readOnly
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    Phone Number
                  </div>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.phone ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none`}
                  placeholder="Optional"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Role *
                  </div>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {userProfile?.id === userId && 
                    "You cannot change your own role"}
                </p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                id="is_active"
                disabled={userProfile?.id === userId}
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <label htmlFor="is_active" className="ml-3 text-sm text-gray-700">
                <span className="font-medium">Account is active</span>
                <p className="text-gray-600 mt-1">
                  {formData.is_active 
                    ? 'User can login and use the system normally' 
                    : 'User cannot login to the system'}
                </p>
                {userProfile?.id === userId && (
                  <p className="text-xs text-red-500 mt-1">
                    You cannot deactivate your own account
                  </p>
                )}
              </label>
            </div>
          </div>

          {/* Password Reset */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Password Management</h3>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Lock className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-blue-800">Reset Password</p>
                    <p className="text-sm text-blue-600">
                      Send a password reset email to this user
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                >
                  Send Reset Email
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push(`/admin/users/${userId}`)}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Danger Zone */}
      {userId !== userProfile?.id && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-medium text-red-800 mb-4">Danger Zone</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-white border border-red-300 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-800">Deactivate Account</p>
                  <p className="text-sm text-red-600 mt-1">
                    User will not be able to login until reactivated
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to deactivate this account?')) {
                      // Update is_active to false
                      handleChange({
                        target: {
                          name: 'is_active',
                          type: 'checkbox',
                          checked: false
                        }
                      } as any);
                      handleSubmit(new Event('submit') as any);
                    }
                  }}
                  className="px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                >
                  Deactivate
                </button>
              </div>
            </div>

            <div className="p-4 bg-white border border-red-300 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-800">Delete Account</p>
                  <p className="text-sm text-red-600 mt-1">
                    This action cannot be undone. All user data will be permanently deleted.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete User</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}