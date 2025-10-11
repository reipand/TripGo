import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Midtrans Sandbox Configuration
const MIDTRANS_CONFIG = {
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YourServerKey',
  baseUrl: 'https://api.sandbox.midtrans.com/v2'
};

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transaction_details,
      item_details,
      customer_details,
      payment_type,
      enabled_payments
    } = body;

    // Validate required fields
    if (!transaction_details || !item_details || !customer_details) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare Midtrans transaction data
    const midtransData = {
      transaction_details: {
        order_id: transaction_details.order_id,
        gross_amount: transaction_details.gross_amount
      },
      item_details,
      customer_details,
      payment_type,
      enabled_payments,
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending`,
        error: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error`
      }
    };

    // Create transaction in Midtrans
    const midtransResponse = await fetch(`${MIDTRANS_CONFIG.baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${Buffer.from(MIDTRANS_CONFIG.serverKey + ':').toString('base64')}`
      },
      body: JSON.stringify(midtransData)
    });

    if (!midtransResponse.ok) {
      const errorData = await midtransResponse.text();
      console.error('Midtrans API Error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create transaction with Midtrans' },
        { status: 500 }
      );
    }

    const midtransResult = await midtransResponse.json();

    // Save transaction to database
    const { data: transactionData, error: dbError } = await supabase
      .from('transactions')
      .insert({
        order_id: transaction_details.order_id,
        midtrans_transaction_id: midtransResult.transaction_id,
        amount: transaction_details.gross_amount,
        status: 'pending',
        payment_type,
        customer_email: customer_details.email,
        customer_name: `${customer_details.first_name} ${customer_details.last_name}`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database Error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: midtransResult.token,
      transaction_id: midtransResult.transaction_id,
      order_id: transaction_details.order_id,
      status: 'success'
    });

  } catch (error) {
    console.error('Payment API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle payment notification from Midtrans
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, transaction_status, fraud_status } = body;

    if (!order_id) {
      return NextResponse.json(
        { error: 'Missing order_id' },
        { status: 400 }
      );
    }

    // Update transaction status in database
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        status: transaction_status,
        fraud_status,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', order_id);

    if (updateError) {
      console.error('Update Error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    // If payment is successful, create booking
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
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
        // Don't fail the payment notification, just log the error
      }
    }

    return NextResponse.json({ status: 'success' });

  } catch (error) {
    console.error('Payment notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
