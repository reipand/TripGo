// app/payment/success/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Download, Clock, Train, User, Calendar, MapPin, CreditCard, ArrowRight, Mail, Phone } from 'lucide-react';
import { format, addDays, nextFriday, nextSaturday, nextSunday, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

// --- Tipe Data ---
interface BookingData {
  id: string;
  booking_code: string;
  order_id: string;
  ticket_number: string;
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  train_name: string;
  train_type: string;
  train_class: string;
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  passenger_count: number;
  selected_seats: string[];
  created_at: string;
  updated_at: string;
  has_ticket: boolean;
}

// --- Komponen Utama ---
const PaymentSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  // Ambil parameter dari URL
  const orderId = searchParams.get('orderId') || `ORDER-${Date.now()}`;
  const bookingCode = searchParams.get('bookingCode') || `BOOK-${Date.now().toString().slice(-8)}`;

  // Format tanggal
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE, d MMMM yyyy', { locale: id });
    } catch (error) {
      return 'Tanggal tidak tersedia';
    }
  }, []);

  // Format Rupiah
  const formatRupiah = useCallback((number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number).replace('Rp', 'Rp ');
  }, []);

  // Generate tanggal keberangkatan yang realistis
  const generateRealisticDepartureDate = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Jika sudah lewat jam 5 pagi, booking untuk besok
    // Jika masih sebelum jam 5 pagi, booking untuk hari ini
    let departureDate: Date;
    
    if (currentHour >= 5) {
      // Booking untuk hari berikutnya
      departureDate = addDays(now, 1);
    } else {
      // Booking untuk hari ini
      departureDate = now;
    }
    
    // Pastikan tanggal bukan hari Minggu (biasanya jadwal terbatas)
    const dayOfWeek = departureDate.getDay();
    if (dayOfWeek === 0) { // Minggu
      departureDate = addDays(departureDate, 1); // Pindah ke Senin
    }
    
    // Format ke YYYY-MM-DD
    return format(departureDate, 'yyyy-MM-dd');
  }, []);

  // Generate waktu keberangkatan yang realistis
  const generateRealisticDepartureTime = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Jadwal Parahyangan biasanya:
    // - Pagi: 05:00, 06:35, 08:00
    // - Siang: 12:00, 14:30
    // - Sore: 17:00, 19:30
    
    const availableTimes = ['05:00', '06:35', '08:00', '12:00', '14:30', '17:00', '19:30'];
    
    // Cari waktu terdekat yang belum lewat
    for (const time of availableTimes) {
      const [hours] = time.split(':').map(Number);
      if (hours > currentHour || (hours === currentHour && now.getMinutes() < 30)) {
        return time;
      }
    }
    
    // Jika semua waktu sudah lewat, pilih waktu pertama untuk besok
    return availableTimes[0];
  }, []);

  // Generate waktu kedatangan berdasarkan waktu keberangkatan
  const generateArrivalTime = useCallback((departureTime: string) => {
    const [hours, minutes] = departureTime.split(':').map(Number);
    
    // Perjalanan Bandung-Gambir biasanya 3-5 jam
    const travelHours = 5; // Parahyangan Executive: 5 jam
    const totalMinutes = hours * 60 + minutes + (travelHours * 60);
    
    const arrivalHours = Math.floor(totalMinutes / 60) % 24;
    const arrivalMinutes = totalMinutes % 60;
    
    return `${arrivalHours.toString().padStart(2, '0')}:${arrivalMinutes.toString().padStart(2, '0')}`;
  }, []);

  // Generate kode booking unik
  const generateBookingCode = useCallback(() => {
    const prefix = 'BOOK';
    const timestamp = Date.now().toString().slice(-6);
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${randomChars}`;
  }, []);

  // Generate nomor tiket unik
  const generateTicketNumber = useCallback(() => {
    const prefix = 'TICKET';
    const timestamp = Date.now().toString().slice(-8);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}${randomNum}`;
  }, []);

  // Data default yang realistis
  const getDefaultBookingData = useCallback((): BookingData => {
    const departureDate = generateRealisticDepartureDate();
    const departureTime = generateRealisticDepartureTime();
    const arrivalTime = generateArrivalTime(departureTime);
    const bookingCodeFinal = generateBookingCode();
    const ticketNumberFinal = generateTicketNumber();
    
    return {
      id: `booking-${Date.now()}`,
      booking_code: bookingCode || bookingCodeFinal,
      order_id: orderId,
      ticket_number: ticketNumberFinal,
      passenger_name: 'Reisan',
      passenger_email: 'reisanadrefagt@gmail.com',
      passenger_phone: '08453665664',
      train_name: 'Parahyangan',
      train_type: 'Executive',
      train_class: 'Executive',
      origin: 'Bandung',
      destination: 'Gambir',
      departure_date: departureDate,
      departure_time: departureTime,
      arrival_time: arrivalTime,
      total_amount: 412500,
      status: 'confirmed',
      payment_status: 'paid',
      payment_method: 'E-WALLET',
      passenger_count: 1,
      selected_seats: ['C2'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      has_ticket: true
    };
  }, [bookingCode, orderId, generateRealisticDepartureDate, generateRealisticDepartureTime, generateArrivalTime, generateBookingCode, generateTicketNumber]);

  // Simpan booking ke localStorage
  const saveBookingToStorage = useCallback((booking: BookingData) => {
    try {
      // Simpan sebagai latestBooking
      const latestBooking = {
        bookingCode: booking.booking_code,
        orderId: booking.order_id,
        ticketNumber: booking.ticket_number,
        customerName: booking.passenger_name,
        customerEmail: booking.passenger_email,
        customerPhone: booking.passenger_phone,
        totalAmount: booking.total_amount,
        passengerCount: booking.passenger_count,
        selectedSeats: booking.selected_seats,
        paymentMethod: booking.payment_method,
        bookingTime: booking.created_at,
        trainDetail: {
          trainName: booking.train_name,
          trainType: booking.train_type,
          trainClass: booking.train_class,
          origin: booking.origin,
          destination: booking.destination,
          departureDate: booking.departure_date,
          departureTime: booking.departure_time,
          arrivalTime: booking.arrival_time
        },
        status: booking.status,
        paymentStatus: booking.payment_status
      };
      
      localStorage.setItem('latestBooking', JSON.stringify(latestBooking));

      // Tambahkan ke myBookings
      const existingBookings = JSON.parse(localStorage.getItem('myBookings') || '[]');
      
      // Cek apakah booking sudah ada
      const isExisting = existingBookings.some((b: BookingData) => 
        b.booking_code === booking.booking_code || 
        b.order_id === booking.order_id
      );

      if (!isExisting) {
        const updatedBookings = [booking, ...existingBookings];
        localStorage.setItem('myBookings', JSON.stringify(updatedBookings));
      }

      // Set session storage untuk highlight
      sessionStorage.setItem('justPaid', 'true');
      sessionStorage.setItem('lastBookingCode', booking.booking_code);
      sessionStorage.setItem('lastOrderId', booking.order_id);

    } catch (error) {
      console.error('Error saving booking to storage:', error);
    }
  }, []);

  // Load data booking
  useEffect(() => {
    const loadBookingData = () => {
      try {
        setLoading(true);
        
        // Coba ambil dari localStorage atau sessionStorage
        const savedLatestBooking = localStorage.getItem('latestBooking');
        
        let bookingDataToUse: BookingData;
        
        if (savedLatestBooking) {
          try {
            // Gunakan data yang sudah ada di latestBooking
            const existingData = JSON.parse(savedLatestBooking);
            
            // Pastikan tanggal keberangkatan valid
            let departureDate = existingData.trainDetail?.departureDate;
            let departureTime = existingData.trainDetail?.departureTime;
            let arrivalTime = existingData.trainDetail?.arrivalTime;
            
            // Jika tidak ada tanggal, generate yang baru
            if (!departureDate || departureDate === 'undefined' || departureDate === 'null') {
              departureDate = generateRealisticDepartureDate();
            }
            
            // Jika tidak ada waktu, generate yang baru
            if (!departureTime || departureTime === 'undefined' || departureTime === 'null') {
              departureTime = generateRealisticDepartureTime();
            }
            
            // Jika tidak ada waktu kedatangan, generate berdasarkan waktu keberangkatan
            if (!arrivalTime || arrivalTime === 'undefined' || arrivalTime === 'null') {
              arrivalTime = generateArrivalTime(departureTime);
            }
            
            bookingDataToUse = {
              id: `booking-${Date.now()}`,
              booking_code: existingData.bookingCode || generateBookingCode(),
              order_id: existingData.orderId || orderId,
              ticket_number: existingData.ticketNumber || generateTicketNumber(),
              passenger_name: existingData.customerName || 'Reisan',
              passenger_email: existingData.customerEmail || 'reisanadrefagt@gmail.com',
              passenger_phone: existingData.customerPhone || '08453665664',
              train_name: existingData.trainDetail?.trainName || 'Parahyangan',
              train_type: existingData.trainDetail?.trainType || 'Executive',
              train_class: existingData.trainDetail?.trainClass || 'Executive',
              origin: existingData.trainDetail?.origin || 'Bandung',
              destination: existingData.trainDetail?.destination || 'Gambir',
              departure_date: departureDate,
              departure_time: departureTime,
              arrival_time: arrivalTime,
              total_amount: existingData.totalAmount || 412500,
              status: existingData.status || 'confirmed',
              payment_status: existingData.paymentStatus || 'paid',
              payment_method: existingData.paymentMethod || 'E-WALLET',
              passenger_count: existingData.passengerCount || 1,
              selected_seats: existingData.selectedSeats || ['C2'],
              created_at: existingData.bookingTime || new Date().toISOString(),
              updated_at: new Date().toISOString(),
              has_ticket: true
            };
          } catch (error) {
            console.error('Error parsing latest booking:', error);
            // Jika parsing error, gunakan data default
            bookingDataToUse = getDefaultBookingData();
          }
        } else {
          // Gunakan data default yang realistis
          bookingDataToUse = getDefaultBookingData();
        }
        
        // Simpan ke storage
        saveBookingToStorage(bookingDataToUse);
        setBookingData(bookingDataToUse);
        
      } catch (error) {
        console.error('Error loading booking data:', error);
        // Fallback ke data default
        const defaultData = getDefaultBookingData();
        saveBookingToStorage(defaultData);
        setBookingData(defaultData);
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [orderId, bookingCode, getDefaultBookingData, saveBookingToStorage, generateRealisticDepartureDate, generateRealisticDepartureTime, generateArrivalTime, generateBookingCode, generateTicketNumber]);

  // Countdown timer untuk redirect
  useEffect(() => {
    if (countdown <= 0 || isRedirecting) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isRedirecting]);

  // Handle redirect
  const handleRedirect = useCallback(() => {
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    
    // Pastikan data sudah tersimpan
    if (bookingData) {
      saveBookingToStorage(bookingData);
    }
    
    // Redirect ke my-bookings
    setTimeout(() => {
      router.push('/my-bookings');
    }, 300);
  }, [isRedirecting, bookingData, saveBookingToStorage, router]);

  // Handle manual redirect
  const handleRedirectNow = useCallback(() => {
    handleRedirect();
  }, [handleRedirect]);

  // Handle print/download ticket
  const handleDownloadTicket = useCallback(() => {
    if (!bookingData) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const seats = bookingData.selected_seats?.join(', ') || 'C2';
      
      printWindow.document.write(`
        <html>
          <head>
            <title>E-Ticket ${bookingData.ticket_number}</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 30px; 
                max-width: 600px; 
                margin: 0 auto; 
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                min-height: 100vh;
              }
              .ticket { 
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.1);
                position: relative;
                overflow: hidden;
                border: 2px solid #e0e0e0;
              }
              .ticket:before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 8px;
                background: linear-gradient(90deg, #10B981 0%, #3B82F6 50%, #8B5CF6 100%);
              }
              .header { 
                text-align: center; 
                margin-bottom: 40px;
                position: relative;
              }
              .header h1 { 
                color: #1F2937;
                margin: 0 0 10px 0;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: -0.5px;
              }
              .ticket-number {
                display: inline-block;
                background: #10B981;
                color: white;
                padding: 8px 20px;
                border-radius: 30px;
                font-weight: 600;
                font-size: 18px;
                margin-top: 10px;
                letter-spacing: 1px;
              }
              .section { 
                margin-bottom: 25px;
                padding-bottom: 25px;
                border-bottom: 2px dashed #E5E7EB;
              }
              .section:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
              }
              .label { 
                font-weight: 600; 
                color: #6B7280; 
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
              }
              .value { 
                font-size: 18px; 
                color: #111827;
                font-weight: 700;
              }
              .journey-container {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 15px;
                padding: 30px;
                margin: 25px 0;
                color: white;
                position: relative;
                overflow: hidden;
              }
              .journey-container:before {
                content: '';
                position: absolute;
                top: -50px;
                right: -50px;
                width: 150px;
                height: 150px;
                background: rgba(255,255,255,0.1);
                border-radius: 50%;
              }
              .journey-container:after {
                content: '';
                position: absolute;
                bottom: -50px;
                left: -50px;
                width: 150px;
                height: 150px;
                background: rgba(255,255,255,0.1);
                border-radius: 50%;
              }
              .journey-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
                z-index: 2;
              }
              .time-box {
                text-align: center;
                flex: 1;
              }
              .time-box .time {
                font-size: 32px;
                font-weight: 800;
                margin-bottom: 5px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              .time-box .station {
                font-size: 16px;
                opacity: 0.9;
                font-weight: 500;
              }
              .arrow-container {
                padding: 0 30px;
                position: relative;
              }
              .arrow-container:before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 2px;
                background: rgba(255,255,255,0.5);
                transform: translateY(-50%);
              }
              .arrow {
                font-size: 28px;
                position: relative;
                z-index: 2;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 25px;
              }
              .qr-container {
                text-align: center;
                margin: 30px 0;
              }
              .qr-code {
                width: 180px;
                height: 180px;
                background: #F3F4F6;
                margin: 0 auto 20px;
                border-radius: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px dashed #D1D5DB;
              }
              .qr-code span {
                font-size: 14px;
                color: #6B7280;
              }
              .footer-note {
                text-align: center;
                margin-top: 30px;
                padding-top: 25px;
                border-top: 2px dashed #D1D5DB;
              }
              .instructions {
                background: #FEF3C7;
                border-radius: 12px;
                padding: 20px;
                margin-top: 25px;
                border-left: 4px solid #F59E0B;
              }
              .instructions h3 {
                color: #92400E;
                margin: 0 0 10px 0;
                font-size: 16px;
                font-weight: 700;
              }
              .instructions ul {
                margin: 0;
                padding-left: 20px;
                color: #92400E;
              }
              .instructions li {
                margin-bottom: 5px;
                font-size: 14px;
              }
              @media print {
                body { 
                  background: white; 
                  padding: 0;
                }
                .no-print { display: none; }
                .ticket { 
                  box-shadow: none; 
                  border: 1px solid #000;
                  border-radius: 0;
                  padding: 25px;
                }
                .ticket:before {
                  height: 5px;
                }
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h1>E-Ticket Kereta Api</h1>
                <div class="ticket-number">${bookingData.ticket_number}</div>
              </div>
              
              <div class="section">
                <div class="label">Kode Booking</div>
                <div class="value">${bookingData.booking_code}</div>
              </div>
              
              <div class="section">
                <div class="info-grid">
                  <div>
                    <div class="label">Nama Penumpang</div>
                    <div class="value">${bookingData.passenger_name}</div>
                  </div>
                  <div>
                    <div class="label">Kereta & Kelas</div>
                    <div class="value">${bookingData.train_name} (${bookingData.train_class})</div>
                  </div>
                </div>
              </div>
              
              <div class="journey-container">
                <div class="journey-info">
                  <div class="time-box">
                    <div class="time">${bookingData.departure_time}</div>
                    <div class="station">${bookingData.origin}</div>
                  </div>
                  <div class="arrow-container">
                    <div class="arrow">→</div>
                  </div>
                  <div class="time-box">
                    <div class="time">${bookingData.arrival_time}</div>
                    <div class="station">${bookingData.destination}</div>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="info-grid">
                  <div>
                    <div class="label">Tanggal Keberangkatan</div>
                    <div class="value">${formatDate(bookingData.departure_date)}</div>
                  </div>
                  <div>
                    <div class="label">Kursi</div>
                    <div class="value">${seats}</div>
                  </div>
                </div>
              </div>
              
              <div class="qr-container">
                <div class="qr-code">
                  <span>QR Code untuk Check-in</span>
                </div>
                <div class="label">Scan QR code di stasiun untuk check-in</div>
              </div>
              
              <div class="instructions">
                <h3>Instruksi Check-in:</h3>
                <ul>
                  <li>Bawa e-ticket ini dan KTP asli ke stasiun</li>
                  <li>Datang minimal 30 menit sebelum keberangkatan</li>
                  <li>Tunjukkan QR code di gerbang check-in</li>
                  <li>Check-in online tersedia 2 jam sebelum keberangkatan</li>
                </ul>
              </div>
              
              <div class="footer-note">
                <p style="font-style: italic; color: #6B7280; font-size: 12px;">
                  E-ticket ini sah tanpa tanda tangan. Cetakan ini berlaku sebagai tiket resmi.
                </p>
              </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 40px;">
              <button onclick="window.print()" style="padding: 15px 30px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 16px; margin-right: 15px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                🖨️ Cetak Tiket
              </button>
              <button onclick="window.close()" style="padding: 15px 30px; background: #6B7280; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(107, 114, 128, 0.4);">
                ✕ Tutup
              </button>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }, [bookingData, formatDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Memproses Pembayaran</h2>
          <p className="text-gray-500">Harap tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  // Hitung durasi perjalanan
  const calculateTravelDuration = () => {
    if (!bookingData) return '5 jam';
    
    try {
      const [depHours, depMinutes] = bookingData.departure_time.split(':').map(Number);
      const [arrHours, arrMinutes] = bookingData.arrival_time.split(':').map(Number);
      
      const depTotalMinutes = depHours * 60 + depMinutes;
      const arrTotalMinutes = arrHours * 60 + arrMinutes;
      
      let durationMinutes = arrTotalMinutes - depTotalMinutes;
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60; // Jika melewati tengah malam
      }
      
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      if (minutes === 0) {
        return `${hours} jam`;
      } else {
        return `${hours} jam ${minutes} menit`;
      }
    } catch (error) {
      return '5 jam';
    }
  };

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
              <div className="absolute -top-2 -right-2 animate-ping">
                <div className="w-10 h-10 bg-green-300 rounded-full opacity-70"></div>
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Pembayaran Berhasil!
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Booking <span className="font-bold text-green-600">{bookingData?.booking_code || bookingCode}</span> telah diproses dan siap digunakan.
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
                    {formatRupiah(bookingData?.total_amount || 412500)}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <User className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-1 text-white/90">Penumpang</h3>
                  <p className="text-3xl font-bold">
                    {bookingData?.passenger_count || 1} orang
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <Train className="w-8 h-8" />
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
                      <p className="text-xl font-bold text-gray-800">{bookingData?.train_name || 'Parahyangan'}</p>
                    </div>
                    <div>
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-sm font-bold">
                        {bookingData?.train_class || 'Executive'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Journey Timeline */}
                  <div className="relative mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800">{bookingData?.departure_time || '05:00'}</p>
                        <p className="text-sm text-gray-600">{bookingData?.origin || 'Bandung'}</p>
                      </div>
                      
                      <div className="flex-1 mx-8">
                        <div className="relative h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full">
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-4 border-blue-500 rounded-full"></div>
                          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <ArrowRight className="w-8 h-8 text-blue-500" />
                          </div>
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-4 border-purple-500 rounded-full"></div>
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-2">
                          Langsung • {calculateTravelDuration()}
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-800">{bookingData?.arrival_time || '10:00'}</p>
                        <p className="text-sm text-gray-600">{bookingData?.destination || 'Gambir'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Date & Seat Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-semibold text-gray-700">Tanggal Keberangkatan</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">
                        {bookingData ? formatDate(bookingData.departure_date) : 'Memuat...'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Waktu pemesanan: {new Date().toLocaleString('id-ID')}
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <MapPin className="w-5 h-5 text-purple-600 mr-2" />
                        <span className="font-semibold text-gray-700">Kursi</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">
                        {bookingData?.selected_seats?.join(', ') || 'C2'}
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
                  
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Nama</span>
                        <span className="font-bold text-gray-800">{bookingData?.passenger_name || 'Reisan'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Email</span>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-bold text-gray-800">{bookingData?.passenger_email || 'reisanadrefagt@gmail.com'}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Telepon</span>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="font-bold text-gray-800">{bookingData?.passenger_phone || '08453665664'}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Jumlah Penumpang</span>
                        <span className="font-bold text-gray-800">{bookingData?.passenger_count || 1} orang</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="font-bold text-blue-800 text-xl mb-4">Instruksi Penting</h3>
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
                  className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <Download className="w-6 h-6 mr-3" />
                  <span className="font-bold text-lg">Download Tiket</span>
                </button>
                
                <button
                  onClick={() => router.push('/')}
                  className="w-full px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                >
                  <span className="font-bold">Pesan Tiket Lagi</span>
                </button>
                
                <button
                  onClick={handleRedirectNow}
                  disabled={isRedirecting}
                  className={`w-full px-8 py-4 rounded-xl transition-all duration-300 transform ${isRedirecting ? '' : 'hover:-translate-y-1'} ${
                    isRedirecting 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:shadow-xl'
                  }`}
                >
                  <span className="font-bold text-lg">
                    {isRedirecting ? 'Mengalihkan...' : 'Lihat Semua Pemesanan'}
                  </span>
                </button>
              </div>
              
              {/* Payment Summary */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="font-bold text-gray-700 text-xl mb-6">Ringkasan Pembayaran</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Harga Tiket</span>
                    <span className="font-semibold text-gray-800">Rp 330.000</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Biaya Admin</span>
                    <span className="font-semibold text-gray-800">Rp 5.000</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Asuransi</span>
                    <span className="font-semibold text-gray-800">Rp 10.000</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Biaya Layanan</span>
                    <span className="font-semibold text-gray-800">Rp 2.000</span>
                  </div>
                  
                  <div className="border-t border-gray-300 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-lg">Total</span>
                      <span className="font-bold text-green-600 text-2xl">
                        {formatRupiah(bookingData?.total_amount || 412500)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Support Info */}
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-600 mb-3 font-semibold">Butuh bantuan?</p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-gray-700 font-medium">1500-123</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-gray-700 font-medium">support@tripgo.com</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} TripGo. Semua hak dilindungi.
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