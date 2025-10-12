import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client with fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huwcvhngslkmfljfnxrv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1d2N2aG5nc2xrbWZsamZueHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODA0NjQsImV4cCI6MjA3MjQ1NjQ2NH0.EFKYTaaftNNV0W_4buhjPA5hFS35CHYCqr5nWw54TWg';

const supabase = createClient(supabaseUrl, supabaseKey);

// Midtrans webhook signature verification
const verifySignature = (requestBody: string, signature: string): boolean => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YourServerKey';
  const expectedSignature = crypto
    .createHash('sha512')
    .update(requestBody + serverKey)
    .digest('hex');
  
  return signature === expectedSignature;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-midtrans-signature') || '';
    
    // Verify webhook signature
    if (!verifySignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const notification = JSON.parse(body);
    const {
      order_id,
      transaction_status,
      fraud_status,
      transaction_id,
      payment_type,
      gross_amount,
      settlement_time,
      status_code,
      status_message
    } = notification;

    console.log('Payment webhook received:', {
      order_id,
      transaction_status,
      fraud_status,
      transaction_id
    });

    // Update transaction status in database
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: transaction_status,
        fraud_status,
        transaction_id,
        payment_type,
        settlement_time,
        status_code,
        status_message,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', order_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    // If payment is successful, create booking
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      try {
        // Get transaction details
        const { data: transaction, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('order_id', order_id)
          .single();

        if (fetchError || !transaction) {
          console.error('Transaction fetch error:', fetchError);
          return NextResponse.json(
            { error: 'Transaction not found' },
            { status: 404 }
          );
        }

        // Create booking record
        const { error: bookingError } = await supabase
          .from('bookings')
          .insert({
            transaction_id: transaction.id,
            order_id: order_id,
            customer_email: transaction.customer_email,
            customer_name: transaction.customer_name,
            total_amount: transaction.amount,
            status: 'confirmed',
            booking_date: new Date().toISOString()
          });

        if (bookingError) {
          console.error('Booking creation error:', bookingError);
          // Don't fail the webhook, just log the error
        } else {
          console.log('Booking created successfully for order:', order_id);
        }

        // Send notification to user
        await supabase
          .from('notifications')
          .insert({
            user_id: transaction.user_id || null,
            type: 'payment_success',
            title: 'Pembayaran Berhasil',
            message: `Pembayaran untuk order ${order_id} berhasil diproses. Tiket Anda akan segera dikirim.`,
            data: {
              order_id,
              transaction_id,
              amount: transaction.amount
            },
            created_at: new Date().toISOString()
          });

      } catch (error) {
        console.error('Error processing successful payment:', error);
        // Don't fail the webhook
      }
    }

    // Handle failed payments
    if (transaction_status === 'deny' || transaction_status === 'failure') {
      try {
        const { data: transaction } = await supabase
          .from('transactions')
          .select('user_id')
          .eq('order_id', order_id)
          .single();

        if (transaction?.user_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: transaction.user_id,
              type: 'payment_failed',
              title: 'Pembayaran Gagal',
              message: `Pembayaran untuk order ${order_id} gagal. Silakan coba metode pembayaran lain.`,
              data: {
                order_id,
                transaction_id,
                status: transaction_status
              },
              created_at: new Date().toISOString()
            });
        }
      } catch (error) {
        console.error('Error processing failed payment notification:', error);
      }
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Payment webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
