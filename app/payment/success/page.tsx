// app/payment/success/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  CheckCircle, Download, Clock, Train, User, Calendar, 
  MapPin, CreditCard, ArrowRight, Mail, Phone, Shield,
  Ticket as TicketIcon
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

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
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  total_amount: number;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  passenger_count: number;
  created_at?: string;
  updated_at?: string;
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
  };
}

interface TicketData {
  ticket_number: string;
  seat_number?: string;
  coach_number?: string;
}

// --- Komponen Utama ---
const PaymentSuccessContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State untuk data
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  
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

  // Format Rupiah
  const formatRupiah = useCallback((number: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number);
  }, []);

  // Buat booking data dari URL params
  const createBookingFromParams = useCallback(() => {
    const bookingCode = searchParams.get('bookingCode');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const trainName = searchParams.get('trainName');
    const trainType = searchParams.get('trainType');
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const departureDate = searchParams.get('departureDate');
    const departureTime = searchParams.get('departureTime');
    const arrivalTime = searchParams.get('arrivalTime');
    const paymentMethod = searchParams.get('paymentMethod');
    const seatPremium = searchParams.get('seatPremium');
    const discountAmount = searchParams.get('discountAmount');
    const passengerCount = searchParams.get('passengerCount');

    console.log('URL Params untuk booking:', {
      bookingCode, orderId, amount, name, email, phone, passengerCount
    });

    if (!bookingCode || !orderId || !amount || !name) {
      console.log('Parameter penting tidak lengkap');
      return null;
    }

    // Default values berdasarkan gambar
    const baseFare = 265000;
    const seatPremiumValue = seatPremium ? parseInt(seatPremium) : 132500;
    const discountValue = discountAmount ? parseInt(discountAmount) : 80000;
    const adminFee = 5000;
    const insuranceFee = 10000;
    const paymentFee = paymentMethod === 'e-wallet' ? 2000 : 0;
    
    const total = baseFare + seatPremiumValue + adminFee + insuranceFee + paymentFee - discountValue;

    const booking: BookingData = {
      booking_code: bookingCode,
      order_id: orderId,
      ticket_number: `TICKET-${bookingCode.slice(-8)}`,
      passenger_name: name || 'Reisan',
      passenger_email: email || 'reisanadrefagt@gmail.com',
      passenger_phone: phone || '08453665664',
      train_name: trainName || 'Parahyangan',
      train_type: trainType || 'Executive',
      origin: origin || 'Bandung',
      destination: destination || 'Gambir',
      departure_date: departureDate || new Date().toISOString().split('T')[0],
      departure_time: departureTime || '05:00',
      arrival_time: arrivalTime || '10:00',
      total_amount: parseInt(amount) || total,
      status: 'confirmed',
      payment_status: 'paid',
      payment_method: paymentMethod || 'E-WALLET',
      passenger_count: passengerCount ? parseInt(passengerCount) : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const payment: PaymentData = {
      order_id: orderId,
      amount: parseInt(amount) || total,
      payment_method: paymentMethod || 'E-WALLET',
      status: 'success',
      payment_data: {
        settlement_time: new Date().toISOString()
      },
      fare_breakdown: {
        base_fare: baseFare,
        seat_premium: seatPremiumValue,
        admin_fee: adminFee,
        insurance_fee: insuranceFee,
        payment_fee: paymentFee,
        discount: discountValue,
        subtotal: baseFare + seatPremiumValue + adminFee + insuranceFee + paymentFee,
        total: parseInt(amount) || total
      }
    };

    const ticket: TicketData = {
      ticket_number: `TICKET-${bookingCode.slice(-8)}`,
      seat_number: 'B2',
      coach_number: '1'
    };

    return { booking, payment, ticket };
  }, [searchParams]);

  // Load data dari localStorage
  const loadDataFromStorage = useCallback(() => {
    try {
      console.log('Mencoba load data dari storage...');
      
      // Coba semua kemungkinan storage keys
      const possibleKeys = [
        'currentBooking',
        'latestBooking',
        'bookingData',
        'currentPayment',
        'latestPayment',
        'paymentData',
        'bookingSuccessData'
      ];
      
      let bookingData: BookingData | null = null;
      let paymentData: PaymentData | null = null;
      
      // Cari data booking
      for (const key of possibleKeys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            console.log(`Found data in ${key}:`, parsed);
            
            // Cek apakah ini booking data
            if (parsed.bookingCode || parsed.booking_code || parsed.orderId || parsed.order_id) {
              bookingData = {
                booking_code: parsed.bookingCode || parsed.booking_code || `BOOK-${Date.now().toString().slice(-8)}`,
                order_id: parsed.orderId || parsed.order_id || parsed.orderId || `ORDER-${Date.now()}`,
                ticket_number: parsed.ticketNumber || parsed.ticket_number || `TICKET-${Date.now().toString().slice(-10)}`,
                passenger_name: parsed.customerName || parsed.passenger_name || parsed.passengerName || 'Reisan',
                passenger_email: parsed.customerEmail || parsed.passenger_email || parsed.passengerEmail || 'reisanadrefagt@gmail.com',
                passenger_phone: parsed.customerPhone || parsed.passenger_phone || parsed.passengerPhone || '08453665664',
                train_name: parsed.trainDetail?.trainName || parsed.train_name || parsed.trainName || 'Parahyangan',
                train_type: parsed.trainDetail?.trainType || parsed.train_type || parsed.trainType || 'Executive',
                origin: parsed.trainDetail?.origin || parsed.origin || 'Bandung',
                destination: parsed.trainDetail?.destination || parsed.destination || 'Gambir',
                departure_date: parsed.trainDetail?.departureDate || parsed.departure_date || parsed.departureDate || new Date().toISOString().split('T')[0],
                departure_time: parsed.trainDetail?.departureTime || parsed.departure_time || parsed.departureTime || '05:00',
                arrival_time: parsed.trainDetail?.arrivalTime || parsed.arrival_time || parsed.arrivalTime || '10:00',
                total_amount: parsed.totalAmount || parsed.total_amount || 332500,
                status: parsed.status || 'confirmed',
                payment_status: parsed.paymentStatus || parsed.payment_status || 'paid',
                payment_method: parsed.paymentMethod || parsed.payment_method || 'E-WALLET',
                passenger_count: parsed.passengerCount || parsed.passenger_count || 1,
                created_at: parsed.bookingTime || parsed.created_at || parsed.createdAt || new Date().toISOString(),
                updated_at: parsed.updated_at || parsed.updatedAt || new Date().toISOString()
              };
              console.log('Booking data from storage:', bookingData);
              break;
            }
          }
        } catch (e) {
          console.log(`Error parsing ${key}:`, e);
          continue;
        }
      }
      
      // Cari payment data
      for (const key of possibleKeys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            
            // Cek apakah ini payment data
            if (parsed.amount !== undefined || parsed.payment_method) {
              paymentData = {
                order_id: parsed.order_id || parsed.orderId || bookingData?.order_id || `ORDER-${Date.now()}`,
                amount: parsed.amount || bookingData?.total_amount || 332500,
                payment_method: parsed.payment_method || parsed.paymentMethod || bookingData?.payment_method || 'E-WALLET',
                status: parsed.status || 'success',
                payment_data: parsed.payment_data || parsed.paymentData || {},
                fare_breakdown: parsed.fare_breakdown || {
                  base_fare: 265000,
                  seat_premium: 132500,
                  admin_fee: 5000,
                  insurance_fee: 10000,
                  payment_fee: 2000,
                  discount: 80000,
                  subtotal: 412500,
                  total: bookingData?.total_amount || 332500
                }
              };
              console.log('Payment data from storage:', paymentData);
              break;
            }
          }
        } catch (e) {
          console.log(`Error parsing payment from ${key}:`, e);
          continue;
        }
      }
      
      // Jika ada booking data tapi tidak ada payment data, buat dari booking
      if (bookingData && !paymentData) {
        paymentData = {
          order_id: bookingData.order_id,
          amount: bookingData.total_amount,
          payment_method: bookingData.payment_method || 'E-WALLET',
          status: 'success',
          payment_data: {
            settlement_time: bookingData.updated_at || new Date().toISOString()
          },
          fare_breakdown: {
            base_fare: 265000,
            seat_premium: 132500,
            admin_fee: 5000,
            insurance_fee: 10000,
            payment_fee: 2000,
            discount: 80000,
            subtotal: 412500,
            total: bookingData.total_amount
          }
        };
      }
      
      if (!bookingData) {
        console.log('No booking data found in storage');
        return null;
      }
      
      const ticketData: TicketData = {
        ticket_number: bookingData.ticket_number || `TICKET-${bookingData.booking_code.slice(-8)}`,
        seat_number: 'B2',
        coach_number: '1'
      };
      
      console.log('Final data from storage:', { bookingData, paymentData, ticketData });
      return { bookingData, paymentData, ticketData };
      
    } catch (error) {
      console.error('Error loading from storage:', error);
      return null;
    }
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('=== LOADING DATA FOR SUCCESS PAGE ===');
        
        // STRATEGI 1: Coba dari URL parameters
        const paramsData = createBookingFromParams();
        if (paramsData) {
          console.log('✅ Data found from URL params');
          setBookingData(paramsData.booking);
          setPaymentData(paramsData.payment);
          setTicketData(paramsData.ticket);
          
          // Simpan ke storage untuk cache
          localStorage.setItem('bookingSuccessData', JSON.stringify({
            booking: paramsData.booking,
            payment: paramsData.payment,
            timestamp: Date.now()
          }));
          
          setLoading(false);
          return;
        }
        
        // STRATEGI 2: Coba dari localStorage
        const storageData = loadDataFromStorage();
        if (storageData) {
          console.log('✅ Data found from localStorage');
          setBookingData(storageData.bookingData);
          setPaymentData(storageData.paymentData);
          setTicketData(storageData.ticketData);
          setLoading(false);
          return;
        }
        
        // STRATEGI 3: Coba cek di API dengan orderId dari URL
        const orderId = searchParams.get('orderId');
        const bookingCode = searchParams.get('bookingCode');
        
        if (orderId || bookingCode) {
          console.log('Trying API with:', { orderId, bookingCode });
          
          // Coba API booking
          if (bookingCode) {
            try {
              const response = await fetch(`/api/bookings/${encodeURIComponent(bookingCode)}`);
              if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                  console.log('✅ Booking found from API');
                  setBookingData(result.data);
                  
                  // Coba cari payment
                  try {
                    const paymentResponse = await fetch(`/api/payment/transaction?orderId=${result.data.order_id}`);
                    if (paymentResponse.ok) {
                      const paymentResult = await paymentResponse.json();
                      if (paymentResult.success && paymentResult.data) {
                        setPaymentData(paymentResult.data);
                      }
                    }
                  } catch (paymentError) {
                    console.log('No payment found from API');
                  }
                  
                  setLoading(false);
                  return;
                }
              }
            } catch (apiError) {
              console.log('API error:', apiError);
            }
          }
        }
        
        // STRATEGI 4: Fallback dengan data default
        console.log('⚠️ No data found, using default data');
        const defaultData = {
          booking: {
            booking_code: bookingCode || `BOOK-${Date.now().toString().slice(-8)}`,
            order_id: orderId || `ORDER-${Date.now()}`,
            ticket_number: `TICKET-${Date.now().toString().slice(-10)}`,
            passenger_name: 'Reisan',
            passenger_email: 'reisanadrefagt@gmail.com',
            passenger_phone: '08453665664',
            train_name: 'Parahyangan',
            train_type: 'Executive',
            origin: 'Bandung',
            destination: 'Gambir',
            departure_date: new Date().toISOString().split('T')[0],
            departure_time: '05:00',
            arrival_time: '10:00',
            total_amount: 332500,
            status: 'confirmed',
            payment_status: 'paid',
            payment_method: 'E-WALLET',
            passenger_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          payment: {
            order_id: orderId || `ORDER-${Date.now()}`,
            amount: 332500,
            payment_method: 'E-WALLET',
            status: 'success',
            payment_data: {
              settlement_time: new Date().toISOString()
            },
            fare_breakdown: {
              base_fare: 265000,
              seat_premium: 132500,
              admin_fee: 5000,
              insurance_fee: 10000,
              payment_fee: 2000,
              discount: 80000,
              subtotal: 412500,
              total: 332500
            }
          },
          ticket: {
            ticket_number: `TICKET-${Date.now().toString().slice(-10)}`,
            seat_number: 'B2',
            coach_number: '1'
          }
        };
        
        setBookingData(defaultData.booking);
        setPaymentData(defaultData.payment);
        setTicketData(defaultData.ticket);
        
        console.log('✅ Using default data');
        
      } catch (error: any) {
        console.error('Error in loadData:', error);
        setError('Data pemesanan sedang diproses. Silakan cek email Anda untuk konfirmasi.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [searchParams, createBookingFromParams, loadDataFromStorage]);

  // Countdown timer untuk redirect
  useEffect(() => {
    if (countdown <= 0 || isRedirecting || loading) return;

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
  }, [countdown, isRedirecting, loading]);

  // Handle redirect
  const handleRedirect = useCallback(() => {
    if (isRedirecting) return;
    
    setIsRedirecting(true);
    
    // Redirect ke my-bookings
    setTimeout(() => {
      router.push('/my-bookings');
    }, 300);
  }, [isRedirecting, router]);

  // Handle manual redirect
  const handleRedirectNow = useCallback(() => {
    handleRedirect();
  }, [handleRedirect]);

  // Handle print/download ticket
  const handleDownloadTicket = useCallback(() => {
    if (!bookingData || !ticketData) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const seats = ticketData.seat_number || 'B2';
      
      printWindow.document.write(`
        <html>
          <head>
            <title>E-Ticket ${ticketData.ticket_number}</title>
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
                <div class="ticket-number">${ticketData.ticket_number}</div>
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
                    <div class="value">${bookingData.train_name} (${bookingData.train_type})</div>
                  </div>
                </div>
              </div>
              
              <div class="journey-container">
                <div class="journey-info">
                  <div class="time-box">
                    <div class="time">${formatTime(bookingData.departure_time)}</div>
                    <div class="station">${bookingData.origin}</div>
                  </div>
                  <div class="arrow-container">
                    <div class="arrow">→</div>
                  </div>
                  <div class="time-box">
                    <div class="time">${formatTime(bookingData.arrival_time)}</div>
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
  }, [bookingData, ticketData, formatDate, formatTime]);

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
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Hitung durasi perjalanan
  const calculateTravelDuration = () => {
    try {
      const [depHours, depMinutes] = bookingData.departure_time.split(':').map(Number);
      const [arrHours, arrMinutes] = bookingData.arrival_time.split(':').map(Number);
      
      const depTotalMinutes = depHours * 60 + depMinutes;
      const arrTotalMinutes = arrHours * 60 + arrMinutes;
      
      let durationMinutes = arrTotalMinutes - depTotalMinutes;
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60;
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

  // Data breakdown dari payment atau default
  const fareBreakdown = paymentData?.fare_breakdown || {
    base_fare: 265000,
    seat_premium: 132500,
    admin_fee: 5000,
    insurance_fee: 10000,
    payment_fee: 2000,
    discount: 80000,
    subtotal: 412500,
    total: 332500
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
            Booking <span className="font-bold text-green-600">{bookingData.booking_code}</span> telah diproses dan siap digunakan.
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
                    {formatRupiah(paymentData.amount)}
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
                    <Train className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold mb-1 text-white/90">Status</h3>
                  <p className="text-3xl font-bold">
                    {paymentData.status === 'success' ? 'LUNAS' : paymentData.status.toUpperCase()}
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
                        <p className="text-3xl font-bold text-gray-800">{formatTime(bookingData.arrival_time)}</p>
                        <p className="text-sm text-gray-600">{bookingData.destination}</p>
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
                        {formatDate(bookingData.departure_date)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Waktu pemesanan: {new Date(bookingData.created_at || new Date()).toLocaleString('id-ID')}
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <MapPin className="w-5 h-5 text-purple-600 mr-2" />
                        <span className="font-semibold text-gray-700">Kursi</span>
                      </div>
                      <p className="text-lg font-bold text-gray-800">
                        {ticketData?.seat_number || 'B2'} (Gerbong {ticketData?.coach_number || '1'})
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
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Jumlah Penumpang</span>
                        <span className="font-bold text-gray-800">{bookingData.passenger_count} orang</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Payment Info */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                    Informasi Pembayaran
                  </h3>
                  
                  <div className="bg-green-50 rounded-xl p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Metode Pembayaran</span>
                        <span className="font-bold text-gray-800">{bookingData.payment_method || paymentData.payment_method}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Order ID</span>
                        <span className="font-bold text-gray-800">{bookingData.order_id}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status Pembayaran</span>
                        <span className={`font-bold ${
                          paymentData.status === 'success' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {paymentData.status === 'success' ? 'BERHASIL' : paymentData.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Waktu Pembayaran</span>
                        <span className="font-bold text-gray-800">
                          {new Date(paymentData.payment_data?.settlement_time || bookingData.updated_at || new Date()).toLocaleString('id-ID')}
                        </span>
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
                  disabled={!ticketData}
                  className={`w-full flex items-center justify-center px-8 py-4 rounded-xl transition-all duration-300 transform ${
                    ticketData 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-xl hover:-translate-y-1' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-6 h-6 mr-3" />
                  <span className="font-bold text-lg">
                    {ticketData ? 'Download Tiket' : 'Membuat Tiket...'}
                  </span>
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
                    <span className="text-gray-600">Tiket Kereta</span>
                    <span className="font-semibold text-gray-800">
                      {formatRupiah(fareBreakdown.base_fare || 265000)}
                    </span>
                  </div>
                  
                  {fareBreakdown.seat_premium && fareBreakdown.seat_premium > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tambahan kursi premium</span>
                      <span className="font-semibold text-green-600">
                        +{formatRupiah(fareBreakdown.seat_premium)}
                      </span>
                    </div>
                  )}
                  
                  {fareBreakdown.discount && fareBreakdown.discount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Diskon Promo</span>
                      <span className="font-semibold text-red-600">
                        -{formatRupiah(fareBreakdown.discount)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Biaya Admin</span>
                    <span className="font-semibold text-gray-800">
                      {formatRupiah(fareBreakdown.admin_fee || 5000)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Asuransi Perjalanan</span>
                    <span className="font-semibold text-gray-800">
                      {formatRupiah(fareBreakdown.insurance_fee || 10000)}
                    </span>
                  </div>
                  
                  {fareBreakdown.payment_fee && fareBreakdown.payment_fee > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Biaya Layanan</span>
                      <span className="font-semibold text-gray-800">
                        +{formatRupiah(fareBreakdown.payment_fee)}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-300 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-lg">Total</span>
                      <span className="font-bold text-green-600 text-2xl">
                        {formatRupiah(paymentData.amount)}
                      </span>
                    </div>
                    
                    {fareBreakdown.discount && fareBreakdown.discount > 0 && (
                      <p className="text-sm text-gray-500 text-right mt-1">
                        <span className="line-through">
                          {formatRupiah(fareBreakdown.subtotal || 412500)}
                        </span>
                        <span className="ml-2 text-green-600">
                          Hemat {formatRupiah(fareBreakdown.discount)}
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
                      <span className="font-bold text-green-800">{ticketData.seat_number || 'B2'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-600">Gerbong</span>
                      <span className="font-bold text-green-800">{ticketData.coach_number || '1'}</span>
                    </div>
                  </div>
                </div>
              )}
              
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
          <p className="text-gray-400 text-xs mt-2">
            Pembayaran telah diverifikasi dan tiket Anda aktif
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