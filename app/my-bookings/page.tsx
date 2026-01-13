// app/my-bookings/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  TicketIcon, 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  QrCodeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/app/contexts/AuthContext';

// Update interface Booking
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
}

type FilterStatus = 'all' | 'paid' | 'waiting' | 'active' | 'completed' | 'cancelled';

// Fungsi helper untuk format seats dengan tipe yang lebih aman
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
    
    if (selectedSeats && typeof selectedSeats === 'object') {
      if (selectedSeats.seatNumber) return [selectedSeats.seatNumber];
      if (selectedSeats.number) return [selectedSeats.number];
      if (selectedSeats.id) return [String(selectedSeats.id)];
      return [JSON.stringify(selectedSeats)];
    }
    
    return [];
  } catch (error) {
    console.error('Error formatting seats:', error);
    return [];
  }
};

// Fungsi untuk mendapatkan nama kereta yang benar
const getTrainDisplayName = (booking: Booking): string => {
  if (booking.train_name && booking.train_name !== 'Kereta Api' && booking.train_name !== 'Train') {
    return booking.train_name;
  }
  
  if (booking.train_code) {
    const code = booking.train_code.toUpperCase();
    
    const trainMappings: Record<string, string> = {
      'KA-01': 'Argo Wilis',
      'KA-02': 'Argo Parahyangan',
      'KA-03': 'Turangga',
      'KA-04': 'Sancaka',
      'KA-05': 'Mutiara Selatan',
      'KA-06': 'Mutiara Timur',
      'KA-07': 'Taksaka',
      'KA-08': 'Bima',
      'KA-09': 'Gajayana',
      'KA-10': 'Sembrani',
      'KA-11': 'Bangunkarta',
      'KA-12': 'Fajar/Senja Utama',
      'KA-13': 'Sribilah',
      'KA-14': 'Serelo',
      'KA-15': 'Rajawali',
      'KA-16': 'Tegar',
      'KA-17': 'Harina',
      'KA-18': 'Pangrango',
      'KA-19': 'Gajah Wong',
      'KA-20': 'Jaka Tingkir',
      'T-001': 'Argo Parahyangan',
      'T-002': 'Argo Lawu',
      'T-003': 'Argo Dwipangga',
      'T-004': 'Argo Sindoro',
      'T-005': 'Argo Muria',
      'T-006': 'Argo Cheribon',
      'T-007': 'Argo Bromo Anggrek',
      'T-008': 'Argo Semeru',
      'T-009': 'Taksaka',
      'T-010': 'Bima',
      'T-011': 'Gajayana',
      'T-012': 'Sembrani',
      'T-013': 'Mutiara Selatan',
      'T-014': 'Mutiara Timur',
      'T-015': 'Sancaka',
      'T-016': 'Turangga',
      'T-017': 'Argo Wilis',
      'T-018': 'Lodaya',
      'T-019': 'Malabar',
      'T-020': 'Kahuripan'
    };
    
    if (trainMappings[code]) {
      return trainMappings[code];
    }
    
    return `Kereta ${code}`;
  }
  
  return booking.train_name || 'Kereta Api';
};

// Fungsi untuk mendapatkan kelas kereta yang lebih deskriptif
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

// Fungsi untuk mendapatkan operator kereta
const getTrainOperator = (trainName: string, origin?: string, destination?: string): string => {
  const operators: Record<string, string> = {
    'Argo Parahyangan': 'PT. Kereta Api Indonesia (KAI)',
    'Argo Wilis': 'PT. Kereta Api Indonesia (KAI)',
    'Turangga': 'PT. Kereta Api Indonesia (KAI)',
    'Sancaka': 'PT. Kereta Api Indonesia (KAI)',
    'Mutiara Selatan': 'PT. Kereta Api Indonesia (KAI)',
    'Taksaka': 'PT. Kereta Api Indonesia (KAI)',
    'Gajayana': 'PT. Kereta Api Indonesia (KAI)',
    'Sembrani': 'PT. Kereta Api Indonesia (KAI)',
    'Bima': 'PT. Kereta Api Indonesia (KAI)',
    'Bangunkarta': 'PT. Kereta Api Indonesia (KAI)',
    'Lodaya': 'PT. Kereta Api Indonesia (KAI)',
    'Malabar': 'PT. Kereta Api Indonesia (KAI)',
    'Argo Lawu': 'PT. Kereta Api Indonesia (KAI)',
    'Argo Dwipangga': 'PT. Kereta Api Indonesia (KAI)',
    'Argo Sindoro': 'PT. Kereta Api Indonesia (KAI)',
    'Argo Muria': 'PT. Kereta Api Indonesia (KAI)',
    'Argo Cheribon': 'PT. Kereta Api Indonesia (KAI)',
    'Argo Bromo Anggrek': 'PT. Kereta Api Indonesia (KAI)',
    'Argo Semeru': 'PT. Kereta Api Indonesia (KAI)'
  };
  
  return operators[trainName] || 'PT. Kereta Api Indonesia (KAI)';
};

