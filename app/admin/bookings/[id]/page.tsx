'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import { ChevronLeft, Save, User, CreditCard, Train, Calendar, CheckCircle } from 'lucide-react';

export default function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
    useAdminRoute();
    const router = useRouter();
    const { loading: authLoading } = useAuth();
    const { id } = use(params);

    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [passengers, setPassengers] = useState<any[]>([]);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const fetchBooking = async () => {
            if (!id) return;

            const { data, error } = await supabase
                .from('bookings_kereta')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                alert('Booking not found');
                router.push('/admin/bookings');
                return;
            }

            setBooking(data);
            setStatus(data.status);

            // Fetch passengers if stored separately or parse JSON
            if (data.passengers_data) {
                try {
                    if (typeof data.passengers_data === 'string') {
                        setPassengers(JSON.parse(data.passengers_data));
                    } else {
                        setPassengers(data.passengers_data);
                    }
                } catch (e) {
                    console.error("Error parsing passengers", e);
                }
            } else {
                // Try fetching from passengers table
                const { data: pData } = await supabase
                    .from('passengers')
                    .select('*')
                    .eq('booking_id', id);
                if (pData) setPassengers(pData);
            }

            setLoading(false);
        };

        if (!authLoading) fetchBooking();
    }, [authLoading, id, router]);

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            const { error } = await supabase
                .from('bookings_kereta')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            setStatus(newStatus);
            alert('Status updated successfully');
        } catch (err: any) {
            alert('Failed to update: ' + err.message);
        }
    };

    if (authLoading || loading) return <div>Loading...</div>;
    if (!booking) return <div>Not found</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
                <button onClick={() => router.back()} className="mr-4 text-gray-500 hover:text-gray-700">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Booking Details: {booking.booking_code}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Train size={20} /> Journey Details
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm text-gray-500">Train</label>
                                <p className="font-medium">{booking.train_name}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Type</label>
                                <p className="font-medium">{booking.train_type}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Origin</label>
                                <p className="font-medium">{booking.origin}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Destination</label>
                                <p className="font-medium">{booking.destination}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Departure</label>
                                <p className="font-medium">{new Date(booking.departure_date).toLocaleDateString()} {booking.departure_time}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <User size={20} /> Passengers ({booking.passenger_count})
                        </h2>
                        <div className="space-y-4">
                            {passengers.map((p: any, idx: number) => (
                                <div key={idx} className="border-b pb-4 last:border-0 last:pb-0">
                                    <p className="font-medium">{p.fullName || p.full_name || p.nama}</p>
                                    <p className="text-sm text-gray-500">{p.idNumber || p.id_number || p.nik} | {p.type || 'Adult'}</p>
                                    <p className="text-sm text-gray-500">Seat: {p.seatNumber || p.seat_number || '-'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold mb-4">Status & Actions</h2>

                        <div className="mb-4">
                            <label className="text-sm text-gray-500 block mb-1">Current Status</label>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold capitalize
                          ${status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                    status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'}`}>
                                {status}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={() => handleUpdateStatus('confirmed')}
                                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                            >
                                Mark as Confirmed
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('cancelled')}
                                className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                            >
                                Cancel Booking
                            </button>
                            <button
                                onClick={() => handleUpdateStatus('pending')}
                                className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
                            >
                                Set Pending
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CreditCard size={20} /> Payment
                        </h2>
                        <div className="space-y-2">
                            <div>
                                <label className="text-sm text-gray-500">Total Amount</label>
                                <p className="text-xl font-bold text-blue-600">Rp {booking.total_amount?.toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Method</label>
                                <p className="font-medium capitalize">{booking.payment_method?.replace('_', ' ')}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-500">Payment Status</label>
                                <p className="font-medium capitalize">{booking.payment_status}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
