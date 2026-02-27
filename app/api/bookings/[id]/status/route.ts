import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const body = await request.json();
    const { status, payment_status, payment_method } = body;

    console.log('🔄 Updating booking status:', { bookingId, status, payment_status });

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings_kereta')
      .update({
        status,
        payment_status,
        payment_method,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create notification jika status berubah
    if (status === 'confirmed' || payment_status === 'paid') {
      await supabase.from('notifications').insert({
        user_id: updatedBooking.user_id,
        type: 'booking',
        title: 'Booking Dikonfirmasi',
        message: `Booking ${updatedBooking.booking_code} telah dikonfirmasi`,
        booking_id: updatedBooking.id,
        booking_code: updatedBooking.booking_code,
        data: { status, payment_status }
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedBooking
    });

  } catch (error: any) {
    console.error('❌ Error updating booking status:', error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
