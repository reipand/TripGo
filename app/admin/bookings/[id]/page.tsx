// app/admin/bookings/[id]/page.tsx
'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAdminRoute } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';
import { 
  ChevronLeft, 
  User, 
  CreditCard, 
  Train, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  MapPin,
  Ticket,
  Hash,
  Phone,
  Mail,
  Shield,
  BadgeCheck,
  AlertCircle,
  Users,
  Tag,
  Receipt,
  Package,
  Wifi,
  Coffee,
  Luggage,
  ArrowRight,
  Printer,
  Download,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

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
  seat_info?: {
    coach: string;
    seat: string;
    wagon_number?: string;
    coach_type?: string;
  };
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

interface Passenger {
  id: string;
  booking_id: string;
  passenger_order: number;
  nama: string;
  email: string;
  phone: string;
  nik: string;
  tanggal_lahir: string;
  gender: string;
  seat_number?: string;
  coach_number?: string;
  created_at: string;
}

// Mapping nama kereta
const TRAIN_MAPPINGS: Record<string, { name: string; operator: string; class: string }> = {
  'KA-01': { name: 'Argo Wilis', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-02': { name: 'Argo Parahyangan', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-03': { name: 'Turangga', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-04': { name: 'Sancaka', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-05': { name: 'Mutiara Selatan', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-06': { name: 'Mutiara Timur', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-07': { name: 'Taksaka', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-08': { name: 'Bima', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-09': { name: 'Gajayana', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-10': { name: 'Sembrani', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-11': { name: 'Bangunkarta', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-12': { name: 'Fajar/Senja Utama', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-13': { name: 'Sribilah', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-14': { name: 'Serelo', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-15': { name: 'Rajawali', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-16': { name: 'Tegar', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-17': { name: 'Harina', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-18': { name: 'Pangrango', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-19': { name: 'Gajah Wong', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-20': { name: 'Jaka Tingkir', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-21': { name: 'Lodaya', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-22': { name: 'Malabar', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-23': { name: 'Kutojaya', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-24': { name: 'Ciremai', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' },
  'KA-25': { name: 'Tawang Alun', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-26': { name: 'Logawa', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-27': { name: 'Matarmaja', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-28': { name: 'Kertanegara', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-29': { name: 'Probowangi', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'KA-30': { name: 'Sri Tanjung', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Ekonomi' },
  'MS-001': { name: 'Perjalanan Multi Segment', operator: 'PT. Kereta Api Indonesia (KAI)', class: 'Eksekutif' }
};

export default function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
    useAdminRoute();
    const router = useRouter();
    const { loading: authLoading, user } = useAuth();
    const { id } = use(params);

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [status, setStatus] = useState('');
    const [userInfo, setUserInfo] = useState<any>(null);
    const [paymentInfo, setPaymentInfo] = useState<any>(null);
    const [ticketInfo, setTicketInfo] = useState<any>(null);
    const [realtimeConnected, setRealtimeConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    // Fungsi untuk memvalidasi dan membersihkan data booking
    const validateAndCleanBooking = (data: any): Booking | null => {
      try {
        if (!data) return null;

        // Parse segments jika exists
        let segments: Segment[] = [];
        if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
          segments = data.segments.map((segment: any, index: number) => {
            const trainCode = segment.train_code || segment.trainCode || data.train_code || '';
            const trainMapping = TRAIN_MAPPINGS[trainCode] || {
              name: segment.train_name || data.train_name || 'Kereta Api',
              operator: 'PT. Kereta Api Indonesia (KAI)',
              class: segment.train_class || data.train_class || 'Ekonomi'
            };

            return {
              origin: segment.origin || data.origin || '',
              destination: segment.destination || data.destination || '',
              departure_date: segment.departure_date || segment.departureDate || data.departure_date || new Date().toISOString().split('T')[0],
              departure_time: segment.departure_time || segment.departureTime || data.departure_time || '08:00',
              arrival_time: segment.arrival_time || segment.arrivalTime || data.arrival_time || '12:00',
              train_code: trainCode,
              train_name: trainMapping.name,
              train_class: segment.train_class || segment.trainClass || trainMapping.class,
              train_type: segment.train_type || segment.trainType || data.train_type || trainMapping.class,
              duration: segment.duration || calculateTripDuration(
                segment.departure_time || data.departure_time,
                segment.arrival_time || data.arrival_time
              ),
              platform: segment.platform || data.platform,
              station_code_origin: segment.station_code_origin,
              station_code_destination: segment.station_code_destination,
              seat_info: segment.seat_info || {
                coach: segment.coach_number || data.coach_number || '',
                seat: segment.seat_numbers?.join(', ') || data.seat_numbers?.join(', ') || segment.selected_seats?.join(', ') || '',
                wagon_number: segment.coach_number || data.coach_number || '',
                coach_type: segment.coach_type || data.coach_type
              },
              baggage_allowance: segment.baggage_allowance || data.baggage_allowance || '20kg',
              amenities: segment.amenities || data.amenities || ['AC', 'Toilet', 'Snack']
            };
          });
        }

        // Get main train info
        const trainCode = data.train_code || data.trainCode || '';
        const trainMapping = TRAIN_MAPPINGS[trainCode] || {
          name: data.train_name || 'Kereta Api',
          operator: 'PT. Kereta Api Indonesia (KAI)',
          class: data.train_class || 'Ekonomi'
        };

        const bookingData: Booking = {
          id: data.id || `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          booking_code: data.booking_code || data.bookingCode || `BOOK-${Date.now().toString().slice(-8)}`,
          order_id: data.order_id || data.orderId || `ORDER-${Date.now()}`,
          ticket_number: data.ticket_number || data.ticketNumber,
          passenger_name: data.passenger_name || data.passengerName || data.customerName || 'Penumpang',
          passenger_email: data.passenger_email || data.passengerEmail || data.customerEmail || '',
          passenger_phone: data.passenger_phone || data.passengerPhone || data.customerPhone || '',
          train_name: trainMapping.name,
          train_code: trainCode,
          train_class: data.train_class || data.trainClass || trainMapping.class,
          train_type: data.train_type || data.trainType || trainMapping.class,
          origin: data.origin || '',
          destination: data.destination || '',
          departure_date: data.departure_date || data.departureDate || new Date().toISOString().split('T')[0],
          departure_time: data.departure_time || data.departureTime || '08:00',
          arrival_time: data.arrival_time || data.arrivalTime || '12:00',
          segments: segments.length > 0 ? segments : undefined,
          is_multi_segment: segments.length > 1,
          total_segments: segments.length || 1,
          total_amount: Number(data.total_amount || data.totalAmount || 0),
          status: data.status || 'pending',
          payment_status: data.payment_status || data.paymentStatus || 'pending',
          payment_method: data.payment_method || data.paymentMethod,
          passenger_count: Number(data.passenger_count || data.passengerCount || 1),
          created_at: data.created_at || data.createdAt || new Date().toISOString(),
          updated_at: data.updated_at || data.updatedAt || new Date().toISOString(),
          selected_seats: data.selected_seats || data.selectedSeats,
          has_ticket: data.has_ticket || !!data.ticket_number,
          ticket_id: data.ticket_id,
          booking_date: data.booking_date || data.created_at || new Date().toISOString(),
          train_number: data.train_number,
          operator: trainMapping.operator,
          user_id: data.user_id,
          pnr_number: data.pnr_number,
          coach_number: data.coach_number,
          seat_numbers: data.seat_numbers || (data.selected_seats ? formatSelectedSeats(data.selected_seats) : []),
          transaction_id: data.transaction_id,
          payment_proof: data.payment_proof,
          checkin_status: data.checkin_status || false,
          baggage_allowance: data.baggage_allowance || '20kg',
          trip_duration: data.trip_duration,
          notes: data.notes,
          platform: data.platform || 'web',
          is_insurance_included: data.is_insurance_included || false,
          insurance_amount: Number(data.insurance_amount || 0),
          convenience_fee: Number(data.convenience_fee || 0),
          discount_amount: Number(data.discount_amount || 0),
          final_amount: Number(data.final_amount || data.total_amount || 0),
          cancellation_reason: data.cancellation_reason,
          refund_amount: Number(data.refund_amount || 0),
          refund_status: data.refund_status,
          station_details: data.station_details || {
            origin: {
              name: data.origin || '',
              code: data.station_code_origin || '',
              city: data.origin_city || ''
            },
            destination: {
              name: data.destination || '',
              code: data.station_code_destination || '',
              city: data.destination_city || ''
            }
          }
        };

        return bookingData;
      } catch (error) {
        console.error('Error validating booking:', error);
        return null;
      }
    };

    const formatSelectedSeats = (selectedSeats: any): string[] => {
      if (!selectedSeats || selectedSeats === 'null' || selectedSeats === 'undefined') {
        return [];
      }

      try {
        if (typeof selectedSeats === 'string') {
          if (selectedSeats.includes('[')) {
            try {
              const parsed = JSON.parse(selectedSeats);
              if (Array.isArray(parsed)) {
                return parsed.map(seat => {
                  if (typeof seat === 'string') return seat.trim();
                  if (seat && typeof seat === 'object') {
                    return seat.seatNumber || seat.number || seat.id || seat.toString();
                  }
                  return String(seat).trim();
                }).filter(Boolean);
              }
            } catch {
              return selectedSeats.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          }
          return selectedSeats.split(',').map((s: string) => s.trim()).filter(Boolean);
        }

        if (Array.isArray(selectedSeats)) {
          return selectedSeats.map(seat => {
            if (typeof seat === 'string') return seat.trim();
            if (seat && typeof seat === 'object') {
              return seat.seatNumber || seat.number || seat.id || JSON.stringify(seat);
            }
            return String(seat).trim();
          }).filter(Boolean);
        }

        return [];
      } catch (error) {
        console.error('Error formatting seats:', error);
        return [];
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

    const fetchBooking = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Fetch booking data dari bookings_kereta
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings_kereta')
          .select('*')
          .or(`id.eq.${id},booking_code.eq.${id}`)
          .single();

        if (bookingError) {
          console.error('Booking error:', bookingError);
          // Coba dari localStorage sebagai fallback
          const savedBookings = localStorage.getItem('myBookings');
          if (savedBookings) {
            const parsedBookings = JSON.parse(savedBookings);
            const foundBooking = parsedBookings.find((b: any) => b.id === id || b.booking_code === id);
            if (foundBooking) {
              const validatedBooking = validateAndCleanBooking(foundBooking);
              setBooking(validatedBooking);
              if (validatedBooking) {
                setStatus(validatedBooking.status);
              }
            } else {
              throw new Error('Booking not found');
            }
          } else {
            throw new Error('Booking not found');
          }
        } else {
          const validatedBooking = validateAndCleanBooking(bookingData);
          setBooking(validatedBooking);
          if (validatedBooking) {
            setStatus(validatedBooking.status);
          }
        }

        // Fetch passengers
        const { data: passengersData, error: passengersError } = await supabase
          .from('penumpang')
          .select('*')
          .eq('booking_id', id)
          .order('passenger_order', { ascending: true });

        if (!passengersError && passengersData) {
          setPassengers(passengersData);
        }

        // Fetch user info
        if (bookingData?.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('full_name, email, phone_number, created_at')
            .eq('id', bookingData.user_id)
            .single();
          setUserInfo(userData);
        }

        // Fetch payment information
        if (bookingData?.order_id) {
          const { data: paymentData } = await supabase
            .from('transactions')
            .select('*')
            .or(`order_id.eq.${bookingData.order_id},reference_code.eq.${bookingData.booking_code}`)
            .single();
          
          if (paymentData) {
            setPaymentInfo(paymentData);
          }
        }

        // Fetch ticket information
        if (bookingData?.booking_code) {
          const { data: ticketData } = await supabase
            .from('tickets')
            .select('*')
            .eq('booking_code', bookingData.booking_code)
            .single();
          
          if (ticketData) {
            setTicketInfo(ticketData);
          }
        }

        setLastUpdate(new Date());
        setLoading(false);
      } catch (err) {
        console.error('Error fetching booking:', err);
        alert('Failed to load booking details');
        router.push('/admin/bookings');
      }
    };

    useEffect(() => {
      if (!authLoading) fetchBooking();
    }, [authLoading, id, router]);

    // Setup realtime subscription
    useEffect(() => {
      if (!id) return;

      console.log('🔌 Setting up admin realtime subscription for booking:', id);

      const channel = supabase
        .channel(`admin-booking-${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings_kereta',
            filter: `id=eq.${id}`
          },
          (payload: any) => {
            console.log('🔔 Admin realtime update received:', payload);
            setLastUpdate(new Date());
            
            if (payload.new) {
              const validatedBooking = validateAndCleanBooking(payload.new);
              setBooking(validatedBooking);
              if (validatedBooking) {
                setStatus(validatedBooking.status);
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'penumpang',
            filter: `booking_id=eq.${id}`
          },
          () => {
            console.log('👥 Passenger data updated, refreshing...');
            fetchBooking();
          }
        )
        .subscribe((status: string) => {
          console.log('🔌 Admin subscription status:', status);
          setRealtimeConnected(status === 'SUBSCRIBED');
          
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setTimeout(() => {
              console.log('🔄 Retrying subscription...');
              channel.subscribe();
            }, 3000);
          }
        });

      return () => {
        console.log('🔌 Cleaning up admin subscription');
        supabase.removeChannel(channel);
      };
    }, [id]);

    const handleUpdateStatus = async (newStatus: string) => {
      if (!booking || !confirm(`Are you sure you want to change status to "${newStatus}"?`)) return;

      try {
        const updates: any = { 
          status: newStatus,
          updated_at: new Date().toISOString()
        };

        // Jika status dibatalkan, set refund amount
        if (newStatus === 'cancelled' || newStatus === 'canceled') {
          const refundAmount = Math.floor((booking.final_amount || booking.total_amount) * 0.8);
          updates.refund_amount = refundAmount;
          updates.refund_status = 'processing';
          updates.cancellation_reason = 'Dibatalkan oleh admin';
          updates.payment_status = 'refunded';
        }

        // Jika status confirmed, set payment_status to paid
        if (newStatus === 'confirmed') {
          updates.payment_status = 'paid';
        }

        const { error } = await supabase
          .from('bookings_kereta')
          .update(updates)
          .eq('id', booking.id)
          .eq('booking_code', booking.booking_code);

        if (error) throw error;

        // Update local state
        const updatedBooking = { ...booking, ...updates };
        setBooking(updatedBooking);
        setStatus(newStatus);

        alert(`Status updated to ${newStatus} successfully`);
      } catch (err: any) {
        alert('Failed to update: ' + err.message);
      }
    };

    const handleForceCheckin = async () => {
      if (!booking || !confirm('Force check-in for this booking?')) return;

      try {
        const { error } = await supabase
          .from('bookings_kereta')
          .update({ 
            checkin_status: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id);

        if (error) throw error;

        setBooking({ ...booking, checkin_status: true });
        alert('Check-in forced successfully');
      } catch (err: any) {
        alert('Failed to force check-in: ' + err.message);
      }
    };

    const formatDate = (dateString: string) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return dateString;
      }
    };

    const formatTime = (timeString: string) => {
      if (!timeString) return 'N/A';
      if (timeString.includes(':')) return timeString.substring(0, 5);
      return timeString;
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    };

    const getTrainDisplayName = (booking: Booking): string => {
      if (booking.segments && booking.segments.length > 1) {
        return 'Perjalanan Multi Segment';
      }
      
      if (booking.train_code && TRAIN_MAPPINGS[booking.train_code]) {
        return TRAIN_MAPPINGS[booking.train_code].name;
      }
      
      return booking.train_name || 'Kereta Api';
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
          'business_premium': 'Bisnis Premium',
          'eksekutif': 'Eksekutif',
          'ekonomi': 'Ekonomi',
          'bisnis': 'Bisnis'
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

    const getStatusIcon = (status: string) => {
      switch (status.toLowerCase()) {
        case 'confirmed':
          return <BadgeCheck className="w-5 h-5" />;
        case 'cancelled':
        case 'canceled':
          return <XCircle className="w-5 h-5" />;
        case 'pending':
          return <Clock className="w-5 h-5" />;
        case 'refunded':
          return <Package className="w-5 h-5" />;
        default:
          return <AlertCircle className="w-5 h-5" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'confirmed':
          return 'bg-green-50 border-green-200 text-green-800';
        case 'cancelled':
        case 'canceled':
          return 'bg-red-50 border-red-200 text-red-800';
        case 'pending':
          return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        case 'refunded':
          return 'bg-blue-50 border-blue-200 text-blue-800';
        default:
          return 'bg-gray-50 border-gray-200 text-gray-800';
      }
    };

    const getPaymentStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'paid':
          return 'text-green-600 bg-green-50';
        case 'pending':
          return 'text-yellow-600 bg-yellow-50';
        case 'failed':
          return 'text-red-600 bg-red-50';
        case 'refunded':
          return 'text-blue-600 bg-blue-50';
        default:
          return 'text-gray-600 bg-gray-50';
      }
    };

    if (authLoading || loading) return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
    
    if (!booking) return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Booking Not Found</h2>
          <p className="text-gray-500 mb-6">The requested booking could not be found.</p>
          <button 
            onClick={() => router.push('/admin/bookings')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );

    const isMultiSegment = booking.is_multi_segment && booking.segments && booking.segments.length > 1;
    const segments = booking.segments || [{
      origin: booking.origin,
      destination: booking.destination,
      departure_date: booking.departure_date,
      departure_time: booking.departure_time,
      arrival_time: booking.arrival_time,
      train_code: booking.train_code,
      train_name: getTrainDisplayName(booking),
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

    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Connection Status */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-gray-600">
              {realtimeConnected ? 'Realtime Connected' : 'Realtime Disconnected'}
            </span>
            {lastUpdate && (
              <span className="text-gray-500 text-xs ml-2">
                | Last update: {lastUpdate.toLocaleTimeString('id-ID')}
              </span>
            )}
          </div>
          <button
            onClick={fetchBooking}
            className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/admin/bookings')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mr-4"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Booking Details</h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {booking.booking_code}
                  </code>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                  <span className="font-medium capitalize">{status}</span>
                </div>
                {isMultiSegment && (
                  <span className="text-sm text-white font-semibold bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-lg">
                    MULTI SEGMENT
                  </span>
                )}
                {booking.checkin_status && (
                  <span className="text-sm text-white font-semibold bg-green-500 px-3 py-1 rounded-lg">
                    CHECKED-IN
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            <div>Created: {formatDate(booking.created_at)}</div>
            <div>Updated: {booking.updated_at ? formatDate(booking.updated_at) : 'N/A'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Journey & Passengers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Journey Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Train className="w-5 h-5" />
                  Journey Details
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Train Information */}
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Train className="w-4 h-4" />
                      Train Information
                    </label>
                    <div className="mt-2 space-y-2">
                      <p className="text-lg font-bold text-gray-900">{getTrainDisplayName(booking)}</p>
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {getTrainClassDisplay(booking.train_class, booking.train_type)}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-600">Kode: {booking.train_code || 'N/A'}</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-600">Operator: {booking.operator || 'PT. Kereta Api Indonesia (KAI)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Multi Segment Display */}
                  {isMultiSegment && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {booking.total_segments}
                        </div>
                        <span className="font-semibold text-purple-700">Perjalanan Multi Segment</span>
                      </div>
                      
                      <div className="space-y-3">
                        {segments.map((segment, idx) => {
                          const trainName = TRAIN_MAPPINGS[segment.train_code]?.name || segment.train_name;
                          return (
                            <div key={idx} className="bg-white rounded-lg p-3 border border-purple-100">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded mr-2">
                                      Segmen {idx + 1}
                                    </span>
                                    <p className="text-sm font-medium text-gray-800">
                                      {segment.origin} → {segment.destination}
                                    </p>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {trainName} ({getTrainClassDisplay(segment.train_class, segment.train_type)})
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-800">
                                    {segment.departure_time} - {segment.arrival_time}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {formatDate(segment.departure_date)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex justify-between text-xs text-gray-700">
                                <span>Durasi: {segment.duration}</span>
                                {segment.seat_info && (
                                  <span className="font-semibold">
                                    Gerbong {segment.seat_info.coach} / Kursi {segment.seat_info.seat}
                                  </span>
                                )}
                                {segment.platform && (
                                  <span>Peron: {segment.platform}</span>
                                )}
                              </div>
                              {segment.amenities && segment.amenities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {segment.amenities.map((amenity, aIdx) => (
                                    <span key={aIdx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                      {amenity}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Single Segment Display */}
                  {!isMultiSegment && (
                    <>
                      <div className="relative">
                        <div className="flex items-center justify-between">
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-500">Origin</div>
                            <div className="text-lg font-bold mt-1">{booking.origin}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {formatDate(booking.departure_date)}
                            </div>
                            {booking.station_details?.origin && (
                              <div className="text-xs text-gray-500">
                                {booking.station_details.origin.code} - {booking.station_details.origin.city}
                              </div>
                            )}
                          </div>
                          <div className="mx-4">
                            <ArrowRight className="w-6 h-6 text-blue-500" />
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-500">Destination</div>
                            <div className="text-lg font-bold mt-1">{booking.destination}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {booking.arrival_date ? formatDate(booking.arrival_date) : formatDate(booking.departure_date)}
                            </div>
                            {booking.station_details?.destination && (
                              <div className="text-xs text-gray-500">
                                {booking.station_details.destination.code} - {booking.station_details.destination.city}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm text-gray-500">Departure</label>
                            <p className="font-medium">{formatTime(booking.departure_time)}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Arrival</label>
                            <p className="font-medium">{formatTime(booking.arrival_time)}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Duration</label>
                            <p className="font-medium">{booking.trip_duration || calculateTripDuration(booking.departure_time, booking.arrival_time)}</p>
                          </div>
                          <div>
                            <label className="text-sm text-gray-500">Passengers</label>
                            <p className="font-medium">{booking.passenger_count}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Seat Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500">Seat Information</label>
                      {isMultiSegment ? (
                        <div className="mt-2 space-y-1">
                          {segments.map((segment, idx) => (
                            segment.seat_info && (
                              <div key={idx} className="text-sm text-gray-700">
                                <span className="font-medium">Segmen {idx + 1}: </span>
                                <span>Gerbong {segment.seat_info.coach} / Kursi {segment.seat_info.seat}</span>
                              </div>
                            )
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2">
                          {booking.seat_numbers && booking.seat_numbers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {booking.seat_numbers.map((seat, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                                  {seat}
                                </span>
                              ))}
                            </div>
                          ) : booking.coach_number ? (
                            <p className="font-medium">Gerbong {booking.coach_number}</p>
                          ) : (
                            <p className="text-gray-500">Not assigned</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-500">Baggage Allowance</label>
                      <p className="font-medium">{booking.baggage_allowance || '20kg'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Passengers Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Passengers ({passengers.length || booking.passenger_count})
                </h2>
              </div>
              <div className="p-6">
                {passengers.length > 0 ? (
                  <div className="space-y-4">
                    {passengers.map((passenger: Passenger, idx: number) => (
                      <div key={passenger.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-bold text-lg text-gray-900">
                                  {passenger.nama || booking.passenger_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Passenger #{idx + 1}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                passenger.gender === 'female' 
                                  ? 'bg-pink-100 text-pink-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {passenger.gender || 'Not specified'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm text-gray-500">ID Number (NIK)</label>
                                <p className="font-medium">{passenger.nik || 'Not provided'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-gray-500">Date of Birth</label>
                                <p className="font-medium">
                                  {passenger.tanggal_lahir 
                                    ? new Date(passenger.tanggal_lahir).toLocaleDateString('id-ID')
                                    : 'Not provided'}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm text-gray-500">Age</label>
                                <p className="font-medium">
                                  {passenger.tanggal_lahir 
                                    ? (new Date().getFullYear() - new Date(passenger.tanggal_lahir).getFullYear())
                                    : 'N/A'}
                                  </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                              <div>
                                <label className="text-sm text-gray-500">Email</label>
                                <p className="font-medium">{passenger.email || booking.passenger_email}</p>
                              </div>
                              <div>
                                <label className="text-sm text-gray-500">Phone</label>
                                <p className="font-medium">{passenger.phone || booking.passenger_phone}</p>
                              </div>
                            </div>

                            {/* Seat Assignment */}
                            {(passenger.seat_number || passenger.coach_number) && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <label className="text-xs text-gray-500">Seat Number</label>
                                    <p className="font-bold">{passenger.seat_number || 'Not assigned'}</p>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500">Coach Number</label>
                                    <p className="font-bold">{passenger.coach_number || 'Not assigned'}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No passenger data found</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Passenger data might be stored in a different format or using main booking information
                    </p>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-700">Main Passenger Information:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div>
                          <label className="text-xs text-gray-500">Name</label>
                          <p className="font-medium">{booking.passenger_name}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Email</label>
                          <p className="font-medium">{booking.passenger_email}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Phone</label>
                          <p className="font-medium">{booking.passenger_phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Information Card */}
            {ticketInfo || booking.ticket_number ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5" />
                    Ticket Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                        <Tag className="w-4 h-4" />
                        Ticket Number
                      </label>
                      <p className="font-mono font-bold text-lg">{ticketInfo?.ticket_number || booking.ticket_number || booking.booking_code}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Ticket Status</label>
                      <p className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        booking.has_ticket 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.has_ticket ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        {booking.has_ticket ? 'Active' : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">PNR Number</label>
                      <p className="font-medium">{booking.pnr_number || 'Not available'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Check-in Status</label>
                      <p className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        booking.checkin_status 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.checkin_status ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        {booking.checkin_status ? 'Checked-in' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* User Information Card */}
            {userInfo && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    User Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                        <User className="w-4 h-4" />
                        Full Name
                      </label>
                      <p className="font-medium">{userInfo.full_name || 'Not available'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <p className="font-medium">{userInfo.email || 'Not available'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4" />
                        Phone
                      </label>
                      <p className="font-medium">{userInfo.phone_number || 'Not available'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions & Payment */}
          <div className="space-y-6">
            {/* Status & Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 p-4">
                <h2 className="text-lg font-bold text-white">Status & Actions</h2>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Current Status</label>
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                    <span className="font-bold capitalize">{status}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Update Booking Status:</p>
                  <button
                    onClick={() => handleUpdateStatus('confirmed')}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Mark as Confirmed
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('pending')}
                    className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 transition font-medium"
                  >
                    <Clock className="w-5 h-5" />
                    Set as Pending
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('cancelled')}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancel Booking
                  </button>
                  {!booking.checkin_status && (
                    <button
                      onClick={handleForceCheckin}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Force Check-in
                    </button>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span className="font-medium">
                        {booking.updated_at ? formatDate(booking.updated_at) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Booking Date:</span>
                      <span className="font-medium">{formatDate(booking.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passenger Count:</span>
                      <span className="font-medium">{booking.passenger_count || passengers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Booking Platform:</span>
                      <span className="font-medium capitalize">{booking.platform || 'web'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Information
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Total Amount</label>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(booking.final_amount || booking.total_amount || 0)}
                    </p>
                  </div>

                  {(booking.insurance_amount || booking.convenience_fee || booking.discount_amount) && (
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Base Fare:</span>
                        <span className="font-medium">{formatCurrency(booking.total_amount || 0)}</span>
                      </div>
                      {booking.insurance_amount ? (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Insurance:</span>
                          <span className="font-medium">+{formatCurrency(booking.insurance_amount)}</span>
                        </div>
                      ) : null}
                      {booking.convenience_fee ? (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Service Fee:</span>
                          <span className="font-medium">+{formatCurrency(booking.convenience_fee)}</span>
                        </div>
                      ) : null}
                      {booking.discount_amount ? (
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Discount:</span>
                          <span className="font-medium text-green-600">-{formatCurrency(booking.discount_amount)}</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div>
                    <label className="text-sm text-gray-500">Payment Method</label>
                    <div className="flex items-center gap-2 mt-1">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="font-medium capitalize">
                        {booking.payment_method?.replace(/_/g, ' ') || 'E-Wallet'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-500">Payment Status</label>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mt-1 ${getPaymentStatusColor(booking.payment_status || 'paid')}`}>
                      <Shield className="w-4 h-4" />
                      <span className="font-medium capitalize">{booking.payment_status || 'paid'}</span>
                    </div>
                  </div>

                  {paymentInfo && (
                    <>
                      <div className="pt-4 border-t border-gray-200">
                        <label className="text-sm text-gray-500">Order ID</label>
                        <p className="font-mono text-sm">{paymentInfo.order_id}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Transaction ID</label>
                        <p className="font-mono text-sm">{paymentInfo.transaction_id || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500">Payment Type</label>
                        <p className="font-medium capitalize">{paymentInfo.payment_type || 'N/A'}</p>
                      </div>
                    </>
                  )}

                  {booking.transaction_id && (
                    <div>
                      <label className="text-sm text-gray-500">Transaction ID (Booking)</label>
                      <p className="font-mono text-sm">{booking.transaction_id}</p>
                    </div>
                  )}

                  {booking.refund_amount && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="text-sm text-gray-500">Refund Amount</label>
                          <p className="font-bold text-blue-700">{formatCurrency(booking.refund_amount)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500">Status</label>
                          <p className="font-medium capitalize">{booking.refund_status || 'processing'}</p>
                        </div>
                      </div>
                      {booking.cancellation_reason && (
                        <p className="text-xs text-gray-600 mt-2">Reason: {booking.cancellation_reason}</p>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <label className="text-sm text-gray-500">Payment Date</label>
                    <p className="font-medium">
                      {paymentInfo?.settlement_time 
                        ? formatDate(paymentInfo.settlement_time)
                        : (booking.updated_at ? formatDate(booking.updated_at) : 'Not paid yet')}
                    </p>
                  </div>

                  {booking.payment_proof && (
                    <div className="mt-4">
                      <label className="text-sm text-gray-500 mb-2 block">Payment Proof</label>
                      <a 
                        href={booking.payment_proof} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <Download className="w-4 h-4" />
                        View Proof
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Additional Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Booking Source:</span>
                  <span className="font-medium">{booking.platform || 'Web Platform'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Multi Segment:</span>
                  <span className="font-medium">{isMultiSegment ? 'Yes' : 'No'}</span>
                </div>
                {isMultiSegment && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Segments:</span>
                    <span className="font-medium">{booking.total_segments}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Insurance Included:</span>
                  <span className="font-medium">{booking.is_insurance_included ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Has Ticket:</span>
                  <span className="font-medium">{booking.has_ticket ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Notes:</span>
                  <span className="font-medium text-right">
                    {booking.notes || 'No additional notes'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  <Printer className="w-5 h-5" />
                  Print Details
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(booking.booking_code)}
                  className="w-full flex items-center justify-center gap-2 border border-blue-300 text-blue-700 px-4 py-3 rounded-lg hover:bg-blue-50 transition font-medium"
                >
                  <Hash className="w-5 h-5" />
                  Copy Booking Code
                </button>
                <button
                  onClick={() => router.push(`/admin/bookings/${id}/edit`)}
                  className="w-full flex items-center justify-center gap-2 border border-purple-300 text-purple-700 px-4 py-3 rounded-lg hover:bg-purple-50 transition font-medium"
                >
                  <Receipt className="w-5 h-5" />
                  Edit Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}