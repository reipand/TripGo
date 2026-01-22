import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// Validasi UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Validasi booking code format
function isValidBookingCode(code: string): boolean {
  const bookingCodeRegex = /^(BOOK-|DEV)[A-Z0-9-]+$/i;
  return bookingCodeRegex.test(code);
}

// Validasi order ID format
function isValidOrderId(orderId: string): boolean {
  const orderIdRegex = /^ORDER-[A-Z0-9-]+$/i;
  return orderIdRegex.test(orderId);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // PERBAIKAN PENTING: Await params terlebih dahulu
    const { id } = await params;
    const bookingId = id;
    console.log('📋 Fetching booking:', bookingId);

    if (!bookingId || bookingId.trim() === '') {
      console.error('❌ No booking ID provided');
      return NextResponse.json({
        success: false,
        message: 'Booking ID is required',
        fallback: true
      }, { status: 400 });
    }

    // Sanitize input untuk keamanan
    const sanitizedId = encodeURIComponent(bookingId.trim());

    // PERBAIKAN: Tentukan tipe ID untuk query yang tepat
    let bookingData: any = null;
    
    // Strategy 1: Coba berdasarkan tipe ID
    let query = supabase
      .from('bookings_kereta')
      .select('*');

    // PERBAIKAN: Hindari SQL injection dengan menggunakan .eq() terpisah
    if (isValidUUID(bookingId)) {
      // Jika ini UUID, cari berdasarkan id
      console.log('🔍 Searching by UUID');
      const { data, error } = await query
        .eq('id', bookingId)
        .maybeSingle();
      
      if (!error && data) {
        bookingData = data;
      }
    } 
    else if (isValidBookingCode(bookingId)) {
      // Jika ini booking code
      console.log('🔍 Searching by booking code');
      const { data, error } = await query
        .eq('booking_code', bookingId)
        .maybeSingle();
      
      if (!error && data) {
        bookingData = data;
      }
    }
    else if (isValidOrderId(bookingId)) {
      // Jika ini order ID
      console.log('🔍 Searching by order ID');
      const { data, error } = await query
        .eq('order_id', bookingId)
        .maybeSingle();
      
      if (!error && data) {
        bookingData = data;
      }
    }
    
    // Strategy 2: Jika belum ketemu, coba dengan ILIKE
    if (!bookingData) {
      console.log('🔄 Trying case-insensitive search');
      const { data: searchResults, error: searchError } = await supabase
        .from('bookings_kereta')
        .select('*')
        .or(`booking_code.ilike.%${sanitizedId}%,order_id.ilike.%${sanitizedId}%`)
        .limit(1);
      
      if (!searchError && searchResults && searchResults.length > 0) {
        bookingData = searchResults[0];
      }
    }

    // Strategy 3: Cari berdasarkan email jika booking code mengandung @
    if (!bookingData && bookingId.includes('@')) {
      console.log('📧 Searching by email');
      const { data: emailResults, error: emailError } = await supabase
        .from('bookings_kereta')
        .select('*')
        .eq('passenger_email', bookingId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!emailError && emailResults && emailResults.length > 0) {
        bookingData = emailResults[0];
      }
    }

    // PERBAIKAN: Jika tidak ada data, gunakan mock
    if (!bookingData) {
      console.log('📝 No booking found in database, using mock data');
      
      // Coba cari di localStorage untuk mock data
      try {
        // Simulasi: Cari di mock storage
        const mockStorageData = await searchInMockStorage(bookingId);
        if (mockStorageData) {
          console.log('✅ Found in mock storage');
          return NextResponse.json({
            success: true,
            data: mockStorageData,
            fallback: true,
            source: 'mock_storage'
          });
        }
      } catch (mockError) {
        console.log('⚠️ Mock storage search failed:', mockError);
      }
      
      return NextResponse.json({
        success: true,
        data: generateMockBooking(bookingId),
        fallback: true,
        source: 'generated_mock'
      });
    }

    console.log('✅ Found booking in database:', bookingData.booking_code);

    // PERBAIKAN: Ambil data payment dengan error handling yang lebih baik
    let paymentData = null;
    let detailData = null;
    
    try {
      // Ambil payment data jika order_id ada
      if (bookingData.order_id) {
        const { data: payment, error: paymentError } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('order_id', bookingData.order_id)
          .maybeSingle();
          
        if (!paymentError && payment) {
          paymentData = payment;
        }
      }
      
    } catch (paymentError: any) {
      console.log('⚠️ Payment data not available:', paymentError.message);
    }
    
    try {
      // Coba ambil detail pemesanan jika ada - dengan error handling
      const { data: detail, error: detailError } = await supabase
        .from('detail_pemesanan')
        .select('*')
        .eq('booking_id', bookingData.id)
        .maybeSingle();
        
      if (!detailError && detail) {
        detailData = detail;
      }
    } catch (detailError: any) {
      console.log('⚠️ Detail data not available:', detailError.message);
    }

    // PERBAIKAN: Format data dengan aman
    const formattedBooking = formatBookingData(bookingData, paymentData, detailData);
    
    return NextResponse.json({
      success: true,
      data: formattedBooking,
      fallback: false,
      source: 'database'
    });

  } catch (error: any) {
    console.error('💥 Unhandled error in booking API:', error);
    
    // PERBAIKAN: Generate safe mock data bahkan saat error
    try {
      // Coba dapatkan bookingId dari params (dengan cara yang aman)
      let bookingId = 'unknown';
      try {
        const paramsObj = await params;
        bookingId = paramsObj?.id || 'unknown';
      } catch {
        bookingId = 'unknown';
      }
      
      const safeMockData = generateMockBooking(bookingId);
      
      return NextResponse.json({
        success: true,
        data: safeMockData,
        fallback: true,
        error: error.message,
        source: 'error_fallback'
      });
    } catch (mockError) {
      // Fallback absolute
      return NextResponse.json({
        success: false,
        message: 'Internal server error',
        error: error.message
      }, { status: 500 });
    }
  }
}

