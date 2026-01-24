'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import {
    ChevronLeft,
    Calendar,
    Plus,
    Edit,
    Trash2,
    Clock,
    AlertCircle,
    Train
} from 'lucide-react';

interface Schedule {
    id: string;
    train_id: string;
    travel_date: string;
    status: string;
    created_at: string;
    kereta: {
        nama_kereta: string;
        kode_kereta: string;
    };
}

interface TrainData {
    id: string;
    nama_kereta: string;
    kode_kereta: string;
}

export default function TrainSchedulesPage({ params }: { params: Promise<{ id: string }> }) {
    useAdminRoute();
    const router = useRouter();
    const { loading: authLoading } = useAuth();
    const { id } = use(params);

    const [train, setTrain] = useState<TrainData | null>(null);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            try {
                setLoading(true);

                // Fetch train details
                const { data: trainData, error: trainError } = await supabase
                    .from('kereta')
                    .select('id, nama_kereta, kode_kereta')
                    .eq('id', id)
                    .single();

                if (trainError) throw trainError;
                setTrain(trainData);

                // Fetch schedules for this train
                const { data: scheduleData, error: scheduleError } = await supabase
                    .from('jadwal_kereta')
                    .select(`
                        *,
                        kereta (nama_kereta, kode_kereta)
                    `)
                    .eq('train_id', id)
                    .order('travel_date', { ascending: true });

                if (scheduleError) throw scheduleError;
                setSchedules(scheduleData || []);

            } catch (err: any) {
                console.error('Error fetching train schedules:', err);
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) fetchData();
    }, [id, authLoading]);

    const deleteSchedule = async (scheduleId: string) => {
        if (!confirm('Are you sure you want to delete this schedule?')) return;

        try {
            const response = await fetch(`/api/admin/schedules/${scheduleId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete schedule');
            }

            setSchedules(prev => prev.filter(s => s.id !== scheduleId));
            alert('Schedule deleted successfully');
        } catch (err: any) {
            alert('Error: ' + err.message);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !train) {
        return (
            <div className="p-6 text-center">
                <div className="bg-red-50 text-red-800 p-4 rounded-lg inline-flex items-center gap-2">
                    <AlertCircle size={20} />
                    <span>{error || 'Train not found'}</span>
                </div>
                <div className="mt-4">
                    <button
                        onClick={() => router.push('/admin/trains')}
                        className="text-blue-600 hover:underline"
                    >
                        Back to Trains List
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/admin/trains')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Schedules for {train.nama_kereta}</h1>
                        <p className="text-gray-500 font-mono text-sm">{train.kode_kereta}</p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/admin/schedules/create')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    Add New Schedule
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {schedules.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-lg font-medium">No schedules found for this train</p>
                                    <p className="mt-1">Add a new schedule to get started</p>
                                </td>
                            </tr>
                        ) : (
                            schedules.map((schedule) => (
                                <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="text-blue-500" size={18} />
                                            <span className="font-medium text-gray-900">
                                                {new Date(schedule.travel_date).toLocaleDateString(undefined, {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${schedule.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                                                schedule.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {schedule.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                        {new Date(schedule.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => router.push(`/admin/schedules/${schedule.id}/edit`)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Schedule"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteSchedule(schedule.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Schedule"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <Train className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-blue-900">Manage Train Settings</h3>
                        <p className="text-blue-700 mt-1">
                            You are currently viewing schedules for <span className="font-bold">{train.nama_kereta}</span>.
                            You can edit train details, capacity, and facilities in the train edit page.
                        </p>
                        <button
                            onClick={() => router.push(`/admin/trains/${id}/edit`)}
                            className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            Go to Edit Train Page
                            <ChevronLeft className="rotate-180" size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
