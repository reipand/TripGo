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
    MapPin,
    ArrowRight,
    Clock
} from 'lucide-react';

interface Route {
    id: string;
    schedule_id?: string;
    train_id?: string;
    origin_station_id: string;
    destination_station_id: string;
    arrival_time: string;
    departure_time: string;
    duration_minutes: number;
    route_order: number;
    kereta?: {
        nama_kereta: string;
    };
    stasiun_origin?: {
        nama_stasiun: string;
        kode_stasiun: string;
    };
    stasiun_destination?: {
        nama_stasiun: string;
        kode_stasiun: string;
    };
}

export default function AdminRoutes() {
    useAdminRoute();
    const router = useRouter();
    const { loading: authLoading } = useAuth();

    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const itemsPerPage = 10;

    const fetchRoutes = async () => {
        try {
            setLoading(true);
            // We need to join origin and destination stations
            // Note: Supabase JS syntax for multiple foreign keys to same table requires alias or explicit relation, but here we can try standard join.
            // If relations are named: origin_station, destination_station

            let query = supabase
                .from('rute_kereta')
                .select(`
          *,
          kereta (nama_kereta),
          origin:origin_station_id (nama_stasiun, kode_stasiun),
          destination:destination_station_id (nama_stasiun, kode_stasiun)
        `, { count: 'exact' })
                .order('created_at', { ascending: false });

            if (searchTerm) {
                // Complex search not easily supported on joins without inner
            }

            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            // Map alias results if needed, though Supabase returns object structure
            const formattedData = data?.map((item: any) => ({
                ...item,
                stasiun_origin: item.origin,
                stasiun_destination: item.destination
            }));

            setRoutes(formattedData || []);
            setTotalPages(Math.ceil((count || 0) / itemsPerPage));

        } catch (err: any) {
            console.error('Error fetching routes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchRoutes();

            const channel = supabase.channel('admin-routes-list')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'rute_kereta' }, () => {
                    fetchRoutes();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [authLoading, currentPage]);

    const deleteRoute = async (id: string) => {
        if (!confirm('Are you sure you want to delete this route segment?')) return;
        try {
            const { error } = await supabase.from('rute_kereta').delete().eq('id', id);
            if (error) throw error;
            fetchRoutes();
        } catch (err: any) {
            alert('Error deleting route: ' + err.message);
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
                    <h1 className="text-2xl font-bold text-gray-800">Route Segments</h1>
                    <p className="text-gray-600">Manage train route segments and stops</p>
                </div>
                <button
                    onClick={() => router.push('/admin/routes/create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    Add Route Segment
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Train</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Times</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {routes.map((route) => (
                            <tr key={route.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <span className="font-medium text-gray-900">{route.kereta?.nama_kereta || '-'}</span>
                                    {route.route_order && <span className="ml-2 text-xs text-gray-500">Order: {route.route_order}</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-green-600" />
                                        <div>
                                            <div className="text-sm font-medium">{route.stasiun_origin?.nama_stasiun}</div>
                                            <div className="text-xs text-gray-500">{route.stasiun_origin?.kode_stasiun}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-red-600" />
                                        <div>
                                            <div className="text-sm font-medium">{route.stasiun_destination?.nama_stasiun}</div>
                                            <div className="text-xs text-gray-500">{route.stasiun_destination?.kode_stasiun}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 flex items-center gap-1">
                                        <Clock size={14} />
                                        {route.departure_time} - {route.arrival_time}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {route.duration_minutes} mins
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/routes/${route.id}/edit`)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => deleteRoute(route.id)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {routes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    No route segments found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
