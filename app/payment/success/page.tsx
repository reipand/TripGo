// app/payment/success/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle, Download, Clock, Train, User, Calendar,
  MapPin, CreditCard, ArrowRight, Mail, Phone, Shield,
  Ticket as TicketIcon, Package, Coffee, Wifi, Utensils,
  Home, RefreshCw, AlertCircle, BadgeCheck, Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

// Import supabase client yang benar
import { createClient } from '@/app/lib/supabaseClient';
import { useAuth } from '@/app/contexts/AuthContext';

// --- Tipe Data ---
interface BookingData {
  id?: string;
  booking_code: string;
  order_id: string;
  ticket_number?: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  train_name: string;
  train_type: string;
  train_code?: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  passenger_count: number;
  created_at?: string;
  updated_at?: string;
  selected_seats?: any;
  has_ticket?: boolean;
  booking_date?: string;
  user_id?: string;

  // New fields from updated API
  pnr_number?: string;
  coach_number?: string;
  seat_numbers?: string[];
  transaction_id?: string;
  checkin_status?: boolean;
  baggage_allowance?: string;
  trip_duration?: string;
  platform?: string;

  // Transit related fields
  has_transit?: boolean;
  transit_station?: string;
  transit_arrival?: string;
  transit_departure?: string;
  transit_discount?: number;
  transit_additional_price?: number;
  seat_premium?: number;
  admin_fee?: number;
  insurance_fee?: number;
  base_price?: number;
  discount_amount?: number;
  promo_discount?: number;
  
  // Additional fields
  schedule_id?: string;
  payment_date?: string;
}

interface PaymentData {
  id?: string;
  order_id: string;
  booking_id?: string;
  amount: number;
  payment_method: string;
  status: string;
  customer_email: string;
  customer_name: string;
  payment_data?: any;
  transaction_data?: any;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
  fare_breakdown?: {
    base_fare?: number;
    seat_premium?: number;
    admin_fee?: number;
    insurance_fee?: number;
    payment_fee?: number;
    discount?: number;
    subtotal?: number;
    total?: number;
    transit_fee?: number;
    transit_discount?: number;
    transit_additional?: number;
  };
}

