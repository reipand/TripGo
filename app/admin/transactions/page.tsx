'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  CreditCard,
  DollarSign
} from 'lucide-react';

interface Transaction {
  id: string;
  order_id: string;
  booking_code: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  customer_name: string; // from link or stored
  customer_email: string;
}

export default function AdminTransactions() {
  useAdminRoute();
  const router = useRouter();
  const { loading: authLoading } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const itemsPerPage = 10;

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Assuming transactions are tracked in payment_transactions table OR we view bookings with payment info
      // Let's use payment_transactions if available, otherwise bookings_kereta
      // Based on previous files, likely payment_transactions serves as log or we just treat bookings as transactions

      // Let's try fetching from bookings_kereta for now as it contains payment_status and total_amount
      // If there is a separate payment_transactions table, we should use that. 
      // Checking update-status route... it updates bookings_kereta. 
      // It ALSO inserts into payment_transactions usually.

      let query = supabase
        .from('bookings_kereta')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`booking_code.ilike.%${searchTerm}%,order_id.ilike.%${searchTerm}%`);
      }

      if (statusFilter !== 'all') {
        query = query.eq('payment_status', statusFilter);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      // Map to Transaction interface
      const mappedData = data?.map((item: any) => ({
        id: item.id,
        order_id: item.order_id,
        booking_code: item.booking_code,
        amount: item.total_amount,
        payment_method: item.payment_method,
        status: item.payment_status,
        created_at: item.created_at,
        customer_name: item.customer_name,
        customer_email: item.customer_email
      })) || [];

      setTransactions(mappedData);
      setTotalCount(count || 0);

    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchTransactions();

      // Realtime subscription
      const channel = supabase.channel('admin-transactions-list')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings_kereta' }, (payload) => {
          console.log('Realtime transaction update:', payload);
          fetchTransactions();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, currentPage, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'success': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading && transactions.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
          <p className="text-gray-600">Monitor all payments and refunds</p>
        </div>
        <button
          onClick={fetchTransactions}
          className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition"
        >
          <RefreshCw size={20} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by Order ID or Booking Code..."
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
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Info</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{tx.order_id}</div>
                  <div className="text-xs text-gray-500">{tx.booking_code}</div>
                  <div className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{tx.customer_name}</div>
                  <div className="text-xs text-gray-500">{tx.customer_email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="capitalize">{tx.payment_method?.replace(/[-_]/g, ' ') || '-'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">
                    Rp {tx.amount?.toLocaleString('id-ID')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(tx.status)}`}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => router.push(`/admin/transactions/${tx.id}`)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}