// app/api/payment/create-transaction/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// PERBAIKAN: Fungsi untuk mendapatkan atau membuat payment transaction
async function getOrCreatePaymentTransaction(
  orderId: string, 
  bookingCode: string, 
  body: any,
  midtransResponse: any
) {
  console.log(`🔍 Checking existing payment for order_id: ${orderId}`);
  
  try {
    // 1. Cari transaksi yang sudah ada
    const { data: existingPayment, error: findError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle(); // Gunakan maybeSingle untuk menghindari error jika tidak ada
    
    if (findError) {
      console.error('❌ Error finding payment:', findError);
    }
    
    // 2. Jika transaksi sudah ada, return data yang ada
    if (existingPayment) {
      console.log('✅ Existing payment found:', existingPayment.id);
      
      // Update token jika ada yang baru
      if (midtransResponse.token && !existingPayment.midtrans_token) {
        console.log('🔄 Updating existing payment with new token');
        
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({
            midtrans_token: midtransResponse.token,
            payment_url: midtransResponse.redirect_url,
            snap_redirect_url: midtransResponse.redirect_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.id);
          
        if (updateError) {
          console.warn('⚠️ Failed to update token:', updateError);
        }
      }
      
      return {
        success: true,
        data: existingPayment,
        isExisting: true
      };
    }
    
    // 3. Jika tidak ada, buat transaksi baru
    console.log('🔄 Creating new payment transaction...');
    
    // Cari booking_id
    let bookingId = null;
    if (bookingCode) {
      const { data: bookingData } = await supabase
        .from('bookings_kereta')
        .select('id')
        .eq('booking_code', bookingCode)
        .single()
        .catch(() => ({ data: null }));
      
      bookingId = bookingData?.id || null;
    }
    
    // Bangun data payment
    const paymentData: any = {
      id: generateValidUUID(),
      order_id: orderId,
      customer_email: body.customer_email || 'customer@example.com',
      customer_name: body.customer_name || 'Customer',
      amount: body.amount || body.total_amount || 0,
      payment_method: body.payment_method || 'e-wallet',
      status: 'pending',
      payment_url: midtransResponse.redirect_url,
      midtrans_token: midtransResponse.token,
      snap_redirect_url: midtransResponse.redirect_url,
      transaction_data: JSON.stringify(midtransResponse),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: JSON.stringify({
        train_name: body.train_name,
        origin: body.origin,
        destination: body.destination,
        departure_date: body.departure_date,
        passenger_count: body.passenger_count,
        booking_code: bookingCode,
        booking_data: body
      })
    };
    
    // Tambahkan booking_id jika ada
    if (bookingId) {
      paymentData.booking_id = bookingId;
    }
    
    // 4. Coba insert dengan berbagai strategi
    let insertResult = null;
    
    // Strategi 1: Coba insert biasa
    let { data: insertedData, error: insertError } = await supabase
      .from('payment_transactions')
      .insert([paymentData])
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Initial insert failed:', insertError.message);
      
      // Strategi 2: Jika duplicate key, coba tanpa ID (biarkan database generate)
      if (insertError.code === '23505' && insertError.message.includes('payment_transactions_pkey')) {
        console.log('🔄 Trying insert without custom ID');
        delete paymentData.id;
        
        ({ data: insertedData, error: insertError } = await supabase
          .from('payment_transactions')
          .insert([paymentData])
          .select()
          .single());
      }
      
      // Strategi 3: Jika masih error karena order_id duplicate, update existing
      if (insertError && insertError.code === '23505' && insertError.message.includes('payment_transactions_order_id_key')) {
        console.log('🔄 Duplicate order_id, updating existing record');
        
        // Cari lagi dan update
        const { data: foundPayment } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('order_id', orderId)
          .single();
          
        if (foundPayment) {
          const { error: updateError } = await supabase
            .from('payment_transactions')
            .update({
              midtrans_token: midtransResponse.token,
              payment_url: midtransResponse.redirect_url,
              snap_redirect_url: midtransResponse.redirect_url,
              amount: paymentData.amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', foundPayment.id);
            
          if (!updateError) {
            insertedData = foundPayment;
            insertError = null;
          }
        }
      }
      
      // Strategi 4: Jika masih gagal, coba tanpa booking_id
      if (insertError) {
        console.log('🔄 Trying insert without booking_id');
        delete paymentData.booking_id;
        
        ({ data: insertedData, error: insertError } = await supabase
          .from('payment_transactions')
          .insert([paymentData])
          .select()
          .single());
      }
    }
    
    if (insertError) {
      console.error('❌ All insert strategies failed:', insertError);
      
      // Return response dengan data meskipun tidak tersimpan di database
      return {
        success: false,
        data: paymentData, // Return data yang seharusnya disimpan
        error: insertError.message,
        isExisting: false
      };
    }
    
    console.log('✅ Payment transaction created:', insertedData?.id);
    
    return {
      success: true,
      data: insertedData,
      isExisting: false
    };
    
  } catch (error: any) {
    console.error('❌ Error in getOrCreatePaymentTransaction:', error);
    
    return {
      success: false,
      error: error.message,
      isExisting: false
    };
  }
}

// Fungsi untuk generate UUID yang valid
function generateValidUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Simple Midtrans integration
async function createMidtransTransaction(data: any) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  
  if (!serverKey || !clientKey) {
    console.log('⚠️ Midtrans keys not configured, using mock response');
    return {
      token: `MOCK-TOKEN-${Date.now()}`,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?order_id=${data.transaction_details.order_id}`,
      is_fallback: true
    };
  }

  try {
    const encodedKey = Buffer.from(`${serverKey}:`).toString('base64');
    
    const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${encodedKey}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Midtrans API error:', response.status, errorText);
      
      // Fallback untuk error 400 dan lainnya
      return {
        token: `FALLBACK-TOKEN-${Date.now()}`,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?order_id=${data.transaction_details.order_id}`,
        is_fallback: true
      };
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Midtrans API call failed:', error);
    
    return {
      token: `FALLBACK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?order_id=${data.transaction_details.order_id}`,
      is_fallback: true
    };
  }
}

// Fungsi untuk mendapatkan data dari request
async function getRequestData(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 Data dari JSON body:', {
      order_id: body.order_id,
      booking_code: body.booking_code,
      amount: body.amount
    });
    return body;
  } catch (error) {
    // Coba ambil dari query parameters
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    const data: any = {};
    const params = [
      'booking_code', 'order_id', 'customer_name', 'customer_email',
      'amount', 'payment_method', 'customer_phone', 'train_name',
      'origin', 'destination', 'departure_date', 'departure_time',
      'passenger_count', 'total_amount'
    ];
    
    params.forEach(param => {
      const value = searchParams.get(param);
      if (value !== null) {
        data[param] = value;
      }
    });
    
    console.log('📦 Data dari query params:', {
      order_id: data.order_id,
      booking_code: data.booking_code,
      amount: data.amount
    });
    
    return data;
  }
}

