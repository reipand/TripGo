// app/api/payments/webhook/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const notification = await request.json();
    
    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      payment_type,
      signature_key,
      settlement_time,
      status_code,
      transaction_id
    } = notification;
    
    console.log('🔔 Midtrans Webhook Received:', {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount
    });
    
    // 1. Validasi signature (penting untuk keamanan)
    if (process.env.NODE_ENV === 'production') {
      const expectedSignature = crypto
        .createHash('sha512')
        .update(
          order_id +
          status_code +
          gross_amount +
          process.env.MIDTRANS_SERVER_KEY
        )
        .digest('hex');
      
      if (signature_key !== expectedSignature) {
        console.error('❌ Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 400 }
        );
      }
    }
    
    // 2. Cari payment transaction
    const { data: payment, error: paymentError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', order_id)
      .single();
    
    if (paymentError || !payment) {
      console.error('❌ Payment transaction not found:', order_id);
      return NextResponse.json(
        { error: 'Payment transaction not found' },
        { status: 404 }
      );
    }
    
    // 3. Update payment status
    let paymentStatus = 'pending';
    let bookingStatus = 'waiting_payment';
    let isPaid = false;
    
    switch (transaction_status) {
      case 'capture':
        if (fraud_status === 'accept') {
          paymentStatus = 'paid';
          bookingStatus = 'confirmed';
          isPaid = true;
        } else {
          paymentStatus = 'failed';
          bookingStatus = 'cancelled';
        }
        break;
      case 'settlement':
        paymentStatus = 'paid';
        bookingStatus = 'confirmed';
        isPaid = true;
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
    
    console.log(`📊 Updating status: payment=${paymentStatus}, booking=${bookingStatus}`);
    
    // 4. Update payment transaction
    const { error: updatePaymentError } = await supabase
      .from('payment_transactions')
      .update({
        status: paymentStatus,
        transaction_data: notification,
        updated_at: new Date().toISOString(),
        settlement_time: settlement_time || null
      })
      .eq('id', payment.id);
    
    if (updatePaymentError) {
      console.error('❌ Update payment error:', updatePaymentError);
      throw new Error('Failed to update payment status');
    }
    
    // 5. Update booking status
    const { data: booking, error: bookingError } = await supabase
      .from('bookings_kereta')
      .select('*')
      .eq('order_id', order_id)
      .single();
    
    if (!bookingError && booking) {
      // Update booking
      await supabase
        .from('bookings_kereta')
        .update({
          status: bookingStatus,
          payment_status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id);
      
      console.log(`✅ Booking ${booking.booking_code} updated to ${bookingStatus}`);
      
      // 6. Jika pembayaran berhasil, buat invoice dan tiket
      if (isPaid) {
        console.log(`💰 Payment successful, creating invoice and ticket for ${booking.booking_code}`);
        
        // Buat invoice
        const invoiceNumber = `INV-${order_id.slice(-8)}-${Date.now().toString(36)}`;
        await supabase
          .from('invoices')
          .insert({
            booking_id: booking.id,
            invoice_number: invoiceNumber,
            total_amount: gross_amount,
            payment_method: payment_type,
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            transaction_id: transaction_id
          });
        
        // Buat tiket otomatis
        await generateTicket(booking, payment);
      }
    }
    
    // 7. Log activity
    await supabase
      .from('activity_logs')
      .insert({
        action: 'payment_webhook',
        description: `Payment ${paymentStatus} for order ${order_id}`,
        data: {
          order_id,
          transaction_status,
          payment_status: paymentStatus,
          booking_status: bookingStatus,
          amount: gross_amount,
          booking_code: booking?.booking_code
        },
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      payment_status: paymentStatus,
      booking_status: bookingStatus
    });
    
  } catch (err: any) {
    console.error('❌ Webhook processing error:', err);
    
    // Log error
    await supabase
      .from('activity_logs')
      .insert({
        action: 'payment_webhook_error',
        description: 'Failed to process payment webhook',
        data: { error: err.message },
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Helper function untuk generate tiket
async function generateTicket(booking: any, payment: any) {
  try {
    // Cek apakah sudah ada tiket
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id')
      .eq('booking_id', booking.booking_code)
      .single();
    
    if (existingTicket) {
      console.log('✅ Ticket already exists');
      return existingTicket;
    }
    
    // Buat nomor tiket unik
    const ticketNumber = `TICKET-${booking.booking_code}`;
    
    // Buat QR Code
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketNumber)}`;
    
    // Insert tiket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        ticket_number: ticketNumber,
        booking_id: booking.booking_code,
        order_id: booking.order_id,
        customer_email: booking.passenger_email || payment.customer_email,
        customer_name: booking.passenger_name || payment.customer_name,
        qr_code: qrCodeUrl,
        status: 'active',
        train_name: booking.train_name,
        origin: booking.origin,
        destination: booking.destination,
        departure_date: booking.departure_date,
        departure_time: booking.departure_time,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();
    
    if (ticketError) {
      console.error('❌ Ticket creation failed:', ticketError);
      return null;
    }
    
    console.log(`✅ Ticket created: ${ticketNumber}`);
    return ticket;
    
  } catch (error) {
    console.error('❌ Generate ticket error:', error);
    return null;
  }
}