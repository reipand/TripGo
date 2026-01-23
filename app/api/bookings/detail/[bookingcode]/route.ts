// app/api/bookings/detail/[bookingCode]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// **PERBAIKAN: Gunakan service role key**
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingcode: string } }
) {
  try {
    const bookingCode = params.bookingcode;

    if (!bookingCode) {
      return NextResponse.json(
        { success: false, message: 'Booking code diperlukan' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching details for booking: ${bookingCode}`);

    // **PERBAIKAN: Ambil data booking dengan fallback ke payment_transactions**
    let booking = null;
    let bookingError = null;

    // Coba cari di bookings_kereta
    const { data: bookingData, error: bookingDataError } = await supabase
      .from('bookings_kereta')
      .select('*')
      .eq('booking_code', bookingCode)
      .single();

    if (!bookingDataError && bookingData) {
      booking = bookingData;
      console.log(`✅ Booking found in bookings_kereta: ${booking.booking_code}`);
    } else {
      console.log(`⚠️ Booking not found in bookings_kereta, checking payment_transactions...`);

      // Coba cari di payment_transactions
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('booking_id', bookingCode)
        .single();

      if (!paymentError && paymentData) {
        console.log(`✅ Found in payment_transactions, creating booking object...`);
        // Buat booking object dari payment data
        booking = {
          id: paymentData.id,
          booking_code: bookingCode,
          created_at: paymentData.created_at,
          total_amount: paymentData.amount,
          status: paymentData.status,
          passenger_count: 1,
          order_id: paymentData.order_id,
          passenger_name: paymentData.customer_name,
          passenger_email: paymentData.customer_email,
          payment_status: paymentData.status,
          payment_method: paymentData.payment_method,
          // Field lainnya bisa kosong
          passenger_phone: '',
          train_name: 'Kereta Api',
          origin: '',
          destination: '',
          departure_date: '',
          departure_time: '',
          arrival_time: ''
        };
      } else {
        return NextResponse.json(
          {
            success: false,
            message: 'Booking tidak ditemukan',
            debug: {
              bookingCode,
              bookingError: bookingDataError?.message,
              paymentError: paymentError?.message
            }
          },
          { status: 404 }
        );
      }
    }

    // **PERBAIKAN: Ambil data terkait secara paralel**
    const [passengersResult, ticketResult, paymentResult] = await Promise.allSettled([
      // Penumpang
      booking.id ? supabase
        .from('penumpang')
        .select('*')
        .eq('booking_id', booking.id)
        .order('passenger_order', { ascending: true }) :
        Promise.resolve({ data: null, error: null }),

      // Tiket
      supabase
        .from('tickets')
        .select('*')
        .eq('booking_id', bookingCode)
        .single(),

      // Pembayaran
      booking.order_id ? supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', booking.order_id)
        .single() :
        Promise.resolve({ data: null, error: null })
    ]);

    // Proses hasil
    const passengers = passengersResult.status === 'fulfilled' ?
      passengersResult.value.data || [] : [];

    const ticket = ticketResult.status === 'fulfilled' ?
      (ticketResult.value.data || null) : null;

    const payment = paymentResult.status === 'fulfilled' ?
      (paymentResult.value.data || null) : null;

    // Enriched Metadata
    const enrichedBooking = {
      ...booking,
      pnr_number: booking.pnr_number || `PNR${bookingCode.slice(-6).toUpperCase()}`,
      passenger_count: passengers.length || booking.passenger_count || 1,
      // Ensure seat numbers are available as an array
      seat_numbers: booking.seat_numbers || (ticket?.seat_number ? [ticket.seat_number] : passengers.map(p => p.seat_number).filter(Boolean))
    };

    console.log(`✅ Detail loaded:`, {
      booking: enrichedBooking.booking_code,
      passengers: passengers.length,
      hasTicket: !!ticket,
      hasPayment: !!payment
    });

    return NextResponse.json({
      success: true,
      data: {
        booking: enrichedBooking,
        passengers,
        ticket,
        payment,
        metadata: {
          has_passengers: passengers.length > 0,
          has_ticket: !!ticket,
          has_payment: !!payment,
          total_passengers: passengers.length || 1
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching booking details:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Terjadi kesalahan saat mengambil data booking',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// **PERBAIKAN: Tambahkan POST handler untuk consistency**
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const bookingCode = body.bookingcode || body.bookingCode;

    if (!bookingCode) {
      return NextResponse.json(
        { success: false, message: 'bookingCode diperlukan' },
        { status: 400 }
      );
    }

    // Redirect ke GET dengan parameter yang sama
    return NextResponse.json({
      success: true,
      message: 'Gunakan GET endpoint untuk detail booking',
      get_endpoint: `/api/bookings/detail/${bookingCode}`
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Invalid request' },
      { status: 400 }
    );
  }
}