// Fungsi untuk update booking status
async function updateBookingStatus(bookingCode: string, orderId: string) {
  if (!bookingCode) return;
  
  try {
    console.log(`🔄 Updating booking status for ${bookingCode}`);
    
    // Cari booking
    const { data: bookingData } = await supabase
      .from('bookings_kereta')
      .select('id, status, payment_status')
      .eq('booking_code', bookingCode)
      .single()
      .catch(() => ({ data: null }));
    
    if (!bookingData) {
      console.log('⚠️ Booking not found for update');
      return;
    }
    
    // Update booking
    const { error: updateError } = await supabase
      .from('bookings_kereta')
      .update({
        payment_status: 'pending',
        order_id: orderId,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingData.id);
    
    if (updateError) {
      console.warn('⚠️ Booking update error:', updateError.message);
    } else {
      console.log('✅ Booking status updated');
    }
    
  } catch (error: any) {
    console.warn('⚠️ Error updating booking:', error.message);
  }
}

// Fungsi utama untuk membuat transaksi pembayaran
export async function POST(request: NextRequest) {
  console.log('🔍 /api/payment/create-transaction called');
  
  try {
    const body = await getRequestData(request);
    
    console.log('📥 Payment request data:', {
      booking_code: body.booking_code,
      order_id: body.order_id,
      amount: body.amount || body.total_amount,
      customer_email: body.customer_email,
      payment_method: body.payment_method
    });

    // Validasi
    if (!body.order_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: order_id',
        help: 'Send order_id in JSON body or query parameters'
      }, { status: 400 });
    }

    const amount = body.amount || body.total_amount;
    if (!amount || isNaN(parseInt(amount)) || parseInt(amount) < 10000) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be a number and at least 10,000',
        received_amount: amount
      }, { status: 400 });
    }

    const grossAmount = parseInt(amount);
    const bookingCode = body.booking_code || body.order_id;
    
    // Buat data Midtrans
    const midtransData = {
      transaction_details: {
        order_id: body.order_id,
        gross_amount: grossAmount
      },
      customer_details: {
        first_name: body.customer_name?.split(' ')[0] || 'Customer',
        last_name: body.customer_name?.split(' ').slice(1).join(' ') || '',
        email: body.customer_email || 'customer@example.com',
        phone: body.customer_phone || '081234567890'
      },
      item_details: [
        {
          id: `ticket-${bookingCode}`,
          name: body.train_name 
            ? `Tiket Kereta ${body.train_name}`
            : 'Tiket Perjalanan Kereta',
          price: grossAmount,
          quantity: 1,
          category: 'Transportation'
        }
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?order_id=${body.order_id}`,
        error: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/failed?order_id=${body.order_id}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/pending?order_id=${body.order_id}`
      },
      enabled_payments: body.payment_method 
        ? [body.payment_method]
        : ['credit_card', 'bank_transfer', 'gopay', 'shopeepay']
    };

    console.log('🔄 Calling Midtrans...');
    const midtransResponse = await createMidtransTransaction(midtransData);
    
    console.log('✅ Midtrans response:', {
      token_length: midtransResponse.token?.length || 0,
      has_redirect_url: !!midtransResponse.redirect_url,
      is_fallback: midtransResponse.is_fallback || false
    });

    // PERBAIKAN: Gunakan fungsi getOrCreatePaymentTransaction yang baru
    const paymentResult = await getOrCreatePaymentTransaction(
      body.order_id,
      bookingCode,
      body,
      midtransResponse
    );
    
    // Update booking status jika perlu
    if (bookingCode && bookingCode !== body.order_id) {
      await updateBookingStatus(bookingCode, body.order_id);
    }

    // Response dengan data lengkap
    const responseData = {
      success: true,
      data: {
        token: midtransResponse.token,
        redirect_url: midtransResponse.redirect_url,
        snap_redirect_url: midtransResponse.redirect_url,
        order_id: body.order_id,
        booking_code: bookingCode,
        amount: grossAmount,
        customer: {
          name: body.customer_name || 'Customer',
          email: body.customer_email || 'customer@example.com',
          phone: body.customer_phone
        },
        payment_method: body.payment_method || 'e-wallet',
        passenger_count: body.passenger_count || 1,
        payment_record: {
          saved: paymentResult.success,
          id: paymentResult.data?.id,
          is_existing: paymentResult.isExisting || false
        },
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        timestamp: new Date().toISOString(),
        ...(midtransResponse.is_fallback && { 
          is_fallback: true,
          note: 'Using fallback payment gateway for development/testing'
        })
      },
      message: paymentResult.isExisting 
        ? 'Transaksi pembayaran sudah ada, menggunakan token yang sama'
        : 'Transaksi pembayaran berhasil dibuat',
      ...(process.env.NODE_ENV === 'development' && {
        development_note: 'Development mode: Transaction handling optimized'
      })
    };

    console.log('✅ Payment response prepared:', {
      order_id: responseData.data.order_id,
      has_token: !!responseData.data.token,
      payment_saved: responseData.data.payment_record.saved
    });

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('❌ Payment API error:', error);
    
    // Response fallback untuk development
    const fallbackResponse = {
      success: true,
      data: {
        token: `MOCK-TOKEN-${Date.now()}`,
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?order_id=${body?.order_id || 'FALLBACK'}&fallback=true`,
        snap_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?order_id=${body?.order_id || 'FALLBACK'}&fallback=true`,
        order_id: body?.order_id || `FALLBACK-${Date.now()}`,
        amount: 100000,
        customer: {
          name: 'Customer',
          email: 'customer@example.com'
        },
        payment_method: 'e-wallet',
        is_fallback: true,
        development_mode: true,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
        timestamp: new Date().toISOString()
      },
      message: 'Transaksi pembayaran dibuat dalam mode fallback',
      note: 'Database atau payment gateway sedang dalam perbaikan'
    };
    
    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}

// GET method untuk testing
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  
  return NextResponse.json({
    success: true,
    endpoint: '/api/payment/create-transaction',
    method: 'POST',
    environment: process.env.NODE_ENV,
    supabase_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    timestamp: new Date().toISOString(),
    test_data: {
      order_id: `TEST-${Date.now()}`,
      booking_code: `DEV${Date.now().toString().slice(-6)}ABC`,
      amount: 150000,
      customer_email: 'test@example.com',
      customer_name: 'Test Customer'
    },
    note: 'Use POST method to create actual payment transactions'
  });
}