'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import { ChevronLeft, Save, Calendar, Clock, MapPin } from 'lucide-react';

interface Train {
    id: string;
    nama_kereta: string;
    kode_kereta: string;
}

export default function CreateSchedule() {
    useAdminRoute();
    const router = useRouter();
    const { loading: authLoading } = useAuth();

    const [loading, setLoading] = useState(false);
    const [trains, setTrains] = useState<Train[]>([]);

    const [formData, setFormData] = useState({
        train_id: '',
        travel_date: '',
        status: 'scheduled'
    });

    useEffect(() => {
        const fetchTrains = async () => {
            const { data } = await supabase
                .from('kereta')
                .select('id, nama_kereta, kode_kereta')
                .eq('is_active', true)
                .order('nama_kereta');

            if (data) setTrains(data);
        };

        if (!authLoading) fetchTrains();
    }, [authLoading]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/admin/schedules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create schedule');
            }

            alert('Schedule created successfully!');
            router.push('/admin/schedules');
        } catch (error: any) {
            alert('Error creating schedule: ' + error.message);
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
                <h1 className="text-2xl font-bold text-gray-800">Add New Schedule</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Train</label>
                        <select
                            name="train_id"
                            required
                            value={formData.train_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- Select Train --</option>
                            {trains.map(train => (
                                <option key={train.id} value={train.id}>
                                    {train.nama_kereta} ({train.kode_kereta})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Travel Date</label>
                        <input
                            type="date"
                            name="travel_date"
                            required
                            value={formData.travel_date}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="scheduled">Scheduled</option>
                            <option value="delayed">Delayed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
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
                        {loading ? 'Saving...' : <><Save size={18} /> Save Schedule</>}
                    </button>
                </div>

            </form>
        </div>
    );
}
