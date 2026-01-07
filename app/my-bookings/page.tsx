// app/my-bookings/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  TrashIcon
} from '@heroicons/react/24/outline';

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
  booking_date?: string; // Tambahkan field untuk tanggal pemesanan
}

type FilterStatus = 'all' | 'paid' | 'waiting' | 'active' | 'completed';

// Fungsi helper untuk format seats dengan tipe yang lebih aman
const formatSelectedSeats = (selectedSeats: any): string[] => {
  if (!selectedSeats || selectedSeats === 'null' || selectedSeats === 'undefined') {
    return [];
  }
  
  try {
    // Jika sudah string array yang dipisah koma
    if (typeof selectedSeats === 'string') {
      if (selectedSeats.includes('[')) {
        // Jika string JSON
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
          // Jika parsing JSON gagal, anggap sebagai string biasa
          return selectedSeats.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
      }
      return selectedSeats.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    
    // Jika array
    if (Array.isArray(selectedSeats)) {
      return selectedSeats.map(seat => {
        if (typeof seat === 'string') return seat.trim();
        if (seat && typeof seat === 'object') {
          return seat.seatNumber || seat.number || seat.id || JSON.stringify(seat);
        }
        return String(seat).trim();
      }).filter(Boolean);
    }
    
    // Jika object
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

// Fungsi untuk mendapatkan tanggal realtime sesuai dengan pemesanan
const getRealtimeDepartureDate = (baseDate: string, bookingDate?: string): string => {
  try {
    // Jika bookingDate ada, gunakan itu sebagai referensi
    const referenceDate = bookingDate ? new Date(bookingDate) : new Date();
    const departureDate = new Date(baseDate);
    
    // Hitung selisih hari antara tanggal pemesanan dan tanggal keberangkatan pada data asli
    const originalBookingDate = bookingDate ? new Date(bookingDate) : new Date();
    const originalDepartureDate = new Date(baseDate);
    const diffTime = originalDepartureDate.getTime() - originalBookingDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Buat tanggal baru dengan selisih yang sama dari hari ini
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newDepartureDate = new Date(today);
    newDepartureDate.setDate(today.getDate() + diffDays);
    
    return newDepartureDate.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error calculating realtime date:', error);
    return baseDate;
  }
};

export default function MyBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [justPaidHighlight, setJustPaidHighlight] = useState<string | null>(null);

  // Check URL parameters for direct redirect from payment
  useEffect(() => {
    const justPaidFromUrl = searchParams.get('justPaid');
    const bookingCodeFromUrl = searchParams.get('bookingCode');
    
    if (justPaidFromUrl === 'true' && bookingCodeFromUrl) {
      setJustPaidHighlight(bookingCodeFromUrl);
      // Clean URL (remove query parameters)
      window.history.replaceState({}, '', '/my-bookings');
    }
  }, [searchParams]);

  // Load bookings dari localStorage dan sessionStorage
  useEffect(() => {
    const loadBookings = () => {
      try {
        setLoading(true);
        
        // Cek jika baru saja melakukan pembayaran dari sessionStorage
        const justPaid = sessionStorage.getItem('justPaid');
        const lastBookingCode = sessionStorage.getItem('lastBookingCode');
        
        if (justPaid === 'true' && lastBookingCode) {
          setJustPaidHighlight(lastBookingCode);
          // Clear session storage setelah digunakan
          sessionStorage.removeItem('justPaid');
          sessionStorage.removeItem('lastBookingCode');
          sessionStorage.removeItem('lastOrderId');
          
          // Remove highlight setelah 5 detik
          setTimeout(() => {
            setJustPaidHighlight(null);
          }, 5000);
        }
        
        // Load dari localStorage
        const savedBookings = localStorage.getItem('myBookings');
        let bookingsData: Booking[] = [];
        
        if (savedBookings) {
          const parsedBookings = JSON.parse(savedBookings);
          
          // Normalisasi data booking dan hilangkan duplikat berdasarkan booking_code
          const uniqueBookingsMap = new Map<string, Booking>();
          
          parsedBookings.forEach((booking: any) => {
            // Normalisasi selected_seats
            const normalizedSeatsArray = formatSelectedSeats(booking.selected_seats);
            
            // Gunakan booking_code sebagai key untuk mencegah duplikasi
            const bookingCode = booking.booking_code || booking.bookingCode || 'BOOK-UNKNOWN';
            
            // Konversi ke tanggal realtime
            const bookingDate = booking.created_at || booking.createdAt || booking.booking_date || new Date().toISOString();
            const realtimeDepartureDate = getRealtimeDepartureDate(
              booking.departure_date || booking.departureDate || new Date().toISOString().split('T')[0],
              bookingDate
            );
            
            const normalizedBooking: Booking = {
              id: booking.id || `booking-${Date.now()}`,
              booking_code: bookingCode,
              order_id: booking.order_id || booking.orderId || `ORDER-${Date.now()}`,
              ticket_number: booking.ticket_number || booking.ticketNumber || '',
              passenger_name: booking.passenger_name || booking.passengerName || booking.customerName || 'Penumpang',
              passenger_email: booking.passenger_email || booking.passengerEmail || booking.customerEmail || '',
              passenger_phone: booking.passenger_phone || booking.passengerPhone || booking.customerPhone || '',
              train_name: booking.train_name || booking.trainName || 'Kereta Api',
              train_class: booking.train_class || booking.trainClass || booking.train_type || 'Ekonomi',
              train_type: booking.train_type || booking.trainType || 'Ekonomi',
              origin: booking.origin || 'Stasiun A',
              destination: booking.destination || 'Stasiun B',
              departure_date: realtimeDepartureDate, // Gunakan tanggal yang sudah dikonversi ke realtime
              departure_time: booking.departure_time || booking.departureTime || '08:00',
              arrival_time: booking.arrival_time || booking.arrivalTime || '12:00',
              total_amount: booking.total_amount || booking.totalAmount || 0,
              status: booking.status || 'pending',
              payment_status: booking.payment_status || booking.paymentStatus || 'pending',
              payment_method: booking.payment_method || booking.paymentMethod,
              passenger_count: booking.passenger_count || booking.passengerCount || 1,
              created_at: bookingDate,
              updated_at: booking.updated_at || booking.updatedAt || new Date().toISOString(),
              selected_seats: normalizedSeatsArray,
              has_ticket: booking.has_ticket || booking.hasTicket || !!booking.ticket_number,
              ticket_id: booking.ticket_id || booking.ticketId,
              booking_date: bookingDate
            };
            
            // Gunakan booking_code sebagai key untuk mencegah duplikat
            if (!uniqueBookingsMap.has(bookingCode)) {
              uniqueBookingsMap.set(bookingCode, normalizedBooking);
            } else {
              // Jika sudah ada, pilih yang lebih baru berdasarkan created_at
              const existingBooking = uniqueBookingsMap.get(bookingCode)!;
              const existingDate = new Date(existingBooking.created_at);
              const newDate = new Date(normalizedBooking.created_at);
              
              if (newDate > existingDate) {
                uniqueBookingsMap.set(bookingCode, normalizedBooking);
              }
            }
          });
          
          bookingsData = Array.from(uniqueBookingsMap.values());
        }
        
        // Load dan proses latest booking jika ada
        const latestBooking = localStorage.getItem('latestBooking');
        if (latestBooking) {
          try {
            const newBooking = JSON.parse(latestBooking);
            
            // Cek apakah booking sudah ada berdasarkan booking_code
            const existingIndex = bookingsData.findIndex(b => 
              b.booking_code === newBooking.bookingCode
            );
            
            if (existingIndex !== -1) {
              // Jika sudah ada, hapus yang lama dan tambahkan yang baru
              bookingsData.splice(existingIndex, 1);
            }
            
            if (newBooking.bookingCode) {
              // Konversi latestBooking ke format Booking
              const seatsArray = formatSelectedSeats(newBooking.selectedSeats);
              const bookingDate = newBooking.bookingTime || new Date().toISOString();
              
              // Konversi ke tanggal realtime
              const realtimeDepartureDate = getRealtimeDepartureDate(
                newBooking.trainDetail?.departureDate || newBooking.departureDate || '2026-01-02',
                bookingDate
              );
              
              const booking: Booking = {
                id: newBooking.id || `booking-${Date.now()}`,
                booking_code: newBooking.bookingCode,
                order_id: newBooking.orderId || `ORDER-${Date.now()}`,
                ticket_number: newBooking.ticketNumber || `TICKET-${Date.now().toString().slice(-8)}`,
                passenger_name: newBooking.customerName || newBooking.passengerName || 'Reisan',
                passenger_email: newBooking.customerEmail || newBooking.passengerEmail || 'reisanadrefagt@gmail.com',
                passenger_phone: newBooking.customerPhone || newBooking.passengerPhone || '08453665664',
                train_name: newBooking.trainDetail?.trainName || newBooking.trainName || 'Parahyangan',
                train_class: newBooking.trainDetail?.trainClass || newBooking.trainClass || 'Executive',
                train_type: newBooking.trainDetail?.trainType || newBooking.trainType || 'Executive',
                origin: newBooking.trainDetail?.origin || newBooking.origin || 'Bandung',
                destination: newBooking.trainDetail?.destination || newBooking.destination || 'Gambir',
                departure_date: realtimeDepartureDate, // Gunakan tanggal realtime
                departure_time: newBooking.trainDetail?.departureTime || newBooking.departureTime || '05:00',
                arrival_time: newBooking.trainDetail?.arrivalTime || newBooking.arrivalTime || '10:00',
                total_amount: newBooking.totalAmount || 412500,
                status: newBooking.status || 'confirmed',
                payment_status: newBooking.paymentStatus || 'paid',
                payment_method: newBooking.paymentMethod || 'E-WALLET',
                passenger_count: newBooking.passengerCount || 1,
                created_at: bookingDate,
                updated_at: new Date().toISOString(),
                selected_seats: seatsArray,
                has_ticket: true,
                booking_date: bookingDate
              };
              
              // Tambahkan ke awal array
              bookingsData.unshift(booking);
            }
            
            // Clear latestBooking setelah diproses
            localStorage.removeItem('latestBooking');
            
          } catch (error) {
            console.error('Error parsing latest booking:', error);
            localStorage.removeItem('latestBooking');
          }
        }

        // Tambahkan data demo jika kosong
        if (bookingsData.length === 0) {
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          
          const demoBookingDate = new Date();
          demoBookingDate.setDate(today.getDate() - 2); // 2 hari yang lalu
          
          bookingsData = [
            {
              id: 'demo-1',
              booking_code: 'BOOK-206942-JUBG',
              order_id: 'ORDER-1767783206942-JUBG',
              ticket_number: 'TICKET-43328554',
              passenger_name: 'Reisan',
              passenger_email: 'reisanadrefagt@gmail.com',
              passenger_phone: '08453665664',
              train_name: 'Parahyangan',
              train_class: 'Executive',
              train_type: 'Executive',
              origin: 'Bandung',
              destination: 'Gambir',
              departure_date: tomorrow.toISOString().split('T')[0], // Besok
              departure_time: '05:00',
              arrival_time: '10:00',
              total_amount: 412500,
              status: 'confirmed',
              payment_status: 'paid',
              payment_method: 'E-WALLET',
              passenger_count: 1,
              created_at: demoBookingDate.toISOString(),
              updated_at: demoBookingDate.toISOString(),
              selected_seats: ['C2'],
              has_ticket: true,
              booking_date: demoBookingDate.toISOString()
            },
            {
              id: 'demo-2',
              booking_code: 'BOOK-012000-EBS0',
              order_id: 'ORDER-1767536012000-EBS0',
              ticket_number: 'TICKET-36149124',
              passenger_name: 'Reisan Adrefa',
              passenger_email: 'reisanadrefagt@gmail.com',
              passenger_phone: '08453535345',
              train_name: 'Parahyangan',
              train_class: 'Economy',
              train_type: 'Economy',
              origin: 'Bandung',
              destination: 'Gambir',
              departure_date: today.toISOString().split('T')[0], // Hari ini
              departure_time: '06:35',
              arrival_time: '11:35',
              total_amount: 149825,
              status: 'confirmed',
              payment_status: 'paid',
              payment_method: 'e-wallet',
              passenger_count: 1,
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 hari yang lalu
              updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              selected_seats: ['A1'],
              has_ticket: true,
              booking_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            }
          ];
        }
        
        // Urutkan berdasarkan tanggal keberangkatan (yang terdekat dulu)
        bookingsData.sort((a, b) => {
          const dateA = new Date(a.departure_date);
          const dateB = new Date(b.departure_date);
          return dateA.getTime() - dateB.getTime();
        });
        
        // Simpan kembali ke localStorage (dengan data yang sudah dinormalisasi)
        localStorage.setItem('myBookings', JSON.stringify(bookingsData));
        
        setBookings(bookingsData);
        applyFilter(activeFilter, bookingsData);
        
      } catch (error) {
        console.error('Error loading bookings:', error);
        // Set default empty array jika error
        setBookings([]);
        setFilteredBookings([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadBookings();
  }, [activeFilter]);

  // Apply filter dengan useCallback untuk optimasi
  const applyFilter = useCallback((filter: FilterStatus, bookingsList: Booking[]) => {
    if (filter === 'all') {
      setFilteredBookings([...bookingsList]);
      return;
    }
    
    const filtered = bookingsList.filter(booking => {
      switch (filter) {
        case 'paid':
          return booking.payment_status === 'paid' || booking.status === 'confirmed';
        case 'waiting':
          return booking.payment_status === 'pending' || booking.status === 'pending';
        case 'active':
          // Booking dengan tanggal hari ini atau besok sebagai "active"
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const bookingDate = new Date(booking.departure_date);
          bookingDate.setHours(0, 0, 0, 0);
          const diffTime = bookingDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 2;
        case 'completed':
          const today2 = new Date();
          today2.setHours(0, 0, 0, 0);
          const bookingDate2 = new Date(booking.departure_date);
          bookingDate2.setHours(0, 0, 0, 0);
          return bookingDate2 < today2 || booking.status === 'completed' || booking.status === 'expired';
        default:
          return true;
      }
    });
    
    setFilteredBookings(filtered);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((filter: FilterStatus) => {
    setActiveFilter(filter);
    applyFilter(filter, bookings);
  }, [applyFilter, bookings]);

  // Handle search dengan debounce
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
      return dateString;
    }
  }, []);

  const formatTime = useCallback((timeString: string) => {
    return timeString;
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
        return 'Hari ini';
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
      return dateString;
    }
  }, []);

  const getStatusBadge = useCallback((status: string, paymentStatus: string) => {
    if (paymentStatus === 'paid' || status === 'confirmed') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          LUNAS
        </span>
      );
    } else if (paymentStatus === 'pending' || status === 'pending') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          <ClockIcon className="w-4 h-4 mr-1" />
          MENUNGGU PEMBAYARAN
        </span>
      );
    } else if (status === 'cancelled' || status === 'canceled') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          <XCircleIcon className="w-4 h-4 mr-1" />
          DIBATALKAN
        </span>
      );
    } else if (status === 'completed' || status === 'expired') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
          SELESAI
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {status.toUpperCase()}
        </span>
      );
    }
  }, []);

  // Handle actions
  const handleViewDetails = useCallback((bookingCode: string) => {
    router.push(`/booking/${bookingCode}`);
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
                <div class="value">${booking.train_name} (${booking.train_class || booking.train_type})</div>
              </div>
              
              <div class="route">
                <div class="station">
                  <div class="time">${booking.departure_time}</div>
                  <div class="station-name">${booking.origin}</div>
                </div>
                <div class="arrow">→</div>
                <div class="station">
                  <div class="time">${booking.arrival_time}</div>
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
  }, [formatDate, formatCurrency]);

  const handleCancelBooking = useCallback((bookingCode: string) => {
    if (!confirm(`Apakah Anda yakin ingin membatalkan booking ${bookingCode}?`)) {
      return;
    }
    
    try {
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
      localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
      
      // Show success message
      alert(`Booking ${bookingCode} berhasil dibatalkan. Dana akan dikembalikan dalam 1-3 hari kerja.`);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Gagal membatalkan booking. Silakan coba lagi.');
    }
  }, [applyFilter, activeFilter, bookings]);

  const handleAddManualBooking = useCallback(() => {
    const bookingCode = prompt('Masukkan kode booking (contoh: BOOK-T71780-84FY):');
    if (!bookingCode || bookingCode.trim() === '') return;
    
    // Validasi format kode booking
    const cleanBookingCode = bookingCode.trim().toUpperCase();
    
    if (!cleanBookingCode.startsWith('BOOK-')) {
      if (!confirm('Format kode booking biasanya dimulai dengan "BOOK-". Tetap lanjutkan?')) {
        return;
      }
    }
    
    // Cek apakah sudah ada
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
      passenger_name: 'Penumpang',
      passenger_email: '',
      passenger_phone: '',
      train_name: 'Kereta Api',
      train_class: 'Ekonomi',
      train_type: 'Ekonomi',
      origin: 'Stasiun A',
      destination: 'Stasiun B',
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
    localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
    
    alert(`Booking ${cleanBookingCode} berhasil ditambahkan!`);
  }, [applyFilter, activeFilter, bookings]);

  const handleClearAllBookings = useCallback(() => {
    if (!confirm('Apakah Anda yakin ingin menghapus SEMUA booking? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }
    
    try {
      setBookings([]);
      setFilteredBookings([]);
      localStorage.removeItem('myBookings');
      localStorage.removeItem('latestBooking');
      sessionStorage.clear();
      alert('Semua booking telah dihapus.');
    } catch (error) {
      console.error('Error clearing bookings:', error);
      alert('Gagal menghapus booking. Silakan coba lagi.');
    }
  }, []);

  // Hitung statistik dengan useMemo untuk optimasi
  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const paidBookings = bookings.filter(b => b.payment_status === 'paid' || b.status === 'confirmed').length;
    const pendingBookings = bookings.filter(b => b.payment_status === 'pending' || b.status === 'pending').length;
    
    return { totalBookings, paidBookings, pendingBookings };
  }, [bookings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FD7E14] mx-auto mb-6"></div>
          <p className="text-gray-600 font-medium">Memuat data booking Anda...</p>
          <p className="text-sm text-gray-500 mt-2">Harap tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-6xl">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <p className="text-sm text-gray-500">Menunggu Pembayaran</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.pendingBookings}
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
              href="/"
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
                href="/"
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all text-lg text-center"
              >
                Pesan Tiket Sekarang
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {justPaidHighlight && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6 shadow-lg">
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
              // Cek apakah booking ini adalah duplikat
              const isDuplicate = filteredBookings.filter(b => 
                b.booking_code === booking.booking_code
              ).length > 1;
              
              return (
                <div
                  key={`${booking.id}-${booking.updated_at}`}
                  id={`booking-${booking.booking_code}`}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 transition-all hover:shadow-2xl ${
                    justPaidHighlight === booking.booking_code
                      ? 'border-green-300 bg-gradient-to-r from-green-50 to-white animate-pulse'
                      : isDuplicate
                      ? 'border-red-300 bg-gradient-to-r from-red-50 to-white'
                      : 'border-gray-200 hover:border-[#FD7E14]/30'
                  }`}
                >
                  {isDuplicate && (
                    <div className="bg-red-100 text-red-800 px-4 py-2 text-sm font-medium text-center">
                      ⚠️ Booking ini mungkin duplikat
                    </div>
                  )}
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
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          {booking.train_name} <span className="text-[#FD7E14]">({booking.train_class || booking.train_type})</span>
                        </h3>
                        <div className="flex items-center text-gray-600 text-lg">
                          <span className="font-semibold">{booking.origin}</span>
                          <ArrowRightIcon className="w-5 h-5 mx-3" />
                          <span className="font-semibold">{booking.destination}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-[#FD7E14]">
                          {formatCurrency(booking.total_amount)}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {booking.passenger_count} {booking.passenger_count > 1 ? 'penumpang' : 'penumpang'}
                        </p>
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
                      {booking.payment_status === 'pending' && (
                        <button
                          onClick={() => {
                            if (confirm(`Kirim link pembayaran untuk ${booking.booking_code} ke email ${booking.passenger_email || 'Anda'}?`)) {
                              // Simulasi update status setelah "pembayaran"
                              const updatedBookings = bookings.map(b => {
                                if (b.booking_code === booking.booking_code) {
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
                              localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
                              alert('Link pembayaran telah dikirim ke email Anda. Status booking diperbarui menjadi LUNAS.');
                            }
                          }}
                          className="px-7 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-xl transition-all flex items-center text-lg"
                        >
                          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Bayar Sekarang
                        </button>
                      )}
                      
                      {booking.ticket_number && (booking.payment_status === 'paid' || booking.status === 'confirmed') && (
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
                      
                      {booking.status !== 'cancelled' && booking.status !== 'canceled' && (
                        <button
                          onClick={() => handleCancelBooking(booking.booking_code)}
                          className="px-7 py-4 border-2 border-red-300 text-red-600 font-bold rounded-xl hover:bg-red-50 hover:shadow-lg transition-all text-lg"
                        >
                          Batalkan Booking
                        </button>
                      )}
                      
                      <Link
                        href="/"
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
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-bold text-gray-700 text-lg">Bagaimana cara check-in?</p>
              <p className="text-gray-600">
                Check-in online dapat dilakukan 2 jam sebelum keberangkatan melalui halaman detail tiket.
                Datang ke stasiun minimal 30 menit sebelum keberangkatan dengan membawa KTP asli dan e-ticket.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-bold text-gray-700 text-lg">Bagaimana jika ingin membatalkan tiket?</p>
              <p className="text-gray-600">
                Pembatalan dapat dilakukan melalui tombol "Batalkan" di atas. Biaya pembatalan tergantung waktu pembatalan.
                Pembatalan dalam 1 jam setelah booking mendapatkan refund 100%.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
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