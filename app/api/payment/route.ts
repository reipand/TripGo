// app/api/bookings/detail/[bookingCode]/payment-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest
) {
  try {
    const bookingCode =
      request.nextUrl.searchParams.get('bookingCode') ||
      request.nextUrl.searchParams.get('booking_code') ||
      '';
    
    console.log(`🔍 GET payment status untuk booking: ${bookingCode}`);
    
    if (!bookingCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking code diperlukan'
        },
        { status: 400 }
      );
    }

    // Query 1: Cari data booking dari bookings_kereta
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings_kereta')
      .select(`
        id,
        booking_code,
        passenger_name,
        passenger_email,
        passenger_phone,
        passenger_count,
        total_amount,
        status as booking_status,
        payment_status,
        order_id,
        created_at,
        updated_at,
        metadata
      `)
      .eq('booking_code', bookingCode)
      .maybeSingle();

    if (bookingError) {
      console.error('❌ Error mengambil data booking:', bookingError);
      return NextResponse.json(
        {
          success: false,
          error: 'Gagal mengambil data booking',
          details: bookingError.message
        },
        { status: 500 }
      );
    }

    if (!bookingData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking tidak ditemukan',
          booking_code: bookingCode
        },
        { status: 404 }
      );
    }

    // Query 2: Cari payment transaction terkait
    let paymentData = null;
    if (bookingData.order_id) {
      const { data: paymentTransaction, error: paymentError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', bookingData.order_id)
        .maybeSingle();

      if (paymentError) {
        console.error('❌ Error mengambil data pembayaran:', paymentError);
      } else {
        paymentData = paymentTransaction;
      }
    }

    // Jika tidak ada payment data berdasarkan order_id, coba cari berdasarkan booking_id
    if (!paymentData) {
      const { data: paymentByBooking, error: paymentError2 } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('booking_id', bookingCode)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!paymentError2 && paymentByBooking) {
        paymentData = paymentByBooking;
      }
    }

    // Siapkan response data
    const responseData = {
      booking: {
        booking_code: bookingData.booking_code,
        passenger_name: bookingData.passenger_name,
        passenger_email: bookingData.passenger_email,
        passenger_phone: bookingData.passenger_phone,
        passenger_count: bookingData.passenger_count,
        total_amount: bookingData.total_amount,
        status: bookingData.booking_status,
        payment_status: bookingData.payment_status,
        order_id: bookingData.order_id,
        created_at: bookingData.created_at,
        updated_at: bookingData.updated_at,
        metadata: bookingData.metadata || {}
      },
      payment: paymentData ? {
        order_id: paymentData.order_id,
        status: paymentData.status,
        payment_method: paymentData.payment_method,
        amount: paymentData.amount,
        transaction_time: paymentData.transaction_time || paymentData.updated_at,
        payment_url: paymentData.payment_url || paymentData.snap_redirect_url,
        midtrans_token: paymentData.midtrans_token,
        transaction_id: paymentData.transaction_id,
        fraud_status: paymentData.fraud_status,
        settlement_time: paymentData.settlement_time,
        metadata: paymentData.metadata || {}
      } : null,
      summary: {
        is_paid: bookingData.payment_status === 'paid' || 
                paymentData?.status === 'settlement' || 
                paymentData?.status === 'capture',
        is_pending: bookingData.payment_status === 'pending' || 
                   paymentData?.status === 'pending' ||
                   bookingData.booking_status === 'waiting_payment',
        is_failed: bookingData.payment_status === 'failed' || 
                  paymentData?.status === 'failed' ||
                  paymentData?.status === 'deny' ||
                  paymentData?.status === 'expire' ||
                  paymentData?.status === 'cancel',
        can_retry_payment: (bookingData.payment_status === 'failed' || 
                           bookingData.payment_status === 'pending') && 
                          bookingData.booking_status !== 'cancelled',
        payment_expired: paymentData?.expiry_time ? 
                        new Date(paymentData.expiry_time) < new Date() : false
      }
    };

    console.log(`✅ Status pembayaran berhasil diambil untuk booking: ${bookingCode}`);
    
    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error: any) {
    console.error('❌ Error mengambil status pembayaran:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil status pembayaran',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint untuk membuat pembayaran baru untuk booking yang ada
export async function POST(
  request: NextRequest
) {
  try {
    const body = await request.json();
    const bookingCode =
      body.bookingCode ||
      body.booking_code ||
      request.nextUrl.searchParams.get('bookingCode') ||
      request.nextUrl.searchParams.get('booking_code') ||
      '';
    
    console.log(`🔄 POST create payment untuk booking: ${bookingCode}`);
    
    if (!bookingCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking code diperlukan'
        },
        { status: 400 }
      );
    }

    // Cari data booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings_kereta')
      .select('*')
      .eq('booking_code', bookingCode)
      .maybeSingle();

    if (bookingError) {
      console.error('❌ Error mengambil data booking:', bookingError);
      return NextResponse.json(
        {
          success: false,
          error: 'Gagal mengambil data booking',
          details: bookingError.message
        },
        { status: 500 }
      );
    }

    if (!bookingData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking tidak ditemukan',
          booking_code: bookingCode
        },
        { status: 404 }
      );
    }

    // Cek apakah booking masih bisa dibayar
    if (bookingData.status === 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking telah dibatalkan, tidak dapat melakukan pembayaran'
        },
        { status: 400 }
      );
    }

    if (bookingData.payment_status === 'paid') {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking sudah dibayar',
          data: {
            booking_code: bookingCode,
            payment_status: bookingData.payment_status,
            order_id: bookingData.order_id
          }
        },
        { status: 400 }
      );
    }

    // Proses pembuatan pembayaran baru
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentUrl = `${baseUrl}/api/payments`;
    
    const paymentPayload = {
      booking_code: bookingCode,
      order_id: bookingData.order_id || `TRIPGO-${bookingCode}-${Date.now()}`,
      customer_name: bookingData.passenger_name,
      customer_email: bookingData.passenger_email,
      amount: bookingData.total_amount,
      payment_method: body.payment_method || 'midtrans',
      phone: bookingData.passenger_phone,
      bookingData: bookingData.metadata || {}
    };

    console.log('📤 Mengirim request ke /api/payments:', paymentPayload);

    // Panggil payment API
    const paymentResponse = await fetch(paymentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentResult = await paymentResponse.json();

    if (!paymentResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Gagal membuat pembayaran baru',
          details: paymentResult.error || 'Unknown error'
        },
        { status: paymentResponse.status }
      );
    }

    // Update booking dengan order_id baru jika ada
    if (paymentResult.data?.order_id && paymentResult.data.order_id !== bookingData.order_id) {
      await supabase
        .from('bookings_kereta')
        .update({
          order_id: paymentResult.data.order_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingData.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Pembayaran baru berhasil dibuat',
      data: {
        ...paymentResult.data,
        booking_status: 'waiting_payment',
        payment_status: 'pending'
      }
    });

  } catch (error: any) {
    console.error('❌ Error membuat pembayaran baru:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal membuat pembayaran baru',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH endpoint untuk update manual status pembayaran
export async function PATCH(
  request: NextRequest
) {
  try {
    const body = await request.json();
    const bookingCode =
      body.bookingCode ||
      body.booking_code ||
      request.nextUrl.searchParams.get('bookingCode') ||
      request.nextUrl.searchParams.get('booking_code') ||
      '';
    const { payment_status, status, notes } = body;

    console.log(`✏️ PATCH update payment status untuk booking: ${bookingCode}`);
    
    if (!bookingCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking code diperlukan'
        },
        { status: 400 }
      );
    }

    // Update booking status
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (payment_status) {
      updateData.payment_status = payment_status;
    }

    if (status) {
      updateData.status = status;
    }

    // Cari booking terlebih dahulu
    const { data: bookingData, error: findError } = await supabase
      .from('bookings_kereta')
      .select('id, order_id')
      .eq('booking_code', bookingCode)
      .maybeSingle();

    if (findError || !bookingData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking tidak ditemukan'
        },
        { status: 404 }
      );
    }

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings_kereta')
      .update(updateData)
      .eq('id', bookingData.id);

    if (updateError) {
      console.error('❌ Error update booking status:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Gagal update status booking',
          details: updateError.message
        },
        { status: 500 }
      );
    }

    // Jika ada order_id, update juga payment_transactions
    if (bookingData.order_id) {
      await supabase
        .from('payment_transactions')
        .update({
          status: payment_status || 'updated',
          updated_at: new Date().toISOString(),
          notes: notes || 'Manual update via API'
        })
        .eq('order_id', bookingData.order_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Status booking berhasil diupdate',
      data: {
        booking_code: bookingCode,
        updated_at: new Date().toISOString(),
        payment_status,
        status
      }
    });

  } catch (error: any) {
    console.error('❌ Error update payment status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal update status pembayaran',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler untuk CORS
export async function OPTIONS() {
  console.log('🛠️ OPTIONS /api/bookings/detail/[bookingCode]/payment-status (CORS preflight)');
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
