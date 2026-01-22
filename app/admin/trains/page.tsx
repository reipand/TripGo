// app/admin/trains/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import {
  Search,
  Filter,
  Train,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Users,
  Zap,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface TrainData {
  id: string;
  kode_kereta: string;
  nama_kereta: string;
  operator: string;
  tipe_kereta: string;
  jumlah_kursi: number;
  is_active: boolean;
  fasilitas: any;
  keterangan: string;
  created_at: string;
  updated_at: string;
}

export default function AdminTrains() {
  useAdminRoute(); // Protect route
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [trains, setTrains] = useState<TrainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTrains, setSelectedTrains] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [trainToDelete, setTrainToDelete] = useState<string | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [trainToToggle, setTrainToToggle] = useState<TrainData | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    types: {} as Record<string, number>
  });

  const itemsPerPage = 10;

  // Fetch trains data
  const fetchTrains = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query
      let query = supabase
        .from('kereta')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`kode_kereta.ilike.%${searchTerm}%,nama_kereta.ilike.%${searchTerm}%,operator.ilike.%${searchTerm}%`);
      }

      if (typeFilter !== 'all') {
        query = query.eq('tipe_kereta', typeFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error: queryError, count } = await query.range(from, to);

      if (queryError) {
        throw queryError;
      }

      setTrains(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

    } catch (err: any) {
      console.error('Error fetching trains:', err);
      setError(err.message || 'Failed to load trains');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      // Total trains
      const { count: total } = await supabase
        .from('kereta')
        .select('*', { count: 'exact', head: true });

      // Active trains
      const { count: active } = await supabase
        .from('kereta')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Train types
      const { data: typeData } = await supabase
        .from('kereta')
        .select('tipe_kereta');

      const types = {} as Record<string, number>;
      typeData?.forEach(train => {
        const type = train.tipe_kereta || 'Unknown';
        types[type] = (types[type] || 0) + 1;
      });

      setStats({
        total: total || 0,
        active: active || 0,
        inactive: (total || 0) - (active || 0),
        types
      });

    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchTrains();
      fetchStats();
    }
  }, [currentPage, typeFilter, statusFilter, searchTerm, authLoading]);

  // Handle train status toggle
  const toggleTrainStatus = async () => {
    if (!trainToToggle) return;

    try {
      const { error } = await supabase
        .from('kereta')
        .update({ 
          is_active: !trainToToggle.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', trainToToggle.id);

      if (error) throw error;

      // Refresh data
      fetchTrains();
      fetchStats();
      setShowDeactivateModal(false);
      setTrainToToggle(null);

      alert(`Train ${!trainToToggle.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      console.error('Error updating train status:', err);
      alert('Failed to update train status');
    }
  };

  // Handle train deletion
  const deleteTrain = async (trainId: string) => {
    try {
      // Check if train has active schedules
      const { count: scheduleCount } = await supabase
        .from('jadwal_kereta')
        .select('*', { count: 'exact', head: true })
        .eq('train_id', trainId);

      if (scheduleCount && scheduleCount > 0) {
        alert('Cannot delete train with active schedules. Deactivate it instead.');
        return;
      }

      const { error } = await supabase
        .from('kereta')
        .delete()
        .eq('id', trainId);

      if (error) throw error;

      // Refresh data
      fetchTrains();
      fetchStats();
      setShowDeleteModal(false);
      setTrainToDelete(null);

      alert('Train deleted successfully');
    } catch (err: any) {
      console.error('Error deleting train:', err);
      alert('Failed to delete train');
    }
  };

  // Get status badge color
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Get train type color
  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'eksekutif':
        return 'bg-purple-100 text-purple-800';
      case 'bisnis':
        return 'bg-blue-100 text-blue-800';
      case 'ekonomi':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format facilities
  const formatFacilities = (fasilitas: any) => {
    if (!fasilitas) return 'No facilities';
    const facilities = Object.keys(fasilitas).filter(key => fasilitas[key] === true);
    return facilities.slice(0, 3).join(', ') + (facilities.length > 3 ? '...' : '');
  };

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
            <h1 className="text-2xl font-bold text-gray-800">Trains Management</h1>
            <p className="text-gray-600 mt-2">Manage train inventory and schedules</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/admin/trains/create')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Train</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <Train className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.total}</h3>
          <p className="text-gray-600 text-sm">Trains</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Active</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.active}</h3>
          <p className="text-gray-600 text-sm">Active Trains</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Capacity</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            {trains.reduce((sum, train) => sum + (train.jumlah_kursi || 0), 0)}
          </h3>
          <p className="text-gray-600 text-sm">Total Seats</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Types</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            {Object.keys(stats.types).length}
          </h3>
          <p className="text-gray-600 text-sm">Train Types</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search trains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            {Object.keys(stats.types).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('all');
              setStatusFilter('all');
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

      {/* Trains Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {userProfile?.role === 'super_admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTrains(trains.map(t => t.id));
                        } else {
                          setSelectedTrains([]);
                        }
                      }}
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Train Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Train Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trains.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Train className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No trains found</p>
                      <p className="mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                trains.map((train) => (
                  <tr key={train.id} className="hover:bg-gray-50">
                    {userProfile?.role === 'super_admin' && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTrains.includes(train.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTrains([...selectedTrains, train.id]);
                            } else {
                              setSelectedTrains(selectedTrains.filter(id => id !== train.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-mono font-bold text-gray-900">{train.kode_kereta}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(train.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{train.nama_kereta}</div>
                        <div className="text-sm text-gray-600">{train.operator}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Facilities: {formatFacilities(train.fasilitas)}
                        </div>
                        {train.keterangan && (
                          <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                            {train.keterangan}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(train.tipe_kereta)}`}>
                          {train.tipe_kereta || 'Unknown'}
                        </span>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{train.jumlah_kursi || 0} seats</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(train.is_active)}`}>
                        {train.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/admin/trains/${train.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => router.push(`/admin/trains/${train.id}/edit`)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => router.push(`/admin/trains/${train.id}/schedules`)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Manage Schedules"
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setTrainToToggle(train);
                            setShowDeactivateModal(true);
                          }}
                          className={`p-2 rounded-lg transition-colors ${train.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={train.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {train.is_active ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        
                        {userProfile?.role === 'super_admin' && (
                          <button
                            onClick={() => {
                              setTrainToDelete(train.id);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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

      {/* Deactivate/Activate Modal */}
      {showDeactivateModal && trainToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 ${trainToToggle.is_active ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
                {trainToToggle.is_active ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {trainToToggle.is_active ? 'Deactivate Train' : 'Activate Train'}
                </h3>
                <p className="text-sm text-gray-600">{trainToToggle.nama_kereta}</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              {trainToToggle.is_active 
                ? 'Are you sure you want to deactivate this train? It will no longer be available for new bookings.'
                : 'Are you sure you want to activate this train? It will become available for new bookings.'
              }
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setTrainToToggle(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={toggleTrainStatus}
                className={`px-4 py-2 ${trainToToggle.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition-colors`}
              >
                {trainToToggle.is_active ? 'Deactivate' : 'Activate'}
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
                <h3 className="text-lg font-semibold text-gray-800">Delete Train</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this train? All associated schedules and data will be permanently removed.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTrainToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => trainToDelete && deleteTrain(trainToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Train
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}