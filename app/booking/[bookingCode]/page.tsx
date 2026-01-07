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
  PrinterIcon
} from '@heroicons/react/24/outline';

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

  useEffect(() => {
    const loadBooking = () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load dari localStorage
        const savedBookings = localStorage.getItem('myBookings');
        if (!savedBookings) {
          throw new Error('Data booking tidak ditemukan');
        }
        
        const bookingsData: Booking[] = JSON.parse(savedBookings);
        const foundBooking = bookingsData.find(b => b.booking_code === bookingCode);
        
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

  const handlePrintTicket = () => {
    if (!booking?.ticket_number) {
      alert('Tiket belum tersedia untuk booking ini');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow && booking) {
      printWindow.document.write(`
        <html>
          <head>
            <title>E-Ticket ${booking.ticket_number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
              .ticket { border: 2px solid #333; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .header h1 { color: #FD7E14; margin: 0; }
              .section { margin-bottom: 15px; }
              .label { font-weight: bold; color: #666; font-size: 12px; }
              .value { font-size: 16px; margin-top: 5px; }
              .divider { border-top: 1px dashed #ccc; margin: 20px 0; }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h1>E-Ticket Kereta Api</h1>
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
                <div class="value">${booking.train_name} (${booking.train_type})</div>
              </div>
              
              <div class="section">
                <div class="label">Rute</div>
                <div class="value">${booking.origin} → ${booking.destination}</div>
              </div>
              
              <div class="section">
                <div class="label">Waktu Keberangkatan</div>
                <div class="value">
                  ${formatDate(booking.departure_date)} • ${booking.departure_time}
                </div>
              </div>
              
              ${booking.selected_seats && formatSelectedSeats(booking.selected_seats).length > 0 ? `
              <div class="section">
                <div class="label">Kursi</div>
                <div class="value">${formatSelectedSeats(booking.selected_seats).join(', ')}</div>
              </div>
              ` : ''}
              
              <div class="divider"></div>
              
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
            return { ...b, status: 'cancelled', payment_status: 'refunded' };
          }
          return b;
        });
        
        localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
        setBooking({ ...booking, status: 'cancelled', payment_status: 'refunded' });
        alert(`Booking ${booking.booking_code} berhasil dibatalkan.`);
      } catch (err) {
        alert('Gagal membatalkan booking.');
      }
    }
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
      <div className="container mx-auto px-4 max-w-4xl">
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
                          return { ...b, payment_status: 'paid', status: 'confirmed' };
                        }
                        return b;
                      });
                      localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
                      setBooking({ ...booking, payment_status: 'paid', status: 'confirmed' });
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
                    <span>{booking.origin} → {booking.destination}</span>
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
                        <p className="font-bold text-xl text-gray-800">{booking.departure_time}</p>
                        <p className="text-sm text-gray-600">{booking.origin}</p>
                      </div>
                      <div className="text-gray-400 mx-4">→</div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-gray-800">{booking.arrival_time}</p>
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
                      <p className="text-sm text-gray-600">Nama Lengkap</p>
                      <p className="font-semibold text-gray-800">{booking.passenger_name}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-800">{booking.passenger_email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Telepon</p>
                        <p className="font-semibold text-gray-800">{booking.passenger_phone}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Jumlah Penumpang</p>
                      <p className="font-semibold text-gray-800">{booking.passenger_count} orang</p>
                    </div>
                  </div>
                </div>
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
                      {booking.payment_method.toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="text-gray-600">Total Pembayaran</span>
                  <span className="text-2xl font-bold text-[#FD7E14]">
                    {formatCurrency(booking.total_amount)}
                  </span>
                </div>
                
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
                    <span className="text-gray-500 text-sm">QR Code akan muncul setelah check-in</span>
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
                    // Simulasi kirim email
                    alert(`E-ticket telah dikirim ke ${booking.passenger_email}`);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Kirim ke Email
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
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-800 mb-2">Informasi Penting</h3>
              <ul className="space-y-2 text-sm text-blue-700">
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
          </div>
        </div>
      </div>
    </div>
  );
}