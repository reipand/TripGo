'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import { ChevronLeft, CheckCircle, XCircle, Clock, CreditCard, User, FileText } from 'lucide-react';

export default function TransactionDetail({ params }: { params: Promise<{ id: string }> }) {
    useAdminRoute();
    const router = useRouter();
    const { loading: authLoading } = useAuth();
    const { id } = use(params);

    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransaction = async () => {
            if (!id) return;

            // Ensure we are fetching from bookings_kereta if that's where we store it
            const { data, error } = await supabase
                .from('bookings_kereta')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                alert('Transaction not found');
                router.push('/admin/transactions');
                return;
            }
            setTransaction(data);
            setLoading(false);
        };

        if (!authLoading) fetchTransaction();
    }, [authLoading, id, router]);

    const updatePaymentStatus = async (newStatus: string) => {
        try {
            const { error } = await supabase
                .from('bookings_kereta')
                .update({ payment_status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setTransaction({ ...transaction, payment_status: newStatus });
            alert('Payment status updated');
        } catch (e: any) {
            alert('Failed to update: ' + e.message);
        }
    };

    if (authLoading || loading) return <div>Loading...</div>;
    if (!transaction) return <div>Not found</div>;

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="flex items-center mb-6">
                <button onClick={() => router.back()} className="mr-4 text-gray-500 hover:text-gray-700">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Transaction Details</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="text-xl font-bold text-gray-800">{transaction.order_id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{new Date(transaction.created_at).toLocaleString()}</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                                <User size={16} /> Customer Info
                            </h3>
                            <p className="font-medium">{transaction.customer_name}</p>
                            <p className="text-gray-600">{transaction.customer_email}</p>
                            <p className="text-gray-600">{transaction.customer_phone}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                                <CreditCard size={16} /> Payment Info
                            </h3>
                            <p className="font-medium capitalize">{transaction.payment_method?.replace(/[-_]/g, ' ') || 'Manual'}</p>
                            <p className="text-2xl font-bold text-blue-600 mt-2">
                                Rp {transaction.total_amount?.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-4">Status Management</h3>
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-500">Current Status</p>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold capitalize mt-1
                            ${transaction.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                                        transaction.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'}`}>
                                    {transaction.payment_status}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => updatePaymentStatus('paid')}
                                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition"
                                >
                                    <CheckCircle size={16} /> Mark Paid
                                </button>
                                <button
                                    onClick={() => updatePaymentStatus('pending')}
                                    className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-2 rounded hover:bg-yellow-600 transition"
                                >
                                    <Clock size={16} /> Mark Pending
                                </button>
                                <button
                                    onClick={() => updatePaymentStatus('failed')}
                                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition"
                                >
                                    <XCircle size={16} /> Mark Failed
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                            <FileText size={16} /> Related Booking
                        </h3>
                        <div className="flex justify-between items-center p-4 border rounded-lg hover:bg-blue-50 cursor-pointer transition"
                            onClick={() => router.push(`/admin/bookings/${transaction.id}`)}>
                            <div>
                                <p className="font-bold">{transaction.booking_code}</p>
                                <p className="text-sm text-gray-600">{transaction.train_name}</p>
                            </div>
                            <div className="text-blue-600">
                                View Booking &rarr;
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
