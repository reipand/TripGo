// app/booking/[bookingCode]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  TicketIcon, 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  CheckCircleIcon,
  MapPinIcon,
  CreditCardIcon,
  ArrowLeftIcon,
  QrCodeIcon,
  PrinterIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface TransitInfo {
  station_name: string;
  arrival_time: string;
  departure_time: string;
  waiting_minutes: number;
  additional_price: number;
  discount: number;
}

interface Passenger {
  fullName: string;
  idNumber: string;
  email: string;
  phoneNumber: string;
  title: string;
  seatNumber: string;
  transit_station?: string;
  transit_arrival?: string;
  transit_departure?: string;
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
  selected_seats?: string | string[] | any[];
  has_ticket?: boolean;
  ticket_id?: string;
  
  // Transit fields
  transit?: TransitInfo;
  passengers?: Passenger[];
  fareBreakdown?: {
    base_fare: number;
    seat_premium: number;
    transit_discount: number;
    transit_additional: number;
    admin_fee: number;
    insurance_fee: number;
    payment_fee: number;
    promo_discount: number;
    subtotal: number;
    total: number;
  };
  seatPremium?: number;
  discountAmount?: number;
  transitDiscount?: number;
  transitAdditionalPrice?: number;
}

const formatSelectedSeats = (selectedSeats: any): string[] => {
  if (!selectedSeats) return [];
  
  if (typeof selectedSeats === 'string') {
    return selectedSeats.split(',').map((s: string) => s.trim()).filter(Boolean);
  }
  
  if (Array.isArray(selectedSeats)) {
    return selectedSeats.map(seat => {
      if (typeof seat === 'string') return seat;
      if (seat?.seatNumber) return seat.seatNumber;
      if (seat?.number) return seat.number;
      if (seat?.id) return String(seat.id);
      return String(seat);
    }).filter(Boolean);
  }
  
  if (typeof selectedSeats === 'object') {
    if (selectedSeats.seatNumber) return [selectedSeats.seatNumber];
    if (selectedSeats.number) return [selectedSeats.number];
    if (selectedSeats.id) return [String(selectedSeats.id)];
  }
  
  return [];
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingCode = params.bookingCode as string;
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTransitDetails, setShowTransitDetails] = useState(false);

  useEffect(() => {
    const loadBooking = () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load dari localStorage
        const savedBookings = localStorage.getItem('myBookings');
        const currentBooking = sessionStorage.getItem('currentBooking');
        const latestBooking = localStorage.getItem('latestBooking');
        
        let foundBooking: Booking | null = null;
        
        // Coba ambil dari savedBookings terlebih dahulu
        if (savedBookings) {
          const bookingsData: Booking[] = JSON.parse(savedBookings);
          foundBooking = bookingsData.find(b => b.booking_code === bookingCode) || null;
        }
        
        // Jika tidak ditemukan, coba dari currentBooking
        if (!foundBooking && currentBooking) {
          const bookingData = JSON.parse(currentBooking);
          if (bookingData.bookingCode === bookingCode) {
            foundBooking = {
              id: Date.now().toString(),
              booking_code: bookingData.bookingCode,
              order_id: bookingData.orderId || `ORDER-${Date.now()}`,
              passenger_name: bookingData.customerName || bookingData.name,
              passenger_email: bookingData.customerEmail || bookingData.email,
              passenger_phone: bookingData.customerPhone || bookingData.phone,
              train_name: bookingData.trainDetail?.trainName || 'Kereta Express',
              train_type: bookingData.trainDetail?.trainType || 'Executive',
              origin: bookingData.trainDetail?.origin || 'Stasiun A',
              destination: bookingData.trainDetail?.destination || 'Stasiun B',
              departure_date: bookingData.trainDetail?.departureDate || new Date().toISOString(),
              departure_time: bookingData.trainDetail?.departureTime || '08:00',
              arrival_time: bookingData.trainDetail?.arrivalTime || '12:00',
              total_amount: bookingData.totalAmount || 0,
              status: 'confirmed',
              payment_status: bookingData.paymentStatus || 'paid',
              payment_method: bookingData.paymentMethod,
              passenger_count: bookingData.passengerCount || 1,
              created_at: bookingData.bookingTime || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              selected_seats: bookingData.selectedSeats || [],
              transit: bookingData.transit,
              passengers: bookingData.passengers,
              fareBreakdown: bookingData.fareBreakdown
            };
          }
        }
        
        // Jika masih tidak ditemukan, coba dari latestBooking
        if (!foundBooking && latestBooking) {
          const bookingData = JSON.parse(latestBooking);
          if (bookingData.bookingCode === bookingCode) {
            foundBooking = {
              id: Date.now().toString(),
              booking_code: bookingData.bookingCode,
              order_id: bookingData.orderId || `ORDER-${Date.now()}`,
              passenger_name: bookingData.customerName || bookingData.name,
              passenger_email: bookingData.customerEmail || bookingData.email,
              passenger_phone: bookingData.customerPhone || bookingData.phone,
              train_name: bookingData.trainDetail?.trainName || 'Kereta Express',
              train_type: bookingData.trainDetail?.trainType || 'Executive',
              origin: bookingData.trainDetail?.origin || 'Stasiun A',
              destination: bookingData.trainDetail?.destination || 'Stasiun B',
              departure_date: bookingData.trainDetail?.departureDate || new Date().toISOString(),
              departure_time: bookingData.trainDetail?.departureTime || '08:00',
              arrival_time: bookingData.trainDetail?.arrivalTime || '12:00',
              total_amount: bookingData.totalAmount || 0,
              status: 'confirmed',
              payment_status: bookingData.paymentStatus || 'paid',
              payment_method: bookingData.paymentMethod,
              passenger_count: bookingData.passengerCount || 1,
              created_at: bookingData.bookingTime || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              selected_seats: bookingData.selectedSeats || [],
              transit: bookingData.transit,
              passengers: bookingData.passengers,
              fareBreakdown: bookingData.fareBreakdown
            };
          }
        }
        
        if (!foundBooking) {
          throw new Error(`Booking dengan kode ${bookingCode} tidak ditemukan`);
        }
        
        setBooking(foundBooking);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
        console.error('Error loading booking:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadBooking();
  }, [bookingCode]);

  const formatDate = (dateString: string) => {
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
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch (error) {
      return timeString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string, paymentStatus: string) => {
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
    } else if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          DIBATALKAN
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
          {status.toUpperCase()}
        </span>
      );
    }
  };

  const renderTransitInfo = () => {
    if (!booking?.transit) return null;

    const transit = booking.transit;
    
    return (
      <div className="mt-6 p-6 bg-purple-50 border border-purple-200 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ArrowPathIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold text-purple-800">Informasi Transit</h3>
              <p className="text-purple-600">Anda akan turun di stasiun transit</p>
            </div>
          </div>
          <button
            onClick={() => setShowTransitDetails(!showTransitDetails)}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium"
          >
            {showTransitDetails ? 'Sembunyikan' : 'Lihat Detail'}
          </button>
        </div>
        
        {showTransitDetails && (
          <div className="bg-white rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">Stasiun Transit</div>
                <div className="font-bold text-lg text-purple-700">{transit.station_name}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Tiba</div>
                <div className="font-bold text-lg text-gray-800">{formatTime(transit.arrival_time)}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Berangkat</div>
                <div className="font-bold text-lg text-gray-800">{formatTime(transit.departure_time)}</div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-sm text-gray-500">Rute Perjalanan</div>
                  <div className="flex items-center mt-2">
                    <span className="font-medium text-gray-700">{booking.origin}</span>
                    <ArrowRightIcon className="w-6 h-6 text-purple-500 mx-2" />
                    <span className="font-bold text-purple-700">{transit.station_name}</span>
                    <ArrowRightIcon className="w-6 h-6 text-purple-500 mx-2" />
                    <span className="font-medium text-gray-700">{booking.destination}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <span className="font-semibold">Perhatian:</span> Tiket hanya berlaku sampai {transit.station_name}. 
                Untuk melanjutkan perjalanan ke {booking.destination}, perlu membeli tiket baru.
              </p>
            </div>
          </div>
        )}
        
        {!showTransitDetails && (
          <div className="flex items-center justify-between">
            <div className="text-purple-700">
              <span className="font-medium">{transit.station_name}</span>
              <span className="text-sm ml-2">({transit.arrival_time} - {transit.departure_time})</span>
            </div>
            <div className="text-sm text-purple-600">
              Transit {transit.waiting_minutes} menit
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTransitPassengers = () => {
    if (!booking?.passengers || !booking.transit) return null;
    
    const transitPassengers = booking.passengers.filter(p => p.transit_station);
    
    if (transitPassengers.length === 0) return null;
    
    return (
      <div className="mt-4 p-4 bg-purple-50 rounded-lg">
        <h4 className="font-semibold text-purple-800 mb-2">Penumpang Transit</h4>
        <div className="space-y-2">
          {transitPassengers.map((passenger, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-gray-700">{passenger.fullName}</span>
                <span className="text-purple-600 ml-2">
                  (Turun di {passenger.transit_station})
                </span>
              </div>
              {passenger.seatNumber && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                  Kursi: {passenger.seatNumber}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDetailedFareBreakdown = () => {
    if (!booking?.fareBreakdown) return null;
    
    const breakdown = booking.fareBreakdown;
    
    return (
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-700 mb-3">Rincian Harga</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tiket dasar ({booking.passenger_count} orang)</span>
            <span className="font-medium">{formatCurrency(breakdown.base_fare)}</span>
          </div>
          
          {breakdown.seat_premium > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tambahan kursi premium</span>
              <span className="font-medium text-green-600">+{formatCurrency(breakdown.seat_premium)}</span>
            </div>
          )}
          
          {breakdown.transit_discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Diskon transit (10%)</span>
              <span className="font-medium text-red-600">-{formatCurrency(breakdown.transit_discount)}</span>
            </div>
          )}
          
          {breakdown.transit_additional > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Biaya tambahan transit</span>
              <span className="font-medium text-green-600">+{formatCurrency(breakdown.transit_additional)}</span>
            </div>
          )}
          
          {breakdown.promo_discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Diskon promo</span>
              <span className="font-medium text-red-600">-{formatCurrency(breakdown.promo_discount)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Biaya admin</span>
            <span className="font-medium">{formatCurrency(breakdown.admin_fee)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Asuransi perjalanan</span>
            <span className="font-medium">{formatCurrency(breakdown.insurance_fee)}</span>
          </div>
          
          {breakdown.payment_fee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Biaya pembayaran</span>
              <span className="font-medium">+{formatCurrency(breakdown.payment_fee)}</span>
            </div>
          )}
          
          <div className="border-t border-gray-300 pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span>Total Pembayaran</span>
              <span className="text-[#FD7E14]">{formatCurrency(breakdown.total)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handlePrintTicket = () => {
    if (!booking) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const transitInfo = booking.transit ? `
        <div class="section">
          <div class="label">Transit</div>
          <div class="value">
            ${booking.transit.station_name}<br>
            ${booking.transit.arrival_time} - ${booking.transit.departure_time}<br>
            <small>Tiket berlaku sampai stasiun ini</small>
          </div>
        </div>
      ` : '';
      
      const passengersList = booking.passengers ? booking.passengers.map(passenger => `
        <div style="border-bottom: 1px solid #eee; padding: 10px 0; margin: 10px 0;">
          <strong>${passenger.fullName}</strong><br>
          ${passenger.idNumber} • ${passenger.phoneNumber}
          ${passenger.transit_station ? `<br><small>Transit di: ${passenger.transit_station}</small>` : ''}
        </div>
      `).join('') : '';
      
      printWindow.document.write(`
        <html>
          <head>
            <title>E-Ticket ${booking.booking_code}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
              .ticket { border: 2px solid #333; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { color: #FD7E14; margin: 0; }
              .section { margin-bottom: 15px; }
              .label { font-weight: bold; color: #666; font-size: 12px; }
              .value { font-size: 16px; margin-top: 5px; }
              .divider { border-top: 1px dashed #ccc; margin: 20px 0; }
              .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 10px 0; }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h1>E-Ticket Kereta Api</h1>
                <h3>${booking.ticket_number || booking.booking_code}</h3>
              </div>
              
              <div class="section">
                <div class="label">Kode Booking</div>
                <div class="value">${booking.booking_code}</div>
              </div>
              
              <div class="section">
                <div class="label">Kereta</div>
                <div class="value">${booking.train_name} (${booking.train_type})</div>
              </div>
              
              <div class="section">
                <div class="label">Rute</div>
                <div class="value">${booking.origin} → ${booking.destination}</div>
              </div>
              
              ${transitInfo}
              
              <div class="section">
                <div class="label">Waktu Keberangkatan</div>
                <div class="value">
                  ${formatDate(booking.departure_date)} • ${booking.departure_time}
                </div>
              </div>
              
              <div class="section">
                <div class="label">Penumpang</div>
                <div class="value">
                  ${booking.passenger_name}<br>
                  ${booking.passenger_email}<br>
                  ${booking.passenger_phone}
                </div>
              </div>
              
              ${booking.selected_seats && formatSelectedSeats(booking.selected_seats).length > 0 ? `
              <div class="section">
                <div class="label">Kursi</div>
                <div class="value">${formatSelectedSeats(booking.selected_seats).join(', ')}</div>
              </div>
              ` : ''}
              
              ${booking.passengers ? `
              <div class="section">
                <div class="label">Daftar Penumpang</div>
                <div class="value">
                  ${passengersList}
                </div>
              </div>
              ` : ''}
              
              <div class="divider"></div>
              
              ${booking.transit ? `
              <div class="warning">
                <strong>⚠️ PERHATIAN: TIKET TRANSIT</strong><br>
                Tiket ini hanya berlaku sampai stasiun ${booking.transit.station_name}. 
                Untuk melanjutkan perjalanan ke ${booking.destination}, perlu membeli tiket baru di stasiun.
              </div>
              ` : ''}
              
              <div class="section">
                <p style="text-align: center; color: #666; font-size: 12px;">
                  Bawa print e-ticket ini dan KTP asli untuk check-in di stasiun.
                  Datang minimal 30 menit sebelum keberangkatan.
                </p>
              </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #FD7E14; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Cetak Tiket
              </button>
              <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; margin-left: 10px; cursor: pointer;">
                Tutup
              </button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCancelBooking = () => {
    if (!booking) return;
    
    if (confirm(`Apakah Anda yakin ingin membatalkan booking ${booking.booking_code}?`)) {
      try {
        const savedBookings = localStorage.getItem('myBookings');
        if (!savedBookings) return;
        
        const bookingsData: Booking[] = JSON.parse(savedBookings);
        const updatedBookings = bookingsData.map(b => {
          if (b.booking_code === booking.booking_code) {
            return { 
              ...b, 
              status: 'cancelled', 
              payment_status: 'refunded',
              updated_at: new Date().toISOString()
            };
          }
          return b;
        });
        
        localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
        setBooking({ 
          ...booking, 
          status: 'cancelled', 
          payment_status: 'refunded',
          updated_at: new Date().toISOString()
        });
        alert(`Booking ${booking.booking_code} berhasil dibatalkan.`);
      } catch (err) {
        alert('Gagal membatalkan booking.');
      }
    }
  };

  const handleContinueJourney = () => {
    if (!booking?.transit) return;
    
    router.push(`/search?from=${booking.transit.station_name}&to=${booking.destination}&date=${booking.departure_date}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail booking...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TicketIcon className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">{error || 'Data booking tidak tersedia'}</p>
            <div className="space-y-3">
              <Link
                href="/my-bookings"
                className="block w-full px-6 py-3 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors text-center"
              >
                Kembali ke Daftar Booking
              </Link>
              <Link
                href="/"
                className="block w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Pesan Tiket Baru
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/my-bookings"
            className="inline-flex items-center text-gray-600 hover:text-[#FD7E14] mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Kembali ke Daftar Booking
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Detail Booking</h1>
              <p className="text-gray-600">
                Kode Booking: <span className="font-mono font-medium">{booking.booking_code}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(booking.status, booking.payment_status)}
              {booking.transit && (
                <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                  <ArrowPathIcon className="w-4 h-4 mr-1" />
                  DENGAN TRANSIT
                </span>
              )}
              {booking.payment_status === 'pending' && (
                <button
                  onClick={() => {
                    alert(`Link pembayaran untuk ${booking.booking_code} akan dikirim ke email Anda`);
                    // Update status
                    const savedBookings = localStorage.getItem('myBookings');
                    if (savedBookings) {
                      const bookingsData: Booking[] = JSON.parse(savedBookings);
                      const updatedBookings = bookingsData.map(b => {
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
                      localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
                      setBooking({ 
                        ...booking, 
                        payment_status: 'paid', 
                        status: 'confirmed',
                        updated_at: new Date().toISOString()
                      });
                    }
                  }}
                  className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                >
                  Bayar Sekarang
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Informasi Transit */}
        {renderTransitInfo()}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Journey Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Journey Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Detail Perjalanan</h2>
                {booking.ticket_number && (
                  <span className="text-blue-600 font-medium">
                    Tiket: {booking.ticket_number}
                  </span>
                )}
              </div>
              
              <div className="space-y-6">
                {/* Train Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {booking.train_name} ({booking.train_type})
                  </h3>
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    <span>
                      {booking.origin} 
                      {booking.transit && (
                        <>
                          <ArrowRightIcon className="w-4 h-4 mx-2 inline" />
                          <span className="text-purple-600 font-medium">{booking.transit.station_name}</span>
                        </>
                      )}
                      <ArrowRightIcon className="w-4 h-4 mx-2 inline" />
                      {booking.destination}
                    </span>
                  </div>
                </div>
                
                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <CalendarIcon className="w-5 h-5 mr-2" />
                      <span className="font-medium">Tanggal Keberangkatan</span>
                    </div>
                    <p className="font-semibold text-gray-800 text-lg">
                      {formatDate(booking.departure_date)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-600">
                      <ClockIcon className="w-5 h-5 mr-2" />
                      <span className="font-medium">Waktu</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xl text-gray-800">{formatTime(booking.departure_time)}</p>
                        <p className="text-sm text-gray-600">{booking.origin}</p>
                      </div>
                      <div className="text-gray-400 mx-4">→</div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-gray-800">{formatTime(booking.arrival_time)}</p>
                        <p className="text-sm text-gray-600">{booking.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Selected Seats */}
                {booking.selected_seats && formatSelectedSeats(booking.selected_seats).length > 0 && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="font-medium text-orange-800 mb-2">Kursi yang Dipilih</p>
                    <div className="flex flex-wrap gap-2">
                      {formatSelectedSeats(booking.selected_seats).map((seat, index) => (
                        <span key={index} className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium">
                          {seat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Passenger Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Informasi Penumpang</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Kontak Utama</p>
                      <p className="font-semibold text-gray-800">{booking.passenger_name}</p>
                      <p className="text-sm text-gray-500">{booking.passenger_email} • {booking.passenger_phone}</p>
                    </div>
                    
                    {booking.passengers && booking.passengers.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Daftar Penumpang ({booking.passenger_count} orang)</p>
                        <div className="space-y-3">
                          {booking.passengers.map((passenger, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-800">{passenger.fullName}</p>
                                  <p className="text-sm text-gray-600">
                                    {passenger.idNumber} • {passenger.phoneNumber}
                                  </p>
                                  {passenger.transit_station && (
                                    <p className="text-sm text-purple-600 mt-1">
                                      🚉 Turun di: {passenger.transit_station}
                                    </p>
                                  )}
                                </div>
                                {passenger.seatNumber && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                    {passenger.seatNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Transit Passengers */}
                {renderTransitPassengers()}
              </div>
            </div>
            
            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Informasi Pembayaran</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Status Pembayaran</span>
                  <span className={`font-semibold ${
                    booking.payment_status === 'paid' ? 'text-green-600' :
                    booking.payment_status === 'pending' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {booking.payment_status === 'paid' ? 'LUNAS' :
                     booking.payment_status === 'pending' ? 'MENUNGGU PEMBAYARAN' :
                     booking.payment_status.toUpperCase()}
                  </span>
                </div>
                
                {booking.payment_method && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-gray-600">Metode Pembayaran</span>
                    <span className="font-semibold text-gray-800">
                      {booking.payment_method?.toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Total Pembayaran</span>
                  <span className="text-2xl font-bold text-[#FD7E14]">
                    {formatCurrency(booking.total_amount)}
                  </span>
                </div>
                
                {renderDetailedFareBreakdown()}
                
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Waktu Booking</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(booking.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Actions & QR Code */}
          <div className="space-y-6">
            {/* QR Code Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center mb-4">
                <QrCodeIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">QR Code Tiket</h3>
                <p className="text-sm text-gray-600 mt-1">Tunjukkan QR ini di stasiun</p>
              </div>
              
              <div className="bg-gray-100 p-4 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="w-48 h-48 bg-white border-4 border-gray-300 flex items-center justify-center mx-auto mb-3">
                    <div className="text-center">
                      <div className="font-mono font-bold text-lg mb-2">{booking.booking_code}</div>
                      <div className="text-xs text-gray-500">
                        {booking.train_name}<br/>
                        {booking.origin} → {booking.destination}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Check-in online akan tersedia 2 jam sebelum keberangkatan
                  </p>
                </div>
              </div>
              
              <button
                onClick={handlePrintTicket}
                className="w-full px-4 py-3 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors flex items-center justify-center"
              >
                <PrinterIcon className="w-5 h-5 mr-2" />
                Cetak E-Ticket
              </button>
              
              {/* Continue Journey Button for Transit */}
              {booking.transit && booking.status === 'confirmed' && (
                <button
                  onClick={handleContinueJourney}
                  className="w-full mt-3 px-4 py-3 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
                >
                  <ArrowRightIcon className="w-5 h-5 mr-2" />
                  Lanjutkan Perjalanan
                </button>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Aksi</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handlePrintTicket}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <PrinterIcon className="w-5 h-5 mr-2" />
                  Cetak Tiket
                </button>
                
                <button
                  onClick={() => {
                    const emailBody = `
Booking Details:
- Kode Booking: ${booking.booking_code}
- Tiket: ${booking.ticket_number || 'N/A'}
- Kereta: ${booking.train_name} (${booking.train_type})
- Rute: ${booking.origin} → ${booking.destination}
${booking.transit ? `- Transit: ${booking.transit.station_name}` : ''}
- Tanggal: ${formatDate(booking.departure_date)}
- Waktu: ${booking.departure_time} - ${booking.arrival_time}
- Total: ${formatCurrency(booking.total_amount)}

Tolong kirim detail booking ini ke email saya.

Terima kasih,
${booking.passenger_name}
${booking.passenger_phone}
                    `;
                    
                    window.open(`mailto:${booking.passenger_email}?subject=Booking Details - ${booking.booking_code}&body=${encodeURIComponent(emailBody)}`);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Minta Email Tiket
                </button>
                
                {booking.status !== 'cancelled' && (
                  <button
                    onClick={handleCancelBooking}
                    className="w-full px-4 py-3 border border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Batalkan Booking
                  </button>
                )}
                
                <Link
                  href="/my-bookings"
                  className="block w-full px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  Lihat Semua Booking
                </Link>
              </div>
            </div>
            
            {/* Help Info */}
            <div className={`rounded-xl p-6 ${booking.transit ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'}`}>
              <h3 className={`font-semibold mb-2 ${booking.transit ? 'text-purple-800' : 'text-blue-800'}`}>
                Informasi Penting
              </h3>
              <ul className={`space-y-2 text-sm ${booking.transit ? 'text-purple-700' : 'text-blue-700'}`}>
                {booking.transit && (
                  <li className="flex items-start">
                    <InformationCircleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      Tiket ini hanya berlaku sampai stasiun {booking.transit.station_name}.
                      Untuk melanjutkan perjalanan, perlu membeli tiket baru.
                    </span>
                  </li>
                )}
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Check-in online tersedia 2 jam sebelum keberangkatan</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Datang minimal 30 menit sebelum keberangkatan</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Bawa KTP asli dan e-ticket saat check-in</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Hubungi 1500-123 untuk bantuan</span>
                </li>
              </ul>
            </div>
            
            {/* Transit Assistance */}
            {booking.transit && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="font-semibold text-yellow-800 mb-2">Bantuan Transit</h3>
                <ul className="space-y-2 text-sm text-yellow-700">
                  <li className="flex items-start">
                    <InformationCircleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Stasiun transit menyediakan loket pembelian tiket lanjutan</span>
                  </li>
                  <li className="flex items-start">
                    <InformationCircleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Tanyakan informasi di petugas stasiun untuk kereta lanjutan</span>
                  </li>
                  <li className="flex items-start">
                    <InformationCircleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Perhatikan papan informasi untuk keberangkatan kereta lanjutan</span>
                  </li>
                </ul>
                <button
                  onClick={() => router.push('/help/transit')}
                  className="w-full mt-4 px-4 py-2 bg-yellow-100 text-yellow-800 font-medium rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                >
                  Pelajari Lebih Lanjut tentang Transit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}