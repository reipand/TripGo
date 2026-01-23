'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import {
  ArrowLeft,
  Save,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield
} from 'lucide-react';
import Link from 'next/link';

export default function CreateStationPage() {
  useAdminRoute();
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stationTypes, setStationTypes] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    kode_stasiun: '',
    nama_stasiun: '',
    city: '',
    type: 'stasiun_utama', // Default value yang valid
    is_active: true
  });

  // Update dengan nilai yang valid
  const validStationTypes = [
    { value: 'stasiun_utama', label: 'Stasiun Utama' },
    { value: 'stasiun_transit', label: 'Stasiun Transit' }
  ];

  // Set default type
  useEffect(() => {
    if (!formData.type) {
      setFormData(prev => ({ ...prev, type: 'stasiun_utama' }));
    }
  }, []);

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
    if (!formData.type) {
      return 'Station type is required';
    }
    
    // Validate station code format
    if (!/^[A-Z0-9]{2,4}$/.test(formData.kode_stasiun)) {
      return 'Station code must be 2-4 uppercase letters/numbers';
    }
    
    // Validate station type
    if (!['stasiun_utama', 'stasiun_transit'].includes(formData.type)) {
      return `Invalid station type. Please use: ${validStationTypes.map(t => t.value).join(', ')}`;
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
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Cek jika user adalah admin
      if (userProfile?.role !== 'admin') {
        throw new Error('You do not have permission to create stations. Admin access required.');
      }

      // Cek jika kode stasiun sudah ada
      const { data: existingStations, error: checkError } = await supabase
        .from('stasiun')
        .select('id')
        .eq('kode_stasiun', formData.kode_stasiun.toUpperCase());

      if (checkError) {
        console.error('Check error:', checkError);
        throw new Error('Error checking station code availability');
      }

      if (existingStations && existingStations.length > 0) {
        throw new Error('Station code already exists');
      }

      // Prepare data untuk insert
      const stationData = {
        kode_stasiun: formData.kode_stasiun.trim().toUpperCase(),
        nama_stasiun: formData.nama_stasiun.trim(),
        city: formData.city.trim(),
        type: formData.type,
        tipe: formData.type, // Untuk kompatibilitas dengan kolom lama
        is_active: formData.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Inserting station data:', stationData);

      // Gunakan service role key untuk bypass RLS jika diperlukan
      // Atau pastikan user memiliki role admin
      const { data, error: insertError } = await supabase
        .from('stasiun')
        .insert(stationData)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error details:', insertError);
        
        // Handle RLS error
        if (insertError.message.includes('row-level security') || 
            insertError.message.includes('violates row-level security')) {
          
          throw new Error(
            'Permission denied: Row Level Security policy prevents this action. ' +
            'Please contact administrator to update RLS policies.'
          );
        }
        
        // Handle enum error
        if (insertError.message.includes('enum') || insertError.message.includes('train_station_type_enum')) {
          throw new Error(
            `Invalid station type. Please use one of: ${validStationTypes.map(t => t.value).join(', ')}`
          );
        }
        
        throw new Error(insertError.message || 'Failed to create station');
      }

      setSuccess('Station created successfully!');
      
      // Reset form
      setFormData({
        kode_stasiun: '',
        nama_stasiun: '',
        city: '',
        type: 'stasiun_utama',
        is_active: true
      });
      
      // Redirect to edit page after 2 seconds
      setTimeout(() => {
        if (data) {
          router.push(`/admin/stations/${data.id}/edit`);
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error creating station:', err);
      setError(err.message || 'Failed to create station. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/stations"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Create New Station</h1>
            <p className="text-gray-600 mt-2">Add a new train station to the system</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* RLS Warning Banner */}
        {userProfile?.role !== 'admin' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="w-6 h-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-yellow-800">Permission Required</h3>
            </div>
            <p className="text-yellow-700 mb-2">
              You need <strong>admin privileges</strong> to create new stations.
            </p>
            <p className="text-sm text-yellow-600">
              Your current role: <span className="font-medium">{userProfile?.role || 'not set'}</span>
            </p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                  {error.includes('row-level security') && (
                    <div className="mt-3 p-3 bg-red-100 rounded">
                      <div className="flex items-start space-x-2">
                        <Shield className="w-4 h-4 text-red-700 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-red-800">RLS Policy Issue</p>
                          <p className="text-xs text-red-700 mt-1">
                            Please ask the database administrator to create an RLS policy that allows admin users to insert records.
                          </p>
                          <div className="mt-2">
                            <p className="text-xs font-medium text-red-800">Quick SQL fix:</p>
                            <pre className="text-xs bg-red-900 text-red-100 p-2 rounded mt-1 overflow-x-auto">
                              {`CREATE POLICY "Allow admin to insert stations"\nON stasiun FOR INSERT TO authenticated\nWITH CHECK (\n  EXISTS (\n    SELECT 1 FROM users\n    WHERE users.id = auth.uid()\n    AND users.role = 'admin'\n  )\n);`}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {error.includes('Invalid station type') && (
                    <div className="mt-2 p-2 bg-red-100 rounded">
                      <p className="text-xs text-red-800">
                        Valid station types: {validStationTypes.map(t => t.value).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-medium">Success!</p>
                  <p className="text-green-700 text-sm mt-1">{success}</p>
                </div>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                placeholder="Enter station code (e.g., BKS, GMR)"
                required
                maxLength={4}
                pattern="[A-Z0-9]{2,4}"
                title="2-4 uppercase letters or numbers"
                disabled={userProfile?.role !== 'admin'}
              />
              <p className="mt-1 text-sm text-gray-500">
                Unique 2-4 character code (e.g., BKS for Bekasi, GMR for Gambir)
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
                disabled={userProfile?.role !== 'admin'}
              />
              <p className="mt-1 text-sm text-gray-500">
                Full name of the station (e.g., Stasiun Bekasi)
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
                disabled={userProfile?.role !== 'admin'}
              />
              <p className="mt-1 text-sm text-gray-500">
                City where the station is located
              </p>
            </div>

            {/* Station Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Station Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
                disabled={userProfile?.role !== 'admin'}
              >
                <option value="">Select station type</option>
                {validStationTypes.map(type => (
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
                disabled={userProfile?.role !== 'admin'}
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
              
              <button
                type="submit"
                disabled={loading || userProfile?.role !== 'admin'}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : userProfile?.role !== 'admin' ? (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Admin Access Required</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create Station</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}