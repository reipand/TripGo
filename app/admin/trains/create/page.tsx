'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import { ChevronLeft, Save, Train, Info, Users, CheckSquare } from 'lucide-react';

export default function CreateTrain() {
    useAdminRoute();
    const router = useRouter();
    const { loading: authLoading } = useAuth();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        kode_kereta: '',
        nama_kereta: '',
        operator: 'PT KAI',
        tipe_kereta: 'Eksekutif',
        jumlah_kursi: 50,
        keterangan: '',
        is_active: true,
        fasilitas: {
            ac: true,
            toilet: true,
            socket: true,
            wifi: false,
            makan: false,
            bantal: false,
            selimut: false
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFacilityChange = (key: string) => {
        setFormData(prev => ({
            ...prev,
            fasilitas: {
                ...prev.fasilitas,
                [key]: !prev.fasilitas[key as keyof typeof prev.fasilitas]
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('kereta')
                .insert([{
                    ...formData,
                    jumlah_kursi: Number(formData.jumlah_kursi),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (error) throw error;

            alert('Train created successfully!');
            router.push('/admin/trains');
        } catch (error: any) {
            alert('Error creating train: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div>Loading...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => router.back()}
                    className="mr-4 text-gray-500 hover:text-gray-700 transition"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Add New Train</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">

                {/* Basic Information */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Train size={20} className="text-blue-600" />
                        Basic Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Train Code</label>
                            <input
                                type="text"
                                name="kode_kereta"
                                required
                                value={formData.kode_kereta}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. ARGO-001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Train Name</label>
                            <input
                                type="text"
                                name="nama_kereta"
                                required
                                value={formData.nama_kereta}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Argo Parahyangan"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                            <input
                                type="text"
                                name="operator"
                                required
                                value={formData.operator}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Class Type</label>
                            <select
                                name="tipe_kereta"
                                value={formData.tipe_kereta}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Eksekutif">Eksekutif</option>
                                <option value="Bisnis">Bisnis</option>
                                <option value="Ekonomi">Ekonomi</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Capacity & Description */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-blue-600" />
                        Capacity & Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Seats</label>
                            <input
                                type="number"
                                name="jumlah_kursi"
                                min="1"
                                required
                                value={formData.jumlah_kursi}
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
                                <span className="ms-3 text-sm font-medium text-gray-900">Active</span>
                            </label>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                name="keterangan"
                                rows={3}
                                value={formData.keterangan}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Additional information..."
                            />
                        </div>
                    </div>
                </section>

                {/* Facilities */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <CheckSquare size={20} className="text-blue-600" />
                        Facilities
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.keys(formData.fasilitas).map((key) => (
                            <label key={key} className="flex items-center space-x-2 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition">
                                <input
                                    type="checkbox"
                                    checked={formData.fasilitas[key as keyof typeof formData.fasilitas]}
                                    onChange={() => handleFacilityChange(key)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="capitalize">{key.replace('_', ' ')}</span>
                            </label>
                        ))}
                    </div>
                </section>

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
                        {loading ? 'Saving...' : <><Save size={18} /> Save Train</>}
                    </button>
                </div>

            </form>
        </div>
    );
}
