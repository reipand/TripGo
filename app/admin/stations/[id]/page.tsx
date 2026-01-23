'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import {
  ArrowLeft,
  Edit,
  MapPin,
  Building,
  Navigation,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Copy
} from 'lucide-react';
import Link from 'next/link';

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

interface Route {
  id: string;
  route_code: string;
  origin_station: string;
  destination_station: string;
  distance: number;
  estimated_time: number;
  is_active: boolean;
}

export default function StationDetailsPage() {
  useAdminRoute();
  const router = useRouter();
  const params = useParams();
  const stationId = params.id as string;
  
  const { userProfile, loading: authLoading } = useAuth();
  
  const [station, setStation] = useState<Station | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (stationId && !authLoading) {
      fetchStationDetails();
      fetchRoutes();
    }
  }, [stationId, authLoading]);

  const fetchStationDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('stasiun')
        .select('*')
        .eq('id', stationId)
        .single();

      if (queryError) {
        console.error('Error fetching station:', queryError);
        throw new Error('Station not found or access denied');
      }

      if (!data) {
        throw new Error('Station not found');
      }

      setStation(data);
    } catch (err: any) {
      console.error('Error fetching station:', err);
      setError(err.message || 'Failed to load station details');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('routes')
        .select('*')
        .or(`origin_station.eq.${station?.nama_stasiun},destination_station.eq.${station?.nama_stasiun}`);

      if (queryError) {
        console.error('Error fetching routes:', queryError);
        return;
      }

      setRoutes(data || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const deleteStation = async () => {
    try {
      // Check if station is used in routes
      if (routes.length > 0) {
        alert('Cannot delete station that is being used in routes. Deactivate it instead.');
        setShowDeleteModal(false);
        return;
      }

      const { error: deleteError } = await supabase
        .from('stasiun')
        .delete()
        .eq('id', stationId);

      if (deleteError) throw deleteError;

      alert('Station deleted successfully');
      router.push('/admin/stations');
    } catch (err: any) {
      console.error('Error deleting station:', err);
      alert('Failed to delete station');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !station) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-semibold text-red-800">Error</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <Link
            href="/admin/stations"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Stations</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!station) return null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/stations"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{station.nama_stasiun}</h1>
              <p className="text-gray-600 mt-2">Station Details & Information</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/admin/stations/${stationId}/edit`)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Station</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Station Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Station Overview Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Station Overview</h2>
              <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                station.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {station.is_active ? (
                  <>
                    <CheckCircle className="w-3 h-3" />
                    <span>Active</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    <span>Inactive</span>
                  </>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Station Code
                  </label>
                  <div className="flex items-center space-x-2">
                    <p className="text-lg font-bold text-gray-900">{station.kode_stasiun}</p>
                    <button
                      onClick={() => copyToClipboard(station.kode_stasiun)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Copy code"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Station Name
                  </label>
                  <p className="text-gray-900">{station.nama_stasiun}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Station ID
                  </label>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded break-all">
                      {station.id}
                    </p>
                    <button
                      onClick={() => copyToClipboard(station.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Copy ID"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    City
                  </label>
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{station.city}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Station Type
                  </label>
                  <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                    station.type === 'utama' 
                      ? 'bg-purple-100 text-purple-800'
                      : station.type === 'terminal'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    <Navigation className="w-3 h-3" />
                    <span>{station.type}</span>
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Created Date
                  </label>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(station.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Associated Routes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Associated Routes</h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {routes.length} routes
              </span>
            </div>

            {routes.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No routes found for this station</p>
                <p className="text-sm text-gray-400 mt-1">
                  This station is not used in any routes yet
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Route Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Origin → Destination
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Distance
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {routes.map(route => (
                      <tr key={route.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono font-medium text-gray-900">
                            {route.route_code}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm text-gray-900">{route.origin_station}</div>
                            <div className="text-xs text-gray-500">→</div>
                            <div className="text-sm text-gray-900">{route.destination_station}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {route.distance} km
                          </div>
                          <div className="text-xs text-gray-500">
                            ~{Math.floor(route.estimated_time / 60)}h {route.estimated_time % 60}m
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            route.is_active 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {route.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Actions & Metadata */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/admin/stations/${stationId}/edit`)}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <Edit className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-700">Edit Station</p>
                  <p className="text-sm text-blue-600">Update station information</p>
                </div>
              </button>

              <button
                onClick={() => {
                  router.push(`/admin/stations/create?duplicate=${stationId}`);
                }}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-green-50 rounded-lg transition-colors border border-green-200"
              >
                <Copy className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">Duplicate Station</p>
                  <p className="text-sm text-green-600">Create similar station</p>
                </div>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-700">Delete Station</p>
                  <p className="text-sm text-red-600">Remove station permanently</p>
                </div>
              </button>
            </div>
          </div>

          {/* Station Metadata */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Metadata
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Created</span>
                </div>
                <span className="text-sm text-gray-900">
                  {new Date(station.created_at).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Last Updated</span>
                </div>
                <span className="text-sm text-gray-900">
                  {new Date(station.updated_at).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Database Table</span>
                </div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">stasiun</code>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className={`rounded-xl p-6 ${
            station.is_active 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 rounded-lg ${
                station.is_active ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {station.is_active ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Status</h3>
            </div>
            <p className={`text-sm ${
              station.is_active ? 'text-green-700' : 'text-red-700'
            }`}>
              {station.is_active 
                ? 'This station is active and available for route creation and booking.'
                : 'This station is inactive and not available for new routes.'
              }
            </p>
            <button
              onClick={() => router.push(`/admin/stations/${stationId}/edit`)}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Change status →
            </button>
          </div>
        </div>
      </div>

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
            
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{station.nama_stasiun}</strong>?
            </p>
            
            {routes.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Warning</p>
                    <p className="text-sm text-yellow-700">
                      This station is used in {routes.length} route(s). Deleting it may affect existing routes.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteStation}
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