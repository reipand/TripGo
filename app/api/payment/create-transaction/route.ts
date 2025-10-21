import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
<<<<<<< HEAD
import midtransClient from 'midtrans-client';

// Midtrans Configuration (Sandbox)
const MIDTRANS_CONFIG = {
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YourServerKey',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YourClientKey',
  baseUrl: process.env.MIDTRANS_BASE_URL || 'https://api.sandbox.midtrans.com/v2',
  isProduction: false,
};

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Midtrans Snap client
const snap = new midtransClient.Snap({
  isProduction: MIDTRANS_CONFIG.isProduction,
  serverKey: MIDTRANS_CONFIG.serverKey,
  clientKey: MIDTRANS_CONFIG.clientKey,
});
=======

// Midtrans Sandbox Configuration
const MIDTRANS_CONFIG = {
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YourServerKey',
  baseUrl: 'https://api.sandbox.midtrans.com/v2'
};

// Initialize Supabase client with fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huwcvhngslkmfljfnxrv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1d2N2aG5nc2xrbWZsamZueHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODA0NjQsImV4cCI6MjA3MjQ1NjQ2NH0.EFKYTaaftNNV0W_4buhjPA5hFS35CHYCqr5nWw54TWg';

const supabase = createClient(supabaseUrl, supabaseKey);
>>>>>>> 93a879e (fix fitur)

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
<<<<<<< HEAD
        { error: 'Missing required fields: transaction_details, item_details, customer_details' },
=======
        { error: 'Missing required fields' },
>>>>>>> 93a879e (fix fitur)
        { status: 400 }
      );
    }

    // Prepare Midtrans transaction data
<<<<<<< HEAD
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const midtransData: any = {
=======
    const midtransData = {
>>>>>>> 93a879e (fix fitur)
      transaction_details: {
        order_id: transaction_details.order_id,
        gross_amount: transaction_details.gross_amount
      },
<<<<<<< HEAD
      item_details: Array.isArray(item_details) ? item_details : [item_details],
      customer_details: {
        first_name: customer_details.first_name,
        last_name: customer_details.last_name,
        email: customer_details.email,
        phone: customer_details.phone,
        billing_address: customer_details.billing_address || {
          first_name: customer_details.first_name,
          last_name: customer_details.last_name,
          address: customer_details.billing_address?.address || '',
          city: customer_details.billing_address?.city || 'Jakarta',
          postal_code: customer_details.billing_address?.postal_code || '12345',
          phone: customer_details.phone,
          country_code: 'IDN'
        },
        shipping_address: customer_details.shipping_address || customer_details.billing_address || {
          first_name: customer_details.first_name,
          last_name: customer_details.last_name,
          address: customer_details.billing_address?.address || '',
          city: customer_details.billing_address?.city || 'Jakarta',
          postal_code: customer_details.billing_address?.postal_code || '12345',
          phone: customer_details.phone,
          country_code: 'IDN'
        }
      },
      callbacks: {
        finish: `${baseUrl}/payment/success`,
        pending: `${baseUrl}/payment/status/${transaction_details.order_id}`,
        error: `${baseUrl}/payment/status/${transaction_details.order_id}`
      }
    };

    // Add enabled payments if specified
    if (enabled_payments && Array.isArray(enabled_payments) && enabled_payments.length > 0) {
      midtransData.enabled_payments = enabled_payments;
    }

    // Add credit card config if credit card payment
    if (payment_type === 'credit_card' || enabled_payments?.includes('credit_card')) {
      midtransData.credit_card = {
        secure: true
      };
    }

    console.log('[PAYMENT API] Creating Midtrans transaction:', {
      order_id: transaction_details.order_id,
      gross_amount: transaction_details.gross_amount,
      enabled_payments: enabled_payments || 'all'
    });

    // Create transaction in Midtrans
    const transactionToken = await snap.createTransactionToken(midtransData);

    if (!transactionToken) {
      return NextResponse.json(
        { error: 'Failed to create transaction token with Midtrans' },
=======
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
>>>>>>> 93a879e (fix fitur)
        { status: 500 }
      );
    }

<<<<<<< HEAD
    // Save transaction to database (optional - for tracking)
    try {
      // Get user_id if email provided
      let userId = null;
      if (customer_details.email) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', customer_details.email)
          .maybeSingle();
        userId = userData?.id || null;
      }

      const { data: transactionData, error: dbError } = await supabase
        .from('transactions')
        .insert({
          order_id: transaction_details.order_id,
          user_id: userId,
          amount: transaction_details.gross_amount,
          status: 'pending',
          payment_type: payment_type || enabled_payments?.[0] || 'credit_card',
          customer_email: customer_details.email,
          customer_name: `${customer_details.first_name} ${customer_details.last_name}`,
          created_at: new Date().toISOString()
        })
        .select()
        .maybeSingle();

      if (dbError) {
        console.error('[PAYMENT API] Database Error (non-critical):', dbError);
        // Don't fail the transaction if DB insert fails
      }

      return NextResponse.json({
        token: transactionToken,
        order_id: transaction_details.order_id,
        transaction_id: transactionToken,
        status: 'success'
      });
    } catch (dbError: any) {
      console.error('[PAYMENT API] Database Error:', dbError);
      // Return success even if DB save fails
      return NextResponse.json({
        token: transactionToken,
        order_id: transaction_details.order_id,
        transaction_id: transactionToken,
        status: 'success'
      });
    }

  } catch (error: any) {
    console.error('[PAYMENT API] Error:', error);
    
    // Handle Midtrans API errors
    if (error.ApiResponse) {
      const apiError = error.ApiResponse;
      return NextResponse.json(
        { 
          error: apiError.status_message || 'Midtrans API error',
          details: apiError.validation_messages || apiError.error_messages
        },
        { status: apiError.http_status_code || 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
=======
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
>>>>>>> 93a879e (fix fitur)
      { status: 500 }
    );
  }
}