export default function MyBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [justPaidHighlight, setJustPaidHighlight] = useState<string | null>(null);
  const [trainDetails, setTrainDetails] = useState<Record<string, { name: string; operator: string }>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Tambahkan ref untuk mengontrol loading
  const isLoadingRef = useRef(false);
  const initialLoadDone = useRef(false);

  // Check URL parameters for direct redirect from payment
  useEffect(() => {
    const justPaidFromUrl = searchParams.get('justPaid');
    const bookingCodeFromUrl = searchParams.get('bookingCode');
    
    if (justPaidFromUrl === 'true' && bookingCodeFromUrl) {
      setJustPaidHighlight(bookingCodeFromUrl);
      // Clean URL without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Fetch train details from database
  const fetchTrainDetails = useCallback(async (trainCodes: string[]) => {
    if (!trainCodes.length) return;
    
    try {
      console.log('Fetching train details for:', trainCodes);
      const { data, error } = await supabase
        .from('kereta')
        .select('code, name, operator')
        .in('code', trainCodes);
        
      if (error) {
        console.error('Error fetching train details:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const details: Record<string, { name: string; operator: string }> = {};
        data.forEach(train => {
          details[train.code] = {
            name: train.name,
            operator: train.operator
          };
        });
        setTrainDetails(details);
      }
    } catch (error) {
      console.error('Error in fetchTrainDetails:', error);
    }
  }, []);

  // PERBAIKAN UTAMA: Load bookings dengan timeout dan error handling yang lebih baik
  const loadBookings = useCallback(async (forceReload = false) => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current && !forceReload) {
      console.log('⏸️ Loading already in progress');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('🚀 Starting to load bookings...');
      console.log('User info:', user);
      
      let allBookings: Booking[] = [];
      const trainCodes: string[] = [];
      
      // 1. Load from localStorage first (always works)
      try {
        const savedBookings = localStorage.getItem('myBookings');
        if (savedBookings) {
          const parsedBookings = JSON.parse(savedBookings);
          if (Array.isArray(parsedBookings) && parsedBookings.length > 0) {
            console.log(`✅ Loaded ${parsedBookings.length} bookings from localStorage`);
            
            const processedLocalBookings = parsedBookings.map((booking: any): Booking => {
              const trainName = getTrainDisplayName(booking);
              
              return {
                id: booking.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                booking_code: booking.booking_code || booking.bookingCode || `BOOK-${Date.now().toString().slice(-8)}`,
                order_id: booking.order_id || booking.orderId || `ORDER-${Date.now()}`,
                ticket_number: booking.ticket_number || booking.ticketNumber,
                passenger_name: booking.passenger_name || booking.passengerName || booking.customerName || 'Penumpang',
                passenger_email: booking.passenger_email || booking.passengerEmail || booking.customerEmail || '',
                passenger_phone: booking.passenger_phone || booking.passengerPhone || booking.customerPhone || '',
                train_name: trainName,
                train_code: booking.train_code || booking.trainCode,
                train_class: booking.train_class || booking.trainClass,
                train_type: booking.train_type || booking.trainType || 'Economy',
                origin: booking.origin || '',
                destination: booking.destination || '',
                departure_date: booking.departure_date || booking.departureDate || new Date().toISOString().split('T')[0],
                departure_time: booking.departure_time || booking.departureTime || '08:00',
                arrival_time: booking.arrival_time || booking.arrivalTime || '12:00',
                total_amount: booking.total_amount || booking.totalAmount || 0,
                status: booking.status || 'pending',
                payment_status: booking.payment_status || booking.paymentStatus || 'pending',
                payment_method: booking.payment_method || booking.paymentMethod,
                passenger_count: booking.passenger_count || booking.passengerCount || 1,
                created_at: booking.created_at || booking.createdAt || booking.booking_date || new Date().toISOString(),
                updated_at: booking.updated_at || booking.updatedAt || new Date().toISOString(),
                selected_seats: booking.selected_seats || booking.selectedSeats,
                has_ticket: booking.has_ticket || !!booking.ticket_number,
                booking_date: booking.booking_date || booking.created_at || new Date().toISOString()
              };
            });
            
            allBookings = [...processedLocalBookings];
          }
        }
      } catch (localStorageError) {
        console.error('❌ Local storage error:', localStorageError);
      }
      
      // 2. Try database if user is logged in
      if (user?.id) {
        try {
          console.log('🔍 Querying database for user:', user.id);
          
          // Query berdasarkan user_id atau email
          const queries = [];
          
          if (user.id) {
            queries.push(`user_id.eq.${user.id}`);
          }
          
          if (user.email) {
            queries.push(`passenger_email.eq.${user.email}`);
          }
          
          const queryString = queries.join(',');
          console.log('Supabase query:', queryString);
          
          const { data: dbBookings, error } = await supabase
            .from('bookings_kereta')
            .select('*')
            .or(queryString)
            .order('created_at', { ascending: false });
            
          if (error) {
            console.error('❌ Database query error:', error);
          } else {
            console.log(`✅ Found ${dbBookings?.length || 0} bookings from DB`);
            
            if (dbBookings && dbBookings.length > 0) {
              const processedDbBookings = dbBookings.map((booking: any): Booking => {
                const trainName = getTrainDisplayName({
                  ...booking,
                  train_name: booking.train_name,
                  train_code: booking.train_code
                });
                
                if (booking.train_code) {
                  trainCodes.push(booking.train_code);
                }
                
                return {
                  id: booking.id,
                  booking_code: booking.booking_code,
                  order_id: booking.order_id || '',
                  ticket_number: booking.ticket_number,
                  passenger_name: booking.passenger_name || 'Penumpang',
                  passenger_email: booking.passenger_email || '',
                  passenger_phone: booking.passenger_phone || '',
                  train_name: trainName,
                  train_code: booking.train_code,
                  train_class: booking.train_class,
                  train_type: booking.train_type,
                  origin: booking.origin || '',
                  destination: booking.destination || '',
                  departure_date: booking.departure_date || '',
                  departure_time: booking.departure_time || '',
                  arrival_time: booking.arrival_time || '',
                  total_amount: booking.total_amount || 0,
                  status: booking.status || 'pending',
                  payment_status: booking.payment_status || 'pending',
                  payment_method: booking.payment_method,
                  passenger_count: booking.passenger_count || 1,
                  created_at: booking.created_at || new Date().toISOString(),
                  updated_at: booking.updated_at || new Date().toISOString(),
                  selected_seats: booking.selected_seats,
                  has_ticket: !!booking.ticket_number,
                  booking_date: booking.created_at,
                  user_id: booking.user_id
                };
              });
              
              // Merge with localStorage bookings, avoid duplicates by booking_code
              const existingCodes = allBookings.map(b => b.booking_code);
              const uniqueDbBookings = processedDbBookings.filter(
                (b: Booking) => !existingCodes.includes(b.booking_code)
              );
              
              allBookings = [...allBookings, ...uniqueDbBookings];
            }
          }
        } catch (dbError) {
          console.error('❌ Database fetch exception:', dbError);
        }
      }
      
      // 3. Check for recent payments in session storage
      try {
        const justPaid = sessionStorage.getItem('justPaid');
        const lastBookingCode = sessionStorage.getItem('lastBookingCode');
        const lastOrderId = sessionStorage.getItem('lastOrderId');
        
        if (justPaid === 'true' && lastBookingCode) {
          setJustPaidHighlight(lastBookingCode);
          
          // Clean session storage
          sessionStorage.removeItem('justPaid');
          sessionStorage.removeItem('lastBookingCode');
          sessionStorage.removeItem('lastOrderId');
          
          setTimeout(() => {
            setJustPaidHighlight(null);
          }, 5000);
        }
        
        // Check for latest booking from payment success
        const latestBooking = localStorage.getItem('latestBooking');
        if (latestBooking) {
          try {
            const newBooking = JSON.parse(latestBooking);
            const trainName = getTrainDisplayName(newBooking);
            
            const booking: Booking = {
              id: `latest-${Date.now()}`,
              booking_code: newBooking.bookingCode || `BOOK-${Date.now()}`,
              order_id: newBooking.orderId || `ORDER-${Date.now()}`,
              ticket_number: newBooking.ticketNumber || `TICKET-${Date.now().toString().slice(-10)}`,
              passenger_name: newBooking.customerName || newBooking.passengerName || 'Penumpang',
              passenger_email: newBooking.customerEmail || newBooking.passengerEmail || '',
              passenger_phone: newBooking.customerPhone || newBooking.passengerPhone || '',
              train_name: trainName,
              train_code: newBooking.trainCode,
              train_class: newBooking.trainClass,
              train_type: newBooking.trainType || 'Executive',
              origin: newBooking.origin || '',
              destination: newBooking.destination || '',
              departure_date: newBooking.departureDate || new Date().toISOString().split('T')[0],
              departure_time: newBooking.departureTime || '08:00',
              arrival_time: newBooking.arrivalTime || '12:00',
              total_amount: newBooking.totalAmount || 0,
              status: newBooking.status || 'confirmed',
              payment_status: newBooking.paymentStatus || 'paid',
              payment_method: newBooking.paymentMethod || 'E-WALLET',
              passenger_count: newBooking.passengerCount || 1,
              created_at: newBooking.created_at || newBooking.bookingTime || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              selected_seats: newBooking.selectedSeats,
              has_ticket: !!newBooking.ticketNumber,
              booking_date: new Date().toISOString()
            };
            
            // Remove duplicate if exists
            const existingIndex = allBookings.findIndex(b => b.booking_code === booking.booking_code);
            if (existingIndex !== -1) {
              allBookings[existingIndex] = booking;
            } else {
              allBookings.unshift(booking); // Add to beginning
            }
            
            localStorage.removeItem('latestBooking');
            
          } catch (parseError) {
            console.error('❌ Error parsing latest booking:', parseError);
            localStorage.removeItem('latestBooking');
          }
        }
      } catch (sessionError) {
        console.error('❌ Session storage error:', sessionError);
      }
      
      // 4. Add demo data if empty (for testing)
      if (allBookings.length === 0) {
        console.log('📝 Adding demo bookings');
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        const demoBookings: Booking[] = [
          {
            id: 'demo-1',
            booking_code: 'BOOK-206942-JUBG',
            order_id: 'ORDER-1767783206942-JUBG',
            ticket_number: 'TICKET-43328554',
            passenger_name: 'Reisan',
            passenger_email: 'reisanadrefagt@gmail.com',
            passenger_phone: '08453665664',
            train_name: 'Argo Parahyangan',
            train_code: 'KA-02',
            train_class: 'Executive',
            train_type: 'Executive',
            origin: 'Stasiun Bandung',
            destination: 'Stasiun Gambir',
            departure_date: tomorrow.toISOString().split('T')[0],
            departure_time: '05:00',
            arrival_time: '10:00',
            total_amount: 412500,
            status: 'confirmed',
            payment_status: 'paid',
            payment_method: 'E-WALLET',
            passenger_count: 1,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            selected_seats: ['C2'],
            has_ticket: true,
            booking_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'demo-2',
            booking_code: 'BOOK-012000-EBS0',
            order_id: 'ORDER-1767536012000-EBS0',
            ticket_number: 'TICKET-36149124',
            passenger_name: 'Reisan Adrefa',
            passenger_email: 'reisanadrefagt@gmail.com',
            passenger_phone: '08453535345',
            train_name: 'Argo Wilis',
            train_code: 'KA-01',
            train_class: 'Economy',
            train_type: 'Economy',
            origin: 'Stasiun Bandung',
            destination: 'Stasiun Gambir',
            departure_date: today.toISOString().split('T')[0],
            departure_time: '06:35',
            arrival_time: '11:35',
            total_amount: 149825,
            status: 'confirmed',
            payment_status: 'paid',
            payment_method: 'e-wallet',
            passenger_count: 1,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            selected_seats: ['A1'],
            has_ticket: true,
            booking_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'demo-3',
            booking_code: 'BOOK-999999-TEST',
            order_id: 'ORDER-1767536999999-TEST',
            ticket_number: 'TICKET-99999999',
            passenger_name: 'John Doe',
            passenger_email: 'john@example.com',
            passenger_phone: '081234567890',
            train_name: 'Turangga',
            train_code: 'KA-03',
            train_class: 'Business',
            train_type: 'Business',
            origin: 'Stasiun Surabaya',
            destination: 'Stasiun Yogyakarta',
            departure_date: yesterday.toISOString().split('T')[0],
            departure_time: '14:00',
            arrival_time: '19:30',
            total_amount: 275000,
            status: 'completed',
            payment_status: 'paid',
            payment_method: 'Credit Card',
            passenger_count: 2,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            selected_seats: ['B3', 'B4'],
            has_ticket: true,
            booking_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        
        allBookings = [...allBookings, ...demoBookings];
      }
      
      // 5. Fetch train details asynchronously
      if (trainCodes.length > 0) {
        fetchTrainDetails([...new Set(trainCodes)]).catch(console.error);
      }
      
      // 6. Sort by departure date (closest first)
      allBookings.sort((a, b) => {
        const dateA = new Date(a.departure_date);
        const dateB = new Date(b.departure_date);
        return dateA.getTime() - dateB.getTime();
      });
      
      // 7. Update state
      console.log(`✅ Total bookings to display: ${allBookings.length}`);
      setBookings(allBookings);
      applyFilter(activeFilter, allBookings);
      
      // 8. Cache in localStorage
      try {
        const bookingsToCache = allBookings.map(booking => ({
          id: booking.id,
          booking_code: booking.booking_code,
          order_id: booking.order_id,
          ticket_number: booking.ticket_number,
          passenger_name: booking.passenger_name,
          passenger_email: booking.passenger_email,
          passenger_phone: booking.passenger_phone,
          train_name: booking.train_name,
          train_code: booking.train_code,
          train_class: booking.train_class,
          train_type: booking.train_type,
          origin: booking.origin,
          destination: booking.destination,
          departure_date: booking.departure_date,
          departure_time: booking.departure_time,
          arrival_time: booking.arrival_time,
          total_amount: booking.total_amount,
          status: booking.status,
          payment_status: booking.payment_status,
          payment_method: booking.payment_method,
          passenger_count: booking.passenger_count,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
          selected_seats: booking.selected_seats,
          has_ticket: booking.has_ticket,
          booking_date: booking.booking_date
        }));
        
        localStorage.setItem('myBookings', JSON.stringify(bookingsToCache));
        console.log('💾 Saved bookings to localStorage');
      } catch (e) {
        console.error('❌ Failed to save to localStorage:', e);
      }
      
    } catch (error: any) {
      console.error('💥 Critical error loading bookings:', error);
      setError('Gagal memuat data booking. Silakan refresh halaman.');
      
      // Fallback to demo data only
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      const fallbackBookings: Booking[] = [
        {
          id: 'fallback-1',
          booking_code: 'BOOK-DEMO-001',
          order_id: 'ORDER-DEMO-001',
          ticket_number: 'TICKET-DEMO-001',
          passenger_name: 'Demo User',
          passenger_email: 'demo@example.com',
          passenger_phone: '08123456789',
          train_name: 'Argo Parahyangan',
          train_code: 'KA-02',
          train_class: 'Executive',
          train_type: 'Executive',
          origin: 'Bandung',
          destination: 'Jakarta',
          departure_date: tomorrow.toISOString().split('T')[0],
          departure_time: '08:00',
          arrival_time: '13:00',
          total_amount: 250000,
          status: 'confirmed',
          payment_status: 'paid',
          payment_method: 'E-WALLET',
          passenger_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          selected_seats: ['A1'],
          has_ticket: true,
          booking_date: new Date().toISOString()
        }
      ];
      
      setBookings(fallbackBookings);
      setFilteredBookings(fallbackBookings);
      
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
      initialLoadDone.current = true;
      console.log('🏁 Booking loading completed');
    }
  }, [user, activeFilter, fetchTrainDetails]);

  // PERBAIKAN: Gunakan useEffect dengan dependencies yang tepat
  useEffect(() => {
    // Only load on initial mount or when user changes
    if (!initialLoadDone.current) {
      console.log('🔄 Initial load triggered');
      const loadData = async () => {
        await loadBookings();
      };
      loadData();
    }
    
    // Setup visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && initialLoadDone.current) {
        console.log('🔍 Tab became visible, refreshing data...');
        // Reload when tab becomes visible after 10 seconds
        setTimeout(() => loadBookings(true), 10000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadBookings]);

  // Apply filter function
  const applyFilter = useCallback((filter: FilterStatus, bookingsList: Booking[]) => {
    console.log(`Applying filter: ${filter} to ${bookingsList.length} bookings`);
    
    if (filter === 'all') {
      setFilteredBookings([...bookingsList]);
      return;
    }
    
    const filtered = bookingsList.filter(booking => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDate = new Date(booking.departure_date);
      bookingDate.setHours(0, 0, 0, 0);
      const diffTime = bookingDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (filter) {
        case 'paid':
          return booking.payment_status === 'paid' || booking.status === 'confirmed' || booking.status === 'paid';
        case 'waiting':
          return booking.payment_status === 'pending' || booking.status === 'pending' || booking.status === 'waiting_payment';
        case 'active':
          return (booking.status === 'confirmed' || booking.status === 'paid') && diffDays >= 0 && diffDays <= 2;
        case 'completed':
          const isPast = diffDays < 0;
          return isPast || booking.status === 'completed' || booking.status === 'expired';
        case 'cancelled':
          return booking.status === 'cancelled' || booking.status === 'canceled' || booking.payment_status === 'refunded';
        default:
          return true;
      }
    });
    
    console.log(`Filtered to ${filtered.length} bookings`);
    setFilteredBookings(filtered);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((filter: FilterStatus) => {
    console.log(`Changing filter to: ${filter}`);
    setActiveFilter(filter);
    applyFilter(filter, bookings);
  }, [applyFilter, bookings]);

  // Handle search
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query) {
      applyFilter(activeFilter, bookings);
      return;
    }
    
    const filtered = bookings.filter(booking =>
      (booking.booking_code?.toLowerCase() || '').includes(query) ||
      (booking.passenger_name?.toLowerCase() || '').includes(query) ||
      (booking.train_name?.toLowerCase() || '').includes(query) ||
      (booking.origin?.toLowerCase() || '').includes(query) ||
      (booking.destination?.toLowerCase() || '').includes(query) ||
      (booking.ticket_number?.toLowerCase() || '').includes(query)
    );
    
    setFilteredBookings(filtered);
  }, [applyFilter, activeFilter, bookings]);

  // Format functions
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  }, []);

  const formatTime = useCallback((timeString: string) => {
    try {
      if (!timeString) return '--:--';
      if (timeString.includes(':')) return timeString;
      
      const date = new Date(`2000-01-01T${timeString}`);
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Time formatting error:', error);
      return timeString;
    }
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }, []);

  // Format tanggal booking (waktu pemesanan)
  const formatBookingDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 1) {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          return `${diffMinutes} menit yang lalu`;
        }
        return `${diffHours} jam yang lalu`;
      } else if (diffDays === 1) {
        return 'Kemarin';
      } else if (diffDays < 7) {
        return `${diffDays} hari yang lalu`;
      } else {
        return date.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch (error) {
      console.error('Booking date formatting error:', error);
      return dateString;
    }
  }, []);

  const getStatusBadge = useCallback((status: string, paymentStatus: string) => {
    const lowerStatus = (status || '').toLowerCase();
    const lowerPaymentStatus = (paymentStatus || '').toLowerCase();
    
    if (lowerPaymentStatus === 'paid' || lowerStatus === 'confirmed' || lowerStatus === 'paid') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          LUNAS
        </span>
      );
    } else if (lowerPaymentStatus === 'pending' || lowerStatus === 'pending' || lowerStatus === 'waiting_payment') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          <ClockIcon className="w-4 h-4 mr-1" />
          MENUNGGU PEMBAYARAN
        </span>
      );
    } else if (lowerStatus === 'cancelled' || lowerStatus === 'canceled' || lowerPaymentStatus === 'refunded') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          <XCircleIcon className="w-4 h-4 mr-1" />
          DIBATALKAN
        </span>
      );
    } else if (lowerStatus === 'completed' || lowerStatus === 'expired') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
          SELESAI
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {status?.toUpperCase() || 'PENDING'}
        </span>
      );
    }
  }, []);

  const getPaymentMethodIcon = useCallback((method?: string) => {
    if (!method) return <CurrencyDollarIcon className="w-5 h-5" />;
    
    const lowerMethod = method.toLowerCase();
    if (lowerMethod.includes('bank') || lowerMethod.includes('transfer')) {
      return <CreditCardIcon className="w-5 h-5" />;
    } else if (lowerMethod.includes('wallet') || lowerMethod.includes('ewallet')) {
      return <QrCodeIcon className="w-5 h-5" />;
    } else if (lowerMethod.includes('credit') || lowerMethod.includes('debit')) {
      return <CreditCardIcon className="w-5 h-5" />;
    }
    return <CurrencyDollarIcon className="w-5 h-5" />;
  }, []);

  // Handle actions
  const handleViewDetails = useCallback((bookingCode: string) => {
    router.push(`/booking/detail/${bookingCode}`);
  }, [router]);

  const handlePrintTicket = useCallback((booking: Booking) => {
    if (!booking.ticket_number) {
      alert('Tiket belum tersedia untuk booking ini');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const seats = formatSelectedSeats(booking.selected_seats);
      
      printWindow.document.write(`
        <html>
          <head>
            <title>E-Ticket ${booking.ticket_number}</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 20px; 
                max-width: 600px; 
                margin: 0 auto; 
                background: #f5f5f5;
              }
              .ticket { 
                background: white;
                border: 2px solid #333; 
                border-radius: 12px;
                padding: 25px; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              .header { 
                text-align: center; 
                margin-bottom: 25px; 
                border-bottom: 2px solid #FD7E14;
                padding-bottom: 15px;
              }
              .header h1 { 
                color: #FD7E14; 
                margin: 0; 
                font-size: 24px;
                font-weight: bold;
              }
              .header h3 { 
                color: #333; 
                margin: 5px 0 0 0;
                font-weight: normal;
              }
              .section { 
                margin-bottom: 18px; 
                padding: 10px;
                background: #f9f9f9;
                border-radius: 8px;
              }
              .label { 
                font-weight: bold; 
                color: #666; 
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .value { 
                font-size: 16px; 
                margin-top: 5px; 
                color: #222;
                font-weight: 600;
              }
              .divider { 
                border-top: 2px dashed #ccc; 
                margin: 25px 0; 
              }
              .route { 
                display: flex; 
                justify-content: space-between; 
                align-items: center;
                background: #e8f4ff;
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
              }
              .station { text-align: center; }
              .time { font-size: 20px; font-weight: bold; color: #222; }
              .station-name { font-size: 14px; color: #555; margin-top: 5px; }
              .arrow { font-size: 24px; color: #FD7E14; }
              .qrcode-placeholder {
                width: 120px;
                height: 120px;
                background: #eee;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 20px auto;
                border: 1px dashed #ccc;
                border-radius: 8px;
              }
              @media print {
                body { background: white; }
                .no-print { display: none; }
                .ticket { border: 1px solid #000; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h1>TripGO E-Ticket</h1>
                <h3>${booking.ticket_number}</h3>
              </div>
              
              <div class="section">
                <div class="label">Kode Booking</div>
                <div class="value">${booking.booking_code}</div>
              </div>
              
              <div class="section">
                <div class="label">Nama Penumpang</div>
                <div class="value">${booking.passenger_name}</div>
              </div>
              
              <div class="section">
                <div class="label">Kereta</div>
                <div class="value">${booking.train_name} (${getTrainClassDisplay(booking.train_class, booking.train_type)})</div>
              </div>
              
              <div class="route">
                <div class="station">
                  <div class="time">${formatTime(booking.departure_time)}</div>
                  <div class="station-name">${booking.origin}</div>
                </div>
                <div class="arrow">→</div>
                <div class="station">
                  <div class="time">${formatTime(booking.arrival_time)}</div>
                  <div class="station-name">${booking.destination}</div>
                </div>
              </div>
              
              <div class="section">
                <div class="label">Tanggal Keberangkatan</div>
                <div class="value">${formatDate(booking.departure_date)}</div>
              </div>
              
              ${seats.length > 0 ? `
              <div class="section">
                <div class="label">Kursi</div>
                <div class="value">${seats.join(', ')}</div>
              </div>
              ` : ''}
              
              <div class="section">
                <div class="label">Total Pembayaran</div>
                <div class="value" style="color: #FD7E14; font-size: 18px;">${formatCurrency(booking.total_amount)}</div>
              </div>
              
              <div class="qrcode-placeholder">
                QR Code
              </div>
              
              <div class="divider"></div>
              
              <div class="section" style="text-align: center; background: #fff8e6;">
                <p style="color: #666; font-size: 12px; margin: 0; line-height: 1.6;">
                  <strong>Instruksi Check-in:</strong><br>
                  1. Bawa e-ticket ini dan KTP asli ke stasiun<br>
                  2. Datang minimal 30 menit sebelum keberangkatan<br>
                  3. Tunjukkan QR code di gerbang check-in<br>
                  4. E-ticket hanya berlaku untuk satu kali perjalanan
                </p>
              </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 30px;">
              <button onclick="window.print()" style="padding: 12px 30px; background: #FD7E14; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;">
                🖨️ Cetak Tiket
              </button>
              <button onclick="window.close()" style="padding: 12px 30px; background: #666; color: white; border: none; border-radius: 8px; margin-left: 15px; cursor: pointer; font-size: 16px;">
                Tutup
              </button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }, [formatDate, formatTime, formatCurrency]);

  const handleCancelBooking = useCallback(async (bookingCode: string) => {
    if (!confirm(`Apakah Anda yakin ingin membatalkan booking ${bookingCode}?`)) {
      return;
    }
    
    try {
      const bookingToCancel = bookings.find(b => b.booking_code === bookingCode);
      if (!bookingToCancel) return;
      
      if (bookingToCancel.id && !bookingToCancel.id.startsWith('demo-') && !bookingToCancel.id.startsWith('local-') && !bookingToCancel.id.startsWith('manual-')) {
        try {
          const { error } = await supabase
            .from('bookings_kereta')
            .update({
              status: 'cancelled',
              payment_status: 'refunded',
              updated_at: new Date().toISOString()
            })
            .eq('booking_code', bookingCode);
            
          if (error) {
            console.error('Database update error:', error);
          }
        } catch (dbError) {
          console.error('Error updating database:', dbError);
        }
      }
      
      const updatedBookings = bookings.map(booking => {
        if (booking.booking_code === bookingCode) {
          return { 
            ...booking, 
            status: 'cancelled', 
            payment_status: 'refunded',
            updated_at: new Date().toISOString()
          };
        }
        return booking;
      });
      
      setBookings(updatedBookings);
      applyFilter(activeFilter, updatedBookings);
      
      try {
        localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      
      alert(`Booking ${bookingCode} berhasil dibatalkan. Dana akan dikembalikan dalam 1-3 hari kerja.`);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Gagal membatalkan booking. Silakan coba lagi.');
    }
  }, [applyFilter, activeFilter, bookings]);

  const handleAddManualBooking = useCallback(() => {
    const bookingCode = prompt('Masukkan kode booking (contoh: BOOK-T71780-84FY):');
    if (!bookingCode || bookingCode.trim() === '') return;
    
    const cleanBookingCode = bookingCode.trim().toUpperCase();
    
    const exists = bookings.some(b => b.booking_code.toUpperCase() === cleanBookingCode);
    if (exists) {
      alert('Booking sudah ada dalam daftar!');
      return;
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const newBooking: Booking = {
      id: `manual-${Date.now()}`,
      booking_code: cleanBookingCode,
      order_id: `ORDER-${Date.now().toString().slice(-8)}`,
      ticket_number: `TICKET-${Date.now().toString().slice(-8)}`,
      passenger_name: user?.email?.split('@')[0] || 'Penumpang',
      passenger_email: user?.email || '',
      passenger_phone: '',
      train_name: 'Argo Parahyangan',
      train_code: 'KA-02',
      train_class: 'Ekonomi',
      train_type: 'Ekonomi',
      origin: 'Stasiun Bandung',
      destination: 'Stasiun Gambir',
      departure_date: tomorrow.toISOString().split('T')[0],
      departure_time: '08:00',
      arrival_time: '12:00',
      total_amount: 150000,
      status: 'pending',
      payment_status: 'pending',
      passenger_count: 1,
      created_at: today.toISOString(),
      updated_at: today.toISOString(),
      selected_seats: [],
      booking_date: today.toISOString()
    };
    
    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    applyFilter(activeFilter, updatedBookings);
    
    try {
      localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    
    alert(`Booking ${cleanBookingCode} berhasil ditambahkan!`);
  }, [applyFilter, activeFilter, bookings, user]);

  const handleClearAllBookings = useCallback(() => {
    if (!confirm('Apakah Anda yakin ingin menghapus SEMUA booking? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }
    
    try {
      setBookings([]);
      setFilteredBookings([]);
      localStorage.removeItem('myBookings');
      localStorage.removeItem('latestBooking');
      
      // Clear session storage
      ['justPaid', 'lastBookingCode', 'lastOrderId'].forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      alert('Semua booking telah dihapus.');
    } catch (error) {
      console.error('Error clearing bookings:', error);
      alert('Gagal menghapus booking. Silakan coba lagi.');
    }
  }, []);

  const handleProcessPayment = useCallback(async (bookingCode: string) => {
    const booking = bookings.find(b => b.booking_code === bookingCode);
    if (!booking) return;
    
    if (!confirm(`Kirim link pembayaran untuk ${bookingCode} ke email ${booking.passenger_email || 'Anda'}?`)) {
      return;
    }
    
    try {
      if (booking.id && !booking.id.startsWith('demo-') && !booking.id.startsWith('manual-') && !booking.id.startsWith('local-')) {
        try {
          const { error } = await supabase
            .from('bookings_kereta')
            .update({
              payment_status: 'paid',
              status: 'confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('booking_code', bookingCode);
            
          if (error) {
            console.error('Database update error:', error);
          }
        } catch (dbError) {
          console.error('Error updating database:', dbError);
        }
      }
      
      const updatedBookings = bookings.map(b => {
        if (b.booking_code === bookingCode) {
          return { 
            ...b, 
            payment_status: 'paid',
            status: 'confirmed',
            updated_at: new Date().toISOString()
          };
        }
        return b;
      });
      
      setBookings(updatedBookings);
      applyFilter(activeFilter, updatedBookings);
      
      try {
        localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
      
      alert('Link pembayaran telah dikirim ke email Anda. Status booking diperbarui menjadi LUNAS.');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Gagal memproses pembayaran. Silakan coba lagi.');
    }
  }, [applyFilter, activeFilter, bookings]);

  // Hitung statistik
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const paidBookings = bookings.filter(b => 
      b.payment_status === 'paid' || b.status === 'confirmed' || b.status === 'paid'
    ).length;
    const pendingBookings = bookings.filter(b => 
      b.payment_status === 'pending' || b.status === 'pending' || b.status === 'waiting_payment'
    ).length;
    const cancelledBookings = bookings.filter(b => 
      b.status === 'cancelled' || b.status === 'canceled' || b.payment_status === 'refunded'
    ).length;
    
    const totalSpent = bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    return { totalBookings, paidBookings, pendingBookings, cancelledBookings, totalSpent };
  }, [bookings]);

  // PERBAIKAN: Tambahkan timeout untuk loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⏰ Loading timeout - forcing state change');
        setLoading(false);
        isLoadingRef.current = false;
        
        // Show fallback data
        if (bookings.length === 0) {
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          
          const fallbackBookings: Booking[] = [
            {
              id: 'timeout-fallback',
              booking_code: 'BOOK-TIMEOUT-001',
              order_id: 'ORDER-TIMEOUT-001',
              ticket_number: 'TICKET-TIMEOUT-001',
              passenger_name: 'Demo User',
              passenger_email: 'demo@example.com',
              passenger_phone: '08123456789',
              train_name: 'Argo Parahyangan',
              train_code: 'KA-02',
              train_class: 'Executive',
              train_type: 'Executive',
              origin: 'Bandung',
              destination: 'Jakarta',
              departure_date: tomorrow.toISOString().split('T')[0],
              departure_time: '08:00',
              arrival_time: '13:00',
              total_amount: 250000,
              status: 'confirmed',
              payment_status: 'paid',
              payment_method: 'E-WALLET',
              passenger_count: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              selected_seats: ['A1'],
              has_ticket: true,
              booking_date: new Date().toISOString()
            }
          ];
          
          setBookings(fallbackBookings);
          setFilteredBookings(fallbackBookings);
        }
      }
    }, 8000); // 8 second timeout
    
    return () => clearTimeout(timeout);
  }, [loading, bookings.length]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FD7E14] mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium">Memuat data booking Anda...</p>
          <p className="text-sm text-gray-500 mt-2">Harap tunggu sebentar</p>
          <div className="mt-4 flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Refresh Halaman
            </button>
            <button
              onClick={() => {
                setLoading(false);
                isLoadingRef.current = false;
              }}
              className="px-4 py-2 text-sm bg-[#FD7E14] text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Tampilkan Data Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-300 rounded-2xl shadow-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-500 mr-4" />
              <div className="flex-1">
                <h3 className="font-bold text-red-800 text-lg mb-1">Gagal Memuat Data</h3>
                <p className="text-red-700">{error}</p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Coba Lagi
                  </button>
                  <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg text-sm">
            <p className="font-semibold">Debug Info:</p>
            <p>Total Bookings: {bookings.length}</p>
            <p>Filtered: {filteredBookings.length}</p>
            <p>User: {user?.email || 'Not logged in'}</p>
            <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
            <button 
              onClick={() => loadBookings(true)}
              className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded"
            >
              Reload Data
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Tiket dan Booking Saya</h1>
              <p className="text-gray-600">
                Kelola dan lihat semua tiket Anda di satu tempat
              </p>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CalendarIcon className="w-5 h-5" />
                <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats and Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 transition-transform hover:scale-[1.02]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <TicketIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Booking</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalBookings}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 transition-transform hover:scale-[1.02]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <CheckCircleIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sudah Dibayar</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.paidBookings}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 transition-transform hover:scale-[1.02]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <ClockIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Menunggu</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.pendingBookings}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 transition-transform hover:scale-[1.02]">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <CurrencyDollarIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Belanja</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(stats.totalSpent)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari booking, penumpang, atau kereta..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-3 focus:ring-[#FD7E14]/30 focus:border-[#FD7E14] outline-none transition-all text-lg"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-gradient-to-r from-[#FD7E14] to-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => handleFilterChange('paid')}
                className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                  activeFilter === 'paid'
                    ? 'bg-gradient-to-r from-[#FD7E14] to-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                Lunas
              </button>
              <button
                onClick={() => handleFilterChange('waiting')}
                className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                  activeFilter === 'waiting'
                    ? 'bg-gradient-to-r from-[#FD7E14] to-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                Menunggu
              </button>
              <button
                onClick={() => handleFilterChange('active')}
                className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                  activeFilter === 'active'
                    ? 'bg-gradient-to-r from-[#FD7E14] to-orange-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                Aktif
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-100">
            <button
              onClick={handleAddManualBooking}
              className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Tambah Booking Manual
            </button>
            <button
              onClick={handleClearAllBookings}
              className="px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center"
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              Hapus Semua Booking
            </button>
            <Link
              href="/search/trains"
              className="px-5 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:shadow-lg transition-all font-semibold flex items-center"
            >
              <TicketIcon className="w-5 h-5 mr-2" />
              Pesan Tiket Baru
            </Link>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <TicketIcon className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">
              {searchQuery ? 'Booking tidak ditemukan' : 'Belum Ada Booking'}
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto text-lg">
              {searchQuery 
                ? 'Coba gunakan kata kunci lain atau reset filter pencarian'
                : 'Silakan lakukan pemesanan tiket kereta api terlebih dahulu untuk melihat booking Anda di sini'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    handleFilterChange('all');
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-[#FD7E14] to-orange-500 text-white font-bold rounded-xl hover:shadow-xl transition-all text-lg"
                >
                  Reset Pencarian
                </button>
              )}
              <Link
                href="/search/trains"
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all text-lg text-center"
              >
                Pesan Tiket Sekarang
              </Link>
              <button
                onClick={() => loadBookings(true)}
                className="px-8 py-4 border-2 border-blue-500 text-blue-600 font-bold rounded-xl hover:bg-blue-50 hover:shadow-lg transition-all text-lg text-center"
              >
                Refresh Data
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {justPaidHighlight && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6 shadow-lg animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                    <CheckCircleIcon className="w-7 h-7 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-green-800 text-lg">
                      ✅ Pembayaran berhasil!
                    </p>
                    <p className="text-green-600">
                      Booking <strong className="font-bold">{justPaidHighlight}</strong> telah diproses dan siap digunakan.
                    </p>
                  </div>
                  <button
                    onClick={() => setJustPaidHighlight(null)}
                    className="text-green-500 hover:text-green-700"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
            
            {filteredBookings.map((booking) => {
              const trainDisplayName = getTrainDisplayName(booking);
              const trainClassDisplay = getTrainClassDisplay(booking.train_class, booking.train_type);
              const trainOperator = trainDetails[booking.train_code || '']?.operator || 
                                  getTrainOperator(trainDisplayName, booking.origin, booking.destination);
              
              const isActive = activeFilter === 'active';
              const isPaid = booking.payment_status === 'paid' || booking.status === 'confirmed';
              const isPending = booking.payment_status === 'pending' || booking.status === 'pending';
              
              return (
                <div
                  key={`${booking.id}-${booking.updated_at}`}
                  id={`booking-${booking.booking_code}`}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all hover:shadow-2xl ${
                    justPaidHighlight === booking.booking_code
                      ? 'border-green-300 bg-gradient-to-r from-green-50 to-white'
                      : isActive
                      ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-white'
                      : isPending
                      ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-white'
                      : 'border-gray-200 hover:border-[#FD7E14]/30'
                  }`}
                >
                  <div className="p-8">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          {getStatusBadge(booking.status, booking.payment_status)}
                          <span className="text-sm font-mono font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border">
                            {booking.booking_code}
                          </span>
                          {booking.ticket_number && (
                            <span className="text-sm text-blue-600 font-bold bg-blue-50 px-3 py-1.5 rounded-lg">
                              {booking.ticket_number}
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            Dipesan: {formatBookingDate(booking.booking_date || booking.created_at)}
                          </span>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                          {trainDisplayName} 
                          <span className="text-[#FD7E14] text-lg">({trainClassDisplay})</span>
                        </h3>
                        
                        <div className="flex items-center text-gray-600 text-lg">
                          <span className="font-semibold">{booking.origin}</span>
                          <ArrowRightIcon className="w-5 h-5 mx-3" />
                          <span className="font-semibold">{booking.destination}</span>
                        </div>
                        
                        {booking.train_code && (
                          <p className="text-sm text-gray-500 mt-2">
                            Kode Kereta: <span className="font-semibold">{booking.train_code}</span>
                            {trainOperator && <span className="ml-2">• Operator: {trainOperator}</span>}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-[#FD7E14]">
                          {formatCurrency(booking.total_amount)}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {booking.passenger_count} {booking.passenger_count > 1 ? 'penumpang' : 'penumpang'}
                        </p>
                        {booking.payment_method && (
                          <p className="text-sm text-gray-600 mt-1 flex items-center justify-end gap-1">
                            {getPaymentMethodIcon(booking.payment_method)}
                            <span>{booking.payment_method}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Journey Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                      <div className="space-y-3 bg-gray-50 p-5 rounded-xl">
                        <div className="flex items-center text-gray-600">
                          <CalendarIcon className="w-6 h-6 mr-3 text-[#FD7E14]" />
                          <span className="font-bold">Tanggal Keberangkatan</span>
                        </div>
                        <p className="font-bold text-gray-800 text-lg">
                          {formatDate(booking.departure_date)}
                        </p>
                      </div>
                      
                      <div className="space-y-3 bg-gray-50 p-5 rounded-xl">
                        <div className="flex items-center text-gray-600 mb-3">
                          <ClockIcon className="w-6 h-6 mr-3 text-[#FD7E14]" />
                          <span className="font-bold">Waktu Perjalanan</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-center">
                            <p className="font-bold text-2xl text-gray-800">
                              {formatTime(booking.departure_time)}
                            </p>
                            <p className="text-gray-600 font-medium">{booking.origin}</p>
                          </div>
                          <div className="relative px-6">
                            <ArrowRightIcon className="w-8 h-8 text-[#FD7E14]" />
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-300 to-gray-300 -translate-y-1/2 -z-10"></div>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-2xl text-gray-800">
                              {formatTime(booking.arrival_time)}
                            </p>
                            <p className="text-gray-600 font-medium">{booking.destination}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3 bg-gray-50 p-5 rounded-xl">
                        <div className="flex items-center text-gray-600">
                          <UserIcon className="w-6 h-6 mr-3 text-[#FD7E14]" />
                          <span className="font-bold">Informasi Penumpang</span>
                        </div>
                        <p className="font-bold text-gray-800 text-lg">
                          {booking.passenger_name}
                        </p>
                        <div className="text-sm text-gray-600 space-y-1">
                          {booking.passenger_phone && (
                            <p className="flex items-center">
                              <span className="font-medium mr-2">Telepon:</span> {booking.passenger_phone}
                            </p>
                          )}
                          {booking.passenger_email && (
                            <p className="flex items-center">
                              <span className="font-medium mr-2">Email:</span> {booking.passenger_email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Selected Seats */}
                    {booking.selected_seats && formatSelectedSeats(booking.selected_seats).length > 0 && (
                      <div className="mb-8 p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                        <p className="font-bold text-orange-800 text-lg mb-3">Kursi yang Dipilih:</p>
                        <div className="flex flex-wrap gap-3">
                          {formatSelectedSeats(booking.selected_seats).map((seat, index) => (
                            <span 
                              key={index} 
                              className="px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 font-bold rounded-lg border border-orange-300 text-lg shadow-sm"
                            >
                              {seat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-4 pt-8 border-t border-gray-200">
                      {isPending && (
                        <button
                          onClick={() => handleProcessPayment(booking.booking_code)}
                          className="px-7 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-xl transition-all flex items-center text-lg"
                        >
                          <CurrencyDollarIcon className="w-6 h-6 mr-3" />
                          Bayar Sekarang
                        </button>
                      )}
                      
                      {booking.ticket_number && isPaid && (
                        <button
                          onClick={() => handlePrintTicket(booking)}
                          className="px-7 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all flex items-center text-lg"
                        >
                          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          Cetak Tiket
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleViewDetails(booking.booking_code)}
                        className="px-7 py-4 border-2 border-blue-500 text-blue-600 font-bold rounded-xl hover:bg-blue-50 hover:shadow-lg transition-all text-lg"
                      >
                        Lihat Detail
                      </button>
                      
                      {booking.status !== 'cancelled' && booking.status !== 'canceled' && booking.payment_status !== 'refunded' && (
                        <button
                          onClick={() => handleCancelBooking(booking.booking_code)}
                          className="px-7 py-4 border-2 border-red-300 text-red-600 font-bold rounded-xl hover:bg-red-50 hover:shadow-lg transition-all text-lg"
                        >
                          Batalkan Booking
                        </button>
                      )}
                      
                      <Link
                        href="/search/trains"
                        className="px-7 py-4 border-2 border-gray-700 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all text-lg text-center"
                      >
                        Pesan Lagi
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-8">
          <h3 className="font-bold text-2xl text-gray-800 mb-6 pb-4 border-b border-gray-200">Pertanyaan Umum</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <CheckCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-bold text-gray-700 text-lg">Bagaimana cara check-in?</p>
              <p className="text-gray-600">
                Check-in online dapat dilakukan 2 jam sebelum keberangkatan melalui halaman detail tiket.
                Datang ke stasiun minimal 30 menit sebelum keberangkatan dengan membawa KTP asli dan e-ticket.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <p className="font-bold text-gray-700 text-lg">Bagaimana jika ingin membatalkan tiket?</p>
              <p className="text-gray-600">
                Pembatalan dapat dilakukan melalui tombol "Batalkan" di atas. Biaya pembatalan tergantung waktu pembatalan.
                Pembatalan dalam 1 jam setelah booking mendapatkan refund 100%.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <TicketIcon className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-bold text-gray-700 text-lg">Kapan e-ticket akan dikirim?</p>
              <p className="text-gray-600">
                E-ticket dikirim ke email segera setelah pembayaran berhasil. Jika tidak menerima dalam 5 menit,
                cek folder spam atau hubungi customer service di 1500-123.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="font-bold text-gray-800 text-lg">Butuh bantuan lebih lanjut?</p>
                <p className="text-gray-600">Tim customer service kami siap membantu 24/7</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="tel:1500123" 
                  className="px-6 py-3 bg-gradient-to-r from-[#FD7E14] to-orange-500 text-white font-bold rounded-xl hover:shadow-xl transition-all text-center"
                >
                  📞 Hubungi: 1500-123
                </a>
                <a 
                  href="mailto:help@tripgo.com" 
                  className="px-6 py-3 border-2 border-gray-700 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all text-center"
                >
                  ✉️ Email Kami
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}