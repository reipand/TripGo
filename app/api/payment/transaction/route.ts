import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const bookingCode = searchParams.get('bookingCode');

    if (!orderId && !bookingCode) {
      return NextResponse.json(
        { success: false, error: 'Order ID atau Booking Code diperlukan' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('payment_transactions')
      .select('*')
      .eq('status', 'success');

    if (orderId) {
      query = query.eq('order_id', orderId);
    } else if (bookingCode) {
      query = query.eq('booking_id', 
        supabase.from('bookings_kereta')
          .select('id')
          .eq('booking_code', bookingCode)
          .single()
      );
    }

    const { data, error } = await query.single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Error fetching payment transaction:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data pembayaran' },
      { status: 500 }
    );
  }
}