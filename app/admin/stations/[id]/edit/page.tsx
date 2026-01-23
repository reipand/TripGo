'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  MapPin,
  Building,
  CheckCircle,
  XCircle
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

export default function EditStationPage() {
  useAdminRoute();
  const router = useRouter();
  const params = useParams();
  const stationId = params.id as string;
  
  const { userProfile, loading: authLoading } = useAuth();
  
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    kode_stasiun: '',
    nama_stasiun: '',
    city: '',
    type: 'utama',
    is_active: true
  });

  const stationTypes = [
    { value: 'utama', label: 'Utama' },
    { value: 'perhentian', label: 'Perhentian' },
    { value: 'terminal', label: 'Terminal' },
    { value: 'komersial', label: 'Komersial' },
    { value: 'non_komersial', label: 'Non-Komersial' }
  ];

  useEffect(() => {
    if (stationId && !authLoading) {
      fetchStation();
    }
  }, [stationId, authLoading]);

  const fetchStation = async () => {
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
      setFormData({
        kode_stasiun: data.kode_stasiun || '',
        nama_stasiun: data.nama_stasiun || '',
        city: data.city || '',
        type: data.type || 'utama',
        is_active: data.is_active
      });
    } catch (err: any) {
      console.error('Error fetching station:', err);
      setError(err.message || 'Failed to load station');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
  };

  const validateForm = () => {
    if (!formData.kode_stasiun.trim()) {
      return 'Station code is required';
    }
    if (!formData.nama_stasiun.trim()) {
      return 'Station name is required';
    }
    if (!formData.city.trim()) {
      return 'City is required';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Check if station code already exists (excluding current station)
      const { data: existingStations } = await supabase
        .from('stasiun')
        .select('id')
        .eq('kode_stasiun', formData.kode_stasiun)
        .neq('id', stationId);

      if (existingStations && existingStations.length > 0) {
        throw new Error('Station code already exists');
      }

      const { error: updateError } = await supabase
        .from('stasiun')
        .update({
          kode_stasiun: formData.kode_stasiun.trim(),
          nama_stasiun: formData.nama_stasiun.trim(),
          city: formData.city.trim(),
          type: formData.type,
          tipe: formData.type, // Update both fields
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', stationId);

      if (updateError) {
        console.error('Error updating station:', updateError);
        throw new Error(updateError.message || 'Failed to update station');
      }

      setSuccess('Station updated successfully!');
      
      // Refresh station data
      await fetchStation();
      
      // Redirect back to stations list after 2 seconds
      setTimeout(() => {
        router.push('/admin/stations');
      }, 2000);
    } catch (err: any) {
      console.error('Error updating station:', err);
      setError(err.message || 'Failed to update station. Please try again.');
    } finally {
      setSaving(false);
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
              <h1 className="text-2xl font-bold text-gray-800">Edit Station</h1>
              <p className="text-gray-600 mt-2">
                Update station information for {station?.nama_stasiun}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              station?.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {station?.is_active ? (
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
        </div>
      </div>

      {/* Station Info */}
      {station && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Station Information</h2>
              
              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-green-800">{success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Station Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Station Code *
                  </label>
                  <input
                    type="text"
                    name="kode_stasiun"
                    value={formData.kode_stasiun}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter station code (e.g., BKS, GMR)"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Unique code for identifying the station
                  </p>
                </div>

                {/* Station Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Station Name *
                  </label>
                  <input
                    type="text"
                    name="nama_stasiun"
                    value={formData.nama_stasiun}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter station name"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Full name of the station
                  </p>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Enter city name"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    City where the station is located
                  </p>
                </div>

                {/* Station Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Station Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {stationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Type of station based on its function
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Station is active and available for routes
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <Link
                    href="/admin/stations"
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </Link>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/stations/${stationId}`)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      View Details
                    </button>
                    
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
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Station ID Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Station ID
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Station ID</p>
                  <p className="font-mono text-sm bg-gray-50 p-2 rounded mt-1 break-all">
                    {station.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-sm text-gray-900">
                    {new Date(station.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm text-gray-900">
                    {new Date(station.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/admin/stations/${stationId}`)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span className="text-gray-700">View Station Details</span>
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    const newStatus = !formData.is_active;
                    setFormData(prev => ({ ...prev, is_active: newStatus }));
                  }}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {formData.is_active ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    <span className="text-gray-700">
                      {formData.is_active ? 'Deactivate Station' : 'Activate Station'}
                    </span>
                  </div>
                </button>
                
                <Link
                  href="/admin/stations"
                  className="flex items-center space-x-3 p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to All Stations</span>
                </Link>
              </div>
            </div>

            {/* Stats Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                Current Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Station Code</span>
                  <span className="font-medium">{station.kode_stasiun}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Type</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    station.type === 'utama' 
                      ? 'bg-purple-100 text-purple-800'
                      : station.type === 'terminal'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {station.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">City</span>
                  <span className="font-medium">{station.city}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    station.is_active 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {station.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}