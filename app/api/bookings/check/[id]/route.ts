import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingCode } = await params;
    
    if (!bookingCode) {
      return NextResponse.json(
        { error: 'Booking code is required' },
        { status: 400 }
      );
    }

    console.log(`[CheckBooking] Checking booking: ${bookingCode}`);

    // 1. Cek booking di bookings_kereta
    const { data: booking, error: bookingError } = await supabase
      .from('bookings_kereta')
      .select(`
        id,
        booking_code,
        total_amount,
        status,
        booking_date,
        created_at,
        invoices (
          id,
          invoice_number,
          payment_status,
          paid_at
        ),
        detail_pemesanan (
          id,
          harga,
          status,
          penumpang (
            id,
            nama,
            nik,
            email,
            phone
          )
        )
      `)
      .eq('booking_code', bookingCode)
      .single();

    if (bookingError) {
      if (bookingError.code === 'PGRST116') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Booking not found',
            bookingCode: bookingCode
          },
          { status: 404 }
        );
      }
      console.error('[CheckBooking] Error:', bookingError);
      return NextResponse.json(
        { error: `Database error: ${bookingError.message}` },
        { status: 500 }
      );
    }

    // 2. Cek payment transaction
    const { data: payment } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('booking_id', bookingCode)
      .maybeSingle();

    // 3. Format response
    const response = {
      success: true,
      data: {
        booking: {
          id: booking.id,
          bookingCode: booking.booking_code,
          totalAmount: booking.total_amount,
          status: booking.status,
          bookingDate: booking.booking_date,
          createdAt: booking.created_at
        },
        invoice: booking.invoices?.[0] || null,
        passengers: booking.detail_pemesanan?.map((item: any) => ({
          name: item.penumpang?.nama,
          nik: item.penumpang?.nik,
          email: item.penumpang?.email,
          phone: item.penumpang?.phone,
          price: item.harga,
          status: item.status
        })) || [],
        payment: payment ? {
          orderId: payment.order_id,
          amount: payment.amount,
          paymentMethod: payment.payment_method,
          status: payment.status,
          paymentUrl: payment.payment_url
        } : null
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[CheckBooking] Server error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Internal server error: ${error.message}`
      },
      { status: 500 }
    );
  }
}
