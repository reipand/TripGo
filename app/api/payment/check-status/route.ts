import { NextRequest, NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Midtrans
const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY!
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    console.log('Checking payment status for:', orderId);

    // 1. Check status from Midtrans
    let statusResponse;
    try {
      statusResponse = await snap.transaction.status(orderId);
      console.log('Midtrans status response:', statusResponse);
    } catch (midtransError: any) {
      console.error('Midtrans status check error:', midtransError);
      
      // For development/testing, simulate success
      if (process.env.NODE_ENV === 'development') {
        statusResponse = {
          transaction_status: 'settlement',
          order_id: orderId,
          gross_amount: '265000',
          payment_type: 'bank_transfer',
          transaction_time: new Date().toISOString()
        };
        console.log('Using mock Midtrans response for development');
      } else {
        throw new Error(`Midtrans error: ${midtransError.message}`);
      }
    }

    const transactionStatus = statusResponse.transaction_status;

    // 2. Update payment status in database
    const { data: paymentData, error: paymentError } = await supabase
      .from('payment_transactions')
      .update({
        status: transactionStatus,
        payment_data: statusResponse,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .select()
      .single();

    if (paymentError) {
      console.error('Error updating payment status:', paymentError);
    }

    // 3. Update booking status if payment is successful
    if (transactionStatus === 'settlement') {
      try {
        // Update bookings_kereta table
        const { error: bookingError } = await supabase
          .from('bookings_kereta')
          .update({
            status: 'confirmed',
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('booking_code', statusResponse.order_id || orderId);

        if (bookingError) {
          console.error('Error updating booking status:', bookingError);
          
          // Try alternative table name
          const { error: altBookingError } = await supabase
            .from('bookings')
            .update({
              payment_status: 'paid',
              status: 'confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('payment_order_id', orderId);

          if (altBookingError) {
            console.error('Error updating alternative booking:', altBookingError);
          }
        }
      } catch (bookingErr) {
        console.error('Booking update exception:', bookingErr);
      }
    }

    // 4. Return status response
    return NextResponse.json({
      success: true,
      status: transactionStatus,
      data: statusResponse,
      message: transactionStatus === 'settlement' ? 'Payment completed successfully' :
               transactionStatus === 'pending' ? 'Payment is pending' :
               transactionStatus === 'expire' ? 'Payment has expired' :
               'Payment status updated'
    });

  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        status: 'error'
      },
      { status: 500 }
    );
  }
}