interface TicketData {
  id?: string;
  booking_id: string;
  ticket_number: string;
  seat_number?: string;
  coach_number?: string;
  passenger_name: string;
  passenger_email: string;
  train_name: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  origin: string;
  destination: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

// --- Fungsi Helper ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Fungsi untuk decode email
const decodeEmail = (email: string): string => {
  if (!email) return '';
  
  try {
    // Jika email sudah mengandung @, return langsung
    if (email.includes('@')) {
      return email;
    }
    
    // Handle double encoded email (%2540)
    if (email.includes('%2540')) {
      return decodeURIComponent(decodeURIComponent(email));
    }
    
    // Handle single encoded email (%40)
    if (email.includes('%40')) {
      return decodeURIComponent(email);
    }
    
    return email;
  } catch (error) {
    console.error('Error decoding email:', error);
    return email;
  }
};

// --- Komponen Transit Info ---
const TransitInfo = ({ booking }: { booking: BookingData }) => {
  const hasTransit = booking.transit_station;

  if (!hasTransit) return null;

  const transitStation = booking.transit_station;
  const transitArrival = booking.transit_arrival;
  const transitDeparture = booking.transit_departure;

  // Hitung durasi transit jika ada arrival dan departure
  const calculateTransitDuration = () => {
    if (!transitArrival || !transitDeparture) return '15 menit';

    try {
      const [arrHour, arrMin] = transitArrival.split(':').map(Number);
      const [depHour, depMin] = transitDeparture.split(':').map(Number);

      const arrMinutes = arrHour * 60 + arrMin;
      const depMinutes = depHour * 60 + depMin;

      let duration = depMinutes - arrMinutes;
      if (duration < 0) duration += 24 * 60;

      return `${duration} menit`;
    } catch {
      return '15 menit';
    }
  };

  return (
    <div className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mr-3">
          <RefreshCw className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h4 className="font-bold text-amber-800 text-lg">Rute dengan Transit</h4>
          <p className="text-amber-600 text-sm">Anda akan transit di {transitStation}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white/80 p-4 rounded-xl border border-amber-100">
          <p className="text-sm text-amber-700 mb-1">Stasiun Transit</p>
          <p className="font-bold text-gray-800 text-lg">{transitStation}</p>
        </div>

        <div className="bg-white/80 p-4 rounded-xl border border-amber-100">
          <p className="text-sm text-amber-700 mb-1">Durasi Transit</p>
          <p className="font-bold text-amber-600 text-lg">{calculateTransitDuration()}</p>
        </div>

        <div className="bg-white/80 p-4 rounded-xl border border-amber-100">
          <p className="text-sm text-amber-700 mb-1">Tiba di Transit</p>
          <p className="font-bold text-gray-800 text-lg">{transitArrival || '07:30'}</p>
        </div>

        <div className="bg-white/80 p-4 rounded-xl border border-amber-100">
          <p className="text-sm text-amber-700 mb-1">Berangkat Lagi</p>
          <p className="font-bold text-gray-800 text-lg">{transitDeparture || '07:45'}</p>
        </div>
      </div>

      {/* Transit Discount & Additional Price Info */}
      {(booking.transit_discount || booking.transit_additional_price) && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {booking.transit_discount && booking.transit_discount > 0 && (
              <div className="text-center">
                <p className="text-sm text-green-700 mb-1">Diskon Transit</p>
                <p className="font-bold text-green-600 text-lg">
                  -{formatCurrency(booking.transit_discount)}
                </p>
              </div>
            )}

            {booking.transit_additional_price && booking.transit_additional_price > 0 && (
              <div className="text-center">
                <p className="text-sm text-blue-700 mb-1">Biaya Tambahan Transit</p>
                <p className="font-bold text-blue-600 text-lg">
                  +{formatCurrency(booking.transit_additional_price)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-amber-200">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            <span className="font-bold">Catatan:</span> Tiket ini berlaku sampai {transitStation}.
            Untuk perjalanan lanjutan, silakan pesan tiket terpisah.
          </p>
        </div>
      </div>
    </div>
  );
};
// Fungsi untuk mengambil data dari database dengan polling cerdas
async function fetchBookingData(supabase: any, bookingCode: string, orderId: string) {
  console.log('🔍 Fetching booking data for:', { bookingCode, orderId });

  // Fungsi internal untuk query dengan retry
  const queryWithRetry = async (queryFn: Function, maxRetries = 3) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
        }
      }
    }
    throw lastError;
  };

  try {
    // 1. Cari di bookings_kereta dengan booking_code atau order_id
    let foundBooking = null;
    
    // Query untuk mencari booking
    const bookingQuery = await queryWithRetry(async () => {
      let query = supabase
        .from('bookings_kereta')
        .select('*');
      
      if (bookingCode) {
        query = query.eq('booking_code', bookingCode);
      } else if (orderId) {
        query = query.eq('order_id', orderId);
      }
      
      const { data, error } = await query.limit(1);
      
      if (error) throw error;
      return data?.[0];
    });

    if (bookingQuery) {
      foundBooking = bookingQuery;
      console.log('✅ Found booking:', foundBooking.booking_code);
    }

    if (!foundBooking) {
      console.log('⚠️ Booking not found, checking recent bookings...');
      
      // Coba cari berdasarkan user jika login
      const { data: recentBookings } = await supabase
        .from('bookings_kereta')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentBookings && recentBookings.length > 0) {
        foundBooking = recentBookings[0];
        console.log('✅ Using most recent booking:', foundBooking.booking_code);
      }
    }

    if (!foundBooking) {
      console.log('⏳ Booking data not yet available, will retry...');
      throw new Error('Booking data not yet available in database');
    }

    console.log('✅ Booking data found, processing...');
    return await processBookingData(supabase, foundBooking, orderId || bookingCode);

  } catch (error: any) {
    console.error('❌ Error in fetchBookingData:', error?.message || error);
    throw error;
  }
}
// Fungsi helper untuk memproses data booking
async function processBookingData(supabase: any, booking: any, orderId: string) {
  // 1. Cari payment transaction berdasarkan order_id
  let paymentData = null;
  try {
    const { data: paymentResult, error: paymentError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', booking.order_id || orderId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (paymentError) {
      console.warn('⚠️ Error fetching payment:', paymentError.message);
    } else if (paymentResult && paymentResult.length > 0) {
      paymentData = paymentResult[0];
      console.log('✅ Payment data found:', paymentData.order_id);
    }
  } catch (paymentError) {
    console.warn('⚠️ Error in payment query:', paymentError);
  }

  // 2. Cari ticket berdasarkan booking_code
  let ticketData = null;
  try {
    const { data: ticketResult, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('booking_id', booking.booking_code)
      .order('created_at', { ascending: false })
      .limit(1);

    if (ticketError) {
      console.warn('⚠️ Error fetching ticket:', ticketError.message);
    } else if (ticketResult && ticketResult.length > 0) {
      ticketData = ticketResult[0];
      console.log('✅ Ticket data found:', ticketData.ticket_number);
    }
  } catch (ticketError) {
    console.warn('⚠️ Error in ticket query:', ticketError);
  }

  // 3. Cari penumpang
  let passengersData = [];
  try {
    const { data: passengersResult, error: passengersError } = await supabase
      .from('passengers')
      .select('*')
      .eq('booking_id', booking.id)
      .order('created_at', { ascending: true });

    if (passengersError) {
      console.warn('⚠️ Error fetching passengers:', passengersError.message);
    } else {
      passengersData = passengersResult || [];
      console.log(`✅ Found ${passengersData.length} passengers`);
    }
  } catch (passengersError) {
    console.warn('⚠️ Error in passengers query:', passengersError);
  }

  return {
    booking,
    payment: paymentData,
    ticket: ticketData,
    passengers: passengersData
  };
}

// --- Komponen Utama ---
const PaymentSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [countdown, setCountdown] = useState(30);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(15); // Increased to 15 retries
  const [subscription, setSubscription] = useState<any>(null);
  const [lastErrorTime, setLastErrorTime] = useState<number | null>(null);

  // State untuk data
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [passengers, setPassengers] = useState<any[]>([]);

  // Inisialisasi Supabase client
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    const initSupabase = async () => {
      try {
        const { createClient } = await import('@/app/lib/supabaseClient');
        const client = createClient();
        setSupabase(client);
      } catch (error) {
        console.error('Failed to initialize Supabase:', error);
      }
    };

    initSupabase();
  }, []);

  // Format tanggal
  const formatDate = useCallback((dateString: string) => {
    try {
      if (!dateString) return 'Tanggal tidak tersedia';
      const date = parseISO(dateString);
      return format(date, 'EEEE, d MMMM yyyy', { locale: id });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }, []);

  // Format waktu
  const formatTime = useCallback((timeString: string) => {
    try {
      if (!timeString) return '--:--';
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  }, []);

  // Hitung durasi perjalanan
  const calculateTripDuration = (departureTime: string, arrivalTime: string): string => {
    try {
      if (!departureTime || !arrivalTime) return '--:--';
      
      const [depHours, depMinutes] = departureTime.split(':').map(Number);
      const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);

      let totalMinutes = (arrHours * 60 + arrMinutes) - (depHours * 60 + depMinutes);
      if (totalMinutes < 0) totalMinutes += 24 * 60;

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours === 0) return `${minutes}m`;
      if (minutes === 0) return `${hours}j`;
      return `${hours}j ${minutes}m`;
    } catch {
      return '--:--';
    }
  };

  // Fungsi untuk menyimpan ticket ke database
  const saveTicketToDatabase = useCallback(async (supabaseClient: any, ticket: TicketData) => {
    try {
      const { error } = await supabaseClient
        .from('tickets')
        .insert([{
          booking_id: ticket.booking_id,
          ticket_number: ticket.ticket_number,
          passenger_name: ticket.passenger_name,
          passenger_email: ticket.passenger_email,
          train_name: ticket.train_name,
          departure_date: ticket.departure_date,
          departure_time: ticket.departure_time,
          arrival_time: ticket.arrival_time,
          origin: ticket.origin,
          destination: ticket.destination,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      
      if (error) {
        console.warn('⚠️ Error saving ticket to database:', error.message);
      } else {
        console.log('✅ Ticket saved to database');
      }
    } catch (error) {
      console.error('Error saving ticket:', error);
    }
  }, []);

  // Fungsi helper untuk memproses data
  const processData = useCallback((data: any) => {
    const { booking, payment, ticket, passengers: fetchedPassengers } = data;
    
    if (!booking) {
      throw new Error('No booking data received');
    }
    
    // Decode email untuk booking
    const decodedBooking = {
      ...booking,
      passenger_email: decodeEmail(booking.passenger_email || booking.customer_email || ''),
      passenger_name: booking.passenger_name || booking.customer_name || 'Penumpang',
      // Ensure required fields have values
      booking_code: booking.booking_code || 'BOOK-' + Date.now().toString().slice(-8),
      order_id: booking.order_id || 'ORDER-' + Date.now().toString().slice(-8),
      total_amount: booking.total_amount || 0,
      passenger_count: booking.passenger_count || 1,
      status: booking.status || 'confirmed',
      payment_status: booking.payment_status || 'paid'
    };
    
    setBookingData(decodedBooking);
    console.log('✅ Booking data processed:', decodedBooking.booking_code);
    
    // Decode email untuk payment
    if (payment) {
      const decodedPayment = {
        ...payment,
        customer_email: decodeEmail(payment.customer_email || ''),
        amount: payment.amount || decodedBooking.total_amount,
        status: payment.status || 'success'
      };
      setPaymentData(decodedPayment);
      console.log('✅ Payment data processed:', decodedPayment.order_id);
    } else {
      // Buat payment data dari booking jika tidak ada
      const defaultPayment: PaymentData = {
        order_id: decodedBooking.order_id,
        amount: decodedBooking.total_amount,
        payment_method: decodedBooking.payment_method || 'E-WALLET',
        status: 'success',
        customer_email: decodedBooking.passenger_email,
        customer_name: decodedBooking.passenger_name,
        fare_breakdown: {
          base_fare: decodedBooking.base_price || 265000,
          seat_premium: decodedBooking.seat_premium || 0,
          admin_fee: decodedBooking.admin_fee || 5000,
          insurance_fee: decodedBooking.insurance_fee || 10000,
          transit_discount: decodedBooking.transit_discount || 0,
          transit_additional: decodedBooking.transit_additional_price || 0,
          discount: decodedBooking.discount_amount || decodedBooking.promo_discount || 0,
          total: decodedBooking.total_amount
        }
      };
      setPaymentData(defaultPayment);
      console.log('✅ Default payment data created');
    }
    
    // Set ticket data
    if (ticket) {
      const decodedTicket = {
        ...ticket,
        passenger_email: decodeEmail(ticket.passenger_email || ''),
        ticket_number: ticket.ticket_number || `TICKET-${Date.now().toString().slice(-8)}`
      };
      setTicketData(decodedTicket);
      console.log('✅ Ticket data processed:', decodedTicket.ticket_number);
    } else {
      // Buat ticket data dari booking jika tidak ada
      const defaultTicket: TicketData = {
        booking_id: decodedBooking.booking_code,
        ticket_number: decodedBooking.ticket_number || `TICKET-${Date.now().toString().slice(-8)}`,
        passenger_name: decodedBooking.passenger_name,
        passenger_email: decodedBooking.passenger_email,
        train_name: decodedBooking.train_name || 'Kereta',
        departure_date: decodedBooking.departure_date || new Date().toISOString().split('T')[0],
        departure_time: decodedBooking.departure_time || '08:00',
        arrival_time: decodedBooking.arrival_time || '12:00',
        origin: decodedBooking.origin || 'Stasiun A',
        destination: decodedBooking.destination || 'Stasiun B',
        status: 'active'
      };
      setTicketData(defaultTicket);
      console.log('✅ Default ticket data created:', defaultTicket.ticket_number);
      
      // Simpan ticket ke database
      if (supabase) {
        saveTicketToDatabase(supabase, defaultTicket);
      }
    }
    
    // Set passengers
    if (fetchedPassengers && fetchedPassengers.length > 0) {
      const decodedPassengers = fetchedPassengers.map((p: any) => ({
        ...p,
        email: decodeEmail(p.email || '')
      }));
      setPassengers(decodedPassengers);
      console.log(`✅ ${decodedPassengers.length} passengers processed`);
    } else {
      // Buat passenger dari booking jika tidak ada
      const defaultPassenger = {
        full_name: decodedBooking.passenger_name,
        email: decodedBooking.passenger_email,
        phone: decodedBooking.passenger_phone || '',
        seat_number: decodedBooking.seat_numbers?.[0] || 'A1'
      };
      setPassengers([defaultPassenger]);
      console.log('✅ Default passenger created');
    }
    
    // Simpan ke session storage untuk cache
    try {
      sessionStorage.setItem('lastBookingCode', decodedBooking.booking_code);
      sessionStorage.setItem('lastOrderId', decodedBooking.order_id);
      sessionStorage.setItem('lastPaymentTime', Date.now().toString());
      
      const bookingForStorage = {
        ...decodedBooking,
        bookingCode: decodedBooking.booking_code,
        orderId: decodedBooking.order_id,
        passengerName: decodedBooking.passenger_name,
        passengerEmail: decodedBooking.passenger_email,
        passengerPhone: decodedBooking.passenger_phone || '',
        trainName: decodedBooking.train_name || 'Kereta',
        trainType: decodedBooking.train_type || 'Ekonomi',
        origin: decodedBooking.origin || 'Stasiun A',
        destination: decodedBooking.destination || 'Stasiun B',
        departureDate: decodedBooking.departure_date || new Date().toISOString().split('T')[0],
        departureTime: decodedBooking.departure_time || '08:00',
        arrivalTime: decodedBooking.arrival_time || '12:00',
        totalAmount: decodedBooking.total_amount || 0,
        paymentMethod: decodedBooking.payment_method || 'E-WALLET',
        passengerCount: decodedBooking.passenger_count || 1,
        transitStation: decodedBooking.transit_station,
        transitArrival: decodedBooking.transit_arrival,
        transitDeparture: decodedBooking.transit_departure,
        transitDiscount: decodedBooking.transit_discount || 0,
        transitAdditionalPrice: decodedBooking.transit_additional_price || 0,
        seatPremium: decodedBooking.seat_premium || 0,
        adminFee: decodedBooking.admin_fee || 5000,
        insuranceFee: decodedBooking.insurance_fee || 10000,
        basePrice: decodedBooking.base_price || 265000,
        discountAmount: decodedBooking.discount_amount || 0
      };
      
      sessionStorage.setItem('recentBookingSuccess', JSON.stringify(bookingForStorage));
      console.log('✅ Saved to session storage');
      
      // Simpan ke localStorage untuk my-bookings
      const existingBookings = localStorage.getItem('myBookings');
      let bookingsArray = [];
      
      try {
        bookingsArray = existingBookings ? JSON.parse(existingBookings) : [];
        if (!Array.isArray(bookingsArray)) bookingsArray = [];
      } catch {
        bookingsArray = [];
      }
      
      // Cek duplikat
      const existingIndex = bookingsArray.findIndex(
        (b: any) => b.booking_code === decodedBooking.booking_code || b.bookingCode === decodedBooking.booking_code
      );
      
      if (existingIndex !== -1) {
        bookingsArray[existingIndex] = bookingForStorage;
      } else {
        bookingsArray.unshift(bookingForStorage);
      }
      
      // Simpan maksimal 50 booking
      localStorage.setItem('myBookings', JSON.stringify(bookingsArray.slice(0, 50)));
      console.log('✅ Saved to localStorage');
      
    } catch (storageError) {
      console.error('Error saving to storage:', storageError);
    }
  }, [supabase, saveTicketToDatabase]);

  // Fungsi untuk retry load data dengan exponential backoff
  const retryLoadData = useCallback(async (attempt: number, isInitial = false) => {
    if (!supabase || attempt >= maxRetries) {
      setError('Gagal memuat data setelah beberapa percobaan. Data mungkin belum tersedia di database.');
      setLoading(false);
      setLastErrorTime(Date.now());
      return;
    }

    console.log(`🔄 Retry attempt ${attempt + 1}/${maxRetries}`);
    setRetryCount(attempt);
    
    try {
      const bookingCode = searchParams.get('bookingCode');
      const orderId = searchParams.get('orderId') || searchParams.get('transaction_id');

      console.log('🔍 Searching with:', { bookingCode, orderId });

      const data = await fetchBookingData(supabase, bookingCode || '', orderId || '');
      processData(data);
      setError(null);
      setLastErrorTime(null);
      setLoading(false);
    } catch (error: any) {
      console.log(`⚠️ Retry ${attempt + 1} failed:`, error.message);
      
      // Jika error adalah booking tidak ditemukan, coba sync via API
      if (error.message.includes('not yet available')) {
        try {
          const bookingCode = searchParams.get('bookingCode');
          const orderId = searchParams.get('orderId');
          
          // Panggil API untuk memaksa sync booking
          const syncResponse = await fetch('/api/payment/force-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              bookingCode: bookingCode,
              orderId: orderId,
              force: true 
            })
          });

          if (syncResponse.ok) {
            console.log('✅ Force sync successful');
          }
        } catch (syncError) {
          console.warn('⚠️ Force sync failed:', syncError);
        }
      }
      
      // Exponential backoff dengan jitter
      const baseDelay = isInitial ? 1000 : 500;
      const delay = Math.min(baseDelay * Math.pow(1.5, attempt) + Math.random() * 500, 10000);
      
      console.log(`⏳ Waiting ${Math.round(delay)}ms before next retry...`);
      
      setTimeout(() => {
        retryLoadData(attempt + 1, false);
      }, delay);
    }
  }, [supabase, searchParams, processData, maxRetries]);

  // Load data dari database
  useEffect(() => {
    const loadData = async () => {
      if (!supabase) {
        console.log('⏳ Waiting for Supabase client...');
        // Tunggu 500ms lalu coba lagi
        setTimeout(() => {
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
          } else {
            setLoading(false);
            setError('Gagal menghubungi database. Silakan refresh halaman.');
          }
        }, 500);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Loading payment success data from database...');

        // Ambil parameter dari URL
        const bookingCode = searchParams.get('bookingCode');
        const orderId = searchParams.get('orderId');
        const status = searchParams.get('status');
        const transactionId = searchParams.get('transaction_id');

        console.log('📋 URL Params:', { bookingCode, orderId, status, transactionId });

        // Prioritaskan parameter yang tersedia
        let targetBookingCode = bookingCode;
        let targetOrderId = orderId || transactionId;

        if (!targetBookingCode && !targetOrderId) {
          console.warn('⚠️ No booking code, order ID, or transaction ID in URL');
          
          // Coba ambil dari session storage
          const lastBookingCode = sessionStorage.getItem('lastBookingCode');
          const lastOrderId = sessionStorage.getItem('lastOrderId');
          
          if (lastBookingCode || lastOrderId) {
            console.log('🔍 Trying with session storage data:', { lastBookingCode, lastOrderId });
            targetBookingCode = lastBookingCode || '';
            targetOrderId = lastOrderId || '';
          } else {
            throw new Error('Tidak ada data pemesanan yang ditemukan. Silakan cek di halaman "Pemesanan Saya".');
          }
        }

        // Start retry mechanism dengan initial delay
        retryLoadData(0, true);

      } catch (error: any) {
        console.error('❌ Error in loadData:', error?.message || error);
        
        const errorMessage = error?.message || 'Gagal memuat data pemesanan. Silakan cek di halaman "Pemesanan Saya".';
        setError(errorMessage);
        
        // Coba load dari session storage sebagai fallback
        try {
          const sessionBooking = sessionStorage.getItem('recentBookingSuccess');
          if (sessionBooking) {
            console.log('🔄 Loading from session storage as fallback');
            const parsedBooking = JSON.parse(sessionBooking);
            
            // Validasi data dari session storage
            if (!parsedBooking.bookingCode && !parsedBooking.orderId) {
              throw new Error('Data dari session storage tidak valid');
            }
            
            // Use session data as temporary display
            setBookingData(parsedBooking);
            
            const simplePayment: PaymentData = {
              order_id: parsedBooking.orderId || parsedBooking.order_id,
              amount: parsedBooking.totalAmount || parsedBooking.total_amount || 0,
              payment_method: parsedBooking.paymentMethod || parsedBooking.payment_method || 'E-WALLET',
              status: 'success',
              customer_email: parsedBooking.passengerEmail || parsedBooking.passenger_email || '',
              customer_name: parsedBooking.passengerName || parsedBooking.passenger_name || 'Penumpang',
              fare_breakdown: {
                base_fare: parsedBooking.basePrice || parsedBooking.base_price || 265000,
                seat_premium: parsedBooking.seatPremium || parsedBooking.seat_premium || 0,
                admin_fee: parsedBooking.adminFee || parsedBooking.admin_fee || 5000,
                insurance_fee: parsedBooking.insuranceFee || parsedBooking.insurance_fee || 10000,
                transit_discount: parsedBooking.transitDiscount || parsedBooking.transit_discount || 0,
                transit_additional: parsedBooking.transitAdditionalPrice || parsedBooking.transit_additional_price || 0,
                discount: parsedBooking.discountAmount || parsedBooking.discount_amount || 0,
                total: parsedBooking.totalAmount || parsedBooking.total_amount || 0
              }
            };
            
            setPaymentData(simplePayment);
            
            const simpleTicket: TicketData = {
              booking_id: parsedBooking.bookingCode || parsedBooking.booking_code,
              ticket_number: parsedBooking.ticketNumber || parsedBooking.ticket_number || `TICKET-${Date.now().toString().slice(-8)}`,
              passenger_name: parsedBooking.passengerName || parsedBooking.passenger_name || 'Penumpang',
              passenger_email: parsedBooking.passengerEmail || parsedBooking.passenger_email || '',
              train_name: parsedBooking.trainName || parsedBooking.train_name || 'Kereta',
              departure_date: parsedBooking.departureDate || parsedBooking.departure_date || new Date().toISOString().split('T')[0],
              departure_time: parsedBooking.departureTime || parsedBooking.departure_time || '08:00',
              arrival_time: parsedBooking.arrivalTime || parsedBooking.arrival_time || '12:00',
              origin: parsedBooking.origin || 'Stasiun A',
              destination: parsedBooking.destination || 'Stasiun B',
              status: 'active'
            };
            
            setTicketData(simpleTicket);
            setError(null); // Clear error untuk sementara
            setLoading(false);
            
            // Tetap coba load data realtime di background
            if (supabase) {
              setTimeout(() => retryLoadData(0, false), 2000);
            }
          } else {
            setLoading(false);
          }
        } catch (sessionError) {
          console.error('Session storage error:', sessionError);
          setLoading(false);
        }
      }
    };

    loadData();
  }, [supabase, searchParams, retryLoadData, retryCount]);

  // Setup polling interval untuk mengecek data
  useEffect(() => {
    if (bookingData || !supabase) return;

    const interval = setInterval(() => {
      if (lastErrorTime && Date.now() - lastErrorTime < 5000) return; // Skip jika baru error
      
      const bookingCode = searchParams.get('bookingCode');
      const orderId = searchParams.get('orderId');
      
      if (bookingCode || orderId) {
        fetchBookingData(supabase, bookingCode || '', orderId || '')
          .then(processData)
          .catch(() => {
            // Ignore errors in polling
          });
      }
    }, 3000); // Poll setiap 3 detik

    return () => clearInterval(interval);
  }, [supabase, bookingData, searchParams, processData, lastErrorTime]);

  // Countdown timer untuk redirect
  useEffect(() => {
    if (countdown <= 0 || isRedirecting || loading || !bookingData) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRedirecting, loading, bookingData]);

  // Handle redirect
  const handleRedirect = useCallback(() => {
    if (isRedirecting) return;

    setIsRedirecting(true);

    // Redirect ke my-bookings dengan parameter
    const bookingCode = bookingData?.booking_code || '';
    const redirectUrl = `/my-bookings?justPaid=true&bookingCode=${encodeURIComponent(bookingCode)}&fromPayment=true`;

    router.replace(redirectUrl);
  }, [isRedirecting, bookingData, router]);

  // Redirection monitor
  useEffect(() => {
    if (countdown === 0 && !isRedirecting && !loading && bookingData) {
      handleRedirect();
    }
  }, [countdown, isRedirecting, loading, bookingData, handleRedirect]);

  // Handle manual redirect
  const handleRedirectNow = useCallback(() => {
    handleRedirect();
  }, [handleRedirect]);

  // Handle retry button
  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
    setLastErrorTime(null);
    
    // Reset dan coba lagi
    setTimeout(() => {
      if (supabase) {
        retryLoadData(0, true);
      } else {
        setLoading(false);
        setError('Supabase client belum siap. Silakan refresh halaman.');
      }
    }, 500);
  }, [supabase, retryLoadData]);

  // Handle print/download ticket
  const handleDownloadTicket = useCallback(() => {
    if (!bookingData || !ticketData) {
      alert('Data tiket belum tersedia');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const seats = ticketData.seat_number || passengers[0]?.seat_number || 'A1';
      const duration = calculateTripDuration(bookingData.departure_time, bookingData.arrival_time);
      const hasTransit = bookingData.transit_station;
      const transitStation = bookingData.transit_station;
      const transitArrival = bookingData.transit_arrival;
      const transitDeparture = bookingData.transit_departure;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>E-Ticket ${ticketData.ticket_number}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              padding: 20px; 
              margin: 0;
              background: #f8fafc;
            }
            .ticket-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              overflow: hidden;
              position: relative;
            }
            .ticket-header {
              background: linear-gradient(135deg, #10B981 0%, #059669 100%);
              color: white;
              padding: 30px;
              text-align: center;
              position: relative;
            }
            .ticket-header h1 {
              margin: 0 0 10px 0;
              font-size: 28px;
              font-weight: 800;
            }
            .ticket-number {
              font-size: 20px;
              font-weight: 600;
              letter-spacing: 1px;
              background: rgba(255,255,255,0.2);
              display: inline-block;
              padding: 8px 20px;
              border-radius: 50px;
              margin-top: 10px;
            }
            .ticket-content {
              padding: 30px;
            }
            .section {
              margin-bottom: 25px;
              padding-bottom: 25px;
              border-bottom: 2px dashed #e2e8f0;
            }
            .section:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .section-title {
              color: #64748b;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .section-value {
              color: #0f172a;
              font-size: 18px;
              font-weight: 700;
            }
            .journey-display {
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              border-radius: 15px;
              padding: 25px;
              margin: 20px 0;
              color: white;
              text-align: center;
            }
            .time-display {
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .time-box {
              text-align: center;
              flex: 1;
            }
            .time {
              font-size: 32px;
              font-weight: 800;
              margin-bottom: 5px;
            }
            .station {
              font-size: 16px;
              opacity: 0.9;
            }
            .arrow {
              font-size: 28px;
              padding: 0 20px;
            }
            .duration {
              text-align: center;
              margin-top: 10px;
              font-size: 14px;
              opacity: 0.8;
            }
            .qr-section {
              text-align: center;
              margin: 30px 0;
            }
            .qr-box {
              width: 180px;
              height: 180px;
              background: #f1f5f9;
              margin: 0 auto 20px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px dashed #cbd5e1;
            }
            .qr-text {
              color: #64748b;
              font-size: 14px;
            }
            .instructions {
              background: #fffbeb;
              border-radius: 12px;
              padding: 20px;
              margin-top: 20px;
              border-left: 4px solid #f59e0b;
            }
            .instructions-title {
              color: #92400e;
              font-weight: 700;
              margin-bottom: 10px;
            }
            .instructions-list {
              color: #92400e;
              margin: 0;
              padding-left: 20px;
            }
            .instructions-list li {
              margin-bottom: 5px;
            }
            .footer {
              text-align: center;
              color: #64748b;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-top: 20px;
            }
            .transit-info {
              background: #fef3c7;
              border-radius: 12px;
              padding: 15px;
              margin: 15px 0;
              border-left: 4px solid #f59e0b;
            }
            .transit-title {
              color: #92400e;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .transit-details {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            }
            @media print {
              body { 
                background: white; 
                padding: 0;
              }
              .no-print { display: none; }
              .ticket-container {
                box-shadow: none;
                border: 1px solid #000;
                border-radius: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="ticket-header">
              <h1>E-Ticket Kereta Api</h1>
              <div class="ticket-number">${ticketData.ticket_number}</div>
              <p>Kode Booking: ${bookingData.booking_code}</p>
            </div>
            
            <div class="ticket-content">
              <div class="info-grid">
                <div class="section">
                  <div class="section-title">Nama Penumpang</div>
                  <div class="section-value">${bookingData.passenger_name}</div>
                </div>
                
                <div class="section">
                  <div class="section-title">Kereta & Kelas</div>
                  <div class="section-value">${bookingData.train_name} (${bookingData.train_type})</div>
                </div>
              </div>
              
              <div class="journey-display">
                <div class="time-display">
                  <div class="time-box">
                    <div class="time">${formatTime(bookingData.departure_time)}</div>
                    <div class="station">${bookingData.origin}</div>
                  </div>
                  
                  <div class="arrow">→</div>
                  
                  <div class="time-box">
                    <div class="time">${formatTime(bookingData.arrival_time)}</div>
                    <div class="station">${bookingData.destination}</div>
                  </div>
                </div>
                
                <div class="duration">
                  Durasi: ${duration} • Tanggal: ${formatDate(bookingData.departure_date)}
                </div>
              </div>
              
              ${hasTransit ? `
              <div class="transit-info">
                <div class="transit-title">Informasi Transit</div>
                <div class="transit-details">
                  <div>
                    <div class="section-title">Stasiun Transit</div>
                    <div class="section-value">${transitStation}</div>
                  </div>
                  <div>
                    <div class="section-title">Waktu Transit</div>
                    <div class="section-value">${transitArrival} - ${transitDeparture}</div>
                  </div>
                </div>
                <p style="color: #92400e; font-size: 12px; margin-top: 8px;">
                  <strong>Catatan:</strong> Tiket hanya berlaku sampai ${transitStation}
                </p>
              </div>
              ` : ''}
              
              <div class="info-grid">
                <div class="section">
                  <div class="section-title">Kursi</div>
                  <div class="section-value">${seats}</div>
                </div>
                
                <div class="section">
                  <div class="section-title">Gerbong</div>
                  <div class="section-value">${bookingData.coach_number || '--'}</div>
                </div>
              </div>
              
              ${bookingData.pnr_number ? `
              <div class="section">
                <div class="section-title">PNR Number</div>
                    <div class="section-value">${bookingData.pnr_number}</div>
              </div>
              ` : ''}
              
              ${bookingData.baggage_allowance ? `
              <div class="section">
                <div class="section-title">Bagasi</div>
                <div class="section-value">${bookingData.baggage_allowance}</div>
              </div>
              ` : ''}
              
              <div class="qr-section">
                <div class="qr-box">
                  <div class="qr-text">QR Code untuk Check-in</div>
                </div>
                <p>Scan QR code di stasiun untuk check-in</p>
              </div>
              
              <div class="instructions">
                <div class="instructions-title">Instruksi Check-in:</div>
                <ul class="instructions-list">
                  <li>Bawa e-ticket ini dan KTP asli ke stasiun</li>
                  <li>Datang minimal 30 menit sebelum keberangkatan</li>
                  <li>Tunjukkan QR code di gerbang check-in</li>
                  <li>Check-in online tersedia 2 jam sebelum keberangkatan</li>
                  ${hasTransit ? `
                  <li>Tiket berlaku hanya sampai ${transitStation}</li>
                  <li>Siapkan tiket terpisah untuk perjalanan lanjutan</li>
                  ` : ''}
                </ul>
              </div>
              
              <div class="footer">
                <p>Tiket elektronik ini sah tanpa tanda tangan</p>
                <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="padding: 12px 30px; background: #10B981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 15px;">
              🖨️ Cetak Tiket
            </button>
            <button onclick="window.close()" style="padding: 12px 30px; background: #64748b; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
              ✕ Tutup
            </button>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  }, [bookingData, ticketData, passengers, formatDate, formatTime]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center max-w-xs w-full">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <Loader2 className="w-24 h-24 text-green-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Menunggu Data Tiket
          </h2>
          <p className="text-gray-600 mb-4">
            {retryCount > 0 ? `Mencoba memuat data... (Percobaan ${retryCount + 1}/${maxRetries})` : 'Mengambil data tiket Anda dari database...'}
          </p>
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${Math.min((retryCount / maxRetries) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Data mungkin sedang diproses. Jika ini memakan waktu lama, coba refresh halaman.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                🔄 Refresh Halaman
              </button>
              <button
                onClick={handleRetry}
                className="w-full px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                🔍 Coba Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bookingData || !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Menunggu Data</h1>
          <p className="text-gray-600 mb-6">
            {error || 'Data pemesanan belum tersedia di database. Data mungkin sedang diproses.'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Booking Code: {searchParams.get('bookingCode') || 'Tidak tersedia'}<br />
            Order ID: {searchParams.get('orderId') || searchParams.get('transaction_id') || 'Tidak tersedia'}
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Coba Lagi
            </button>
            <button
              onClick={() => router.push('/my-bookings')}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Lihat Pemesanan Saya
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Kembali ke Beranda
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-6">
            Note: Data mungkin memerlukan beberapa saat untuk muncul di database. Coba refresh setelah 30 detik.
          </p>
        </div>
      </div>
    );
  }

  // Data breakdown dari payment dengan data transit yang benar
  const fareBreakdown = paymentData?.fare_breakdown || {
    base_fare: bookingData.base_price || 265000,
    seat_premium: bookingData.seat_premium || 0,
    admin_fee: bookingData.admin_fee || 5000,
    insurance_fee: bookingData.insurance_fee || 10000,
    transit_discount: bookingData.transit_discount || 0,
    transit_additional: bookingData.transit_additional_price || 0,
    discount: bookingData.discount_amount || bookingData.promo_discount || 0,
    subtotal: (bookingData.base_price || 265000) +
      (bookingData.seat_premium || 0) +
      (bookingData.transit_additional_price || 0) +
      (bookingData.admin_fee || 5000) +
      (bookingData.insurance_fee || 10000),
    total: bookingData.total_amount
  };

  const hasTransit = bookingData.transit_station;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-28 h-28 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-200">
                <CheckCircle className="w-20 h-20 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Pembayaran Berhasil!
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Booking <span className="font-bold text-green-600">{bookingData.booking_code}</span> telah diproses.
            {hasTransit && (
              <span className="block text-lg text-amber-600 mt-2">
                📍 Perjalanan dengan transit di {bookingData.transit_station}
              </span>
            )}
          </p>

          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-lg">
            <Clock className="w-5 h-5 mr-3" />
            <span className="font-bold text-lg">
              Mengalihkan ke halaman tiket dalam {countdown} detik...
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Ticket Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Card */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-1 text-white/90">Total Pembayaran</h3>
                  <p className="text-3xl font-bold">
                    {formatCurrency(paymentData.amount)}
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-1 text-white/90">Penumpang</h3>
                  <p className="text-3xl font-bold">
                    {bookingData.passenger_count} orang
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <BadgeCheck className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-1 text-white/90">Status</h3>
                  <p className="text-3xl font-bold">
                    LUNAS
                  </p>
                </div>
              </div>
            </div>

            {/* Ticket Details */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <Train className="w-6 h-6 mr-3 text-blue-600" />
                  Detail Tiket
                </h2>

                {/* Train Info */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Kereta Api</p>
                      <p className="text-xl font-bold text-gray-800">{bookingData.train_name}</p>
                      {bookingData.train_code && (
                        <p className="text-sm text-gray-600">Kode: {bookingData.train_code}</p>
                      )}
                    </div>
                    <div>
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold">
                        {bookingData.train_type}
                      </span>
                    </div>
                  </div>

                  {/* Journey Timeline */}
                  <div className="relative mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800">{formatTime(bookingData.departure_time)}</p>
                        <p className="text-sm text-gray-600">{bookingData.origin}</p>
                      </div>

                      <div className="text-center flex-1 mx-8">
                        <div className="relative h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full">
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-4 border-blue-500 rounded-full"></div>
                          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <ArrowRight className="w-8 h-8 text-blue-500" />
                          </div>
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-4 border-purple-500 rounded-full"></div>
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-2">
                          {calculateTripDuration(bookingData.departure_time, bookingData.arrival_time)}
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800">{formatTime(bookingData.arrival_time)}</p>
                        <p className="text-sm text-gray-600">{bookingData.destination}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tampilkan Transit Info jika ada */}
                  {hasTransit && <TransitInfo booking={bookingData} />}

                  {/* Date & Seat Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center mb-2">
                        <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-semibold text-gray-700">Tanggal Keberangkatan</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">
                        {formatDate(bookingData.departure_date)}
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                      <div className="flex items-center mb-2">
                        <MapPin className="w-5 h-5 text-purple-600 mr-2" />
                        <span className="font-semibold text-gray-700">Kursi</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">
                        {passengers[0]?.seat_number || 'A1'} 
                        {bookingData.coach_number && ` (Gerbong ${bookingData.coach_number})`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passenger Info */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-purple-600" />
                    Informasi Penumpang ({passengers.length})
                  </h3>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="space-y-4">
                      {passengers.map((passenger, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                          <div>
                            <span className="font-bold text-gray-800">{passenger.full_name || passenger.fullName}</span>
                            {passenger.seat_number && (
                              <span className="ml-3 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                                Kursi: {passenger.seat_number}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {passenger.email && (
                              <div className="flex items-center">
                                <Mail className="w-4 h-4 text-gray-400 mr-1" />
                                {passenger.email}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="font-bold text-blue-800 text-xl mb-4">
                Instruksi Penting
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                      <span className="font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800">E-ticket Terkirim</p>
                      <p className="text-blue-700 text-sm">Tiket elektronik telah dikirim ke email Anda</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                      <span className="font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800">Check-in Online</p>
                      <p className="text-blue-700 text-sm">Tersedia 2 jam sebelum keberangkatan</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                      <span className="font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800">Dokumen Wajib</p>
                      <p className="text-blue-700 text-sm">Bawa KTP/NIK asli saat keberangkatan</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                      <span className="font-bold">4</span>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-800">Datang Tepat Waktu</p>
                      <p className="text-blue-700 text-sm">Minimal 30 menit sebelum keberangkatan</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional transit instructions */}
              {hasTransit && (
                <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                  <div className="flex items-center mb-2">
                    <RefreshCw className="w-5 h-5 text-amber-600 mr-2" />
                    <p className="font-semibold text-amber-800">Instruksi Khusus Transit:</p>
                  </div>
                  <ul className="text-sm text-amber-700 space-y-1 ml-7">
                    <li>• Tiket hanya berlaku sampai {bookingData.transit_station}</li>
                    <li>• Untuk perjalanan lanjutan, pesan tiket terpisah</li>
                    <li>• Durasi transit: {bookingData.transit_arrival} - {bookingData.transit_departure}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions & Payment Summary */}
          <div className="lg:col-span-1">
            {/* Actions Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 sticky top-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 pb-4 border-b border-gray-200">Aksi</h2>

              <div className="space-y-6">
                <button
                  onClick={handleDownloadTicket}
                  className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transform"
                >
                  <Download className="w-6 h-6 mr-3" />
                  <span className="font-bold text-lg">
                    Download Tiket
                  </span>
                </button>

                <button
                  onClick={() => router.push('/search/trains')}
                  className="w-full px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                >
                  <span className="font-bold">Pesan Tiket Lagi</span>
                </button>

                <button
                  onClick={handleRedirectNow}
                  disabled={isRedirecting}
                  className={`w-full px-8 py-4 rounded-xl transition-all duration-300 transform ${isRedirecting ? '' : 'hover:-translate-y-1'} ${isRedirecting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:shadow-xl'
                    }`}
                >
                  <span className="font-bold text-lg flex items-center justify-center">
                    {isRedirecting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Mengalihkan...
                      </>
                    ) : (
                      `Lihat Semua Pemesanan ${countdown > 0 ? `(${countdown})` : ''}`
                    )}
                  </span>
                </button>
              </div>

              {/* Payment Summary dengan data transit */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="font-bold text-gray-700 text-xl mb-6">Ringkasan Pembayaran</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tiket Kereta ({bookingData.passenger_count} orang)</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(fareBreakdown.base_fare || 265000)}
                    </span>
                  </div>

                  {fareBreakdown.seat_premium && fareBreakdown.seat_premium > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tambahan kursi premium</span>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(fareBreakdown.seat_premium)}
                      </span>
                    </div>
                  )}

                  {hasTransit && fareBreakdown.transit_additional && fareBreakdown.transit_additional > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Biaya tambahan transit</span>
                      <span className="font-semibold text-blue-600">
                        +{formatCurrency(fareBreakdown.transit_additional)}
                      </span>
                    </div>
                  )}

                  {fareBreakdown.transit_discount && fareBreakdown.transit_discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Diskon Transit (10%)</span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(fareBreakdown.transit_discount)}
                      </span>
                    </div>
                  )}

                  {fareBreakdown.discount && fareBreakdown.discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Diskon Promo</span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(fareBreakdown.discount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Biaya Admin</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(fareBreakdown.admin_fee || 5000)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Asuransi Perjalanan</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(fareBreakdown.insurance_fee || 10000)}
                    </span>
                  </div>

                  <div className="border-t border-gray-300 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-lg">Total</span>
                      <span className="font-bold text-green-600 text-2xl">
                        {formatCurrency(paymentData.amount)}
                      </span>
                    </div>

                    {((fareBreakdown.transit_discount || 0) > 0 || (fareBreakdown.discount || 0) > 0) && (
                      <p className="text-sm text-gray-500 text-right mt-1">
                        <span className="line-through">
                          {formatCurrency(fareBreakdown.subtotal || (fareBreakdown.base_fare || 0) + (fareBreakdown.seat_premium || 0) + (fareBreakdown.transit_additional || 0) + (fareBreakdown.admin_fee || 0) + (fareBreakdown.insurance_fee || 0))}
                        </span>
                        <span className="ml-2 text-green-600">
                          Hemat {formatCurrency((fareBreakdown.transit_discount || 0) + (fareBreakdown.discount || 0))}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Ticket Info */}
              {ticketData && (
                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center mb-4">
                    <TicketIcon className="w-6 h-6 text-green-600 mr-3" />
                    <h4 className="font-bold text-green-800">Info Tiket</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600">Nomor Tiket</span>
                      <span className="font-mono font-bold text-green-800">{ticketData.ticket_number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600">Kursi</span>
                      <span className="font-bold text-green-800">{passengers[0]?.seat_number || 'A1'}</span>
                    </div>
                    {bookingData.coach_number && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Gerbong</span>
                        <span className="font-bold text-green-800">{bookingData.coach_number}</span>
                      </div>
                    )}
                    {bookingData.booking_code && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Kode Booking</span>
                        <span className="font-bold text-green-800">{bookingData.booking_code}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} TripGo. Semua hak dilindungi.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Pembayaran telah diverifikasi dan tiket Anda aktif • Ticket Number: {ticketData?.ticket_number}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Komponen Wrapper untuk Suspense ---
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Memproses Pembayaran</h2>
          <p className="text-gray-500">Menyiapkan konfirmasi pembayaran Anda...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}