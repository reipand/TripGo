'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import { ChevronLeft, Save } from 'lucide-react';

export default function EditStation({ params }: { params: Promise<{ id: string }> }) {
  useAdminRoute();
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const { id } = use(params);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    kode_stasiun: '',
    nama_stasiun: '',
    city: '',
    tipe: 'DAOP 1',
    is_active: true
  });

  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        const { data, error } = await supabase.from('stasiun').select('*').eq('id', id).single();
        if (error) {
          alert('Station not found');
          router.push('/admin/stations');
          return;
        }
        setFormData({
          kode_stasiun: data.kode_stasiun,
          nama_stasiun: data.nama_stasiun,
          city: data.city,
          tipe: data.tipe || '',
          is_active: data.is_active
        });
      }
      setFetching(false);
    };
    if (!authLoading) fetchData();
  }, [authLoading, id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('stasiun')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      alert('Station updated successfully!');
      router.push('/admin/stations');
    } catch (error: any) {
      alert('Error updating station: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetching) return <div>Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="mr-4 text-gray-500 hover:text-gray-700 transition"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Station</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Station Code</label>
            <input
              type="text"
              name="kode_stasiun"
              required
              value={formData.kode_stasiun}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Station Name</label>
            <input
              type="text"
              name="nama_stasiun"
              required
              value={formData.nama_stasiun}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">DAOP / Region</label>
            <input
              type="text"
              name="tipe"
              value={formData.tipe}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center mt-6">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900">Active Station</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 mr-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            {loading ? 'Saving...' : <><Save size={18} /> Update Station</>}
          </button>
        </div>

      </form>
    </div>
  );
}