// app/my-bookings/[id]/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Clock, Calendar, MapPin, User, Mail, 
  Phone, CreditCard, CheckCircle, XCircle, AlertCircle,
  Download, Train, Shield, Ticket, ChevronRight,
  Printer, CreditCard as CardIcon, Receipt,
  Wifi, Coffee, Luggage, Smartphone,
  Hash, Building, MapPinned
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/app/contexts/AuthContext';

interface SeatInfo {
  coach: string;
  seat: string;
  wagon_number?: string;
  coach_type?: string;
}

interface Segment {
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  train_code: string;
  train_name: string;
  train_class: string;
  train_type?: string;
  duration: string;
  platform?: string;
  station_code_origin?: string;
  station_code_destination?: string;
  seat_info?: SeatInfo;
  baggage_allowance?: string;
  amenities?: string[];
}

interface Booking {
  id: string;
  booking_code: string;
  order_id: string;
  ticket_number?: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  train_name: string;
  train_code?: string;
  train_class?: string;
  train_type: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  segments?: Segment[];
  is_multi_segment?: boolean;
  total_segments?: number;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  passenger_count: number;
  created_at: string;
  updated_at: string;
  selected_seats?: any;
  has_ticket?: boolean;
  ticket_id?: string;
  booking_date?: string;
  train_number?: string;
  operator?: string;
  user_id?: string;
  pnr_number?: string;
  coach_number?: string;
  seat_numbers?: string[];
  transaction_id?: string;
  payment_proof?: string;
  checkin_status?: boolean;
  baggage_allowance?: string;
  trip_duration?: string;
  notes?: string;
  platform?: string;
  is_insurance_included?: boolean;
  insurance_amount?: number;
  convenience_fee?: number;
  discount_amount?: number;
  final_amount?: number;
  cancellation_reason?: string;
  refund_amount?: number;
  refund_status?: string;
  station_details?: {
    origin?: {
      name: string;
      code: string;
      city: string;
    };
    destination?: {
      name: string;
      code: string;
      city: string;
    };
  };
}

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'EEEE, d MMMM yyyy', { locale: id });
  } catch {
    return dateString;
  }
};

const formatDateTime = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'dd MMMM yyyy HH:mm', { locale: id });
  } catch {
    return dateString;
  }
};

