// app/api/payments/webhook/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      payment_type,
      signature_key
    } = body;

    // 1. Verify signature key (penting untuk keamanan)
    const expectedSignature = crypto
      .createHash('sha512')
      .update(
        order_id +
        transaction_status +
        gross_amount +
        process.env.MIDTRANS_SERVER_KEY
      )
      .digest('hex');

    if (signature_key !== expectedSignature && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // 2. Find payment transaction
    const { data: payment, error: paymentError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', order_id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment transaction not found' },
        { status: 404 }
      );
    }

    // 3. Update payment status
    let paymentStatus = 'pending';
    let bookingStatus = 'waiting_payment';

    switch (transaction_status) {
      case 'capture':
        if (fraud_status === 'accept') {
          paymentStatus = 'success';
          bookingStatus = 'confirmed';
        } else {
          paymentStatus = 'failed';
          bookingStatus = 'cancelled';
        }
        break;
      case 'settlement':
        paymentStatus = 'success';
        bookingStatus = 'confirmed';
        break;
      case 'pending':
        paymentStatus = 'pending';
        bookingStatus = 'waiting_payment';
        break;
      case 'deny':
      case 'cancel':
      case 'expire':
        paymentStatus = 'failed';
        bookingStatus = 'cancelled';
        break;
      default:
        paymentStatus = 'pending';
    }

    // 4. Update payment transaction
    const { error: updatePaymentError } = await supabase
      .from('payment_transactions')
      .update({
        status: paymentStatus,
        transaction_data: body,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    if (updatePaymentError) {
      console.error('Update payment error:', updatePaymentError);
      throw new Error('Failed to update payment status');
    }

    // 5. Update booking status
    let bookingTable = 'bookings_kereta';
    let bookingIdColumn = 'booking_code';
    
    const { data: booking, error: bookingError } = await supabase
      .from(bookingTable)
      .select('*')
      .eq(bookingIdColumn, payment.booking_id)
      .single();

    if (!bookingError && booking) {
      await supabase
        .from(bookingTable)
        .update({
          status: bookingStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);

      // Jika pembayaran berhasil, buat invoice dan tiket
      if (paymentStatus === 'success') {
        // Buat invoice
        const invoiceNumber = `INV-${order_id.slice(-8)}`;
        await supabase
          .from('invoices')
          .insert({
            booking_id: booking.id,
            invoice_number: invoiceNumber,
            total_amount: gross_amount,
            tax_amount: 0,
            service_fee: 0,
            insurance_fee: 0,
            discount_amount: 0,
            final_amount: gross_amount,
            payment_method: payment_type,
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          });

        // Buat tiket
        const ticketNumber = `TICKET-${order_id.slice(-8)}`;
        await supabase
          .from('tickets')
          .insert({
            ticket_number: ticketNumber,
            order_id: order_id,
            booking_id: payment.booking_id,
            customer_email: payment.customer_email,
            customer_name: payment.customer_name,
            qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketNumber}`,
            status: 'active',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          });
      }
    }

    // 6. Create activity log
    await supabase
      .from('activity_logs')
      .insert({
        action: 'payment_webhook_received',
        data: {
          order_id,
          transaction_status,
          paymentStatus,
          booking_status: bookingStatus,
          amount: gross_amount
        },
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent')
      });

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      payment_status: paymentStatus,
      booking_status: bookingStatus
    });

  } catch (err: any) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process webhook',
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined
      },
      { status: 500 }
    );
  }
}

