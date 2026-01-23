// app/payment/success/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle, Download, Clock, Train, User, Calendar,
  MapPin, CreditCard, ArrowRight, Mail, Phone, Shield,
  Ticket as TicketIcon, Package, Coffee, Wifi, Utensils,
  Home, RefreshCw, AlertCircle, BadgeCheck
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
  train_class?: string;
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

  // Transit related fields - UPDATED
  has_transit?: boolean;
  transit_info?: {
    transit_station: string;
    transit_duration: string;
    connection_train: string;
    connection_train_type: string;
    connection_departure_time: string;
    connection_arrival_time?: string;
    facilities?: string[];
  };
  facilities?: string[];

  // NEW: Data transit sesuai gambar
  transit_station?: string;
  transit_arrival?: string;
  transit_departure?: string;
  transit_discount?: number;    // 10% dari 265.000 = 26.500
  transit_additional_price?: number; // +7.500
  seat_premium?: number;        // +172.250
  admin_fee?: number;           // +5.000
  insurance_fee?: number;       // +10.000
  base_price?: number;          // Harga dasar tiket
}

interface PaymentData {
  id?: string;
  order_id: string;
  amount: number;
  payment_method: string;
  status: string;
  payment_data?: any;
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
    transit_discount?: number; // NEW
    transit_additional?: number; // NEW
  };
}

interface TicketData {
  ticket_number: string;
  seat_number?: string;
  coach_number?: string;
}