// Helper untuk mencari di mock storage (simulasi localStorage di server)
async function searchInMockStorage(bookingId: string): Promise<any> {
  // Ini adalah simulasi - dalam implementasi nyata, 
  // Anda mungkin menyimpan data mock di Redis atau database cache
  const mockStorage = {
    'DEV687534YOJD': generateMockBooking('DEV687534YOJD'),
    'DEV894397YRZ4': generateMockBooking('DEV894397YRZ4'),
    'BOOK-123456': generateMockBooking('BOOK-123456')
  };
  
  return mockStorage[bookingId] || null;
}

// PERBAIKAN: Update formatBookingData untuk menerima parameter yang aman
function formatBookingData(booking: any, payment?: any, detail?: any) {
  // Default values untuk menghindari undefined
  const safeBooking = booking || {};
  const safePayment = payment || {};
  const safeDetail = detail || {};
  
  // Calculate total and breakdown dengan fallback values
  const baseFare = safeBooking.total_amount || 265000;
  const seatPremium = safeDetail.harga || (safeBooking.seat_premium || 172250);
  const adminFee = safeBooking.admin_fee || 5000;
  const insuranceFee = safeBooking.insurance_fee || 10000;
  const paymentFee = safePayment.payment_fee || (safeBooking.payment_fee || 2000);
  
  // Handle fare breakdown dari payment atau detail
  let discount = 0;
  
  // Cari discount dari berbagai sumber
  if (safePayment.fare_breakdown) {
    try {
      const breakdown = typeof safePayment.fare_breakdown === 'string' 
        ? JSON.parse(safePayment.fare_breakdown)
        : safePayment.fare_breakdown;
      discount = breakdown.discount || 0;
    } catch {
      discount = 0;
    }
  }
  
  // Gunakan discount dari promo jika ada
  if (safeBooking.promo_discount) {
    discount = Math.max(discount, safeBooking.promo_discount);
  }
  
  if (safeBooking.discount_amount) {
    discount = Math.max(discount, safeBooking.discount_amount);
  }

  const subtotal = baseFare + seatPremium + adminFee + insuranceFee + paymentFee;
  const total = Math.max(0, subtotal - discount);

  // Tangani data transit jika ada
  const hasTransit = !!safeBooking.transit_station || 
                    !!safeBooking.transit_details ||
                    (safeBooking.transit_info && Object.keys(safeBooking.transit_info).length > 0);

  // Parse transit info
  let transitInfo = null;
  if (hasTransit) {
    try {
      if (safeBooking.transit_details && typeof safeBooking.transit_details === 'string') {
        transitInfo = JSON.parse(safeBooking.transit_details);
      } else if (safeBooking.transit_details && typeof safeBooking.transit_details === 'object') {
        transitInfo = safeBooking.transit_details;
      } else if (safeBooking.transit_station) {
        transitInfo = {
          transit_station: safeBooking.transit_station,
          transit_arrival: safeBooking.transit_arrival,
          transit_departure: safeBooking.transit_departure,
          transit_duration: '15 menit'
        };
      }
    } catch (e) {
      console.log('⚠️ Error parsing transit info:', e);
      transitInfo = {
        transit_station: 'Stasiun Transit',
        transit_duration: '15 menit'
      };
    }
  }

  return {
    id: safeBooking.id || `booking-${Date.now()}`,
    booking_code: safeBooking.booking_code || `BOOK-${Date.now().toString().slice(-8)}`,
    order_id: safeBooking.order_id || `ORDER-${Date.now()}`,
    
    // Passenger info dengan fallback
    passenger: {
      name: safeBooking.passenger_name || safeBooking.customer_name || safeBooking.guest_name || 'Penumpang',
      email: safeBooking.passenger_email || safeBooking.customer_email || safeBooking.guest_email || '',
      phone: safeBooking.passenger_phone || safeBooking.customer_phone || safeBooking.guest_phone || '',
      count: safeBooking.passenger_count || 1
    },
    
    // Train info dengan fallback
    train: {
      name: safeBooking.train_name || 'Kereta Api',
      type: safeBooking.train_type || safeBooking.train_class || 'Ekonomi',
      code: safeBooking.train_code || 'KA-001'
    },
    
    // Journey info dengan fallback
    journey: {
      origin: safeBooking.origin || 'Stasiun A',
      destination: safeBooking.destination || 'Stasiun B',
      departure_date: safeBooking.departure_date || new Date().toISOString().split('T')[0],
      departure_time: safeBooking.departure_time || '08:00',
      arrival_time: safeBooking.arrival_time || '12:00',
      duration: calculateDuration(
        safeBooking.departure_time || '08:00',
        safeBooking.arrival_time || '12:00'
      )
    },
    
    // Seat info dengan fallback
    seat: {
      number: safeBooking.selected_seats?.[0] || safeDetail.seat_number || 'A1',
      coach: safeDetail.coach || '1',
      premium_price: seatPremium
    },
    
    // Transit info jika ada
    has_transit: hasTransit,
    transit_info: transitInfo,
    
    // Price breakdown
    price_breakdown: {
      base_fare: baseFare,
      seat_premium: seatPremium,
      admin_fee: adminFee,
      insurance_fee: insuranceFee,
      payment_fee: paymentFee,
      discount: discount,
      subtotal: subtotal,
      total: total
    },
    
    // Status dengan mapping yang jelas
    status: mapStatus(safeBooking.status),
    payment_status: mapPaymentStatus(safeBooking.payment_status || safePayment.status),
    payment_method: safeBooking.payment_method || safePayment.payment_method || '',
    
    // Dates dengan fallback
    created_at: safeBooking.created_at || new Date().toISOString(),
    updated_at: safeBooking.updated_at || new Date().toISOString(),
    
    // Promo info jika ada
    promo: safeBooking.promo_code ? {
      code: safeBooking.promo_code,
      description: safeBooking.promo_description || 'Diskon khusus',
      discount: discount
    } : null,
    
    // Metadata tambahan
    metadata: {
      source: safeBooking.id ? 'database' : 'mock',
      has_payment: !!safePayment,
      has_detail: !!safeDetail,
      is_guest: !!safeBooking.is_guest
    }
  };
}

