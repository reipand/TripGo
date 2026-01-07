'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { supabase } from '@/app/lib/supabaseClient';
import { Plus, Edit, Trash2, Copy, Calendar, Tag } from 'lucide-react';

const AdminDashboard = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [promotions, setPromotions] = useState<any[]>([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  
  const [promoForm, setPromoForm] = useState({
    name: '',
    description: '',
    promo_code: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_order_amount: 0,
    max_discount_amount: null as number | null,
    start_date: '',
    end_date: '',
    usage_limit: null as number | null,
    user_limit: 1,
    is_active: true,
    applicable_to: { all: true }
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingTransactions: 0,
    activePromos: 0,
    promoUsage: 0,
    recentBookings: [] as any[],
  });

  useEffect(() => {
    if (activeTab === 'promotions') {
      fetchPromotions();
    } else if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // ... existing stats fetching code ...
      
      // Fetch promo stats
      const { count: activePromosCount } = await supabase
        .from('promotions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('end_date', new Date().toISOString());

      const { count: promoUsageCount } = await supabase
        .from('user_promo_usage')
        .select('*', { count: 'exact', head: true });

      setStats(prev => ({
        ...prev,
        activePromos: activePromosCount || 0,
        promoUsage: promoUsageCount || 0,
      }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePromo = async () => {
    try {
      const formData = {
        ...promoForm,
        discount_value: Number(promoForm.discount_value),
        min_order_amount: Number(promoForm.min_order_amount),
        max_discount_amount: promoForm.max_discount_amount ? Number(promoForm.max_discount_amount) : null,
        usage_limit: promoForm.usage_limit ? Number(promoForm.usage_limit) : null,
        start_date: new Date(promoForm.start_date).toISOString(),
        end_date: new Date(promoForm.end_date).toISOString(),
      };

      if (editingPromo) {
        const { error } = await supabase
          .from('promotions')
          .update(formData)
          .eq('id', editingPromo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('promotions')
          .insert([formData]);
        if (error) throw error;
      }

      setShowPromoModal(false);
      setEditingPromo(null);
      setPromoForm({
        name: '',
        description: '',
        promo_code: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_order_amount: 0,
        max_discount_amount: null,
        start_date: '',
        end_date: '',
        usage_limit: null,
        user_limit: 1,
        is_active: true,
        applicable_to: { all: true }
      });
      fetchPromotions();
    } catch (error) {
      console.error('Error saving promo:', error);
      alert('Gagal menyimpan promo');
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus promo ini?')) return;
    
    try {
      const { error } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchPromotions();
    } catch (error) {
      console.error('Error deleting promo:', error);
    }
  };

  const generatePromoCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPromoForm({...promoForm, promo_code: result});
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner text="Memuat dashboard..." />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600 mt-2">Selamat datang, {userProfile?.first_name || user?.email}!</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'dashboard'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'promotions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Promo & Voucher
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'bookings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pesanan
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pengguna
          </button>
        </nav>
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Stats Cards - Updated with Promo Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* ... existing stats cards ... */}
            
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Promo Aktif</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activePromos}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Tag className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Penggunaan Promo</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.promoUsage}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Copy className="text-indigo-600" size={24} />
                </div>
              </div>
            </div>
          </div>
          
          {/* ... rest of dashboard ... */}
        </>
      )}

      {activeTab === 'promotions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Kelola Promo & Voucher</h2>
            <button
              onClick={() => setShowPromoModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition"
            >
              <Plus size={20} />
              Tambah Promo
            </button>
          </div>

          {/* Promotions List */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {promotions.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">Belum ada promo yang dibuat</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nama Promo</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kode</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Diskon</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Periode</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Penggunaan</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {promotions.map((promo) => {
                      const isExpired = new Date(promo.end_date) < new Date();
                      return (
                        <tr key={promo.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">{promo.name}</p>
                              <p className="text-sm text-gray-500">{promo.description}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                              {promo.promo_code}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {promo.discount_type === 'percentage'
                                  ? `${promo.discount_value}%`
                                  : `Rp${Number(promo.discount_value).toLocaleString('id-ID')}`}
                              </p>
                              {promo.min_order_amount > 0 && (
                                <p className="text-xs text-gray-500">
                                  Min. Rp{Number(promo.min_order_amount).toLocaleString('id-ID')}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-gray-400" />
                              <div className="text-sm">
                                <p>{new Date(promo.start_date).toLocaleDateString('id-ID')}</p>
                                <p className="text-gray-500">sampai</p>
                                <p>{new Date(promo.end_date).toLocaleDateString('id-ID')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p>{promo.usage_count || 0} / {promo.usage_limit || '∞'}</p>
                              <p className="text-gray-500 text-xs">{promo.user_limit}x per user</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                !promo.is_active
                                  ? 'bg-gray-100 text-gray-800'
                                  : isExpired
                                  ? 'bg-error-100 text-error-800'
                                  : 'bg-success-100 text-success-800'
                              }`}
                            >
                              {!promo.is_active ? 'Nonaktif' : isExpired ? 'Kadaluarsa' : 'Aktif'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingPromo(promo);
                                  setPromoForm({
                                    ...promo,
                                    start_date: promo.start_date.split('T')[0],
                                    end_date: promo.end_date.split('T')[0],
                                  });
                                  setShowPromoModal(true);
                                }}
                                className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeletePromo(promo.id)}
                                className="p-2 text-error-600 hover:bg-error-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Promo Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingPromo ? 'Edit Promo' : 'Buat Promo Baru'}
              </h3>
              <button
                onClick={() => {
                  setShowPromoModal(false);
                  setEditingPromo(null);
                  setPromoForm({
                    name: '',
                    description: '',
                    promo_code: '',
                    discount_type: 'percentage',
                    discount_value: 0,
                    min_order_amount: 0,
                    max_discount_amount: null,
                    start_date: '',
                    end_date: '',
                    usage_limit: null,
                    user_limit: 1,
                    is_active: true,
                    applicable_to: { all: true }
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Promo *
                  </label>
                  <input
                    type="text"
                    value={promoForm.name}
                    onChange={(e) => setPromoForm({...promoForm, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Contoh: Promo Natal 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Promo *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoForm.promo_code}
                      onChange={(e) => setPromoForm({...promoForm, promo_code: e.target.value.toUpperCase()})}
                      className="flex-1 p-2 border border-gray-300 rounded-lg uppercase"
                      placeholder="CONTOH123"
                    />
                    <button
                      onClick={generatePromoCode}
                      className="px-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={promoForm.description}
                  onChange={(e) => setPromoForm({...promoForm, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Deskripsi promo yang akan ditampilkan ke user..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe Diskon *
                  </label>
                  <select
                    value={promoForm.discount_type}
                    onChange={(e) => setPromoForm({...promoForm, discount_type: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed_amount">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nilai Diskon *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step={promoForm.discount_type === 'percentage' ? "1" : "1000"}
                      value={promoForm.discount_value}
                      onChange={(e) => setPromoForm({...promoForm, discount_value: parseFloat(e.target.value)})}
                      className="w-full p-2 pl-8 border border-gray-300 rounded-lg"
                    />
                    <span className="absolute left-2 top-2 text-gray-500">
                      {promoForm.discount_type === 'percentage' ? '%' : 'Rp'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min. Order (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={promoForm.min_order_amount}
                    onChange={(e) => setPromoForm({...promoForm, min_order_amount: parseFloat(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maks. Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={promoForm.max_discount_amount || ''}
                    onChange={(e) => setPromoForm({
                      ...promoForm, 
                      max_discount_amount: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Tidak terbatas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maks. Penggunaan
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={promoForm.usage_limit || ''}
                    onChange={(e) => setPromoForm({
                      ...promoForm, 
                      usage_limit: e.target.value ? parseInt(e.target.value) : null
                    })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Tidak terbatas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Mulai *
                  </label>
                  <input
                    type="date"
                    value={promoForm.start_date}
                    onChange={(e) => setPromoForm({...promoForm, start_date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Berakhir *
                  </label>
                  <input
                    type="date"
                    value={promoForm.end_date}
                    onChange={(e) => setPromoForm({...promoForm, end_date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={promoForm.is_active}
                  onChange={(e) => setPromoForm({...promoForm, is_active: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Aktifkan promo
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setShowPromoModal(false);
                  setEditingPromo(null);
                  setPromoForm({
                    name: '',
                    description: '',
                    promo_code: '',
                    discount_type: 'percentage',
                    discount_value: 0,
                    min_order_amount: 0,
                    max_discount_amount: null,
                    start_date: '',
                    end_date: '',
                    usage_limit: null,
                    user_limit: 1,
                    is_active: true,
                    applicable_to: { all: true }
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleSavePromo}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {editingPromo ? 'Update Promo' : 'Buat Promo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;