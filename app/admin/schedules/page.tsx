'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Calendar,
    Train,
    CheckCircle,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Filter
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
        tipe_kereta: string;
    };
}

export default function AdminSchedules() {
    useAdminRoute();
    const router = useRouter();
    const { loading: authLoading } = useAuth();

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const itemsPerPage = 100;

    const fetchSchedules = async () => {
        try {
            setLoading(true);

            // Use !inner to allow filtering on the joined table
            let query = supabase
                .from('jadwal_kereta')
                .select(`
                    *,
                    kereta!inner (nama_kereta, kode_kereta, tipe_kereta)
                `, { count: 'exact' });

            // Handle searchTerm: Date (dd/mm/yyyy) or Train Name/Code
            if (searchTerm.trim()) {
                const dateRegex = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/;
                const dateMatch = searchTerm.trim().match(dateRegex);

                if (dateMatch) {
                    // Convert dd/mm/yyyy to YYYY-MM-DD
                    const [_, day, month, year] = dateMatch;
                    const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    query = query.eq('travel_date', formattedDate);
                } else {
                    // Search by train name or code in the joined 'kereta' table
                    query = query.or(`nama_kereta.ilike.%${searchTerm}%,kode_kereta.ilike.%${searchTerm}%`, { foreignTable: 'kereta' });
                }
            }

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            query = query.order('travel_date', { ascending: true });

            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            setSchedules(data || []);
            setTotalCount(count || 0);
            setTotalPages(Math.ceil((count || 0) / itemsPerPage));

        } catch (err) {
            console.error('Error fetching schedules:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;

        // Fetch immediately on initial load or filters change
        // But debounce the searchTerm specifically
        const timer = setTimeout(() => {
            fetchSchedules();
        }, searchTerm ? 500 : 0);

        return () => clearTimeout(timer);
    }, [authLoading, currentPage, statusFilter, searchTerm]);

    // Real-time subscription - Separate effect to avoid re-subscribing on every search keystroke
    useEffect(() => {
        if (authLoading) return;

        const channel = supabase.channel('admin-schedules-realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'jadwal_kereta'
            }, (payload: any) => {
                console.log('Real-time schedule update:', payload);
                fetchSchedules();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [authLoading]);

    const deleteSchedule = async (id: string) => {
        if (!confirm('Are you sure you want to delete this schedule? This might affect bookings.')) return;

        try {
            const response = await fetch(`/api/admin/schedules/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete schedule');
            }

            fetchSchedules();
        } catch (err: any) {
            console.error('Error deleting schedule:', err);
            alert('Error: ' + err.message);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Train Schedules</h1>
                    <p className="text-gray-600">Manage daily train departures</p>
                </div>
                <button
                    onClick={() => router.push('/admin/schedules/create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    Add Schedule
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by date (YYYY-MM-DD)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="delayed">Delayed</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Train</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {schedules.map((schedule) => (
                            <tr key={schedule.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-gray-400" />
                                        <span className="text-sm font-medium text-gray-900">
                                            {new Date(schedule.travel_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-medium text-gray-900">{schedule.kereta?.nama_kereta}</div>
                                        <div className="text-xs text-gray-500">{schedule.kereta?.kode_kereta}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                                        {schedule.kereta?.tipe_kereta}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${schedule.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                                            schedule.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'}`}>
                                        {schedule.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/schedules/${schedule.id}/edit`)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => deleteSchedule(schedule.id)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {schedules.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No schedules found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
