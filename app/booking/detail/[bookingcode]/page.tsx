// app/booking/detail/[bookingcode]/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Train,
    User,
    MapPin,
    CreditCard,
    Download,
    Printer,
    CheckCircle,
    AlertCircle,
    Ticket as TicketIcon,
    RefreshCw,
    QrCode,
    ShieldCheck,
    ChevronRight,
    Info
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/app/contexts/AuthContext';

// --- Types ---
interface BookingDetail {
    booking: any;
    passengers: any[];
    ticket: any | null;
    payment: any | null;
    metadata: {
        has_passengers: boolean;
        has_ticket: boolean;
        has_payment: boolean;
    };
}

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
    const s = status?.toLowerCase();
    if (s === 'confirmed' || s === 'paid' || s === 'success') {
        return (
            <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Terkonfirmasi
            </div>
        );
    }
    if (s === 'pending' || s === 'waiting') {
        return (
            <div className="flex items-center px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
                <Clock className="w-3 h-3 mr-1" />
                Menunggu Pembayaran
            </div>
        );
    }
    return (
        <div className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold border border-gray-200">
            {status}
        </div>
    );
};

const SegmentTimeline = ({ journey }: { journey: any }) => {
    return (
        <div className="relative py-4">
            <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-dashed border-l-2 border-dashed border-gray-200"></div>

            {/* Depature */}
            <div className="relative flex items-start mb-10">
                <div className="z-10 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-900">{journey.origin}</p>
                            <p className="text-xs text-gray-500">{journey.departure_time}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Arrival */}
            <div className="relative flex items-start">
                <div className="z-10 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                    <MapPin className="w-3 h-3 text-white" />
                </div>
                <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-900">{journey.destination}</p>
                            <p className="text-xs text-gray-500">{journey.arrival_time}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function BookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const bookingCode = params.bookingcode as string;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<BookingDetail | null>(null);

    const fetchDetail = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/bookings/detail/${bookingCode}`);
            const result = await response.json();

            if (result.success) {
                setData(result.data);
            } else {
                setError(result.message || 'Gagal memuat detail booking');
            }
        } catch (err) {
            setError('Koneksi terputus. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    }, [bookingCode]);

    useEffect(() => {
        if (bookingCode) {
            fetchDetail();
        }
    }, [bookingCode, fetchDetail]);

    const formatIDR = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return format(parseISO(dateString), 'EEEE, d MMM yyyy', { locale: id });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-10 h-10 text-green-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Memuat Detail Perjalanan...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-gray-100">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Ups! Terjadi Kesalahan</h1>
                    <p className="text-gray-500 mb-8">{error || 'Data tidak ditemukan'}</p>
                    <div className="flex flex-col space-y-3">
                        <button
                            onClick={() => router.back()}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
                        >
                            Kembali
                        </button>
                        <button
                            onClick={fetchDetail}
                            className="w-full py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all"
                        >
                            Coba Lagi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const { booking, passengers, ticket, payment } = data;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-sm font-bold text-gray-900 leading-none">Detail Booking</h1>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{booking.booking_code}</p>
                    </div>
                    <div className="w-10"></div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">

                {/* E-Ticket Visualization Area */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-green-500 rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>

                    <div className="relative bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-green-100/50 border border-white">
                        {/* Ticket Header */}
                        <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-6 text-white">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                                        <Train className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-bold tracking-tight">TripGo E-Ticket</span>
                                </div>
                                <StatusBadge status={booking.status} />
                            </div>

                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-2xl font-black">{booking.train_name}</h2>
                                    <p className="text-white/80 text-xs font-medium uppercase tracking-widest">{booking.train_type || 'Executive'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">PNR Number</p>
                                    <p className="text-xl font-mono font-bold leading-none">{booking.pnr_number || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Journey Details */}
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Berangkat</p>
                                    <p className="text-xl font-black text-gray-900 leading-none mb-1">{booking.departure_time}</p>
                                    <p className="text-sm font-bold text-gray-600">{booking.origin}</p>
                                </div>

                                <div className="px-6 flex flex-col items-center">
                                    <div className="flex items-center space-x-1 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                        <div className="w-16 h-[2px] bg-gradient-to-r from-green-500 to-blue-500"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400">{booking.trip_duration || '3j 15m'}</p>
                                </div>

                                <div className="flex-1 text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tiba</p>
                                    <p className="text-xl font-black text-gray-900 leading-none mb-1">{booking.arrival_time}</p>
                                    <p className="text-sm font-bold text-gray-600">{booking.destination}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 py-6 border-y border-dashed border-gray-100">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tanggal</p>
                                    <p className="text-xs font-bold text-gray-700">{formatDate(booking.departure_date)}</p>
                                </div>
                                <div className="text-center border-x border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kereta</p>
                                    <p className="text-xs font-bold text-gray-700">{booking.coach_number || '2'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kursi</p>
                                    <p className="text-sm font-black text-green-600">{booking.seat_numbers?.join(', ') || '-'}</p>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
                                        <QrCode className="w-16 h-16 text-gray-800" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Scan for Check-in</p>
                                        <p className="text-xs font-medium text-gray-500 max-w-[120px]">Bawa e-tiket ini ke stasiun keberangkatan</p>
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <button className="flex items-center justify-center p-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors border border-green-200">
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button className="flex items-center justify-center p-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200">
                                        <Printer className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Security Footer */}
                        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-center space-x-2">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secured by TripGo Railway Authority</span>
                        </div>
                    </div>
                </div>

                {/* Info Tiles */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                            <Clock className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Batas Check-in</p>
                        <p className="text-sm font-bold text-gray-900">{booking.departure_time} WIB</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-3">
                            <Info className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stasiun</p>
                        <p className="text-sm font-bold text-gray-900">{booking.origin}</p>
                    </div>
                </div>

                {/* Passenger List */}
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                                <User className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-gray-900">Data Penumpang</h3>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-bold uppercase">{passengers.length} Orang</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {passengers.length > 0 ? passengers.map((p, idx) => (
                            <div key={idx} className="p-6 flex items-center justify-between group hover:bg-gray-50/50 transition-colors">
                                <div>
                                    <p className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{p.name || p.passenger_name}</p>
                                    <p className="text-xs text-gray-400 font-medium">{p.id_number || 'NIK: 12345***'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kursi</p>
                                    <p className="text-sm font-black text-gray-900">{p.seat_number || booking.seat_numbers?.[idx] || '-'}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="p-6 flex items-center justify-between group hover:bg-gray-50/50 transition-colors">
                                <div>
                                    <p className="font-bold text-gray-900">{booking.passenger_name}</p>
                                    <p className="text-xs text-gray-400 font-medium">Penumpang Utama</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Kursi</p>
                                    <p className="text-sm font-black text-gray-900">{booking.seat_numbers?.[0] || '-'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-50 flex items-center space-x-3">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900">Rincian Pembayaran</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">Harga Dasar</span>
                            <span className="text-gray-900 font-bold">{formatIDR(booking.base_price || (booking.total_amount - 15000))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">Biaya Layanan & Asuransi</span>
                            <span className="text-gray-900 font-bold">{formatIDR(15000)}</span>
                        </div>
                        {booking.discount_amount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-green-600 font-medium">Potongan Promo</span>
                                <span className="text-green-600 font-bold">-{formatIDR(booking.discount_amount)}</span>
                            </div>
                        )}
                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Pembayaran</p>
                                <StatusBadge status={booking.payment_status} />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{formatIDR(booking.total_amount)}</p>
                        </div>

                        <div className="mt-6 p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 uppercase text-[10px] font-black text-gray-400">
                                    {booking.payment_method?.slice(0, 2) || 'EW'}
                                </div>
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">{booking.payment_method || 'E-Wallet'}</span>
                            </div>
                            <div className="flex items-center text-gray-400">
                                <span className="text-[10px] font-bold uppercase mr-1">Detail</span>
                                <ChevronRight className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4">
                    <button
                        onClick={() => window.print()}
                        className="w-full py-4 bg-gray-900 text-white rounded-[1.5rem] font-bold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
                    >
                        <Printer className="w-5 h-5" />
                        <span>Cetak Tiket Fisik</span>
                    </button>
                    <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6">
                        Punya pertanyaan? Hubungi Customer Service kami
                    </p>
                </div>

            </div>
        </div>
    );
}
