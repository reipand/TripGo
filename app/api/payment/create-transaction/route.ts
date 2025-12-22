import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Menggunakan require untuk midtrans-client karena library ini CommonJS
const midtransClient = require('midtrans-client');

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
        { error: 'Missing required fields: transaction_details, item_details, customer_details' },
        { status: 400 }
      );
    }

    // Prepare Midtrans transaction data
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const midtransData: any = {
      transaction_details: {
        order_id: transaction_details.order_id,
        gross_amount: transaction_details.gross_amount
      },
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
        { status: 500 }
      );
    }

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
      { status: 500 }
    );
  }
}