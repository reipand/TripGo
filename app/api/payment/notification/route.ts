// /api/payment/notification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';
import crypto from 'crypto';

// Midtrans Configuration
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;

// Verifikasi signature Midtrans
function verifySignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string): boolean {
  const data = orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY;
  const hash = crypto.createHash('sha512').update(data).digest('hex');
  return hash === signatureKey;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Midtrans notification received:', body);

    const {
      order_id: orderId,
      transaction_status: transactionStatus,
      status_code: statusCode,
      gross_amount: grossAmount,
      signature_key: signatureKey,
      payment_type: paymentType,
      fraud_status: fraudStatus,
      settlement_time: settlementTime,
      transaction_time: transactionTime
    } = body;

    // Verifikasi signature
    const isValidSignature = verifySignature(
      orderId,
      statusCode,
      grossAmount,
      signatureKey
    );

    if (!isValidSignature) {
      console.error('Invalid signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Cari booking berdasarkan order_id
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', orderId);
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Tentukan status berdasarkan transaction status Midtrans
    let status = 'pending';
    let paymentStatus = 'pending';

    switch (transactionStatus) {
      case 'capture':
      case 'settlement':
        status = 'confirmed';
        paymentStatus = 'paid';
        break;
      case 'pending':
        status = 'pending';
        paymentStatus = 'pending';
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
        status = 'cancelled';
        paymentStatus = 'failed';
        break;
      case 'refund':
      case 'partial_refund':
        status = 'refunded';
        paymentStatus = 'refunded';
        break;
    }

    // Update booking status
    const { error: updateBookingError } = await supabase
      .from('bookings')
      .update({
        status: status,
        payment_status: paymentStatus,
        payment_method: paymentType,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id);

    if (updateBookingError) throw updateBookingError;

    // Update invoice
    const { error: updateInvoiceError } = await supabase
      .from('invoices')
      .update({
        payment_status: paymentStatus,
        payment_method: paymentType,
        payment_date: settlementTime || transactionTime || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('booking_id', booking.id);

    if (updateInvoiceError) throw updateInvoiceError;

    // Jika pembayaran sukses, update seat status
    if (paymentStatus === 'paid') {
      // Update seat status to confirmed
      const { error: seatError } = await supabase
        .from('train_seats')
        .update({
          status: 'confirmed'
        })
        .eq('booking_id', booking.id);

      if (seatError) console.warn('Seat update error:', seatError);

      // TODO: Kirim email konfirmasi
      // sendConfirmationEmail(booking);
    }

    console.log(`Payment notification processed: ${orderId} - ${transactionStatus}`);

    return NextResponse.json({
      success: true,
      message: 'Notification processed successfully',
      orderId,
      transactionStatus,
      status,
      paymentStatus
    });

  } catch (error: any) {
    console.error('Payment notification error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to process notification' 
      },
      { status: 500 }
    );
  }
}

// Endpoint untuk testing (GET)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Payment notification endpoint is running',
    status: 'active'
  });
}