const calculateTripDuration = (departureTime: string, arrivalTime: string): string => {
  try {
    const [depHour, depMin] = departureTime.split(':').map(Number);
    const [arrHour, arrMin] = arrivalTime.split(':').map(Number);

    let totalMinutes = (arrHour * 60 + arrMin) - (depHour * 60 + depMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}j`;
    return `${hours}j ${minutes}m`;
  } catch {
    return '--';
  }
};

const getTrainClassDisplay = (trainClass?: string, trainType?: string): string => {
  if (trainClass) {
    const classMappings: Record<string, string> = {
      'executive': 'Eksekutif',
      'economy': 'Ekonomi',
      'business': 'Bisnis',
      'premium_economy': 'Ekonomi Premium',
      'first_class': 'Kelas Pertama',
      'executive_premium': 'Eksekutif Premium',
      'business_premium': 'Bisnis Premium'
    };

    const lowerClass = trainClass.toLowerCase();
    return classMappings[lowerClass] || trainClass;
  }

  if (trainType) {
    const typeMappings: Record<string, string> = {
      'executive': 'Eksekutif',
      'economy': 'Ekonomi',
      'business': 'Bisnis',
      'premium': 'Premium'
    };

    const lowerType = trainType.toLowerCase();
    return typeMappings[lowerType] || trainType;
  }

  return 'Ekonomi';
};

const getStatusConfig = (status: string, paymentStatus: string) => {
  const configs: Record<string, { color: string; bgColor: string; icon: any; text: string }> = {
    pending: { 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50 border-yellow-100',
      icon: Clock, 
      text: 'Menunggu Pembayaran' 
    },
    confirmed: { 
      color: 'text-green-600', 
      bgColor: 'bg-green-50 border-green-100',
      icon: CheckCircle, 
      text: 'Terkonfirmasi' 
    },
    paid: { 
      color: 'text-green-600', 
      bgColor: 'bg-green-50 border-green-100',
      icon: CheckCircle, 
      text: 'Lunas' 
    },
    cancelled: { 
      color: 'text-red-600', 
      bgColor: 'bg-red-50 border-red-100',
      icon: XCircle, 
      text: 'Dibatalkan' 
    },
    expired: { 
      color: 'text-gray-600', 
      bgColor: 'bg-gray-50 border-gray-100',
      icon: Clock, 
      text: 'Kadaluarsa' 
    },
    completed: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-100',
      icon: CheckCircle,
      text: 'Selesai'
    }
  };

  return configs[paymentStatus] || configs.pending;
};

const BookingDetailContent = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const bookingCode = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [realtimeUpdate, setRealtimeUpdate] = useState<number>(0);

  // Fetch booking data
  const fetchBookingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from database first
      if (user?.id) {
        const { data: dbBooking, error: dbError } = await supabase
          .from('bookings_kereta')
          .select('*')
          .or(`booking_code.eq.${bookingCode},order_id.eq.${bookingCode}`)
          .single();

        if (!dbError && dbBooking) {
          const bookingData: Booking = {
            id: dbBooking.id,
            booking_code: dbBooking.booking_code,
            order_id: dbBooking.order_id,
            ticket_number: dbBooking.ticket_number,
            passenger_name: dbBooking.passenger_name,
            passenger_email: dbBooking.passenger_email,
            passenger_phone: dbBooking.passenger_phone,
            train_name: dbBooking.train_name,
            train_code: dbBooking.train_code,
            train_class: dbBooking.train_class,
            train_type: dbBooking.train_type || 'Economy',
            origin: dbBooking.origin,
            destination: dbBooking.destination,
            departure_date: dbBooking.departure_date,
            departure_time: dbBooking.departure_time,
            arrival_time: dbBooking.arrival_time,
            segments: dbBooking.segments ? JSON.parse(dbBooking.segments) : undefined,
            is_multi_segment: dbBooking.segments && JSON.parse(dbBooking.segments).length > 1,
            total_segments: dbBooking.segments ? JSON.parse(dbBooking.segments).length : 1,
            total_amount: dbBooking.total_amount,
            status: dbBooking.status,
            payment_status: dbBooking.payment_status,
            payment_method: dbBooking.payment_method,
            passenger_count: dbBooking.passenger_count,
            created_at: dbBooking.created_at,
            updated_at: dbBooking.updated_at,
            selected_seats: dbBooking.selected_seats,
            has_ticket: dbBooking.has_ticket,
            ticket_id: dbBooking.ticket_id,
            booking_date: dbBooking.booking_date,
            train_number: dbBooking.train_number,
            operator: dbBooking.operator,
            user_id: dbBooking.user_id,
            pnr_number: dbBooking.pnr_number,
            coach_number: dbBooking.coach_number,
            seat_numbers: dbBooking.seat_numbers ? JSON.parse(dbBooking.seat_numbers) : [],
            transaction_id: dbBooking.transaction_id,
            payment_proof: dbBooking.payment_proof,
            checkin_status: dbBooking.checkin_status,
            baggage_allowance: dbBooking.baggage_allowance,
            trip_duration: dbBooking.trip_duration,
            notes: dbBooking.notes,
            platform: dbBooking.platform,
            is_insurance_included: dbBooking.is_insurance_included,
            insurance_amount: dbBooking.insurance_amount,
            convenience_fee: dbBooking.convenience_fee,
            discount_amount: dbBooking.discount_amount,
            final_amount: dbBooking.final_amount,
            cancellation_reason: dbBooking.cancellation_reason,
            refund_amount: dbBooking.refund_amount,
            refund_status: dbBooking.refund_status
          };

          setBooking(bookingData);
          return;
        }
      }

      // Fallback to localStorage
      const savedBookings = localStorage.getItem('myBookings');
      if (savedBookings) {
        const bookings: Booking[] = JSON.parse(savedBookings);
        const foundBooking = bookings.find(b => 
          b.booking_code === bookingCode || b.order_id === bookingCode
        );
        
        if (foundBooking) {
          setBooking(foundBooking);
          return;
        }
      }

      throw new Error('Booking tidak ditemukan');
    } catch (err: any) {
      console.error('Error fetching booking:', err);
      setError(err.message || 'Gagal memuat data booking');
    } finally {
      setLoading(false);
    }
  }, [bookingCode, user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchBookingData();
  }, [fetchBookingData]);

  // Setup realtime subscription
  useEffect(() => {
    if (!booking?.id || !user?.id) return;

    const channel = supabase
      .channel(`booking-${booking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings_kereta',
          filter: `id=eq.${booking.id}`
        },
        (payload: any) => {
          console.log('Realtime update received:', payload);
          setRealtimeUpdate(Date.now());
          fetchBookingData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking?.id, user?.id, fetchBookingData]);

  // Handle payment simulation
  const handlePaymentSimulation = async (status: 'paid' | 'cancelled') => {
    if (!booking) return;

    setUpdating(true);
    try {
      // Update local state immediately for better UX
      setBooking({
        ...booking,
        payment_status: status,
        status: status === 'paid' ? 'confirmed' : 'cancelled',
        updated_at: new Date().toISOString()
      });

      // Update in database if exists
      if (booking.id && !booking.id.startsWith('demo-')) {
        await supabase
          .from('bookings_kereta')
          .update({
            payment_status: status,
            status: status === 'paid' ? 'confirmed' : 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);
      }

      // Update localStorage
      const savedBookings = localStorage.getItem('myBookings');
      if (savedBookings) {
        const bookings: Booking[] = JSON.parse(savedBookings);
        const updatedBookings = bookings.map(b => 
          b.booking_code === booking.booking_code 
            ? { 
                ...b, 
                payment_status: status, 
                status: status === 'paid' ? 'confirmed' : 'cancelled',
                updated_at: new Date().toISOString()
              }
            : b
        );
        localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
      }

      alert(`Status booking diperbarui menjadi ${status === 'paid' ? 'LUNAS' : 'DIBATALKAN'}`);
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Gagal memperbarui status booking');
      fetchBookingData(); // Revert changes
    } finally {
      setUpdating(false);
    }
  };

  // Handle check-in
  const handleCheckIn = async () => {
    if (!booking) return;

    setUpdating(true);
    try {
      setBooking({
        ...booking,
        checkin_status: true,
        updated_at: new Date().toISOString()
      });

      if (booking.id && !booking.id.startsWith('demo-')) {
        await supabase
          .from('bookings_kereta')
          .update({
            checkin_status: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);
      }

      const savedBookings = localStorage.getItem('myBookings');
      if (savedBookings) {
        const bookings: Booking[] = JSON.parse(savedBookings);
        const updatedBookings = bookings.map(b => 
          b.booking_code === booking.booking_code 
            ? { ...b, checkin_status: true, updated_at: new Date().toISOString() }
            : b
        );
        localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
      }

      alert('Check-in berhasil! Silakan tunjukkan e-ticket di stasiun.');
    } catch (error) {
      console.error('Error during check-in:', error);
      alert('Gagal melakukan check-in');
      fetchBookingData();
    } finally {
      setUpdating(false);
    }
  };

  // Handle download invoice
  const handleDownloadInvoice = async () => {
    if (!booking) return;

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Simple invoice generation
      doc.setFontSize(24);
      doc.text('INVOICE', 105, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Booking Code: ${booking.booking_code}`, 20, 50);
      doc.text(`Date: ${formatDateTime(booking.created_at)}`, 20, 60);
      doc.text(`Passenger: ${booking.passenger_name}`, 20, 70);
      
      const totalY = 90;
      doc.text('Total Amount:', 20, totalY);
      doc.text(formatCurrency(booking.final_amount || booking.total_amount), 180, totalY, { align: 'right' });
      
      doc.save(`Invoice-${booking.booking_code}.pdf`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Gagal mengunduh invoice');
    }
  };

  // Handle print ticket
  const handlePrintTicket = () => {
    if (!booking) return;
    
    // In a real app, you would generate a proper ticket PDF
    alert(`Fitur cetak tiket untuk ${booking.booking_code} akan segera tersedia`);
  };

  // Get segments for display
  const getSegments = (): Segment[] => {
    if (booking?.segments && booking.segments.length > 0) {
      return booking.segments;
    }
    
    // Fallback to single segment
    if (!booking) return [];
    
    return [{
      origin: booking.origin,
      destination: booking.destination,
      departure_date: booking.departure_date,
      departure_time: booking.departure_time,
      arrival_time: booking.arrival_time,
      train_code: booking.train_code || '',
      train_name: booking.train_name,
      train_class: booking.train_class || booking.train_type,
      train_type: booking.train_type,
      duration: booking.trip_duration || calculateTripDuration(booking.departure_time, booking.arrival_time),
      platform: booking.platform,
      seat_info: {
        coach: booking.coach_number || '',
        seat: booking.seat_numbers?.join(', ') || ''
      },
      baggage_allowance: booking.baggage_allowance,
      amenities: ['AC', 'Toilet', 'Snack']
    }];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FD7E14] mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700">Memuat detail booking...</h2>
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
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push('/my-bookings')}
              className="px-6 py-3 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              Lihat Semua Booking
            </button>
            <button
              onClick={() => router.push('/search/trains')}
              className="px-6 py-3 border border-gray-700 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Pesan Tiket Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Status = getStatusConfig(booking.status, booking.payment_status);
  const segments = getSegments();
  const isMultiSegment = booking.is_multi_segment && segments.length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Kembali ke My Bookings
            </button>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/search/trains')}
                className="px-4 py-2 text-gray-700 hover:text-[#FD7E14] transition-colors font-medium"
              >
                Pesan Lagi
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Banner */}
        <div className={`mb-8 p-6 rounded-xl border-2 ${Status.bgColor} ${Status.color}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center">
              <Status.icon className="w-8 h-8 mr-4" />
              <div>
                <h3 className="font-bold text-2xl">{Status.text}</h3>
                <p className="opacity-90 mt-1">
                  {booking.payment_status === 'pending' 
                    ? 'Batas waktu pembayaran: 30 menit sejak pemesanan' 
                    : `Terakhir diperbarui: ${formatDateTime(booking.updated_at)}`}
                </p>
              </div>
            </div>
            
            {booking.payment_status === 'pending' && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handlePaymentSimulation('paid')}
                  disabled={updating}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {updating ? 'Memproses...' : 'Simulasi Pembayaran Berhasil'}
                </button>
                <button
                  onClick={() => handlePaymentSimulation('cancelled')}
                  disabled={updating}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Batalkan Booking
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Booking Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Detail Pemesanan</h2>
                <div className="flex items-center space-x-2">
                  {booking.ticket_number && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                      TICKET: {booking.ticket_number}
                    </span>
                  )}
                  {booking.pnr_number && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                      PNR: {booking.pnr_number}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Kode Booking</p>
                    <p className="text-2xl font-bold text-gray-800 font-mono">{booking.booking_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order ID</p>
                    <p className="text-lg font-semibold text-gray-800">{booking.order_id}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tanggal Pemesanan</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatDateTime(booking.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Metode Pembayaran</p>
                    <p className="text-lg font-semibold text-gray-800 flex items-center">
                      <CardIcon className="w-5 h-5 mr-2 text-[#FD7E14]" />
                      {booking.payment_method || 'Belum dipilih'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Multi Segment Header */}
              {isMultiSegment && (
                <div className="mb-8 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      {booking.total_segments}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-purple-800">PERJALANAN MULTI SEGMENT</h3>
                      <p className="text-purple-600">
                        {segments.length} segmen perjalanan terhubung
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Journey Timeline for each segment */}
              <div className="space-y-8">
                {segments.map((segment, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-6 hover:border-[#FD7E14] transition-colors">
                    {isMultiSegment && (
                      <div className="mb-6 flex items-center">
                        <div className="w-8 h-8 bg-[#FD7E14] text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          {index + 1}
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">Segmen {index + 1}</h3>
                      </div>
                    )}

                    {/* Train Info */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center mb-2">
                          <Train className="w-6 h-6 text-blue-600 mr-3" />
                          <h3 className="text-xl font-bold text-gray-800">{segment.train_name}</h3>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">
                            {segment.train_code}
                          </span>
                          <span className="text-gray-600">
                            {getTrainClassDisplay(segment.train_class, segment.train_type)}
                          </span>
                        </div>
                      </div>
                      {segment.platform && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Peron</p>
                          <p className="text-2xl font-bold text-gray-800">{segment.platform}</p>
                        </div>
                      )}
                    </div>

                    {/* Journey Timeline */}
                    <div className="relative my-8">
                      <div className="flex items-center justify-between">
                        <div className="text-center w-1/3">
                          <p className="text-4xl font-bold text-gray-800 mb-2">{segment.departure_time}</p>
                          <p className="font-semibold text-gray-800">{segment.origin}</p>
                          {segment.station_code_origin && (
                            <p className="text-sm text-gray-500">({segment.station_code_origin})</p>
                          )}
                        </div>
                        
                        <div className="flex-1 mx-8">
                          <div className="relative">
                            <div className="h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full"></div>
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border-4 border-blue-500 rounded-full shadow-lg"></div>
                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border-4 border-pink-500 rounded-full shadow-lg"></div>
                          </div>
                          <div className="mt-4 text-center">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-bold">
                              {segment.duration}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-center w-1/3">
                          <p className="text-4xl font-bold text-gray-800 mb-2">{segment.arrival_time}</p>
                          <p className="font-semibold text-gray-800">{segment.destination}</p>
                          {segment.station_code_destination && (
                            <p className="text-sm text-gray-500">({segment.station_code_destination})</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Journey Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center p-4 bg-gray-50 rounded-xl">
                        <Calendar className="w-5 h-5 text-gray-400 mr-4" />
                        <div>
                          <p className="text-sm text-gray-500">Tanggal</p>
                          <p className="font-semibold text-gray-800">{formatDate(segment.departure_date)}</p>
                        </div>
                      </div>
                      
                      {segment.seat_info && (
                        <div className="flex items-center p-4 bg-blue-50 rounded-xl">
                          <Hash className="w-5 h-5 text-blue-400 mr-4" />
                          <div>
                            <p className="text-sm text-gray-500">Gerbong & Kursi</p>
                            <p className="font-semibold text-gray-800">
                              {segment.seat_info.coach} / {segment.seat_info.seat}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center p-4 bg-green-50 rounded-xl">
                        <Luggage className="w-5 h-5 text-green-400 mr-4" />
                        <div>
                          <p className="text-sm text-gray-500">Bagasi</p>
                          <p className="font-semibold text-gray-800">{segment.baggage_allowance || '20kg'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Amenities */}
                    {segment.amenities && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-bold text-gray-700 mb-4">Fasilitas:</h4>
                        <div className="flex flex-wrap gap-2">
                          {segment.amenities.map((amenity, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Passenger Info */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center">
                <User className="w-6 h-6 mr-3 text-[#FD7E14]" />
                Data Penumpang
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                    <h4 className="font-bold text-gray-800 text-lg mb-4">Penumpang Utama</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Nama Lengkap</p>
                        <p className="font-bold text-gray-800 text-lg">{booking.passenger_name}</p>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-semibold text-gray-800">{booking.passenger_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Telepon</p>
                          <p className="font-semibold text-gray-800">{booking.passenger_phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-bold text-yellow-800 mb-2 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Catatan Khusus
                      </h4>
                      <p className="text-yellow-700">{booking.notes}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <h4 className="font-bold text-gray-800 text-lg mb-4">Detail Pesanan</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jumlah Penumpang</span>
                        <span className="font-bold text-gray-800">
                          {booking.passenger_count} {booking.passenger_count > 1 ? 'orang' : 'orang'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jumlah Segmen</span>
                        <span className="font-bold text-gray-800">
                          {booking.total_segments || 1} {isMultiSegment ? 'segmen' : 'segmen'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status Check-in</span>
                        {booking.checkin_status ? (
                          <span className="font-bold text-green-600 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Sudah Check-in
                          </span>
                        ) : (
                          <span className="font-bold text-yellow-600 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Belum Check-in
                          </span>
                        )}
                      </div>
                      {booking.platform && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Platform</span>
                          <span className="font-bold text-gray-800">{booking.platform}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!booking.checkin_status && booking.payment_status === 'paid' && (
                    <button
                      onClick={handleCheckIn}
                      disabled={updating}
                      className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {updating ? 'Memproses...' : 'Lakukan Check-in Online'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Summary & Actions */}
          <div className="space-y-8">
            {/* Price Summary */}
            <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-8">Ringkasan Pembayaran</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Tiket Kereta</span>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(booking.total_amount - (booking.convenience_fee || 0) - (booking.insurance_amount || 0))}
                  </span>
                </div>
                
                {booking.convenience_fee && booking.convenience_fee > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Biaya Layanan</span>
                    <span className="font-semibold text-gray-800">
                      +{formatCurrency(booking.convenience_fee)}
                    </span>
                  </div>
                )}
                
                {booking.insurance_amount && booking.insurance_amount > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Asuransi Perjalanan</span>
                    <span className="font-semibold text-green-600">
                      +{formatCurrency(booking.insurance_amount)}
                    </span>
                  </div>
                )}
                
                {booking.discount_amount && booking.discount_amount > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100 bg-green-50 -mx-3 px-3">
                    <div>
                      <span className="text-gray-600">Diskon</span>
                      <p className="text-xs text-gray-500">Promo khusus</p>
                    </div>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(booking.discount_amount)}
                    </span>
                  </div>
                )}
                
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-800 text-xl">Total</span>
                    <span className="font-bold text-[#FD7E14] text-3xl">
                      {formatCurrency(booking.final_amount || booking.total_amount)}
                    </span>
                  </div>
                  
                  {booking.discount_amount && booking.discount_amount > 0 && (
                    <p className="text-sm text-gray-500 text-right">
                      <span className="line-through">
                        {formatCurrency(booking.total_amount)}
                      </span>
                      <span className="ml-3 text-green-600 font-bold">
                        Hemat {formatCurrency(booking.discount_amount)}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* Payment Status */}
              <div className="mb-8 p-6 bg-gray-50 rounded-xl">
                <h4 className="font-bold text-gray-800 mb-4">Status Transaksi</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Kode Booking</span>
                    <span className="font-bold text-gray-800 font-mono">{booking.booking_code}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order ID</span>
                    <span className="font-bold text-gray-800">{booking.order_id}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-bold ${
                      booking.payment_status === 'paid' ? 'text-green-600' : 
                      booking.payment_status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {booking.payment_status === 'paid' ? 'LUNAS' : 
                       booking.payment_status === 'pending' ? 'MENUNGGU' : booking.payment_status.toUpperCase()}
                    </span>
                  </div>

                  {booking.transaction_id && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">ID Transaksi</span>
                      <span className="font-bold text-gray-800">{booking.transaction_id}</span>
                    </div>
                  )}

                  {booking.refund_amount && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-700 font-bold">Refund</span>
                        <span className="font-bold text-blue-700">
                          {formatCurrency(booking.refund_amount)}
                        </span>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        Status: {booking.refund_status || 'processing'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-4">
                {booking.payment_status === 'paid' && booking.status === 'confirmed' && (
                  <>
                    <button
                      onClick={handlePrintTicket}
                      className="w-full py-4 bg-gradient-to-r from-[#FD7E14] to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center"
                    >
                      <Printer className="w-5 h-5 mr-2" />
                      Cetak E-Ticket
                    </button>
                    
                    <button
                      onClick={handleDownloadInvoice}
                      className="w-full py-4 border-2 border-blue-500 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all flex items-center justify-center"
                    >
                      <Receipt className="w-5 h-5 mr-2" />
                      Download Invoice
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => router.push('/search/trains')}
                  className="w-full py-4 border-2 border-gray-800 text-gray-800 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Pesan Tiket Lagi
                </button>

                {booking.payment_status === 'paid' && !booking.checkin_status && (
                  <button
                    onClick={handleCheckIn}
                    disabled={updating}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {updating ? 'Memproses...' : 'Check-in Sekarang'}
                  </button>
                )}
              </div>
              
              {/* Important Info */}
              <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Informasi Penting
                </h4>
                <ul className="text-sm text-blue-700 space-y-3">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Batas waktu pembayaran:</strong> 30 menit sejak pemesanan</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Check-in:</strong> Minimal 2 jam sebelum keberangkatan</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Kehadiran:</strong> Hadir di stasiun 30 menit sebelum keberangkatan</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>E-ticket:</strong> Dikirim ke email setelah pembayaran berhasil</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span><strong>Dokumen:</strong> Wajib membawa KTP asli untuk verifikasi</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Support Card */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white">
              <h4 className="font-bold text-2xl mb-4">Butuh Bantuan?</h4>
              <p className="mb-6 opacity-90">
                Tim customer service kami siap membantu Anda 24/7
              </p>
              <div className="space-y-4">
                <a 
                  href="tel:1500123"
                  className="flex items-center justify-center py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-opacity-90 transition-all"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  📞 1500-123
                </a>
                <a 
                  href="mailto:help@tripgo.com"
                  className="flex items-center justify-center py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-opacity-90 transition-all"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  ✉️ Email Kami
                </a>
              </div>
              <p className="text-sm opacity-75 mt-6">
                Jam operasional: 24 jam / 7 hari
              </p>
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FD7E14] mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700">Memuat detail booking...</h2>
        </div>
      </div>
    }>
      <BookingDetailContent />
    </Suspense>
  );
}