'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Clock, Calendar, MapPin, User, Mail, 
  Phone, CreditCard, CheckCircle, XCircle, AlertCircle,
  Download, Train, Shield, Ticket
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const BookingDetailContent = () => {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout>();

  // Fetch booking data
  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bookings/${bookingId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch booking');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setBooking(result.data);
        setError(null);
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error fetching booking:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBookingData();
  }, [bookingId]);

  // Setup realtime updates for pending payments
  useEffect(() => {
    if (booking?.payment_status === 'pending') {
      const interval = setInterval(() => {
        fetchBookingData();
      }, 10000); // Refresh every 10 seconds for pending payments

      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  }, [booking?.payment_status]);

  // Handle payment status changes
  const handlePaymentStatus = (status: string) => {
    if (!booking) return;

    // Update local state immediately for better UX
    setBooking({
      ...booking,
      payment_status: status,
      status: status === 'paid' ? 'confirmed' : booking.status
    });

    // Send update to server
    fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_status: status,
        status: status === 'paid' ? 'confirmed' : booking.status
      })
    }).then(response => {
      if (!response.ok) {
        // Revert if failed
        fetchBookingData();
      }
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, d MMMM yyyy', { locale: id });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700">Memuat data booking...</h2>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="max-w-md mx-4 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Booking Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">{error || 'Booking tidak ditemukan atau telah kadaluarsa'}</p>
          <button
            onClick={() => router.push('/my-bookings')}
            className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            Lihat Semua Booking
          </button>
        </div>
      </div>
    );
  }

  const statusConfig: Record<string, { color: string; icon: any; text: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Menunggu Pembayaran' },
    confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Terkonfirmasi' },
    paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Lunas' },
    cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Dibatalkan' },
    expired: { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Kadaluarsa' }
  };

  const Status = statusConfig[booking.payment_status] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Kembali
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Status Banner */}
        <div className={`mb-8 p-6 rounded-xl ${Status.color} flex items-center justify-between`}>
          <div className="flex items-center">
            <Status.icon className="w-6 h-6 mr-3" />
            <div>
              <h3 className="font-bold text-lg">{Status.text}</h3>
              <p className="text-sm opacity-90">
                {booking.payment_status === 'pending' 
                  ? 'Batas waktu pembayaran: 30 menit' 
                  : `Diperbarui: ${format(new Date(booking.updated_at), 'dd/MM/yyyy HH:mm')}`}
              </p>
            </div>
          </div>
          
          {booking.payment_status === 'pending' && (
            <div className="flex space-x-3">
              <button
                onClick={() => handlePaymentStatus('paid')}
                className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
              >
                Simulasi Bayar
              </button>
              <button
                onClick={() => handlePaymentStatus('cancelled')}
                className="px-6 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
              >
                Batalkan
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Booking Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Detail Pemesanan</h2>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Kode Booking</p>
                  <p className="text-xl font-bold text-gray-800">{booking.booking_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tanggal Pemesanan</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {format(new Date(booking.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                  </p>
                </div>
              </div>

              {/* Train Info */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <Train className="w-5 h-5 mr-2 text-blue-600" />
                      {booking.train.name}
                    </h3>
                    <p className="text-gray-600">{booking.train.type}</p>
                  </div>
                  <span className="px-4 py-2 bg-blue-100 text-blue-600 rounded-full font-bold">
                    {booking.train.code}
                  </span>
                </div>

                {/* Journey Timeline */}
                <div className="relative my-8">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-800">{booking.journey.departure_time}</p>
                      <p className="text-gray-600">{booking.journey.origin}</p>
                    </div>
                    
                    <div className="flex-1 mx-8">
                      <div className="relative h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full">
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-4 border-blue-500 rounded-full"></div>
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-4 border-purple-500 rounded-full"></div>
                      </div>
                      <p className="text-center text-sm text-gray-500 mt-2">{booking.journey.duration}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-800">{booking.journey.arrival_time}</p>
                      <p className="text-gray-600">{booking.journey.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Tanggal</p>
                      <p className="font-semibold text-gray-800">{formatDate(booking.journey.departure_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <User className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Penumpang</p>
                      <p className="font-semibold text-gray-800">{booking.passenger.count} orang</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-purple-600" />
                Data Penumpang
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-800">{booking.passenger.name}</p>
                    <p className="text-sm text-gray-600">Kursi: {booking.seat.number} (Gerbong {booking.seat.coach})</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold text-gray-800">{booking.passenger.email}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Kontak Utama</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{booking.passenger.name}</p>
                      <div className="flex items-center mt-1">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{booking.passenger.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-semibold text-gray-800">{booking.passenger.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="space-y-8">
            {/* Price Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Ringkasan Pembayaran</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tiket Kereta</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(booking.price_breakdown.base_fare)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tambahan kursi premium</span>
                  <span className="font-semibold text-green-600">
                    +{formatCurrency(booking.price_breakdown.seat_premium)}
                  </span>
                </div>
                
                {booking.promo && (
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <span className="text-gray-600">Diskon Promo</span>
                      <p className="text-xs text-gray-500">{booking.promo.description}</p>
                    </div>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(booking.promo.discount)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Biaya Admin</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(booking.price_breakdown.admin_fee)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Asuransi Perjalanan</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(booking.price_breakdown.insurance_fee)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Biaya Pembayaran</span>
                  <span className="font-semibold text-gray-800">
                    +{formatCurrency(booking.price_breakdown.payment_fee)}
                  </span>
                </div>
                
                <div className="border-t border-gray-300 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-800 text-lg">Total</span>
                    <span className="font-bold text-blue-600 text-2xl">
                      {formatCurrency(booking.price_breakdown.total)}
                    </span>
                  </div>
                  
                  {booking.promo && (
                    <p className="text-sm text-gray-500 text-right">
                      <span className="line-through">
                        {formatCurrency(booking.price_breakdown.subtotal)}
                      </span>
                      <span className="ml-2 text-green-600">
                        Hemat {formatCurrency(booking.promo.discount)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Payment Info */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Kode Booking</span>
                    <span className="font-bold text-gray-800">{booking.booking_code}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order ID</span>
                    <span className="font-bold text-gray-800">{booking.order_id}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status Pembayaran</span>
                    <span className={`font-bold ${
                      booking.payment_status === 'paid' ? 'text-green-600' : 
                      booking.payment_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {booking.payment_status === 'paid' ? 'LUNAS' : 
                       booking.payment_status === 'pending' ? 'MENUNGGU' : booking.payment_status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="mt-8 space-y-3">
                {booking.payment_status === 'paid' && booking.status === 'confirmed' && (
                  <button
                    onClick={() => router.push(`/tickets/${booking.booking_code}`)}
                    className="w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download E-Ticket
                  </button>
                )}
                
                <button
                  onClick={() => router.push('/')}
                  className="w-full py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50"
                >
                  Pesan Tiket Lagi
                </button>
              </div>
              
              {/* Important Info */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold text-blue-800 mb-2 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Informasi Penting
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Batas waktu pembayaran 30 menit</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>E-ticket dikirim ke email setelah pembayaran</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Pembayaran diproses otomatis</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function BookingDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700">Memuat detail booking...</h2>
        </div>
      </div>
    }>
      <BookingDetailContent />
    </Suspense>
  );
}