// app/api/bookings/[ref]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  try {
    // PERBAIKAN: Await params karena params adalah Promise
    const { ref } = await params;
    const bookingRef = ref;

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        jadwal_kereta (
          travel_date,
          kereta (
            code,
            name,
            operator
          )
        ),
        booking_items (
          seat_number,
          price,
          train_seats (
            coach_id,
            class_type
          )
        )
      `)
      .eq('booking_reference', bookingRef)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking tidak ditemukan' },
        { status: 404 }
      );
    }

    // Format response
    const response = {
      booking_reference: booking.booking_reference,
      status: booking.status,
      passenger: {
        name: booking.passenger_name,
        email: booking.passenger_email,
        phone: booking.passenger_phone
      },
      train: {
        code: booking.jadwal_kereta?.kereta?.code,
        name: booking.jadwal_kereta?.kereta?.name,
        operator: booking.jadwal_kereta?.kereta?.operator,
        travel_date: booking.jadwal_kereta?.travel_date
      },
      seats: booking.booking_items?.map((item: { seat_number: any; train_seats: { class_type: any; }; price: any; }) => ({
        seat_number: item.seat_number,
        class_type: item.train_seats?.class_type,
        price: item.price
      })),
      payment: {
        total: booking.total_price,
        method: booking.payment_method,
        status: booking.status === 'paid' ? 'success' : 'pending',
        expired_at: booking.payment_expired_at
      },
      created_at: booking.created_at,
      updated_at: booking.updated_at
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}