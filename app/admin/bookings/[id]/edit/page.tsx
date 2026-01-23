'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import { ChevronLeft, Save, CreditCard, Ticket } from 'lucide-react';

export default function EditBooking({ params }: { params: Promise<{ id: string }> }) {
    useAdminRoute();
    const router = useRouter();
    const { loading: authLoading } = useAuth();
    const { id } = use(params);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [formData, setFormData] = useState({
        status: '',
        payment_status: '',
        passenger_name: '',
        passenger_email: '',
        passenger_phone: '',
        total_amount: 0,
        booking_code: ''
    });

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

            setFormData({
                status: data.status || 'pending',
                payment_status: data.payment_status || 'pending',
                passenger_name: data.passenger_name || '',
                passenger_email: data.passenger_email || '',
                passenger_phone: data.passenger_phone || '',
                total_amount: data.total_amount || 0,
                booking_code: data.booking_code || ''
            });
            setFetching(false);
        };

        if (!authLoading) fetchBooking();
    }, [id, authLoading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`/api/admin/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: formData.status,
                    payment_status: formData.payment_status,
                    passenger_name: formData.passenger_name,
                    passenger_email: formData.passenger_email,
                    passenger_phone: formData.passenger_phone,
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || result.message || 'Gagal mengupdate booking');
            }

            alert('Booking updated successfully!');
            router.push('/admin/bookings');
        } catch (error: any) {
            alert('Error updating booking: ' + error.message);
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
                <h1 className="text-2xl font-bold text-gray-800">Edit Booking</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">

                {/* Read-only Info */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Booking Code</label>
                        <div className="text-lg font-mono font-bold text-gray-800">{formData.booking_code}</div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase">Total Amount</label>
                        <div className="text-lg font-bold text-blue-600">Rp {formData.total_amount.toLocaleString('id-ID')}</div>
                    </div>
                </div>

                {/* Statuses */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Ticket size={20} className="text-blue-600" />
                        Booking Status
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Booking Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                                <option value="processing">Processing</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                            <select
                                name="payment_status"
                                value={formData.payment_status}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="pending">Pending</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                                <option value="expired">Expired</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Contact Info */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <CreditCard size={20} className="text-blue-600" />
                        Contact Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passenger Name</label>
                            <input
                                type="text"
                                name="passenger_name"
                                required
                                value={formData.passenger_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="passenger_email"
                                value={formData.passenger_email}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="text"
                                name="passenger_phone"
                                value={formData.passenger_phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
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
                        {loading ? 'Saving...' : <><Save size={18} /> Update Booking</>}
                    </button>
                </div>

            </form>
        </div>
    );
}