// Helper function untuk calculate duration
function calculateDuration(departure: string, arrival: string): string {
  try {
    const [depHour, depMin] = departure.split(':').map(Number);
    const [arrHour, arrMin] = arrival.split(':').map(Number);
    
    let totalMinutes = (arrHour * 60 + arrMin) - (depHour * 60 + depMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Handle overnight
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}j ${minutes}m`;
  } catch {
    return '4j 0m';
  }
}

// Helper function untuk mapping status
function mapStatus(status: string): string {
  if (!status) return 'pending';
  
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'waiting_payment': 'pending',
    'confirmed': 'confirmed',
    'paid': 'confirmed',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'canceled': 'cancelled',
    'expired': 'expired',
    'success': 'confirmed'
  };
  
  return statusMap[status.toLowerCase()] || 'pending';
}

// Helper function untuk mapping payment status
function mapPaymentStatus(paymentStatus: string): string {
  if (!paymentStatus) return 'pending';
  
  const paymentMap: Record<string, string> = {
    'pending': 'pending',
    'waiting': 'pending',
    'paid': 'paid',
    'settled': 'paid',
    'failed': 'failed',
    'expired': 'expired',
    'refunded': 'refunded',
    'success': 'paid'
  };
  
  return paymentMap[paymentStatus.toLowerCase()] || 'pending';
}

// PERBAIKAN: Generate mock data yang lebih aman dan realistik
function generateMockBooking(bookingId: string) {
  // Pastikan bookingId adalah string
  const safeBookingId = bookingId || 'unknown';
  
  // Generate safe IDs
  const timestamp = Date.now().toString();
  let bookingCode = `BOOK-${timestamp.slice(-8)}`;
  let orderId = `ORDER-${timestamp}`;
  
  // Jika bookingId sudah dalam format yang valid, gunakan itu
  if (isValidBookingCode(safeBookingId)) {
    bookingCode = safeBookingId;
  } else if (isValidOrderId(safeBookingId)) {
    orderId = safeBookingId;
  } else if (safeBookingId.startsWith('DEV')) {
    bookingCode = safeBookingId;
  }
  
  const baseFare = 265000;
  const seatPremium = 172250;
  const adminFee = 5000;
  const insuranceFee = 10000;
  const paymentFee = 2000;
  const discount = 80000;
  const subtotal = baseFare + seatPremium + adminFee + insuranceFee + paymentFee;
  const total = subtotal - discount;
  
  // Randomly add transit info for some bookings
  const hasTransit = Math.random() > 0.5;
  
  return {
    id: `mock-${timestamp}`,
    booking_code: bookingCode,
    order_id: orderId,
    
    passenger: {
      name: 'reisan',
      email: 'reisanadrefagt@gmail.com',
      phone: '435435435345',
      count: 1
    },
    
    train: {
      name: 'Parahyangan',
      type: 'Executive',
      code: 'PAR-001'
    },
    
    journey: {
      origin: 'Bandung',
      destination: 'Gambir',
      departure_date: '2026-01-14',
      departure_time: '05:00',
      arrival_time: '10:00',
      duration: '5j 0m'
    },
    
    seat: {
      number: 'A2',
      coach: '1',
      premium_price: seatPremium
    },
    
    has_transit: hasTransit,
    transit_info: hasTransit ? {
      transit_station: 'Stasiun Cirebon',
      transit_arrival: '07:30',
      transit_departure: '07:45',
      transit_duration: '15 menit'
    } : null,
    
    price_breakdown: {
      base_fare: baseFare,
      seat_premium: seatPremium,
      admin_fee: adminFee,
      insurance_fee: insuranceFee,
      payment_fee: paymentFee,
      discount: discount,
      subtotal: subtotal,
      total: total
    },
    
    status: 'confirmed',
    payment_status: 'paid',
    payment_method: 'e-wallet',
    
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    promo: {
      code: 'FLASH40',
      description: 'Diskon 40% untuk 50 pembeli pertama',
      discount: discount
    },
    
    metadata: {
      source: 'mock',
      has_payment: true,
      has_detail: false
    }
  };
}

// PERBAIKAN: Tambahkan handler untuk metode lain
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    success: false,
    message: 'Method not allowed'
  }, { status: 405 });
}