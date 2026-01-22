// app/booking/confirmation/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Tipe data untuk transit
interface TransitStation {
  id: string;
  station_id: string;
  station_name: string;
  arrival_time: string;
  departure_time: string;
  waiting_minutes: number;
  available_seats: number;
  additional_price?: number;
  previous_station: string;
  next_station: string;
}

// Tipe data untuk booking
interface BookingData {
  // Data dari query parameters
  bookingCode: string;
  orderId: string;
  amount: number;
  name: string;
  email: string;
  phone: string;
  passengerCount: string;
  savedToDatabase: string;
  paymentMethod?: string;
  paymentFee?: string;
  databaseId?: string;
  ticketNumber?: string;
  trainName?: string;
  trainType?: string;
  origin?: string;
  destination?: string;
  departureDate?: string;
  departureTime?: string;
  scheduleId?: string;
  insertionMethod?: string;
  isFallback?: string;
  
  // Data transit dari query parameters
  transitStation?: string;
  transitArrival?: string;
  transitDeparture?: string;
  transitDiscount?: string;
  transitAdditionalPrice?: string;
  
  // Data promo dari query parameters
  promoCode?: string;
  promoName?: string;
  
  // Data breakdown harga
  seatPremium?: string;
  discountAmount?: string;
  
  // Data dari session storage (jika ada)
  sessionData?: any;
}

// Tipe data penumpang
interface Passenger {
  id?: number;
  title: string;
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  email: string;
  seatNumber?: string;
  transit_station?: string;
  transit_arrival?: string;
  transit_departure?: string;
}

// Status pembayaran
type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'expired';

const BookingConfirmationContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [countdown, setCountdown] = useState<number>(15 * 60); // 15 menit dalam detik
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string>('');
  const [hasTransit, setHasTransit] = useState(false);
  const [transitInfo, setTransitInfo] = useState<TransitStation | null>(null);
  const [fareBreakdown, setFareBreakdown] = useState({
    baseFare: 0,
    seatPremium: 0,
    transitDiscount: 0,
    transitAdditionalPrice: 0,
    adminFee: 5000,
    insuranceFee: 10000,
    paymentFee: 0,
    promoDiscount: 0,
    subtotal: 0,
    total: 0
  });

  // Efek untuk mengambil data dari URL parameters
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ambil data dari query parameters
        const params: BookingData = {
          bookingCode: searchParams.get('bookingCode') || '',
          orderId: searchParams.get('orderId') || '',
          amount: parseFloat(searchParams.get('amount') || '0'),
          name: searchParams.get('name') || '',
          email: searchParams.get('email') || '',
          phone: searchParams.get('phone') || '',
          passengerCount: searchParams.get('passengerCount') || '1',
          savedToDatabase: searchParams.get('savedToDatabase') || 'false',
          paymentMethod: searchParams.get('paymentMethod') || 'bank-transfer',
          paymentFee: searchParams.get('paymentFee') || '0',
          databaseId: searchParams.get('databaseId') || '',
          ticketNumber: searchParams.get('ticketNumber') || '',
          trainName: searchParams.get('trainName') || '',
          trainType: searchParams.get('trainType') || '',
          origin: searchParams.get('origin') || '',
          destination: searchParams.get('destination') || '',
          departureDate: searchParams.get('departureDate') || '',
          departureTime: searchParams.get('departureTime') || '',
          scheduleId: searchParams.get('scheduleId') || '',
          insertionMethod: searchParams.get('insertionMethod') || '',
          isFallback: searchParams.get('isFallback') || 'false',
          
          // Data transit
          transitStation: searchParams.get('transitStation') || '',
          transitArrival: searchParams.get('transitArrival') || '',
          transitDeparture: searchParams.get('transitDeparture') || '',
          transitDiscount: searchParams.get('transitDiscount') || '0',
          transitAdditionalPrice: searchParams.get('transitAdditionalPrice') || '0',
          
          // Data promo
          promoCode: searchParams.get('promoCode') || '',
          promoName: searchParams.get('promoName') || '',
          
          // Data breakdown harga
          seatPremium: searchParams.get('seatPremium') || '0',
          discountAmount: searchParams.get('discountAmount') || '0'
        };

        console.log('📋 URL Parameters:', params);

        // Validasi data minimal
        if (!params.bookingCode) {
          throw new Error('Data booking tidak ditemukan');
        }

        // Cek apakah ada transit
        if (params.transitStation) {
          setHasTransit(true);
          setTransitInfo({
            id: 'transit-confirmation',
            station_id: 'station-' + params.transitStation.replace(/\s+/g, '-').toLowerCase(),
            station_name: params.transitStation,
            arrival_time: params.transitArrival || '--:--',
            departure_time: params.transitDeparture || '--:--',
            waiting_minutes: 15, // Default
            available_seats: parseInt(params.passengerCount) || 1,
            additional_price: parseFloat(params.transitAdditionalPrice || '0'),
            previous_station: params.origin || '',
            next_station: params.destination || ''
          });
        }

        // Coba ambil data dari session storage
        const storedBooking = sessionStorage.getItem('currentBooking');
        const storedLatestBooking = localStorage.getItem('latestBooking');

        let sessionData = null;
        if (storedBooking) {
          try {
            sessionData = JSON.parse(storedBooking);
            console.log('📦 Data from sessionStorage:', sessionData);
            
            // Jika ada data transit di session, update state
            if (sessionData.transit) {
              setHasTransit(true);
              setTransitInfo({
                id: 'transit-session',
                station_id: sessionData.transit.station_id || '',
                station_name: sessionData.transit.station_name || '',
                arrival_time: sessionData.transit.arrival_time || '',
                departure_time: sessionData.transit.departure_time || '',
                waiting_minutes: sessionData.transit.waiting_minutes || 0,
                available_seats: sessionData.passengerCount || 1,
                additional_price: sessionData.transit.additional_price || 0,
                previous_station: params.origin || '',
                next_station: params.destination || ''
              });
            }
            
            // Ambil data penumpang dari session
            if (sessionData.passengers && Array.isArray(sessionData.passengers)) {
              setPassengers(sessionData.passengers);
            }
            
            // Ambil fare breakdown dari session jika ada
            if (sessionData.fareBreakdown) {
              setFareBreakdown(sessionData.fareBreakdown);
            }
            
            params.sessionData = sessionData;
          } catch (e) {
            console.error('Error parsing session data:', e);
          }
        }

        // Gunakan booking code dari session jika tidak ada di URL
        if (!params.bookingCode && sessionData?.bookingCode) {
          params.bookingCode = sessionData.bookingCode;
        }

        setBookingData(params);

        // Hitung fare breakdown jika belum dihitung
        if (!sessionData?.fareBreakdown) {
          calculateFareBreakdown(params);
        }

        // Mulai countdown pembayaran
        setPaymentStatus('pending');
        startPaymentCountdown();

        // Jika booking disimpan ke database, cek status pembayaran
        if (params.savedToDatabase === 'true' && params.databaseId) {
          checkPaymentStatus(params.databaseId);
        }

      } catch (error: any) {
        console.error('❌ Error loading booking data:', error);
        setError(error.message || 'Gagal memuat data booking');
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [searchParams]);

  // Fungsi untuk menghitung breakdown harga
  const calculateFareBreakdown = (params: BookingData) => {
    const passengerCount = parseInt(params.passengerCount) || 1;
    const basePrice = 265000; // Harga dasar tiket
    const baseFare = basePrice * passengerCount;
    const seatPremium = parseFloat(params.seatPremium || '0');
    const transitDiscount = parseFloat(params.transitDiscount || '0');
    const transitAdditionalPrice = parseFloat(params.transitAdditionalPrice || '0');
    const adminFee = 5000;
    const insuranceFee = 10000;
    const paymentFee = parseFloat(params.paymentFee || '0');
    const promoDiscount = parseFloat(params.discountAmount || '0');
    
    const subtotal = baseFare + seatPremium - transitDiscount + transitAdditionalPrice;
    const totalBeforeDiscount = subtotal + adminFee + insuranceFee + paymentFee;
    const grandTotal = totalBeforeDiscount - promoDiscount;
    
    setFareBreakdown({
      baseFare,
      seatPremium,
      transitDiscount,
      transitAdditionalPrice,
      adminFee,
      insuranceFee,
      paymentFee,
      promoDiscount,
      subtotal: totalBeforeDiscount,
      total: grandTotal
    });
  };

  // Countdown untuk batas waktu pembayaran
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPaymentStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const startPaymentCountdown = () => {
    // Reset countdown ke 15 menit
    setCountdown(15 * 60);
  };

  const checkPaymentStatus = async (bookingId: string) => {
    try {
      // Simulasi cek status pembayaran
      setTimeout(() => {
        const isSuccess = Math.random() > 0.3;
        setPaymentStatus(isSuccess ? 'success' : 'processing');
      }, 3000);
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, d MMMM yyyy', { locale: id });
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

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCopyBookingCode = async () => {
    if (!bookingData?.bookingCode) return;
    
    try {
      await navigator.clipboard.writeText(bookingData.bookingCode);
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (error) {
      setCopyStatus('Failed to copy');
    }
  };

  const handleDownloadTicket = () => {
    if (!bookingData) return;
    
    const ticketData = {
      bookingCode: bookingData.bookingCode,
      ticketNumber: bookingData.ticketNumber || `TICKET-${Date.now()}`,
      passengerName: bookingData.name,
      trainName: bookingData.trainName,
      origin: bookingData.origin,
      destination: bookingData.destination,
      departureDate: bookingData.departureDate,
      departureTime: bookingData.departureTime,
      transitStation: bookingData.transitStation,
      transitArrival: bookingData.transitArrival,
      transitDeparture: bookingData.transitDeparture,
      amount: bookingData.amount
    };
    
    console.log('Generating ticket PDF:', ticketData);
    alert('Fitur download ticket akan segera tersedia!');
  };

  const handleShareBooking = () => {
    if (!bookingData) return;
    
    let shareText = `Saya sudah booking tiket kereta ${bookingData.trainName} dari ${bookingData.origin} ke ${bookingData.destination}`;
    
    if (hasTransit && transitInfo) {
      shareText += ` dengan transit di ${transitInfo.station_name}`;
    }
    
    shareText += ` dengan kode booking: ${bookingData.bookingCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Booking Confirmation',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Link booking telah disalin ke clipboard!');
    }
  };

  const handleRetryPayment = () => {
    if (!bookingData) return;
    
    // Redirect ke halaman pembayaran ulang dengan data transit
    const paymentParams = new URLSearchParams({
      bookingCode: bookingData.bookingCode,
      orderId: bookingData.orderId,
      amount: bookingData.amount.toString(),
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      passengerCount: bookingData.passengerCount,
      transitStation: bookingData.transitStation || '',
      transitArrival: bookingData.transitArrival || '',
      transitDeparture: bookingData.transitDeparture || '',
      transitDiscount: bookingData.transitDiscount || '0',
      transitAdditionalPrice: bookingData.transitAdditionalPrice || '0'
    });
    
    router.push(`/payment/retry?${paymentParams.toString()}`);
  };

  // Render informasi transit
  const renderTransitInfo = () => {
    if (!hasTransit || !transitInfo) return null;

    return (
      <div className="mt-6 p-6 bg-purple-50 border border-purple-200 rounded-xl">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-bold text-purple-800">Informasi Transit</h3>
            <p className="text-purple-600">Anda akan turun di stasiun transit</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-500">Stasiun Transit</div>
              <div className="font-bold text-lg text-purple-700">{transitInfo.station_name}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Tiba</div>
              <div className="font-bold text-lg text-gray-800">{transitInfo.arrival_time}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500">Berangkat</div>
              <div className="font-bold text-lg text-gray-800">{transitInfo.departure_time}</div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm text-gray-500">Rute Perjalanan</div>
                <div className="flex items-center mt-2">
                  <span className="font-medium text-gray-700">{bookingData?.origin}</span>
                  <svg className="w-6 h-6 text-purple-500 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-bold text-purple-700">{transitInfo.station_name}</span>
                  <svg className="w-6 h-6 text-purple-500 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-gray-700">{bookingData?.destination}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ <span className="font-semibold">Perhatian:</span> Tiket hanya berlaku sampai {transitInfo.station_name}. 
              Untuk melanjutkan perjalanan ke {bookingData?.destination}, perlu membeli tiket baru.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Tampilkan status pembayaran
  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Pembayaran Berhasil!</h1>
                <p className="text-gray-600 mt-1">Tiket Anda telah aktif dan siap digunakan</p>
                {hasTransit && (
                  <p className="text-purple-600 mt-1">
                    ✓ Transit di {transitInfo?.station_name} telah dikonfirmasi
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'processing':
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Menunggu Konfirmasi Pembayaran</h1>
                <p className="text-gray-600 mt-1">Pembayaran Anda sedang diproses oleh sistem</p>
                {hasTransit && (
                  <p className="text-purple-600 mt-1">
                    ⏳ Konfirmasi transit di {transitInfo?.station_name} dalam proses
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'expired':
        return (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Waktu Pembayaran Habis</h1>
                <p className="text-gray-600 mt-1">Silakan lakukan booking ulang</p>
                {hasTransit && (
                  <p className="text-red-600 mt-1">
                    ✗ Pilihan transit di {transitInfo?.station_name} telah kadaluarsa
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'failed':
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Pembayaran Gagal</h1>
                <p className="text-gray-600 mt-1">Silakan coba lagi dengan metode pembayaran lain</p>
              </div>
            </div>
          </div>
        );
      
      default: // pending
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Menunggu Pembayaran</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-600">Selesaikan pembayaran dalam:</p>
                  <div className="px-3 py-1 bg-orange-500 text-white rounded-lg font-mono font-bold">
                    {formatCountdown(countdown)}
                  </div>
                </div>
                {hasTransit && (
                  <p className="text-purple-600 mt-2">
                    ⏳ Transit di {transitInfo?.station_name} akan dikonfirmasi setelah pembayaran
                  </p>
                )}
              </div>
            </div>
            
            {/* Countdown warning */}
            {countdown < 300 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 font-semibold">Waktu hampir habis! Segera selesaikan pembayaran.</span>
                </div>
                {hasTransit && (
                  <p className="text-red-700 mt-2">
                    Pilihan transit di {transitInfo?.station_name} akan hangus jika waktu habis
                  </p>
                )}
              </div>
            )}
          </div>
        );
    }
  };

  // Tampilkan instruksi pembayaran berdasarkan metode
  const renderPaymentInstructions = () => {
    if (!bookingData?.paymentMethod) return null;

    const instructions: Record<string, { title: string; steps: string[] }> = {
      'bank-transfer': {
        title: 'Transfer Bank',
        steps: [
          'Pilih bank tujuan: BCA, BNI, Mandiri, atau BRI',
          'Transfer ke rekening: 1234567890 (PT TripGo Indonesia)',
          'Jumlah transfer: ' + formatPrice(bookingData.amount),
          'Tambahkan kode unik: ' + bookingData.bookingCode?.slice(-3),
          'Konfirmasi pembayaran melalui WhatsApp: 0812-3456-7890'
        ]
      },
      'virtual-account': {
        title: 'Virtual Account',
        steps: [
          'Virtual Account: 8880' + bookingData.bookingCode?.replace(/\D/g, '').slice(-10),
          'Jumlah pembayaran: ' + formatPrice(bookingData.amount),
          'Bayar melalui ATM/Internet Banking/Mobile Banking',
          'Pilih menu "Transfer" → "Virtual Account"',
          'Masukkan nomor Virtual Account dan jumlah yang tertera'
        ]
      },
      'credit-card': {
        title: 'Kartu Kredit',
        steps: [
          'Anda akan dialihkan ke halaman pembayaran yang aman',
          'Masukkan detail kartu kredit Anda',
          'Lakukan verifikasi 3D Secure',
          'Tunggu konfirmasi pembayaran',
          'E-ticket akan dikirim ke email setelah pembayaran berhasil'
        ]
      },
      'e-wallet': {
        title: 'E-Wallet',
        steps: [
          'Pilih metode e-wallet: OVO, GoPay, DANA, atau ShopeePay',
          'Scan QR code yang ditampilkan',
          'Konfirmasi pembayaran di aplikasi e-wallet Anda',
          'Tunggu verifikasi dari sistem',
          'Status booking akan otomatis terupdate'
        ]
      }
    };

    const method = instructions[bookingData.paymentMethod] || instructions['bank-transfer'];

    return (
      <div className="mt-6 p-6 bg-white border border-gray-200 rounded-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Instruksi Pembayaran - {method.title}</h3>
        <div className="space-y-3">
          {method.steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>
              <p className="text-gray-700">{step}</p>
            </div>
          ))}
        </div>
        
        {bookingData.paymentMethod === 'bank-transfer' && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Rekening Tujuan:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white border rounded-lg">
                <div className="font-bold text-gray-800">BCA</div>
                <div className="text-lg font-mono font-bold text-blue-600">123 456 7890</div>
                <div className="text-sm text-gray-500">a.n. PT TripGo Indonesia</div>
              </div>
              <div className="p-3 bg-white border rounded-lg">
                <div className="font-bold text-gray-800">Mandiri</div>
                <div className="text-lg font-mono font-bold text-blue-600">987 654 3210</div>
                <div className="text-sm text-gray-500">a.n. PT TripGo Indonesia</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat konfirmasi booking...</p>
        </div>
      </div>
    );
  }

  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Terjadi Kesalahan</h2>
          <p className="text-gray-500 mb-6">{error || 'Data booking tidak ditemukan'}</p>
          <div className="space-y-3">
            <Link
              href="/search"
              className="block px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              Cari Kereta Lain
            </Link>
            <button 
              onClick={() => router.back()}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalAmount = bookingData.amount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center group">
              <div className="w-10 h-10 bg-[#FD7E14] rounded-lg flex items-center justify-center group-hover:bg-[#E06700] transition-colors">
                <span className="text-white font-bold text-lg">TG</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-800">TripGo</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">Home</Link>
              <Link href="/my-bookings" className="text-gray-600 hover:text-gray-900 transition-colors">My Bookings</Link>
              <Link href="/help" className="px-4 py-2 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Pembayaran */}
        {renderPaymentStatus()}

        {/* Informasi Transit */}
        {hasTransit && renderTransitInfo()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Code Section */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Kode Booking</h2>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-blue-700 font-mono tracking-wider">
                      {bookingData.bookingCode}
                    </div>
                    <button
                      onClick={handleCopyBookingCode}
                      className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                    >
                      {copyStatus === 'Copied!' ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                          </svg>
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-500">
                      Order ID: <span className="font-mono">{bookingData.orderId}</span>
                    </p>
                    {bookingData.ticketNumber && (
                      <p className="text-sm text-gray-500">
                        Ticket No: <span className="font-mono">{bookingData.ticketNumber}</span>
                      </p>
                    )}
                    {hasTransit && (
                      <p className="text-sm text-purple-600 font-semibold">
                        🚉 Tiket Transit: {transitInfo?.station_name}
                      </p>
                    )}
                    {bookingData.isFallback === 'true' && (
                      <p className="text-sm text-yellow-600 font-semibold">
                        ⚠️ Data disimpan di penyimpanan lokal
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Database Status */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${bookingData.savedToDatabase === 'true' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm font-medium">
                      {bookingData.savedToDatabase === 'true' 
                        ? 'Tersimpan di database' 
                        : 'Disimpan lokal'}
                    </span>
                  </div>
                  {bookingData.insertionMethod && (
                    <p className="text-xs text-gray-500 mt-1">
                      Method: {bookingData.insertionMethod}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Train Details */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Detail Perjalanan</h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{bookingData.trainName || 'Kereta Express'}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        bookingData.trainType?.includes('Eksekutif') ? 'bg-blue-100 text-blue-800' :
                        bookingData.trainType?.includes('Bisnis') ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {bookingData.trainType || 'Eksekutif'}
                      </span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600">{bookingData.passengerCount} Penumpang</span>
                      {hasTransit && (
                        <>
                          <span className="text-gray-500">•</span>
                          <span className="text-purple-600 font-semibold">Dengan Transit</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#FD7E14]">{formatPrice(totalAmount)}</div>
                    <div className="text-sm text-gray-500">Total Pembayaran</div>
                  </div>
                </div>
                
                {/* Route Timeline dengan Transit */}
                <div className="flex items-center justify-between py-6 border-y border-gray-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {formatTime(bookingData.departureTime || '08:00')}
                    </div>
                    <div className="text-sm font-medium text-gray-700">Keberangkatan</div>
                    <div className="text-sm text-gray-600">{bookingData.origin || 'Stasiun A'}</div>
                  </div>
                  
                  {hasTransit && transitInfo ? (
                    <div className="flex flex-col items-center flex-1 px-4">
                      <div className="text-sm text-gray-600 mb-3">{bookingData.departureDate ? formatDate(bookingData.departureDate) : 'Hari ini'}</div>
                      <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full h-0.5 bg-gray-300"></div>
                        </div>
                        <div className="relative flex justify-between">
                          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                          <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                        </div>
                        <div className="absolute left-1/3 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="text-xs text-purple-600 mt-1 whitespace-nowrap">Transit</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-3">Perjalanan dengan Transit</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center flex-1 px-8">
                      <div className="text-sm text-gray-600 mb-3">{bookingData.departureDate ? formatDate(bookingData.departureDate) : 'Hari ini'}</div>
                      <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full h-0.5 bg-gray-300"></div>
                        </div>
                        <div className="relative flex justify-between">
                          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                          <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-3">Perjalanan Langsung</div>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {formatTime(bookingData.departureTime || '12:00')}
                    </div>
                    <div className="text-sm font-medium text-gray-700">Kedatangan</div>
                    <div className="text-sm text-gray-600">{bookingData.destination || 'Stasiun B'}</div>
                  </div>
                </div>
                
                {/* Station Information dengan Transit */}
                {hasTransit && transitInfo && (
                  <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
                    <h4 className="font-bold text-gray-800 mb-3">Detail Rute:</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <div className="ml-3">
                            <div className="font-medium">{bookingData.origin}</div>
                            <div className="text-sm text-gray-500">Keberangkatan: {formatTime(bookingData.departureTime || '08:00')}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                          <div className="ml-3">
                            <div className="font-medium text-purple-700">{transitInfo.station_name}</div>
                            <div className="text-sm text-gray-500">
                              Transit: {transitInfo.arrival_time} - {transitInfo.departure_time} ({transitInfo.waiting_minutes} menit)
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <div className="ml-3">
                            <div className="font-medium">{bookingData.destination}</div>
                            <div className="text-sm text-gray-500">Tiba: {formatTime(bookingData.departureTime || '12:00')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Additional Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="p-3 bg-white border rounded-lg">
                    <div className="text-sm text-gray-500">Tanggal</div>
                    <div className="font-medium">{bookingData.departureDate ? formatDate(bookingData.departureDate) : '-'}</div>
                  </div>
                  <div className="p-3 bg-white border rounded-lg">
                    <div className="text-sm text-gray-500">Waktu</div>
                    <div className="font-medium">{formatTime(bookingData.departureTime || '')} - {formatTime(bookingData.departureTime || '')}</div>
                  </div>
                  <div className="p-3 bg-white border rounded-lg">
                    <div className="text-sm text-gray-500">Durasi</div>
                    <div className="font-medium">4 jam 30 menit</div>
                  </div>
                  <div className="p-3 bg-white border rounded-lg">
                    <div className="text-sm text-gray-500">Schedule ID</div>
                    <div className="font-medium font-mono text-sm">{bookingData.scheduleId || '-'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Details dengan Transit */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Detail Penumpang</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Nama Pemesan</div>
                      <div className="font-medium">{bookingData.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <div className="font-medium">{bookingData.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Telepon</div>
                      <div className="font-medium">{bookingData.phone}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Jumlah Penumpang</div>
                      <div className="font-medium">{bookingData.passengerCount} orang</div>
                    </div>
                  </div>
                </div>
                
                {/* List of Passengers */}
                {passengers.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-700 mb-3">Daftar Penumpang</h4>
                    <div className="space-y-3">
                      {passengers.map((passenger, index) => (
                        <div key={index} className="bg-white border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{passenger.fullName}</span>
                                <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                  {passenger.title}
                                </span>
                                {passenger.transit_station && (
                                  <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    Transit
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                NIK: {passenger.idNumber} • Telp: {passenger.phoneNumber}
                              </div>
                              {passenger.transit_station && (
                                <div className="text-sm text-purple-600 mt-1">
                                  🚉 Turun di: {passenger.transit_station}
                                </div>
                              )}
                            </div>
                            {passenger.seatNumber && (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                Kursi: {passenger.seatNumber}
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

            {/* Payment Instructions */}
            {paymentStatus === 'pending' && (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Instruksi Pembayaran</h2>
                  <button
                    onClick={() => setShowPaymentInstructions(!showPaymentInstructions)}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {showPaymentInstructions ? 'Sembunyikan' : 'Lihat Instruksi'}
                  </button>
                </div>
                
                {showPaymentInstructions && renderPaymentInstructions()}
                
                {!showPaymentInstructions && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-gray-600">
                      Klik "Lihat Instruksi" untuk melihat petunjuk pembayaran lengkap
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Payment Breakdown dengan Transit dan Promo */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Rincian Pembayaran</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tiket ({bookingData.passengerCount} orang)</span>
                  <span className="font-medium">{formatPrice(fareBreakdown.baseFare)}</span>
                </div>
                
                {fareBreakdown.seatPremium > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tambahan kursi premium</span>
                    <span className="font-medium text-green-600">
                      +{formatPrice(fareBreakdown.seatPremium)}
                    </span>
                  </div>
                )}
                
                {hasTransit && fareBreakdown.transitDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diskon Transit (10%)</span>
                    <span className="font-medium text-red-600">
                      -{formatPrice(fareBreakdown.transitDiscount)}
                    </span>
                  </div>
                )}
                
                {hasTransit && fareBreakdown.transitAdditionalPrice > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Biaya tambahan transit</span>
                    <span className="font-medium text-green-600">
                      +{formatPrice(fareBreakdown.transitAdditionalPrice)}
                    </span>
                  </div>
                )}
                
                {fareBreakdown.promoDiscount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Diskon Promo {bookingData.promoName ? `(${bookingData.promoName})` : ''}
                    </span>
                    <span className="font-medium text-red-600">
                      -{formatPrice(fareBreakdown.promoDiscount)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Biaya Admin</span>
                  <span className="font-medium">{formatPrice(fareBreakdown.adminFee)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Asuransi Perjalanan</span>
                  <span className="font-medium">{formatPrice(fareBreakdown.insuranceFee)}</span>
                </div>
                
                {fareBreakdown.paymentFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Biaya Pembayaran</span>
                    <span className="font-medium">+{formatPrice(fareBreakdown.paymentFee)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-300 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Pembayaran</span>
                    <span className="text-[#FD7E14]">{formatPrice(fareBreakdown.total)}</span>
                  </div>
                </div>
              </div>
              
              {/* Payment Method */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600">Metode Pembayaran</div>
                    <div className="font-medium capitalize">{bookingData.paymentMethod?.replace('-', ' ') || 'Transfer Bank'}</div>
                  </div>
                  {paymentStatus === 'pending' && (
                    <button
                      onClick={handleRetryPayment}
                      className="px-4 py-2 text-sm bg-[#FD7E14] text-white rounded-lg hover:bg-[#E06700] transition-colors"
                    >
                      Ganti Metode
                    </button>
                  )}
                </div>
              </div>
              
              {/* Transit Notice */}
              {hasTransit && (
                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-purple-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm text-purple-800 font-medium">Informasi Tiket Transit</p>
                      <p className="text-sm text-purple-600 mt-1">
                        Tiket transit hanya berlaku sampai stasiun {transitInfo?.station_name}. 
                        Untuk melanjutkan perjalanan ke {bookingData.destination}, Anda perlu membeli tiket baru di stasiun transit.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions & Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Tindakan Selanjutnya</h3>
              
              {/* Action Buttons based on status */}
              <div className="space-y-3">
                {paymentStatus === 'success' && (
                  <>
                    <button
                      onClick={handleDownloadTicket}
                      className="w-full py-3 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download E-Ticket
                    </button>
                    
                    <button
                      onClick={handleShareBooking}
                      className="w-full py-3 bg-white border border-[#FD7E14] text-[#FD7E14] font-semibold rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg>
                      Share Booking
                    </button>
                  </>
                )}
                
                {paymentStatus === 'pending' && (
                  <>
                    <button
                      onClick={() => setShowPaymentInstructions(true)}
                      className="w-full py-3 bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors"
                    >
                      Lihat Instruksi Pembayaran
                    </button>
                    
                    <button
                      onClick={handleRetryPayment}
                      className="w-full py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Coba Metode Lain
                    </button>
                  </>
                )}
                
                {paymentStatus === 'failed' && (
                  <button
                    onClick={handleRetryPayment}
                    className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Coba Pembayaran Ulang
                  </button>
                )}
                
                {paymentStatus === 'expired' && (
                  <Link
                    href="/search"
                    className="block w-full py-3 text-center bg-[#FD7E14] text-white font-semibold rounded-lg hover:bg-[#E06700] transition-colors"
                  >
                    Booking Baru
                  </Link>
                )}
                
                <Link
                  href="/my-bookings"
                  className="block w-full py-3 text-center bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Lihat Semua Booking
                </Link>
                
                <Link
                  href="/search"
                  className="block w-full py-3 text-center bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Booking Lagi
                </Link>
              </div>
              
              {/* Important Notes dengan Transit */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Catatan Penting</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>E-ticket dikirim ke email setelah pembayaran berhasil</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Check-in online tersedia 2 jam sebelum keberangkatan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Bawa identitas asli saat keberangkatan</span>
                  </li>
                  {hasTransit && (
                    <li className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-purple-700">
                        Tiket berlaku sampai {transitInfo?.station_name}. Untuk melanjutkan perjalanan perlu tiket baru.
                      </span>
                    </li>
                  )}
                </ul>
              </div>
              
              {/* Help Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Butuh Bantuan?</h4>
                <div className="space-y-2 text-sm">
                  <a href="tel:1500123" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>Customer Service: 1500-123</span>
                  </a>
                  <a href="mailto:support@tripgo.com" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>support@tripgo.com</span>
                  </a>
                  <Link href="/help" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span>FAQs</span>
                  </Link>
                </div>
              </div>
              
              {/* Booking Status Summary dengan Transit */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Status Booking</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Booking</span>
                    <span className="text-sm font-medium text-green-600">✓ Selesai</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transit</span>
                    <span className={`text-sm font-medium ${
                      hasTransit ? 'text-purple-600' : 'text-gray-400'
                    }`}>
                      {hasTransit ? '✓ Diaktifkan' : 'Tidak ada'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pembayaran</span>
                    <span className={`text-sm font-medium ${
                      paymentStatus === 'success' ? 'text-green-600' :
                      paymentStatus === 'pending' ? 'text-yellow-600' :
                      paymentStatus === 'expired' || paymentStatus === 'failed' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {paymentStatus === 'success' ? '✓ Berhasil' :
                       paymentStatus === 'pending' ? '⏳ Menunggu' :
                       paymentStatus === 'processing' ? '🔄 Diproses' :
                       paymentStatus === 'failed' ? '✗ Gagal' :
                       '⌛ Kadaluarsa'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">E-Ticket</span>
                    <span className={`text-sm font-medium ${
                      paymentStatus === 'success' ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {paymentStatus === 'success' ? '✓ Tersedia' : 'Menunggu pembayaran'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Transit Summary */}
              {hasTransit && (
                <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-700 mb-2">Rincian Transit</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-purple-600">Stasiun</span>
                      <span className="text-xs font-medium text-purple-800">{transitInfo?.station_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-purple-600">Tiba</span>
                      <span className="text-xs font-medium text-purple-800">{transitInfo?.arrival_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-purple-600">Berangkat</span>
                      <span className="text-xs font-medium text-purple-800">{transitInfo?.departure_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-purple-600">Durasi Transit</span>
                      <span className="text-xs font-medium text-purple-800">{transitInfo?.waiting_minutes} menit</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#FD7E14] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">TG</span>
                </div>
                <span className="ml-3 text-xl font-bold">TripGo</span>
              </div>
              <p className="text-gray-400 mt-2 text-sm">Platform booking kereta api terpercaya</p>
            </div>
            
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">Terms & Conditions</Link>
              <Link href="/faq" className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</Link>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} TripGo. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- Export dengan Suspense ---
export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat konfirmasi booking...</p>
        </div>
      </div>
    }>
      <BookingConfirmationContent />
    </Suspense>
  );
}