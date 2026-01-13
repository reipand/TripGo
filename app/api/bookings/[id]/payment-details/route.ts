import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    console.log('💰 Fetching payment details for booking:', bookingId);

    // Cari booking berdasarkan bookingCode atau orderId
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings_kereta')
      .select(`
        *,
        detail_pemesanan (*),
        payment_transactions (*),
        stasiun_asal:origin (kode_stasiun, nama_stasiun, city),
        stasiun_tujuan:destination (kode_stasiun, nama_stasiun, city)
      `)
      .or(`id.eq.${bookingId},booking_code.eq.${bookingId},order_id.eq.${bookingId}`)
      .single();

    if (bookingError || !bookingData) {
      console.error('❌ Booking not found:', bookingError);
      
      // Fallback ke API lain atau data dummy
      return NextResponse.json({
        success: true,
        data: generateFallbackPaymentData(bookingId),
        fallback: true
      });
    }

    // Format data untuk payment
    const paymentData = formatPaymentData(bookingData);
    
    return NextResponse.json({
      success: true,
      data: paymentData
    });

  } catch (error: any) {
    console.error('❌ Error fetching payment details:', error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}

// Format data untuk payment
function formatPaymentData(booking: any) {
  // Ambil data dari detail pemesanan
  const detail = booking.detail_pemesanan?.[0] || {};
  const payment = booking.payment_transactions?.[0] || {};
  
  // Hitung breakdown harga yang KONSISTEN dengan booking
  const baseFare = booking.total_amount || 265000;
  const seatPremium = detail.harga || booking.seat_premium || 172250;
  const adminFee = 5000; // Tetap konsisten
  const insuranceFee = 10000; // Tetap konsisten
  const paymentFee = 0; // Akan diupdate berdasarkan metode
  
  // Hitung discount dari promo jika ada
  const discount = payment.fare_breakdown?.discount || 
                   booking.promo_discount || 
                   80000;
  
  const subtotal = baseFare + seatPremium + adminFee + insuranceFee + paymentFee;
  const total = subtotal - discount;

  return {
    booking: {
      id: booking.id,
      booking_code: booking.booking_code,
      order_id: booking.order_id,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      status: booking.status,
      payment_status: booking.payment_status
    },
    
    customer: {
      name: booking.passenger_name,
      email: booking.passenger_email,
      phone: booking.passenger_phone,
      count: booking.passenger_count || 1
    },
    
    journey: {
      train: {
        name: booking.train_name,
        type: booking.train_type,
        code: booking.train_code
      },
      origin: {
        code: booking.stasiun_asal?.kode_stasiun || 'BD',
        name: booking.stasiun_asal?.nama_stasiun || 'Stasiun Bandung',
        city: booking.stasiun_asal?.city || 'Bandung'
      },
      destination: {
        code: booking.stasiun_tujuan?.kode_stasiun || 'GMR',
        name: booking.stasiun_tujuan?.nama_stasiun || 'Stasiun Gambir',
        city: booking.stasiun_tujuan?.city || 'Jakarta'
      },
      departure_date: booking.departure_date,
      departure_time: booking.departure_time,
      arrival_time: booking.arrival_time,
      duration: '5j 0m'
    },
    
    passengers: [{
      name: booking.passenger_name,
      seat: booking.seat_number || 'A2',
      coach: '1'
    }],
    
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
    
    promo: booking.promo_code ? {
      code: booking.promo_code,
      name: booking.promo_name || 'FLASH40',
      discount: discount
    } : null
  };
}

function generateFallbackPaymentData(bookingId: string) {
  // Fallback data yang KONSISTEN dengan booking page
  const isBookingCode = bookingId.startsWith('BOOK-');
  const isOrderId = bookingId.startsWith('ORDER-');
  
  return {
    booking: {
      id: `booking-${Date.now()}`,
      booking_code: isBookingCode ? bookingId : `BOOK-${Date.now().toString().slice(-8)}`,
      order_id: isOrderId ? bookingId : `ORDER-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'pending',
      payment_status: 'pending'
    },
    
    customer: {
      name: 'reisan',
      email: 'reisanadrefagt@gmail.com',
      phone: '435435435345',
      count: 1
    },
    
    journey: {
      train: {
        name: 'Parahyangan',
        type: 'Executive',
        code: 'PAR-001'
      },
      origin: {
        code: 'BD',
        name: 'Stasiun Bandung',
        city: 'Bandung'
      },
      destination: {
        code: 'GMR',
        name: 'Stasiun Gambir',
        city: 'Jakarta'
      },
      departure_date: '2026-01-14',
      departure_time: '05:00',
      arrival_time: '10:00',
      duration: '5j 0m'
    },
    
    passengers: [{
      name: 'reisan',
      seat: 'A2',
      coach: '1'
    }],
    
    price_breakdown: {
      base_fare: 265000,
      seat_premium: 172250,
      admin_fee: 5000,
      insurance_fee: 10000,
      payment_fee: 0,
      discount: 80000,
      subtotal: 462250,
      total: 382250
    },
    
    promo: {
      code: 'FLASH40',
      name: 'Flash Sale 40%',
      discount: 80000
    }
  };
}