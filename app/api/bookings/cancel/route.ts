import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_code, cancellation_reason, user_id } = body;

    if (!booking_code) {
      return NextResponse.json(
        { success: false, error: 'Booking code diperlukan' },
        { status: 400 }
      );
    }

    console.log('❌ Cancelling booking:', booking_code);

    // 1. Cari booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings_kereta')
      .select('*')
      .eq('booking_code', booking_code)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking tidak ditemukan' },
        { status: 404 }
      );
    }

    // 2. Validasi bisa dicancel
    const canCancel = booking.status === 'confirmed' || booking.status === 'waiting_payment';
    if (!canCancel) {
      return NextResponse.json(
        { success: false, error: 'Booking tidak dapat dibatalkan' },
        { status: 400 }
      );
    }

    // 3. Update booking status
    const { error: updateError } = await supabase
      .from('bookings_kereta')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateError) throw updateError;

    // 4. Create cancellation record
    const cancellationData = {
      booking_id: booking.id,
      user_id: user_id,
      cancellation_reason: cancellation_reason,
      refund_amount: booking.status === 'confirmed' ? Math.floor(booking.total_amount * 0.5) : 0, // 50% refund
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: cancelError } = await supabase
      .from('booking_cancellations')
      .insert(cancellationData);

    if (cancelError) {
      console.warn('⚠️ Error creating cancellation record:', cancelError);
    }

    // 5. Update seat status menjadi available lagi
    const { error: seatError } = await supabase
      .from('train_seats')
      .update({
        status: 'available',
        booking_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('booking_id', booking.id);

    if (seatError) {
      console.warn('⚠️ Error updating seat status:', seatError);
    }

    // 6. Update legacy bookings table
    await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('booking_code', booking_code);

    console.log('✅ Booking cancelled successfully:', booking_code);

    return NextResponse.json({
      success: true,
      message: 'Booking berhasil dibatalkan',
      data: {
        booking_code: booking.booking_code,
        status: 'cancelled',
        refund_amount: cancellationData.refund_amount
      }
    });

  } catch (error: any) {
    console.error('❌ Error cancelling booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal membatalkan booking'
      },
      { status: 500 }
    );
  }
}