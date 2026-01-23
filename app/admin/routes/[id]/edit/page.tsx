'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import { ChevronLeft, Save } from 'lucide-react';

interface Station {
    id: string;
    nama_stasiun: string;
    kode_stasiun: string;
}

interface Train {
    id: string;
    nama_kereta: string;
    kode_kereta: string;
}

export default function EditRoute({ params }: { params: Promise<{ id: string }> }) {
    useAdminRoute();
    const router = useRouter();
    const { loading: authLoading } = useAuth();
    const { id } = use(params);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [stations, setStations] = useState<Station[]>([]);
    const [trains, setTrains] = useState<Train[]>([]);

   const [formData, setFormData] = useState({
    train_id: '',
    origin_station_id: '',
    destination_station_id: '',
    arrival_time: '',
    departure_time: '',
    duration_minutes: 0,
    route_order: 1
});

    useEffect(() => {
    const fetchData = async () => {
        const { data: stData } = await supabase.from('stasiun').select('id, nama_stasiun, kode_stasiun').order('nama_stasiun');
        if (stData) setStations(stData);

        const { data: trData } = await supabase.from('kereta').select('id, nama_kereta, kode_kereta').eq('is_active', true);
        if (trData) setTrains(trData);

        if (id) {
            const { data: routeData, error } = await supabase.from('rute_kereta').select('*').eq('id', id).single();
            if (error) {
                alert('Route not found');
                router.push('/admin/routes');
                return;
            }
            
            // Convert null values to empty strings
            setFormData({
                train_id: routeData.train_id || '',
                origin_station_id: routeData.origin_station_id || '',
                destination_station_id: routeData.destination_station_id || '',
                arrival_time: routeData.arrival_time || '',
                departure_time: routeData.departure_time || '',
                duration_minutes: routeData.duration_minutes || 0,
                route_order: routeData.route_order || 1
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

    const calculateDuration = () => {
        if (formData.arrival_time && formData.departure_time) {
            const [depH, depM] = formData.departure_time.split(':').map(Number);
            const [arrH, arrM] = formData.arrival_time.split(':').map(Number);

            let duration = (arrH * 60 + arrM) - (depH * 60 + depM);
            if (duration < 0) duration += 24 * 60; // Next day arrival

            setFormData(prev => ({ ...prev, duration_minutes: duration }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('rute_kereta')
                .update({
                    ...formData,
                    duration_minutes: Number(formData.duration_minutes),
                    route_order: Number(formData.route_order),
                    train_id: formData.train_id || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            alert('Route segment updated successfully!');
            router.push('/admin/routes');
        } catch (error: any) {
            alert('Error updating route: ' + error.message);
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
                <h1 className="text-2xl font-bold text-gray-800">Edit Route Segment</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Train (Optional)</label>
                        <select
                            name="train_id"
                            value={formData.train_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- Generic Route --</option>
                            {trains.map(t => (
                                <option key={t.id} value={t.id}>{t.nama_kereta} ({t.kode_kereta})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Route Order</label>
                        <input
                            type="number"
                            name="route_order"
                            value={formData.route_order}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Origin Station</label>
                        <select
                            name="origin_station_id"
                            required
                            value={formData.origin_station_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- Select Origin --</option>
                            {stations.map(s => (
                                <option key={s.id} value={s.id}>{s.nama_stasiun} ({s.kode_stasiun})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination Station</label>
                        <select
                            name="destination_station_id"
                            required
                            value={formData.destination_station_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- Select Destination --</option>
                            {stations.map(s => (
                                <option key={s.id} value={s.id}>{s.nama_stasiun} ({s.kode_stasiun})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                        <input
                            type="time"
                            name="departure_time"
                            required
                            value={formData.departure_time}
                            onChange={handleChange}
                            onBlur={calculateDuration}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                        <input
                            type="time"
                            name="arrival_time"
                            required
                            value={formData.arrival_time}
                            onChange={handleChange}
                            onBlur={calculateDuration}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes)</label>
                        <input
                            type="number"
                            name="duration_minutes"
                            readOnly
                            value={formData.duration_minutes}
                            className="w-full px-4 py-2 border rounded-lg bg-gray-50 outline-none"
                        />
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
                        {loading ? 'Saving...' : <><Save size={18} /> Update Route</>}
                    </button>
                </div>

            </form>
        </div>
    );
}
