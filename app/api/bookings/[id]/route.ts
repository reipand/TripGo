import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    console.log('📋 Fetching booking:', bookingId);

    // Cari booking dengan berbagai identifier
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings_kereta')
      .select(`
        *,
        detail_pemesanan (*),
        payment_transactions (*)
      `)
      .or(`id.eq.${bookingId},booking_code.eq.${bookingId},order_id.eq.${bookingId}`)
      .single();

    if (bookingError) {
      console.error('❌ Booking not found:', bookingError);
      
      // Fallback ke data dummy jika tidak ditemukan
      return NextResponse.json({
        success: true,
        data: generateMockBooking(bookingId),
        fallback: true
      });
    }

    if (!bookingData) {
      return NextResponse.json({
        success: false,
        message: 'Booking not found'
      }, { status: 404 });
    }

    // Format data booking
    const formattedBooking = formatBookingData(bookingData);
    
    return NextResponse.json({
      success: true,
      data: formattedBooking
    });

  } catch (error: any) {
    console.error('❌ Error fetching booking:', error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// Format booking data
function formatBookingData(booking: any) {
  const payment = booking.payment_transactions?.[0] || {};
  const details = booking.detail_pemesanan?.[0] || {};
  
  // Calculate total and breakdown
  const baseFare = booking.total_amount || 265000;
  const seatPremium = details.harga || 172250;
  const adminFee = 5000;
  const insuranceFee = 10000;
  const paymentFee = 2000;
  const discount = payment.fare_breakdown?.discount || 80000;
  
  const subtotal = baseFare + seatPremium + adminFee + insuranceFee + paymentFee;
  const total = subtotal - discount;

  return {
    id: booking.id,
    booking_code: booking.booking_code,
    order_id: booking.order_id,
    
    // Passenger info
    passenger: {
      name: booking.passenger_name || 'reisan',
      email: booking.passenger_email || 'reisanadrefagt@gmail.com',
      phone: booking.passenger_phone || '435435435345',
      count: booking.passenger_count || 1
    },
    
    // Train info
    train: {
      name: booking.train_name || 'Parahyangan',
      type: booking.train_type || 'Executive',
      code: booking.train_code || 'PAR-001'
    },
    
    // Journey info
    journey: {
      origin: booking.origin || 'Bandung',
      destination: booking.destination || 'Gambir',
      departure_date: booking.departure_date || '2026-01-14',
      departure_time: booking.departure_time || '05:00',
      arrival_time: booking.arrival_time || '10:00',
      duration: '5j 0m'
    },
    
    // Seat info
    seat: {
      number: 'A2',
      coach: '1',
      premium_price: seatPremium
    },
    
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
    
    // Status
    status: booking.status || 'pending',
    payment_status: booking.payment_status || 'pending',
    payment_method: booking.payment_method || '',
    
    // Dates
    created_at: booking.created_at,
    updated_at: booking.updated_at,
    
    // Promo info
    promo: {
      code: 'FLASH40',
      description: 'Diskon 40% untuk 50 pembeli pertama',
      discount: discount
    }
  };
}

// Generate mock data for development
function generateMockBooking(bookingId: string) {
  const isBookingCode = bookingId.startsWith('BOOK-');
  const isOrderId = bookingId.startsWith('ORDER-');
  
  return {
    id: `booking-${Date.now()}`,
    booking_code: isBookingCode ? bookingId : `BOOK-${Date.now().toString().slice(-8)}`,
    order_id: isOrderId ? bookingId : `ORDER-${Date.now()}`,
    
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
      premium_price: 172250
    },
    
    price_breakdown: {
      base_fare: 265000,
      seat_premium: 172250,
      admin_fee: 5000,
      insurance_fee: 10000,
      payment_fee: 2000,
      discount: 80000,
      subtotal: 454250,
      total: 374250
    },
    
    status: 'pending',
    payment_status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    promo: {
      code: 'FLASH40',
      description: 'Diskon 40% untuk 50 pembeli pertama',
      discount: 80000
    }
  };
}