// --- Fungsi Helper ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// --- Komponen Transit Info (Updated) ---
const TransitInfo = ({ booking }: { booking: BookingData }) => {
  const hasTransit = booking.has_transit || booking.transit_station;

  if (!hasTransit) return null;

  const transitStation = booking.transit_station || booking.transit_info?.transit_station;
  const transitArrival = booking.transit_arrival || booking.transit_info?.connection_departure_time;
  const transitDeparture = booking.transit_departure || booking.transit_info?.connection_arrival_time;

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

// --- Komponen Utama ---
const PaymentSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [countdown, setCountdown] = useState(15);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk data
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

  // Inisialisasi Supabase client
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    // Inisialisasi Supabase client di client side
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
      const date = parseISO(dateString);
      return format(date, 'EEEE, d MMMM yyyy', { locale: id });
    } catch (error) {
      return dateString;
    }
  }, []);

  // Format waktu
  const formatTime = useCallback((timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch (error) {
      return timeString;
    }
  }, []);

  // Hitung durasi perjalanan
  const calculateTripDuration = (departureTime: string, arrivalTime: string): string => {
    try {
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
      return '5j 0m';
    }
  };

  // Load data dari berbagai sumber
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Loading payment success data...');

        // STRATEGI 1: Ambil data dari URL parameters
        const bookingCode = searchParams.get('bookingCode');
        const orderId = searchParams.get('orderId');
        const status = searchParams.get('status');

        console.log('📋 URL Params:', { bookingCode, orderId, status });

        // Ambil data transit dari URL
        const url = new URL(window.location.href);
        const transitStation = url.searchParams.get('transitStation');
        const transitArrival = url.searchParams.get('transitArrival');
        const transitDeparture = url.searchParams.get('transitDeparture');
        const transitDiscount = url.searchParams.get('transitDiscount');
        const transitAdditionalPrice = url.searchParams.get('transitAdditionalPrice');
        const seatPremium = url.searchParams.get('seatPremium');
        const adminFee = url.searchParams.get('adminFee');
        const insuranceFee = url.searchParams.get('insuranceFee');
        const discountAmount = url.searchParams.get('discountAmount');

        console.log('🚉 Transit data from URL:', {
          transitStation,
          transitArrival,
          transitDeparture,
          transitDiscount,
          transitAdditionalPrice
        });

        // STRATEGY 2: Cari data di sessionStorage
        let bookingFromSession = null;
        let paymentFromSession = null;

        try {
          // Coba ambil dari sessionStorage
          const currentPayment = sessionStorage.getItem('currentPayment');
          const sessionBooking = sessionStorage.getItem('currentBooking');

          if (currentPayment || sessionBooking) {
            const paymentData = currentPayment ? JSON.parse(currentPayment) : null;
            const bookingData = sessionBooking ? JSON.parse(sessionBooking) : null;

            console.log('📦 Session data found:', { paymentData, bookingData });

            // Data transit dari URL params
            const sessionBookingData = bookingData || paymentData;

            // Ambil total dari session jika tersedia
            const sessionTotal = paymentData?.totalAmount || paymentData?.amount || bookingData?.totalAmount || bookingData?.amount;
            const urlAmount = searchParams.get('amount');

            // Prioritaskan total dari URL > Session > Perhitungan
            const baseFareValue = sessionBookingData?.basePrice || 265000;
            const seatPremiumValue = seatPremium ? parseInt(seatPremium) : (sessionBookingData?.seatPremium || 0);
            const transitDiscountValue = transitDiscount ? parseInt(transitDiscount) : (sessionBookingData?.transitDiscount || 0);
            const transitAdditionalPriceValue = transitAdditionalPrice ? parseInt(transitAdditionalPrice) : (sessionBookingData?.transitAdditionalPrice || 0);
            const adminFeeValue = adminFee ? parseInt(adminFee) : (sessionBookingData?.adminFee || 5000);
            const insuranceFeeValue = insuranceFee ? parseInt(insuranceFee) : (sessionBookingData?.insuranceFee || 10000);
            const discountAmountValue = discountAmount ? parseInt(discountAmount) : (sessionBookingData?.discountAmount || 0);

            // Jika ada total dari URL atau Session, gunakan itu sebagai source of truth utama
            let calculatedTotal = sessionTotal || (urlAmount ? parseInt(urlAmount) : 0);

            // Jika masih 0 atau tidak ada, barulah hitung
            if (!calculatedTotal) {
              calculatedTotal = baseFareValue + seatPremiumValue - transitDiscountValue +
                transitAdditionalPriceValue - discountAmountValue +
                adminFeeValue + insuranceFeeValue;
            }

            console.log('💰 Final Total source:', {
              sessionTotal,
              urlAmount,
              calculatedTotal,
              baseFare: baseFareValue
            });

            // Buat payment data
            paymentFromSession = {
              order_id: orderId || paymentData?.orderId || `ORDER-${Date.now()}`,
              amount: calculatedTotal,
              payment_method: paymentData?.paymentMethod || bookingData?.payment_method || 'E-WALLET',
              status: 'success',
              payment_data: {
                settlement_time: new Date().toISOString()
              },
              fare_breakdown: {
                base_fare: baseFareValue,
                seat_premium: seatPremiumValue,
                admin_fee: adminFeeValue,
                insurance_fee: insuranceFeeValue,
                transit_discount: transitDiscountValue,
                transit_additional: transitAdditionalPriceValue,
                discount: discountAmountValue,
                subtotal: baseFareValue + seatPremiumValue + transitAdditionalPriceValue +
                  adminFeeValue + insuranceFeeValue,
                total: calculatedTotal
              }
            };

            // Buat booking data
            bookingFromSession = {
              booking_code: bookingCode || sessionBookingData?.bookingCode || `BOOK-${Date.now().toString().slice(-8)}`,
              order_id: orderId || sessionBookingData?.orderId || `ORDER-${Date.now()}`,
              ticket_number: sessionBookingData?.ticketNumber || `TICKET-${Date.now().toString().slice(-8)}`,
              passenger_name: sessionBookingData?.name || sessionBookingData?.customerName || 'Reisan',
              passenger_email: sessionBookingData?.email || sessionBookingData?.customerEmail || 'reisanadrefagt@gmail.com',
              passenger_phone: sessionBookingData?.phone || sessionBookingData?.customerPhone || '0834534345435345',
              train_name: sessionBookingData?.trainName || 'Parahyangan',
              train_type: sessionBookingData?.trainType || 'Eksekutif',
              origin: sessionBookingData?.origin || 'Bandung',
              destination: sessionBookingData?.destination || 'Gambir',
              departure_date: sessionBookingData?.departureDate || new Date().toISOString().split('T')[0],
              departure_time: sessionBookingData?.departureTime || '05:00',
              arrival_time: sessionBookingData?.arrivalTime || '10:00',
              total_amount: calculatedTotal,
              status: 'confirmed',
              payment_status: 'paid',
              payment_method: sessionBookingData?.paymentMethod || 'E-WALLET',
              passenger_count: parseInt(sessionBookingData?.passengerCount || '1'),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              selected_seats: ['A6'],
              has_ticket: true,
              booking_date: new Date().toISOString(),
              user_id: user?.id,
              pnr_number: `PNR${Date.now().toString().slice(-6)}`,
              coach_number: '2',
              seat_numbers: ['A6'],
              checkin_status: false,
              baggage_allowance: '20kg',
              trip_duration: '5j 0m',
              platform: 'web',
              is_insurance_included: true,
              insurance_amount: 10000,
              convenience_fee: 5000,
              discount_amount: discountAmountValue,
              final_amount: calculatedTotal,
              // Data transit
              has_transit: !!transitStation,
              transit_station: transitStation || 'Stasiun Cirebon',
              transit_arrival: transitArrival || '07:30',
              transit_departure: transitDeparture || '07:45',
              transit_discount: transitDiscountValue,
              transit_additional_price: transitAdditionalPriceValue,
              seat_premium: seatPremiumValue,
              admin_fee: adminFeeValue,
              insurance_fee: insuranceFeeValue,
              base_price: baseFareValue
            };
          }
        } catch (storageError) {
          console.error('Storage error:', storageError);
        }

        // STRATEGI 3: Cari di database jika ada bookingCode dan supabase tersedia
        let bookingFromDB = null;
        let invoiceFromDB = null;

        if (bookingCode && supabase) {
          try {
            console.log('🔍 Searching in database for:', bookingCode);

            // 1. Get Booking
            const { data: dbBooking, error: dbError } = await supabase
              .from('bookings_kereta')
              .select(`
                *,
                jadwal_kereta (
                  *,
                  kereta (*)
                ),
                penumpang (*),
                invoices (*)
              `)
              .eq('booking_code', bookingCode)
              .maybeSingle();

            if (!dbError && dbBooking) {
              console.log('✅ Found in database:', dbBooking);

              // 2. Get Invoice separately if needed
              const { data: dbInvoice } = await supabase
                .from('invoices')
                .select('*')
                .eq('booking_id', dbBooking.id)
                .maybeSingle();

              invoiceFromDB = dbInvoice;

              const seatPremiumVal = dbBooking.seat_premium || (dbBooking.total_amount - (dbBooking.base_price || 265000) - (dbBooking.convenience_fee || 5000) - (dbBooking.insurance_fee || 10000) + (dbBooking.discount_amount || 0));

              bookingFromDB = {
                ...dbBooking,
                train_name: dbBooking.jadwal_kereta?.kereta?.name || dbBooking.train_name,
                train_type: dbBooking.jadwal_kereta?.kereta?.type || dbBooking.train_type,
                // Ensure calculations follow the schema
                base_price: dbBooking.base_price || 265000,
                seat_premium: seatPremiumVal,
                admin_fee: dbBooking.convenience_fee || 5000,
                insurance_fee: dbBooking.insurance_amount || 10000,
                discount_amount: dbBooking.discount_amount || 0,
                final_amount: dbBooking.total_amount || dbBooking.final_amount,
              };

              // Update payment status if needed
              if (dbBooking.payment_status === 'pending') {
                const { error: updateErr } = await supabase
                  .from('bookings_kereta')
                  .update({
                    payment_status: 'paid',
                    status: 'confirmed',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', dbBooking.id);

                if (!updateErr) {
                  bookingFromDB.payment_status = 'paid';
                  bookingFromDB.status = 'confirmed';
                }
              }
            }
          } catch (dbError) {
            console.error('Database error:', dbError);
          }
        }

        // Prioritaskan data: DB > Session > Default
        let finalBooking = bookingFromDB || bookingFromSession;
        let finalPayment = paymentFromSession;

        if (invoiceFromDB) {
          const fareBreakdown = {
            base_fare: finalBooking.base_price || 265000,
            seat_premium: finalBooking.seat_premium || 0,
            admin_fee: finalBooking.admin_fee || 5000,
            insurance_fee: finalBooking.insurance_fee || 10000,
            transit_discount: finalBooking.transit_discount || 0,
            transit_additional: finalBooking.transit_additional_price || 0,
            discount: finalBooking.discount_amount || 0,
            subtotal: (finalBooking.base_price || 265000) +
              (finalBooking.seat_premium || 0) +
              (finalBooking.transit_additional_price || 0) +
              (finalBooking.admin_fee || 5000) +
              (finalBooking.insurance_fee || 10000),
            total: finalBooking.total_amount
          };

          finalPayment = {
            order_id: finalBooking.order_id,
            amount: finalBooking.total_amount,
            payment_method: finalBooking.payment_method || 'E-WALLET',
            status: 'success',
            payment_data: {
              settlement_time: invoiceFromDB.created_at || new Date().toISOString()
            },
            fare_breakdown: fareBreakdown
          };
        }

        // Jika masih tidak ada data, gunakan default
        if (!finalBooking) {
          console.log('⚠️ No booking found, creating default with transit');

          const hasTransit = !!transitStation;
          const baseFare = 265000;
          const seatPremiumValue = seatPremium ? parseInt(seatPremium) : 172250;
          const transitDiscountValue = transitDiscount ? parseInt(transitDiscount) : 26500;
          const transitAdditionalPriceValue = transitAdditionalPrice ? parseInt(transitAdditionalPrice) : 7500;
          const adminFeeValue = adminFee ? parseInt(adminFee) : 5000;
          const insuranceFeeValue = insuranceFee ? parseInt(insuranceFee) : 10000;
          const discountAmountValue = discountAmount ? parseInt(discountAmount) : 26500;

          const calculatedTotal = baseFare + seatPremiumValue - transitDiscountValue +
            transitAdditionalPriceValue - discountAmountValue +
            adminFeeValue + insuranceFeeValue;

          finalBooking = {
            booking_code: bookingCode || `BOOK-${Date.now().toString().slice(-8)}`,
            order_id: orderId || `ORDER-${Date.now()}`,
            ticket_number: `TICKET-${Date.now().toString().slice(-8)}`,
            passenger_name: 'Reisan',
            passenger_email: 'reisanadrefagt@gmail.com',
            passenger_phone: '0834534345435345',
            train_name: 'Parahyangan',
            train_type: 'Eksekutif',
            origin: 'Bandung',
            destination: 'Gambir',
            departure_date: new Date().toISOString().split('T')[0],
            departure_time: '05:00',
            arrival_time: '10:00',
            total_amount: calculatedTotal,
            status: 'confirmed',
            payment_status: 'paid',
            payment_method: 'E-WALLET',
            passenger_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            selected_seats: ['A6'],
            has_ticket: true,
            booking_date: new Date().toISOString(),
            user_id: user?.id,
            pnr_number: `PNR${Date.now().toString().slice(-6)}`,
            coach_number: '2',
            seat_numbers: ['A6'],
            checkin_status: false,
            baggage_allowance: '20kg',
            trip_duration: '5j 0m',
            platform: 'web',
            is_insurance_included: true,
            insurance_amount: 10000,
            convenience_fee: 5000,
            discount_amount: discountAmountValue,
            final_amount: calculatedTotal,
            // Data transit
            has_transit: hasTransit,
            transit_station: transitStation || 'Stasiun Cirebon',
            transit_arrival: transitArrival || '07:30',
            transit_departure: transitDeparture || '07:45',
            transit_discount: transitDiscountValue,
            transit_additional_price: transitAdditionalPriceValue,
            seat_premium: seatPremiumValue,
            admin_fee: adminFeeValue,
            insurance_fee: insuranceFeeValue,
            base_price: baseFare
          };

          // Coba simpan ke database jika supabase tersedia
          if (supabase && bookingCode) {
            try {
              const { error: saveError } = await supabase
                .from('bookings_kereta')
                .insert([{
                  ...finalBooking,
                  id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                }]);

              if (saveError) {
                console.error('Failed to save to database:', saveError);
              } else {
                console.log('✅ Saved booking to database');
              }
            } catch (saveError) {
              console.error('Database save error:', saveError);
            }
          }
        }

        // Buat payment data jika tidak ada
        if (!finalPayment && finalBooking) {
          const breakdown = {
            base_fare: finalBooking.base_price || 265000,
            seat_premium: finalBooking.seat_premium || 0,
            admin_fee: finalBooking.admin_fee || 5000,
            insurance_fee: finalBooking.insurance_fee || 10000,
            transit_discount: finalBooking.transit_discount || 0,
            transit_additional: finalBooking.transit_additional_price || 0,
            discount: finalBooking.discount_amount || 0,
            subtotal: (finalBooking.base_price || 265000) +
              (finalBooking.seat_premium || 0) +
              (finalBooking.transit_additional_price || 0) +
              (finalBooking.admin_fee || 5000) +
              (finalBooking.insurance_fee || 10000),
            total: finalBooking.total_amount
          };

          finalPayment = {
            order_id: finalBooking.order_id,
            amount: finalBooking.total_amount,
            payment_method: finalBooking.payment_method || 'E-WALLET',
            status: 'success',
            payment_data: {
              settlement_time: finalBooking.updated_at || new Date().toISOString()
            },
            fare_breakdown: breakdown
          };
        }

        // Buat ticket data
        const ticket = {
          ticket_number: finalBooking.ticket_number || `TICKET-${finalBooking.booking_code.slice(-8)}`,
          seat_number: finalBooking.seat_numbers?.[0] || 'A6',
          coach_number: finalBooking.coach_number || '2'
        };

        console.log('✅ Final data loaded:', {
          bookingCode: finalBooking.booking_code,
          hasTransit: finalBooking.has_transit,
          transitStation: finalBooking.transit_station,
          transitDiscount: finalBooking.transit_discount,
          totalAmount: finalBooking.total_amount
        });

        setBookingData(finalBooking);
        setPaymentData(finalPayment);
        setTicketData(ticket);

        // Simpan data ke storage untuk my-bookings
        if (finalBooking) {
          try {
            // Set flag untuk highlight di my-bookings
            sessionStorage.setItem('justPaid', 'true');
            sessionStorage.setItem('lastBookingCode', finalBooking.booking_code);
            sessionStorage.setItem('lastOrderId', finalBooking.order_id);
            sessionStorage.setItem('lastPaymentTime', Date.now().toString());

            // Simpan data booking untuk my-bookings
            const bookingForStorage = {
              ...finalBooking,
              bookingCode: finalBooking.booking_code,
              orderId: finalBooking.order_id,
              passengerName: finalBooking.passenger_name,
              passengerEmail: finalBooking.passenger_email,
              passengerPhone: finalBooking.passenger_phone,
              trainName: finalBooking.train_name,
              trainType: finalBooking.train_type,
              origin: finalBooking.origin,
              destination: finalBooking.destination,
              departureDate: finalBooking.departure_date,
              departureTime: finalBooking.departure_time,
              arrivalTime: finalBooking.arrival_time,
              totalAmount: finalBooking.total_amount,
              paymentMethod: finalBooking.payment_method,
              passengerCount: finalBooking.passenger_count,
              createdAt: finalBooking.created_at,
              updatedAt: finalBooking.updated_at,
              selectedSeats: finalBooking.selected_seats || finalBooking.seat_numbers,
              hasTicket: finalBooking.has_ticket,
              // Transit data
              transitStation: finalBooking.transit_station,
              transitArrival: finalBooking.transit_arrival,
              transitDeparture: finalBooking.transit_departure,
              transitDiscount: finalBooking.transit_discount,
              transitAdditionalPrice: finalBooking.transit_additional_price,
              seatPremium: finalBooking.seat_premium,
              adminFee: finalBooking.admin_fee,
              insuranceFee: finalBooking.insurance_fee,
              basePrice: finalBooking.base_price
            };

            sessionStorage.setItem('recentBookingSuccess', JSON.stringify(bookingForStorage));

            // Juga simpan ke localStorage sebagai cache
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
              (b: any) => b.booking_code === finalBooking.booking_code ||
                b.bookingCode === finalBooking.booking_code
            );

            if (existingIndex !== -1) {
              bookingsArray[existingIndex] = bookingForStorage;
            } else {
              bookingsArray.unshift(bookingForStorage);
            }

            // Simpan maksimal 50 booking
            localStorage.setItem('myBookings', JSON.stringify(bookingsArray.slice(0, 50)));

          } catch (saveError) {
            console.error('Error saving to storage:', saveError);
          }
        }

      } catch (error: any) {
        console.error('Error loading data:', error);
        setError('Data pemesanan sedang diproses. Silakan cek email Anda untuk konfirmasi.');
      } finally {
        setLoading(false);
      }
    };

    // Delay sedikit untuk memastikan Supabase client siap
    const timer = setTimeout(() => {
      if (supabase !== null) {
        loadData();
      } else {
        // Jika supabase belum siap, load tanpa database
        loadData();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [searchParams, user, supabase]);

  // Countdown timer untuk redirect
  useEffect(() => {
    if (countdown <= 0 || isRedirecting || loading) return;

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
  }, [isRedirecting, loading]);

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

  // Handle print/download ticket
  const handleDownloadTicket = useCallback(() => {
    if (!bookingData || !ticketData) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const seats = ticketData.seat_number || 'A6';
      const duration = bookingData.trip_duration || calculateTripDuration(bookingData.departure_time, bookingData.arrival_time);
      const hasTransit = bookingData.has_transit || bookingData.transit_station;
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
                  <div class="section-value">${ticketData.coach_number}</div>
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
  }, [bookingData, ticketData, formatDate, formatTime]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center max-w-xs w-full">
          <div className="relative w-24 h-24 mx-auto">
            {/* Decorative background rings */}
            <div className="absolute inset-0 rounded-full border-4 border-green-100 opacity-50"></div>
            <div className="absolute inset-2 rounded-full border-2 border-emerald-50 opacity-30 animate-pulse"></div>

            {/* Main spinning indicator */}
            <div className="absolute inset-0 animate-spin rounded-full border-t-4 border-r-4 border-green-500 border-l-transparent border-b-transparent"></div>

            {/* Center icon or dot */}
            <div className="absolute inset-[38%] bg-green-500 rounded-full shadow-lg shadow-green-200 animate-pulse"></div>
          </div>

          <div className="mt-8 space-y-3">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-emerald-600 animate-pulse">
              Memproses Pembayaran
            </h2>
            <div className="flex items-center justify-center space-x-1.5 text-gray-500">
              <span className="text-sm font-medium">Menyesuaikan tiket Anda</span>
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"></span>
              </span>
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
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Pembayaran Sedang Diproses</h1>
          <p className="text-gray-600 mb-6">
            {error || 'Data pembayaran sedang diverifikasi. Silakan cek email Anda untuk konfirmasi.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/my-bookings')}
              className="w-full px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
            >
              Cek Status Booking
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Kembali ke Beranda
            </button>
          </div>
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
    discount: bookingData.discount_amount || 0,
    subtotal: (bookingData.base_price || 265000) +
      (bookingData.seat_premium || 0) +
      (bookingData.transit_additional_price || 0) +
      (bookingData.admin_fee || 5000) +
      (bookingData.insurance_fee || 10000),
    total: bookingData.total_amount
  };

  const hasTransit = bookingData.has_transit || bookingData.transit_station;

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
                          {bookingData.trip_duration || calculateTripDuration(bookingData.departure_time, bookingData.arrival_time)}
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
                        {ticketData?.seat_number || 'A6'} (Gerbong {ticketData?.coach_number || '2'})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passenger Info */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-purple-600" />
                    Informasi Penumpang
                  </h3>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Nama</span>
                        <span className="font-bold text-gray-800">{bookingData.passenger_name}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Email</span>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-bold text-gray-800">{bookingData.passenger_email}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Telepon</span>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-bold text-gray-800">{bookingData.passenger_phone}</span>
                        </div>
                      </div>
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

              {/* Payment Summary - UPDATED dengan data transit */}
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
                      <span className="font-bold text-green-800">{ticketData.seat_number || 'A6'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600">Gerbong</span>
                      <span className="font-bold text-green-800">{ticketData.coach_number || '2'}</span>
                    </div>
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