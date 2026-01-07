// app/payment/page.tsx
'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

// --- Tipe Data ---
interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  banks?: string[];
  fees: number;
  midtrans_payment_type?: string;
}

interface TrainDetail {
  id: string;
  trainCode: string;
  trainName: string;
  trainType: string;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  departureDate: string;
  seatNumbers?: string[];
}

interface Passenger {
  fullName: string;
  email?: string;
  phoneNumber?: string;
  seatNumber?: string;
}

interface BookingData {
  bookingCode: string;
  orderId: string;
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  trainDetail: TrainDetail;
  passengers: Passenger[];
  savedToDatabase: boolean;
  databaseId?: string;
  ticketNumber?: string;
  passengerCount?: number;
  paymentMethod?: string;
}

// --- Komponen Ikon (Sesuai dengan booking page) ---
const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const TrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const TimerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

// --- Komponen Utama ---
const PaymentPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank-transfer');
  const [selectedBank, setSelectedBank] = useState<string>('bca');
  const [processing, setProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 menit
  const [midtransLoading, setMidtransLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [virtualAccountNumber, setVirtualAccountNumber] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Ref untuk menyimpan interval timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Metode pembayaran (sesuai dengan booking page)
  const PAYMENT_METHODS: PaymentMethod[] = [
    {
      id: 'bank-transfer',
      name: 'Transfer Bank',
      description: 'BNI, BCA, Mandiri, BRI',
      icon: '🏦',
      banks: ['BNI', 'BCA', 'Mandiri', 'BRI'],
      fees: 0,
      midtrans_payment_type: 'bank_transfer'
    },
    {
      id: 'virtual-account',
      name: 'Virtual Account',
      description: 'Bayar dengan virtual account',
      icon: '🏧',
      banks: ['BCA VA', 'BNI VA', 'Mandiri VA', 'BRI VA'],
      fees: 4000,
      midtrans_payment_type: 'bank_transfer'
    },
    {
      id: 'credit-card',
      name: 'Kartu Kredit',
      description: 'Visa, MasterCard, JCB',
      icon: '💳',
      fees: 0,
      midtrans_payment_type: 'credit_card'
    },
    {
      id: 'e-wallet',
      name: 'E-Wallet',
      description: 'GoPay, OVO, Dana, ShopeePay',
      icon: '💰',
      fees: 2000,
      midtrans_payment_type: 'gopay'
    },
  ];

  // Generate virtual account number
  const generateVirtualAccountNumber = () => {
    if (!bookingData) return '';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const bookingCode = bookingData.bookingCode.replace(/[^0-9]/g, '').slice(-3);
    return `88${timestamp}${random}${bookingCode}`;
  };

  // Timer countdown dengan cleanup yang benar
  useEffect(() => {
    if (timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      handlePaymentExpired();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handlePaymentExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft]);

  const handlePaymentExpired = async () => {
    if (bookingData) {
      try {
        // Update status booking menjadi expired
        await fetch('/api/payment/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: bookingData.orderId,
            status: 'expired'
          })
        });
      } catch (error) {
        console.error('Failed to update expired status:', error);
      }
    }
    router.push(`/payment/expired?bookingCode=${bookingData?.bookingCode}`);
  };

  // Load booking data dengan data yang lebih lengkap
  useEffect(() => {
    const loadBookingData = () => {
      setLoading(true);
      setErrorMessage(null);
      
      try {
        console.log('🔍 Loading booking data from URL params...');
        
        // Ambil data dari URL parameters
        const bookingCode = searchParams.get('bookingCode');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const phone = searchParams.get('phone');
        const databaseId = searchParams.get('databaseId');
        const ticketNumber = searchParams.get('ticketNumber');
        const passengerCount = searchParams.get('passengerCount');
        const savedToDatabase = searchParams.get('savedToDatabase');
        const trainName = searchParams.get('trainName');
        const trainType = searchParams.get('trainType');
        const origin = searchParams.get('origin');
        const destination = searchParams.get('destination');
        const departureDate = searchParams.get('departureDate');
        const departureTime = searchParams.get('departureTime');
        const scheduleId = searchParams.get('scheduleId');
        const seatPremium = searchParams.get('seatPremium') || '0';
        const paymentFee = searchParams.get('paymentFee') || '0';

        console.log('📥 URL params:', {
          bookingCode, orderId, amount, name, email, phone, databaseId, ticketNumber
        });

        if (!bookingCode || !orderId || !amount || !name) {
          throw new Error('Data pemesanan tidak lengkap');
        }

        // Coba ambil data penumpang dari sessionStorage
        let passengers: Passenger[] = [];
        try {
          const sessionData = sessionStorage.getItem('currentBooking');
          if (sessionData) {
            const parsedData = JSON.parse(sessionData);
            if (parsedData.passengers && Array.isArray(parsedData.passengers)) {
              passengers = parsedData.passengers;
            }
          }
        } catch (e) {
          console.warn('Failed to load passengers from session:', e);
        }

        // Format data booking
        const formattedData: BookingData = {
          bookingCode,
          orderId,
          totalAmount: parseInt(amount),
          customerName: name,
          customerEmail: email || '',
          customerPhone: phone || '',
          trainDetail: {
            id: scheduleId || '1',
            trainCode: scheduleId ? `TR-${scheduleId.slice(-4)}` : 'TR-1234',
            trainName: trainName || 'Kereta Api Express',
            trainType: trainType || 'Eksekutif',
            departureTime: departureTime || '08:00',
            arrivalTime: '12:00',
            origin: origin || 'Stasiun A',
            destination: destination || 'Stasiun B',
            departureDate: departureDate || new Date().toISOString().split('T')[0]
          },
          passengers: passengers.length > 0 ? passengers : [{
            fullName: name,
            email: email || '',
            phoneNumber: phone || ''
          }],
          savedToDatabase: savedToDatabase === 'true',
          databaseId: databaseId || undefined,
          ticketNumber: ticketNumber || undefined,
          passengerCount: passengerCount ? parseInt(passengerCount) : 1,
          paymentMethod: searchParams.get('paymentMethod') || undefined
        };

        console.log('✅ Booking data loaded:', formattedData);
        setBookingData(formattedData);
        
        // Simpan ke sessionStorage
        sessionStorage.setItem('currentPayment', JSON.stringify(formattedData));
        
        // Generate virtual account number
        if (paymentMethod === 'virtual-account') {
          setVirtualAccountNumber(generateVirtualAccountNumber());
        }

      } catch (error: any) {
        console.error('❌ Error loading booking data:', error);
        
        // Fallback ke sessionStorage jika URL params tidak lengkap
        try {
          const sessionData = sessionStorage.getItem('currentPayment');
          if (sessionData) {
            console.log('🔄 Trying to load from sessionStorage...');
            const savedData = JSON.parse(sessionData);
            setBookingData(savedData);
            console.log('✅ Loaded from sessionStorage:', savedData.bookingCode);
          } else {
            throw new Error('No booking data found');
          }
        } catch (sessionError) {
          setErrorMessage('Data pemesanan tidak ditemukan. Silakan lakukan pemesanan ulang.');
          console.error('❌ No booking data available:', sessionError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [searchParams]);

  // Update virtual account number when payment method changes
  useEffect(() => {
    if (paymentMethod === 'virtual-account' && bookingData) {
      setVirtualAccountNumber(generateVirtualAccountNumber());
    }
  }, [paymentMethod, bookingData]);

  // Fungsi handlePayment yang lebih baik
  const handlePayment = async () => {
    if (!bookingData) {
      setErrorMessage('Data pemesanan tidak ditemukan');
      return;
    }

    if (processing) {
      console.log('⏳ Payment already in progress...');
      return;
    }

    console.log('💰 Starting payment process...');
    setProcessing(true);
    setMidtransLoading(true);
    setErrorMessage(null);
    setPaymentStatus('processing');

    try {
      // Siapkan data untuk API
      const paymentRequestData = {
        booking_code: bookingData.bookingCode,
        order_id: bookingData.orderId,
        customer_name: bookingData.customerName,
        customer_email: bookingData.customerEmail,
        customer_phone: bookingData.customerPhone,
        amount: getTotalWithFees(),
        payment_method: paymentMethod,
        selected_bank: paymentMethod === 'bank-transfer' ? selectedBank : '',
        virtual_account_number: paymentMethod === 'virtual-account' ? virtualAccountNumber : '',
        train_name: bookingData.trainDetail.trainName,
        train_type: bookingData.trainDetail.trainType,
        passenger_count: bookingData.passengerCount || 1
      };

      console.log('📤 Sending payment request:', paymentRequestData);

      // Untuk manual payment methods (bank transfer), skip Midtrans
      if (paymentMethod === 'bank-transfer') {
        setShowBankDetails(true);
        setProcessing(false);
        setMidtransLoading(false);
        return;
      }

      // Untuk virtual account, show details
      if (paymentMethod === 'virtual-account') {
        setShowBankDetails(true);
        setProcessing(false);
        setMidtransLoading(false);
        return;
      }

      // Untuk Midtrans-enabled methods (credit-card, e-wallet)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      let paymentResponse;
      try {
        paymentResponse = await fetch('/api/payment/create-transaction', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(paymentRequestData),
          signal: controller.signal
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Waktu permintaan habis. Silakan coba lagi.');
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      // Handle response
      if (!paymentResponse.ok) {
        let errorDetails = `HTTP ${paymentResponse.status}`;
        try {
          const errorText = await paymentResponse.text();
          if (errorText) {
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson.error || errorJson.message || errorDetails;
          }
        } catch {
          // Ignore parse error
        }
        
        console.error('❌ Payment API error:', errorDetails);
        
        // Fallback ke manual payment page
        router.push(`/payment/fallback?bookingCode=${bookingData.bookingCode}&orderId=${bookingData.orderId}&amount=${getTotalWithFees()}&name=${encodeURIComponent(bookingData.customerName)}&email=${encodeURIComponent(bookingData.customerEmail)}`);
        return;
      }

      // Parse response
      const paymentResult = await paymentResponse.json();
      console.log('📥 Payment API response:', paymentResult);

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || paymentResult.message || 'Pembayaran gagal');
      }

      // Simpan token untuk backup
      if (paymentResult.data?.token) {
        sessionStorage.setItem('paymentToken', paymentResult.data.token);
      }

      // Proses dengan Midtrans Snap
      const paymentToken = paymentResult.data?.token;
      const paymentUrl = paymentResult.data?.redirect_url;

      if (paymentToken && window.snap) {
        console.log('🔗 Processing with Midtrans Snap...');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        window.snap.pay(paymentToken, {
          onSuccess: async (result: any) => {
            console.log('✅ Payment success:', result);
            setPaymentStatus('success');
            
            // Update payment status
            try {
              await fetch('/api/payment/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: bookingData.orderId,
                  status: 'paid',
                  paymentData: result
                })
              });
            } catch (updateError) {
              console.warn('⚠️ Failed to update payment status:', updateError);
            }
            
            // Redirect ke success page
            router.push(`/payment/success?orderId=${bookingData.orderId}&bookingCode=${bookingData.bookingCode}`);
          },
          onPending: async (result: any) => {
            console.log('⏳ Payment pending:', result);
            setPaymentStatus('processing');
            
            try {
              await fetch('/api/payment/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: bookingData.orderId,
                  status: 'pending',
                  paymentData: result
                })
              });
            } catch (updateError) {
              console.warn('⚠️ Failed to update pending status:', updateError);
            }
            
            router.push(`/payment/processing?orderId=${bookingData.orderId}&bookingCode=${bookingData.bookingCode}`);
          },
          onError: async (error: any) => {
            console.log('❌ Payment error:', error);
            setPaymentStatus('failed');
            setErrorMessage('Pembayaran gagal. Silakan coba lagi.');
            setProcessing(false);
            setMidtransLoading(false);
          },
          onClose: () => {
            console.log('🚪 Payment popup closed by user');
            setPaymentStatus('idle');
            setProcessing(false);
            setMidtransLoading(false);
          }
        });
        
      } else if (paymentUrl) {
        // Redirect ke payment URL
        console.log('🔗 Redirecting to payment URL:', paymentUrl);
        window.location.href = paymentUrl;
        
      } else {
        // Fallback ke manual
        console.log('⚠️ No payment token or URL available, using fallback');
        router.push(`/payment/fallback?bookingCode=${bookingData.bookingCode}&orderId=${bookingData.orderId}&amount=${getTotalWithFees()}&name=${encodeURIComponent(bookingData.customerName)}&email=${encodeURIComponent(bookingData.customerEmail)}`);
      }

    } catch (error: any) {
      console.error('💥 Payment process error:', error);
      
      let userErrorMessage = 'Terjadi kesalahan saat memproses pembayaran';
      
      if (error.message.includes('timeout')) {
        userErrorMessage = 'Waktu permintaan habis. Silakan coba lagi.';
      } else if (error.message.includes('network')) {
        userErrorMessage = 'Koneksi internet terputus. Silakan cek koneksi Anda.';
      } else {
        userErrorMessage = error.message || 'Terjadi kesalahan yang tidak diketahui';
      }
      
      setErrorMessage(userErrorMessage);
      setProcessing(false);
      setMidtransLoading(false);
      setPaymentStatus('failed');
      
      // Fallback ke manual payment jika error
      if (bookingData) {
        setTimeout(() => {
          router.push(`/payment/fallback?bookingCode=${bookingData.bookingCode}&orderId=${bookingData.orderId}&amount=${getTotalWithFees()}&name=${encodeURIComponent(bookingData.customerName)}&email=${encodeURIComponent(bookingData.customerEmail)}`);
        }, 2000);
      }
    }
  };

  // Fungsi untuk konfirmasi pembayaran manual
  const handleManualPaymentConfirmation = async () => {
    if (!bookingData) return;
    
    try {
      setProcessing(true);
      
      await fetch('/api/payment/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: bookingData.orderId,
          status: 'pending_verification',
          paymentMethod: paymentMethod,
          amount: getTotalWithFees(),
          bank: selectedBank,
          virtualAccountNumber: virtualAccountNumber
        })
      });
      
      // Redirect ke konfirmasi manual
      router.push(`/payment/manual-confirmation?bookingCode=${bookingData.bookingCode}&orderId=${bookingData.orderId}&paymentMethod=${paymentMethod}&amount=${getTotalWithFees()}`);
      
    } catch (error) {
      console.error('Error updating manual payment:', error);
      setErrorMessage('Gagal menyimpan konfirmasi pembayaran');
      setProcessing(false);
    }
  };

  // Format waktu untuk countdown
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Handle script loading
  const handleScriptLoad = () => {
    console.log('✅ Midtrans Snap SDK loaded successfully');
    setScriptLoaded(true);
    setScriptError(false);
    
    // Deklarasi untuk TypeScript
    if (typeof window !== 'undefined') {
      (window as any).snap = (window as any).snap;
    }
  };

  const handleScriptError = (error: any) => {
    console.error('❌ Failed to load Midtrans Snap SDK:', error);
    setScriptError(true);
    setScriptLoaded(false);
    setErrorMessage('Gagal memuat sistem pembayaran otomatis. Silakan gunakan metode pembayaran manual.');
  };

  // Hitung total dengan biaya tambahan
  const getTotalWithFees = () => {
    if (!bookingData) return 0;
    const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);
    const fees = selectedMethod?.fees || 0;
    
    // Ambil seat premium dan payment fee dari URL params
    const seatPremium = parseInt(searchParams.get('seatPremium') || '0');
    const paymentFeeParam = parseInt(searchParams.get('paymentFee') || '0');
    
    return bookingData.totalAmount + fees + seatPremium + paymentFeeParam;
  };

  // Hitung detail biaya
  const getFareBreakdown = () => {
    if (!bookingData) {
      return {
        baseFare: 0,
        seatPremium: 0,
        adminFee: 0,
        insuranceFee: 0,
        paymentFee: 0,
        total: 0
      };
    }
    
    const seatPremium = parseInt(searchParams.get('seatPremium') || '0');
    const paymentFeeParam = parseInt(searchParams.get('paymentFee') || '0');
    const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);
    const paymentFee = selectedMethod?.fees || paymentFeeParam;
    
    const baseFare = bookingData.totalAmount - seatPremium - paymentFee - 15000; // Kurangi biaya-biaya
    
    return {
      baseFare,
      seatPremium,
      adminFee: 5000,
      insuranceFee: 10000,
      paymentFee,
      total: getTotalWithFees()
    };
  };

  // Render bank details untuk transfer manual
  const renderBankDetails = () => {
    if (!bookingData || !showBankDetails) return null;
    
    const selectedMethod = PAYMENT_METHODS.find(m => m.id === paymentMethod);
    const bankName = selectedMethod?.banks?.find(b => 
      b.toLowerCase().replace(' ', '-').replace(' va', '-va') === selectedBank ||
      b.toLowerCase() === selectedBank
    );
    
    if (!bankName) return null;
    
    // Generate account number based on bank
    const getAccountNumber = () => {
      if (paymentMethod === 'virtual-account') {
        return virtualAccountNumber;
      }
      
      // For manual bank transfer
      const bankCodes: {[key: string]: string} = {
        'bca': '1234567890',
        'bni': '0987654321',
        'mandiri': '1122334455',
        'bri': '5566778899',
        'bca-va': virtualAccountNumber,
        'bni-va': virtualAccountNumber,
        'mandiri-va': virtualAccountNumber
      };
      
      return bankCodes[selectedBank] || '1234567890';
    };
    
    const getAccountName = () => {
      return paymentMethod === 'virtual-account' ? 'TripGo Customer' : 'PT TripGo Indonesia';
    };
    
    return (
      <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-center mb-4">
          <InfoIcon />
          <h3 className="ml-3 font-bold text-blue-800 text-lg">Instruksi Pembayaran</h3>
        </div>
        
        {paymentMethod === 'bank-transfer' ? (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-4">Transfer ke Rekening:</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-bold text-lg">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nomor Rekening:</span>
                  <span className="font-bold font-mono text-xl">{getAccountNumber()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Atas Nama:</span>
                  <span className="font-bold">{getAccountName()}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">Jumlah Transfer:</span>
                  <span className="font-bold text-2xl text-[#FD7E14]">{formatCurrency(getTotalWithFees())}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-3">Langkah-langkah:</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 pl-2">
                <li>Lakukan transfer ke rekening di atas</li>
                <li>Simpan bukti transfer (screenshot/photo)</li>
                <li>Klik tombol "Konfirmasi Pembayaran" di bawah</li>
                <li>Upload bukti transfer pada halaman konfirmasi</li>
                <li>Tunggu verifikasi dari admin (max 1x24 jam)</li>
              </ol>
            </div>
          </div>
        ) : paymentMethod === 'virtual-account' ? (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-4">Virtual Account:</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank:</span>
                  <span className="font-bold text-lg">{bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nomor Virtual Account:</span>
                  <span className="font-bold font-mono text-xl tracking-wider">{virtualAccountNumber}</span>
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">Jumlah Pembayaran:</span>
                  <span className="font-bold text-2xl text-[#FD7E14]">{formatCurrency(getTotalWithFees())}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-3">Cara Bayar:</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 pl-2">
                <li>Masuk ke internet/mobile banking {bankName.replace(' Virtual Account', '')}</li>
                <li>Pilih menu "Transfer" → "Virtual Account"</li>
                <li>Masukkan nomor virtual account di atas</li>
                <li>Jumlah pembayaran akan otomatis terisi</li>
                <li>Konfirmasi dan selesaikan pembayaran</li>
                <li>Status akan otomatis terupdate dalam 5-15 menit</li>
              </ol>
            </div>
          </div>
        ) : null}
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setShowBankDetails(false)}
            className="flex-1 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
          >
            Kembali
          </button>
          <button
            onClick={handleManualPaymentConfirmation}
            disabled={processing}
            className={`flex-1 py-3.5 bg-[#FD7E14] text-white font-semibold rounded-xl transition-all ${
              processing 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-[#E06700] shadow-lg hover:shadow-xl'
            }`}
          >
            {processing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
          </button>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!bookingData || errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon />
              <span className="ml-2 font-medium">Kembali</span>
            </button>
          </div>
        </header>
        
        <main className="flex-grow flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Data Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'Data pemesanan tidak ditemukan. Silakan lakukan pemesanan ulang.'}
            </p>
            
            <div className="space-y-3">
              <Link 
                href="/"
                className="block w-full py-3 bg-[#FD7E14] text-white font-semibold rounded-xl hover:bg-[#E06700] transition-colors"
              >
                Kembali ke Beranda
              </Link>
              
              <Link 
                href="/booking"
                className="block w-full py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cari Kereta Lain
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const fareBreakdown = getFareBreakdown();

  return (
    <>
      {/* Script Midtrans dengan proper error handling */}
      <Script
        id="midtrans-snap-sdk"
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YourClientKey'}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />
      
      {/* Loading Overlay */}
      {(midtransLoading || processing) && !showBankDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-sm mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {midtransLoading ? 'Menyiapkan Pembayaran...' : 'Memproses Pembayaran...'}
            </h3>
            <p className="text-gray-600 text-sm mb-2">
              {midtransLoading 
                ? 'Sedang menghubungkan ke sistem pembayaran...' 
                : 'Harap tunggu, mengarahkan ke halaman pembayaran...'
              }
            </p>
            <p className="text-gray-500 text-xs">Jangan tutup atau refresh halaman ini</p>
          </div>
        </div>
      )}
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon />
              <span className="ml-2 font-medium">Kembali</span>
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Script Error Warning */}
          {scriptError && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-yellow-700 font-semibold">Sistem Pembayaran Otomatis Tidak Tersedia</p>
                  <p className="text-yellow-600 text-sm">Gunakan metode pembayaran manual (Transfer Bank/Virtual Account)</p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Pembayaran Tiket</h1>
            <p className="text-gray-600 mt-2">Selesaikan pembayaran sebelum batas waktu berakhir</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Konten Utama */}
            <div className="lg:col-span-2 space-y-6">
              {/* Timer Countdown */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <TimerIcon />
                    </div>
                    <div className="ml-4">
                      <h3 className="font-bold text-red-700">Selesaikan Pembayaran Sebelum</h3>
                      <p className="text-sm text-red-600">Batas waktu pembayaran akan berakhir</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-red-600">{formatTime(timeLeft)}</div>
                    <p className="text-sm text-red-500">menit : detik</p>
                  </div>
                </div>
              </div>

              {/* Detail Pemesanan */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Detail Pemesanan</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Kode Booking</span>
                      <p className="font-semibold font-mono text-lg">{bookingData.bookingCode}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Order ID</span>
                      <p className="font-semibold font-mono text-sm">{bookingData.orderId}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Tanggal Pemesanan</span>
                    <p className="font-semibold">
                      {new Date().toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {/* Detail Perjalanan */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-700 mb-4">Detail Perjalanan</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
                        <div>
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <TrainIcon />
                            </div>
                            <div className="ml-4">
                              <h3 className="font-bold text-lg text-gray-800">{bookingData.trainDetail.trainName}</h3>
                              <div className="flex items-center mt-1">
                                <span className={`px-2 py-1 text-xs rounded font-medium ${
                                  bookingData.trainDetail.trainType === 'Executive' ? 'bg-blue-100 text-blue-800' :
                                  bookingData.trainDetail.trainType === 'Business' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {bookingData.trainDetail.trainType}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 py-6 border-y">
                        <div>
                          <div className="flex items-center text-gray-600 mb-1">
                            <CalendarIcon />
                            <span className="ml-2 text-sm">Tanggal</span>
                          </div>
                          <p className="font-semibold text-gray-800">
                            {formatDate(bookingData.trainDetail.departureDate)}
                          </p>
                        </div>
                        
                        <div className="text-center">
                          <div className="flex items-center justify-center text-gray-600 mb-1">
                            <ClockIcon />
                            <span className="ml-2 text-sm">Durasi</span>
                          </div>
                          <p className="font-semibold text-gray-800">5j 0m</p>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center justify-end text-gray-600 mb-1">
                            <UserIcon />
                            <span className="ml-2 text-sm">Penumpang</span>
                          </div>
                          <p className="font-semibold text-gray-800">{bookingData.passengerCount || 1} orang</p>
                        </div>
                      </div>
                      
                      <div className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">{bookingData.trainDetail.departureTime}</p>
                            <p className="text-gray-600 mt-1">{bookingData.trainDetail.origin}</p>
                          </div>
                          
                          <div className="text-center flex-1 mx-8">
                            <div className="relative">
                              <div className="h-0.5 bg-gray-300 w-full"></div>
                              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-400 rounded-full"></div>
                              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-400 rounded-full"></div>
                              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">5j 0m</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">12:00</p>
                            <p className="text-gray-600 mt-1">{bookingData.trainDetail.destination}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Penumpang */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-4">Penumpang</h3>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="space-y-4">
                        {bookingData.passengers.map((passenger, index) => (
                          <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border">
                            <div>
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                                  <span className="font-bold text-orange-700">{index + 1}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-800">{passenger.fullName}</span>
                                  {passenger.seatNumber && (
                                    <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                                      Kursi: {passenger.seatNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 mt-2 sm:mt-0">
                              {passenger.email}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Pilih Metode Pembayaran</h2>
                
                <div className="space-y-4">
                  {PAYMENT_METHODS.map((method) => (
                    <div key={method.id}>
                      <div 
                        className={`border rounded-xl p-5 cursor-pointer transition-all hover:border-orange-300 ${
                          paymentMethod === method.id 
                            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-100' 
                            : 'border-gray-300'
                        }`}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                              paymentMethod === method.id ? 'border-orange-500 bg-orange-500' : 'border-gray-400'
                            }`}>
                              {paymentMethod === method.id && (
                                <div className="w-2 h-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                                <span className="text-2xl">{method.icon}</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800">{method.name}</h3>
                                <p className="text-sm text-gray-600">{method.description}</p>
                              </div>
                            </div>
                          </div>
                          
                          {method.fees > 0 ? (
                            <span className="text-gray-600 font-medium">
                              +{formatCurrency(method.fees)}
                            </span>
                          ) : (
                            <span className="text-green-600 font-medium">Gratis</span>
                          )}
                        </div>
                        
                        {paymentMethod === method.id && method.banks && (
                          <div className="mt-4 ml-14 pl-2">
                            <p className="text-sm text-gray-600 mb-3">Pilih Bank:</p>
                            <div className="flex flex-wrap gap-2">
                              {method.banks.map(bank => (
                                <div 
                                  key={`bank-${bank}`} 
                                  className={`px-4 py-2 bg-white border rounded-lg text-sm transition-colors ${
                                    selectedBank === bank.toLowerCase().replace(' ', '-').replace(' va', '-va')
                                      ? 'border-orange-500 text-orange-700 bg-orange-50' 
                                      : 'border-gray-300 text-gray-700 hover:border-orange-300 hover:text-orange-700'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const bankCode = bank.toLowerCase().replace(' ', '-').replace(' va', '-va');
                                    setSelectedBank(bankCode);
                                  }}
                                >
                                  {bank}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tampilkan detail bank untuk pembayaran manual */}
                {renderBankDetails()}

                {/* Tombol Bayar untuk metode otomatis */}
                {!showBankDetails && (paymentMethod === 'credit-card' || paymentMethod === 'e-wallet') && (
                  <div className="mt-8">
                    <button
                      onClick={handlePayment}
                      disabled={processing || !scriptLoaded}
                      className={`w-full py-4 rounded-xl font-bold transition-all text-lg ${
                        processing || !scriptLoaded
                          ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                          : 'bg-[#FD7E14] text-white hover:bg-[#E06700] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                      }`}
                    >
                      {processing ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          Memproses Pembayaran...
                        </div>
                      ) : (
                        `Bayar ${formatCurrency(getTotalWithFees())}`
                      )}
                    </button>
                    
                    {!scriptLoaded && !scriptError && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                          <p className="text-sm text-blue-600">Menyiapkan sistem pembayaran...</p>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-500 text-center mt-4">
                      Dengan melanjutkan, Anda menyetujui syarat dan ketentuan kami.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Ringkasan */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Ringkasan Pembayaran</h2>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Tagihan</span>
                    <span className="text-3xl font-bold text-[#FD7E14]">
                      {formatCurrency(fareBreakdown.total)}
                    </span>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-700 mb-4">Detail Biaya</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-gray-700">
                        <span className="text-gray-600">Tiket Kereta</span>
                        <span>{formatCurrency(fareBreakdown.baseFare)}</span>
                      </div>
                      {fareBreakdown.seatPremium > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span className="text-gray-600">Tambahan kursi premium</span>
                          <span className="text-green-600">+{formatCurrency(fareBreakdown.seatPremium)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-700">
                        <span className="text-gray-600">Biaya Admin</span>
                        <span>{formatCurrency(fareBreakdown.adminFee)}</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span className="text-gray-600">Asuransi Perjalanan</span>
                        <span>{formatCurrency(fareBreakdown.insuranceFee)}</span>
                      </div>
                      {fareBreakdown.paymentFee > 0 && (
                        <div className="flex justify-between text-gray-700">
                          <span className="text-gray-600">Biaya Pembayaran</span>
                          <span>+{formatCurrency(fareBreakdown.paymentFee)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Booking Info */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Kode Booking</span>
                        <span className="font-mono font-bold text-gray-800">{bookingData.bookingCode}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Order ID</span>
                        <span className="font-mono text-xs text-gray-600">{bookingData.orderId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status</span>
                        <span className="text-sm font-medium text-orange-600">
                          {showBankDetails ? 'Menunggu Konfirmasi' : 'Menunggu Pembayaran'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Info */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Kontak Utama</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div className="font-medium">{bookingData.customerName}</div>
                      <div>{bookingData.customerEmail}</div>
                      <div>{bookingData.customerPhone}</div>
                    </div>
                  </div>
                  
                  {/* Informasi Penting */}
                  <div className="border-t pt-6">
                    <h3 className="font-bold text-gray-700 mb-4">Informasi Penting</h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <ClockIcon />
                        </div>
                        <span className="text-gray-600">Batas waktu pembayaran 30 menit</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <CheckIcon />
                        </div>
                        <span className="text-gray-600">E-ticket dikirim ke email setelah pembayaran</span>
                      </li>
                      <li className="flex items-start">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <CheckIcon />
                        </div>
                        <span className="text-gray-600">Pembayaran diproses otomatis</span>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Butuh Bantuan */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-700 mb-3">Butuh Bantuan?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Hubungi kami di <span className="font-semibold">1500-123</span> atau email <span className="font-semibold">support@tripgo.com</span>
                    </p>
                    
                    {/* Manual Payment Link */}
                    <button
                      onClick={() => router.push(`/payment/fallback?bookingCode=${bookingData.bookingCode}&orderId=${bookingData.orderId}&amount=${getTotalWithFees()}&name=${encodeURIComponent(bookingData.customerName)}&email=${encodeURIComponent(bookingData.customerEmail)}`)}
                      className="w-full py-2.5 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Kesulitan dengan pembayaran otomatis?
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-12">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="text-center text-gray-400 text-sm">
              <p>© 2024 TripGo. All rights reserved.</p>
              <p className="mt-2">Pembayaran aman dan terenkripsi</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

// --- Export dengan Suspense ---
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat halaman pembayaran...</p>
        </div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}