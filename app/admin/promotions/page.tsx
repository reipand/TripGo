// app/admin/promotions/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  AlertCircle
} from 'lucide-react';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  promo_code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  start_date: string;
  end_date: string;
  usage_limit: number | null;
  usage_count: number;
  user_limit: number;
  is_active: boolean;
  applicable_to: any;
  created_at: string;
  updated_at: string;
}

export default function AdminPromotions() {
  useAdminRoute();
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<string | null>(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [promotionToToggle, setPromotionToToggle] = useState<Promotion | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    usage: 0
  });

  const itemsPerPage = 10;

  // Gunakan useCallback untuk mencegah re-creasi function yang tidak perlu
  const fetchPromotions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cek jika masih dalam auth loading
      if (authLoading) return;

      let query = supabase
        .from('promotions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,promo_code.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        const now = new Date().toISOString();
        switch (statusFilter) {
          case 'active':
            query = query.eq('is_active', true)
              .lte('start_date', now)
              .gte('end_date', now);
            break;
          case 'inactive':
            query = query.eq('is_active', false);
            break;
          case 'expired':
            query = query.lt('end_date', now);
            break;
          case 'upcoming':
            query = query.gt('start_date', now);
            break;
        }
      }

      if (typeFilter !== 'all') {
        query = query.eq('discount_type', typeFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error: queryError, count } = await query.range(from, to);

      if (queryError) {
        console.error('Supabase query error:', queryError);
        throw new Error(queryError.message || 'Failed to fetch promotions from database');
      }

      setPromotions(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

    } catch (err: any) {
      console.error('Error fetching promotions:', err);
      // Tampilkan error yang lebih spesifik
      const errorMessage = err.message || 'Failed to load promotions. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, typeFilter, searchTerm, authLoading]);

  const fetchStats = useCallback(async () => {
    try {
      // Cek jika masih dalam auth loading
      if (authLoading) return;

      const [totalRes, activeRes, expiredRes, usageRes] = await Promise.all([
        supabase.from('promotions').select('*', { count: 'exact', head: true }),
        supabase.from('promotions')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .lte('start_date', new Date().toISOString())
          .gte('end_date', new Date().toISOString()),
        supabase.from('promotions')
          .select('*', { count: 'exact', head: true })
          .lt('end_date', new Date().toISOString()),
        supabase.from('promotions').select('usage_count')
      ]);

      const totalUsage = usageRes.data?.reduce((sum, promo) => sum + (promo.usage_count || 0), 0) || 0;

      setStats({
        total: totalRes.count || 0,
        active: activeRes.count || 0,
        expired: expiredRes.count || 0,
        usage: totalUsage
      });

    } catch (err) {
      console.error('Error fetching promotion stats:', err);
      // Jangan set error untuk stats, biarkan tetap default
    }
  }, [authLoading]);

  // Gunakan debounce untuk search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authLoading) {
        fetchPromotions();
        fetchStats();
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [fetchPromotions, fetchStats, authLoading]);

  // Fetch data saat page pertama kali load
  useEffect(() => {
    if (!authLoading) {
      fetchPromotions();
      fetchStats();

      // Realtime subscription for promotions
      const channel = supabase.channel('admin-promotions-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, () => {
          fetchPromotions();
          fetchStats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, fetchPromotions, fetchStats]);

  const togglePromotionStatus = async () => {
    if (!promotionToToggle) return;

    try {
      const { error } = await supabase
        .from('promotions')
        .update({
          is_active: !promotionToToggle.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', promotionToToggle.id);

      if (error) throw error;

      // Refresh data
      await Promise.all([fetchPromotions(), fetchStats()]);

      setShowToggleModal(false);
      setPromotionToToggle(null);

      alert(`Promotion ${!promotionToToggle.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      console.error('Error toggling promotion status:', err);
      alert('Failed to update promotion status');
    }
  };

  const deletePromotion = async (promotionId: string) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promotionId);

      if (error) throw error;

      // Refresh data
      await Promise.all([fetchPromotions(), fetchStats()]);

      setShowDeleteModal(false);
      setPromotionToDelete(null);

      alert('Promotion deleted successfully');
    } catch (err: any) {
      console.error('Error deleting promotion:', err);
      alert('Failed to delete promotion');
    }
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Promo code copied to clipboard!');
  };

  const getStatusColor = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    if (!promotion.is_active) return 'bg-gray-100 text-gray-800';
    if (now < startDate) return 'bg-blue-100 text-blue-800';
    if (now > endDate) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (promotion: Promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    if (!promotion.is_active) return 'Inactive';
    if (now < startDate) return 'Upcoming';
    if (now > endDate) return 'Expired';
    return 'Active';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Promotions</h1>
            <p className="text-gray-600 mt-2">Manage discount codes and promotional offers</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/admin/promotions/create')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Promotion</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Tag className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.total}</h3>
          <p className="text-gray-600 text-sm">Promotions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Active</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.active}</h3>
          <p className="text-gray-600 text-sm">Active Promotions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-red-100">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Expired</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.expired}</h3>
          <p className="text-gray-600 text-sm">Expired Promotions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Usage</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.usage}</h3>
          <p className="text-gray-600 text-sm">Total Usage</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search promotions..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="upcoming">Upcoming</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error Loading Promotions</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchPromotions();
                }}
                className="mt-2 text-sm text-red-800 hover:text-red-900 font-medium"
              >
                Retry Loading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promotions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promo Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Promotion Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No promotions found</p>
                      <p className="mt-1">Try adjusting your search or filters</p>
                      {error && (
                        <button
                          onClick={() => {
                            setError(null);
                            setSearchTerm('');
                            setStatusFilter('all');
                            setTypeFilter('all');
                            setCurrentPage(1);
                          }}
                          className="mt-3 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                promotions.map((promotion) => (
                  <tr key={promotion.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-mono font-bold text-gray-900">{promotion.promo_code}</div>
                        <button
                          onClick={() => copyPromoCode(promotion.promo_code)}
                          className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy code</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{promotion.name}</div>
                        {promotion.description && (
                          <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {promotion.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {promotion.discount_type === 'percentage'
                            ? `${promotion.discount_value}%`
                            : formatCurrency(promotion.discount_value)
                          }
                        </div>
                        <div className="text-xs text-gray-500">
                          Min order: {formatCurrency(promotion.min_order_amount)}
                        </div>
                        {promotion.max_discount_amount && (
                          <div className="text-xs text-gray-500">
                            Max: {formatCurrency(promotion.max_discount_amount)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900">
                          {new Date(promotion.start_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-900">
                          {new Date(promotion.end_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {promotion.user_limit === 1 ? 'Single use' : `${promotion.user_limit} uses/user`}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {promotion.usage_count} / {promotion.usage_limit || '∞'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {promotion.usage_limit
                            ? `${Math.round((promotion.usage_count / promotion.usage_limit) * 100)}% used`
                            : 'No limit'
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(promotion)}`}>
                        {getStatusText(promotion)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/admin/promotions/${promotion.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => router.push(`/admin/promotions/${promotion.id}/edit`)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setPromotionToToggle(promotion);
                            setShowToggleModal(true);
                          }}
                          className={`p-2 rounded-lg transition-colors ${promotion.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={promotion.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {promotion.is_active ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setPromotionToDelete(promotion.id);
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

      {/* Toggle Status Modal */}
      {showToggleModal && promotionToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 ${promotionToToggle.is_active ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
                {promotionToToggle.is_active ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {promotionToToggle.is_active ? 'Deactivate Promotion' : 'Activate Promotion'}
                </h3>
                <p className="text-sm text-gray-600">{promotionToToggle.name}</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              {promotionToToggle.is_active
                ? 'Are you sure you want to deactivate this promotion? It will no longer be available for users.'
                : 'Are you sure you want to activate this promotion? It will become available for users.'
              }
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowToggleModal(false);
                  setPromotionToToggle(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={togglePromotionStatus}
                className={`px-4 py-2 ${promotionToToggle.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition-colors`}
              >
                {promotionToToggle.is_active ? 'Deactivate' : 'Activate'}
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
                <h3 className="text-lg font-semibold text-gray-800">Delete Promotion</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this promotion? All associated data will be permanently removed.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPromotionToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => promotionToDelete && deletePromotion(promotionToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Promotion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}