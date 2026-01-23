'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import {
    Users,
    Calendar,
    Train as TrainIcon,
    Search,
    Download,
    RefreshCw,
    Printer,
    ChevronRight,
    User,
    Ticket
} from 'lucide-react';

interface ManifestItem {
    id: string;
    name: string;
    nik: string;
    email: string;
    phone: string;
    bookingCode: string;
    bookingStatus: string;
    origin: string;
    destination: string;
    trainName: string;
    trainCode: string;
    travelDate: string;
    departureTime: string;
    seatNumber: string;
    coach: string;
    class: string;
}

export default function AdminManifestPage() {
    useAdminRoute();
    const { loading: authLoading } = useAuth();

    // Filters
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTrain, setSelectedTrain] = useState('all');
    const [selectedSchedule, setSelectedSchedule] = useState('all');

    // Data
    const [manifest, setManifest] = useState<ManifestItem[]>([]);
    const [trains, setTrains] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, adult: 0 });

    const fetchTrains = async () => {
        const { data } = await supabase.from('kereta').select('id, nama_kereta, kode_kereta').order('nama_kereta');
        setTrains(data || []);
    };

    const fetchSchedules = useCallback(async () => {
        let query = supabase
            .from('jadwal_kereta')
            .select(`
        id,
        travel_date,
        departure_time,
        arrival_time,
        kereta:train_id (
          id,
          nama_kereta,
          kode_kereta
        ),
        asal:origin_station_id (nama_stasiun),
        tujuan:destination_station_id (nama_stasiun)
      `)
            .eq('travel_date', selectedDate);

        if (selectedTrain !== 'all') {
            query = query.eq('train_id', selectedTrain);
        }

        const { data } = await query.order('departure_time');
        setSchedules(data || []);
    }, [selectedDate, selectedTrain]);

    const fetchManifest = useCallback(async () => {
        if (authLoading) return;

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedSchedule !== 'all') params.set('scheduleId', selectedSchedule);
            if (selectedTrain !== 'all') params.set('trainId', selectedTrain);
            if (selectedDate) params.set('date', selectedDate);

            const response = await fetch(`/api/admin/manifest?${params.toString()}`);
            const result = await response.json();

            if (result.success) {
                setManifest(result.data);
                setStats({
                    total: result.count,
                    adult: result.count // Simplified
                });
            }
        } catch (error) {
            console.error('Error fetching manifest:', error);
        } finally {
            setLoading(false);
        }
    }, [authLoading, selectedDate, selectedTrain, selectedSchedule]);

    useEffect(() => {
        fetchTrains();
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    useEffect(() => {
        fetchManifest();
    }, [fetchManifest]);

    const handlePrint = () => {
        window.print();
    };

    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <RefreshCw className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto print:p-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manifest Penumpang</h1>
                    <p className="text-gray-600">Daftar penumpang berdasarkan rute dan jadwal</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchManifest}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition shadow-sm"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition shadow-md"
                    >
                        <Printer size={18} />
                        Cetak Manifest
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Keberangkatan</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Filter Kereta</label>
                    <div className="relative">
                        <TrainIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={selectedTrain}
                            onChange={(e) => setSelectedTrain(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none outline-none"
                        >
                            <option value="all">Semua Kereta</option>
                            {trains.map(t => (
                                <option key={t.id} value={t.id}>{t.nama_kereta} ({t.kode_kereta})</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Jadwal</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            value={selectedSchedule}
                            onChange={(e) => setSelectedSchedule(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none outline-none"
                        >
                            <option value="all">Pilih Spesifik Jadwal</option>
                            {schedules.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.departure_time} - {s.asal?.nama_stasiun} ke {s.tujuan?.nama_stasiun}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 print:hidden">
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Total Penumpang</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                            <User size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-emerald-600 font-medium">Penumpang Dewasa</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.adult}</p>
                        </div>
                    </div>
                </div>

                {/* Print Header (Only visible on print) */}
                <div className="hidden print:block col-span-4 mb-8 text-center border-b pb-6">
                    <h1 className="text-3xl font-bold">MANIFEST PENUMPANG KERETA API</h1>
                    <p className="text-xl mt-2">{selectedDate}</p>
                    <div className="flex justify-center gap-12 mt-4 text-lg">
                        <span>Kereta: {manifest[0]?.trainName || '-'}</span>
                        <span>Kode: {manifest[0]?.trainCode || '-'}</span>
                    </div>
                </div>
            </div>

            {/* Manifest Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden print:border-none print:shadow-none">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200 print:bg-white print:border-black">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">No</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Penumpang</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Identitas (NIK)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Kursi</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Relasi</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Kode Booking</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 print:divide-black">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <RefreshCw className="animate-spin text-blue-600 mx-auto mb-4" size={32} />
                                        <p className="text-gray-500">Memuat data manifest...</p>
                                    </td>
                                </tr>
                            ) : manifest.length > 0 ? (
                                manifest.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors print:hover:bg-white">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-500">{item.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{item.nik}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold bg-blue-50 text-blue-700 border border-blue-100 print:bg-white print:border-black">
                                                {item.coach}-{item.seatNumber}
                                            </span>
                                            <div className="text-[10px] text-gray-400 mt-1 uppercase">{item.class}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-xs text-gray-700 flex items-center gap-1">
                                                <span className="font-semibold">{item.origin}</span>
                                                <ChevronRight size={12} className="text-gray-400" />
                                                <span className="font-semibold">{item.destination}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-1">{item.departureTime}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Ticket size={14} className="text-gray-400" />
                                                <span className="text-sm font-bold text-blue-600 font-mono">{item.bookingCode}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${item.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                    item.bookingStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.bookingStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <Users className="text-gray-300" size={32} />
                                            </div>
                                            <p className="text-gray-500 font-medium">Tidak ada data penumpang pada rute/jadwal ini.</p>
                                            <p className="text-gray-400 text-sm">Coba ubah filter atau tanggal pencarian.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="mt-8 text-center text-gray-400 text-xs hidden print:block">
                Dicetak otomatis oleh TripGo Admin System pada {new Date().toLocaleString()}
            </div>
        </div>
    );
}
