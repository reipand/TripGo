// app/admin/stations/page.tsx
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
  MapPin,
  Building,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Navigation,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Station {
  id: string;
  kode_stasiun: string;
  nama_stasiun: string;
  city: string;
  type: string;
  tipe: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminStations() {
  useAdminRoute();
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stationToDelete, setStationToDelete] = useState<string | null>(null);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [stationToToggle, setStationToToggle] = useState<Station | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    cities: 0,
    types: 0
  });

  const itemsPerPage = 10;

  const fetchStations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cek jika masih dalam auth loading
      if (authLoading) return;

      let query = supabase
        .from('stasiun')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm.trim()) {
        query = query.or(`kode_stasiun.ilike.%${searchTerm}%,nama_stasiun.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`);
      }

      if (cityFilter !== 'all') {
        query = query.eq('city', cityFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error: queryError, count } = await query.range(from, to);

      if (queryError) {
        console.error('Supabase query error:', queryError);
        throw new Error(queryError.message || 'Failed to fetch stations from database');
      }

      setStations(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

    } catch (err: any) {
      console.error('Error fetching stations:', err);
      setError(err.message || 'Failed to load stations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, cityFilter, typeFilter, statusFilter, searchTerm, authLoading]);

  const fetchCities = useCallback(async () => {
    try {
      if (authLoading) return;

      const { data, error: queryError } = await supabase
        .from('stasiun')
        .select('city')
        .order('city');

      if (queryError) {
        console.error('Error fetching cities:', queryError);
        return;
      }

      // Filter unique cities and ensure they're strings
      const uniqueCities = [...new Set(
        data
          ?.map(s => s.city)
          .filter((city): city is string => Boolean(city && typeof city === 'string'))
      )];
      
      setCities(uniqueCities);

    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  }, [authLoading]);

  const fetchStats = useCallback(async () => {
    try {
      if (authLoading) return;

      const [totalRes, activeRes, cityRes, typeRes] = await Promise.all([
        supabase.from('stasiun').select('*', { count: 'exact', head: true }),
        supabase.from('stasiun')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase.from('stasiun').select('city'),
        supabase.from('stasiun').select('type')
      ]);

      // Count unique cities
      const uniqueCities = new Set(
        cityRes.data
          ?.map(s => s.city)
          .filter((city): city is string => Boolean(city && typeof city === 'string'))
      );
      
      // Count unique types
      const uniqueTypes = new Set(
        typeRes.data
          ?.map(s => s.type)
          .filter((type): type is string => Boolean(type && typeof type === 'string'))
      );

      setStats({
        total: totalRes.count || 0,
        active: activeRes.count || 0,
        cities: uniqueCities.size,
        types: uniqueTypes.size
      });

    } catch (err) {
      console.error('Error fetching station stats:', err);
      // Don't set error for stats, keep default values
    }
  }, [authLoading]);

  // Debounce untuk search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authLoading) {
        fetchStations();
        fetchStats();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchStations, fetchStats, authLoading]);

  // Fetch data awal
  useEffect(() => {
    if (!authLoading) {
      fetchStations();
      fetchCities();
      fetchStats();
    }
  }, [authLoading, fetchStations, fetchCities, fetchStats]);

  const toggleStationStatus = async () => {
    if (!stationToToggle) return;

    try {
      const { error } = await supabase
        .from('stasiun')
        .update({ 
          is_active: !stationToToggle.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', stationToToggle.id);

      if (error) throw error;

      // Refresh data
      await Promise.all([fetchStations(), fetchStats()]);
      
      setShowToggleModal(false);
      setStationToToggle(null);

      alert(`Station ${!stationToToggle.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (err: any) {
      console.error('Error toggling station status:', err);
      alert('Failed to update station status');
    }
  };

  const deleteStation = async (stationId: string) => {
    try {
      // Check if station is used in bookings
      const station = stations.find(s => s.id === stationId);
      if (station) {
        const { count: bookingCount } = await supabase
          .from('bookings_kereta')
          .select('*', { count: 'exact', head: true })
          .or(`origin.ilike.%${station.nama_stasiun}%,destination.ilike.%${station.nama_stasiun}%`);

        if (bookingCount && bookingCount > 0) {
          alert('Cannot delete station that is being used in bookings. Deactivate it instead.');
          return;
        }
      }

      const { error } = await supabase
        .from('stasiun')
        .delete()
        .eq('id', stationId);

      if (error) throw error;

      // Refresh data
      await Promise.all([fetchStations(), fetchStats(), fetchCities()]);
      
      setShowDeleteModal(false);
      setStationToDelete(null);

      alert('Station deleted successfully');
    } catch (err: any) {
      console.error('Error deleting station:', err);
      alert('Failed to delete station');
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getTypeColor = (type: string | null | undefined) => {
    const typeStr = (type || '').toLowerCase();
    switch (typeStr) {
      case 'utama':
        return 'bg-purple-100 text-purple-800';
      case 'perhentian':
        return 'bg-blue-100 text-blue-800';
      case 'terminal':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
            <h1 className="text-2xl font-bold text-gray-800">Stations</h1>
            <p className="text-gray-600 mt-2">Manage train stations and locations</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/admin/stations/create')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Station</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-100">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.total}</h3>
          <p className="text-gray-600 text-sm">Stations</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Active</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.active}</h3>
          <p className="text-gray-600 text-sm">Active Stations</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-100">
              <Building className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Cities</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.cities}</h3>
          <p className="text-gray-600 text-sm">Cities Covered</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-100">
              <Navigation className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Types</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.types}</h3>
          <p className="text-gray-600 text-sm">Station Types</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search stations..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
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
            <option value="utama">Utama</option>
            <option value="perhentian">Perhentian</option>
            <option value="terminal">Terminal</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setCityFilter('all');
              setTypeFilter('all');
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
        
        {/* Status Filter */}
        <div className="mt-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <div className="flex items-center space-x-2">
              {['all', 'active', 'inactive'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    statusFilter === status
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {status === 'all' ? 'All' : status === 'active' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error Loading Stations</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  fetchStations();
                }}
                className="mt-2 text-sm text-red-800 hover:text-red-900 font-medium"
              >
                Retry Loading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Station Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Station Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City & Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No stations found</p>
                      <p className="mt-1">Try adjusting your search or filters</p>
                      {error && (
                        <button
                          onClick={() => {
                            setError(null);
                            setSearchTerm('');
                            setCityFilter('all');
                            setTypeFilter('all');
                            setStatusFilter('all');
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
                stations.map((station) => (
                  <tr key={station.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-mono font-bold text-gray-900">{station.kode_stasiun}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(station.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{station.nama_stasiun}</div>
                        <div className="text-sm text-gray-600">ID: {station.id.substring(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="font-medium text-gray-900">{station.city || 'Unknown'}</div>
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(station.type)}`}>
                          {station.type || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(station.is_active)}`}>
                        {station.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(station.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        Updated: {new Date(station.updated_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/admin/stations/${station.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => router.push(`/admin/stations/${station.id}/edit`)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setStationToToggle(station);
                            setShowToggleModal(true);
                          }}
                          className={`p-2 rounded-lg transition-colors ${station.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          title={station.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {station.is_active ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => {
                            setStationToDelete(station.id);
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
      {showToggleModal && stationToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 ${stationToToggle.is_active ? 'bg-red-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
                {stationToToggle.is_active ? (
                  <XCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {stationToToggle.is_active ? 'Deactivate Station' : 'Activate Station'}
                </h3>
                <p className="text-sm text-gray-600">{stationToToggle.nama_stasiun}</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              {stationToToggle.is_active 
                ? 'Are you sure you want to deactivate this station? It will no longer be available for new routes.'
                : 'Are you sure you want to activate this station? It will become available for new routes.'
              }
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowToggleModal(false);
                  setStationToToggle(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={toggleStationStatus}
                className={`px-4 py-2 ${stationToToggle.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition-colors`}
              >
                {stationToToggle.is_active ? 'Deactivate' : 'Activate'}
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
                <h3 className="text-lg font-semibold text-gray-800">Delete Station</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this station? All associated data will be permanently removed.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setStationToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => stationToDelete && deleteStation(stationToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Station
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}