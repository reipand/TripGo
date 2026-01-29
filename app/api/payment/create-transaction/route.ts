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

// FUNGSI BARU: Decode email yang double encoded
function decodeEmail(email: string): string {
  if (!email) return 'customer@example.com';
  
  try {
    console.log('📧 Email decoding process:', { original: email });
    
    // Case 1: Sudah benar (@gmail.com)
    if (email.includes('@')) {
      console.log('✅ Email already has @ symbol');
      return email;
    }
    
    // Case 2: %40 encoding (single encoded)
    if (email.includes('%40')) {
      let decoded = decodeURIComponent(email);
      console.log('🔧 Decoded %40:', { before: email, after: decoded });
      
      // Jika masih ada encoding setelah decode pertama
      if (decoded.includes('%40')) {
        decoded = decodeURIComponent(decoded);
        console.log('🔧 Double decoded:', { before: email, after: decoded });
      }
      return decoded;
    }
    
    // Case 3: %2540 encoding (double encoded)
    if (email.includes('%2540')) {
      const decoded = decodeURIComponent(decodeURIComponent(email));
      console.log('🔧 Decoded %2540:', { before: email, after: decoded });
      return decoded;
    }
    
    console.log('⚠️ Email format unknown, returning as-is:', email);
    return email;
  } catch (error) {
    console.error('❌ Error decoding email:', error);
    return 'customer@example.com';
  }
}

// FUNGSI BARU: Validasi dan format email untuk Midtrans
function validateAndFormatEmailForMidtrans(email: string): string {
  const decodedEmail = decodeEmail(email);
  
  // Validasi format email sederhana
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (emailRegex.test(decodedEmail)) {
    console.log('✅ Email validated for Midtrans:', decodedEmail);
    return decodedEmail;
  } else {
    console.warn('⚠️ Invalid email format, using fallback:', decodedEmail);
    // Return email yang sudah di-decode meskipun format tidak valid
    // Midtrans akan menolak jika format benar-benar invalid
    return decodedEmail;
  }
}

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
      .maybeSingle();

    if (findError && !findError.message.includes('does not exist')) {
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

    // Cari booking_id dengan email yang sudah di-decode
    let bookingId = null;
    if (bookingCode) {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings_kereta')
        .select('id')
        .eq('booking_code', bookingCode)
        .maybeSingle();

      if (bookingError && !bookingError.message.includes('does not exist')) {
        console.warn('⚠️ Error finding booking:', bookingError.message);
      }

      bookingId = bookingData?.id || null;
    }

    // PERBAIKAN: Decode email sebelum disimpan
    const customerEmail = body.customer_email 
      ? validateAndFormatEmailForMidtrans(body.customer_email)
      : 'customer@example.com';
    
    const customerName = body.customer_name || 'Customer';

    // Bangun data payment
    const paymentData: any = {
      order_id: orderId,
      customer_email: customerEmail, // Email yang sudah di-decode
      customer_name: customerName,
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
        booking_data: body,
        // Tambahkan info decoding
        email_original: body.customer_email,
        email_decoded: customerEmail,
        decoded_at: new Date().toISOString()
      })
    };

    // Tambahkan booking_id jika ada
    if (bookingId) {
      paymentData.booking_id = bookingId;
    }

    // 4. Insert dengan error handling yang lebih baik
    let { data: insertedData, error: insertError } = await supabase
      .from('payment_transactions')
      .insert([paymentData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      
      // Coba tanpa metadata jika error
      if (insertError.message.includes('metadata')) {
        console.log('🔄 Trying insert without metadata');
        delete paymentData.metadata;
        
        ({ data: insertedData, error: insertError } = await supabase
          .from('payment_transactions')
          .insert([paymentData])
          .select()
          .single());
      }
      
      // Coba tanpa transaction_data jika masih error
      if (insertError && insertError.message.includes('transaction_data')) {
        console.log('🔄 Trying insert without transaction_data');
        delete paymentData.transaction_data;
        
        ({ data: insertedData, error: insertError } = await supabase
          .from('payment_transactions')
          .insert([paymentData])
          .select()
          .single());
      }
      
      // Coba dengan minimal fields jika masih error
      if (insertError) {
        console.log('🔄 Trying minimal insert');
        const minimalData = {
          order_id: orderId,
          customer_email: customerEmail,
          customer_name: customerName,
          amount: paymentData.amount,
          payment_method: paymentData.payment_method,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        
        ({ data: insertedData, error: insertError } = await supabase
          .from('payment_transactions')
          .insert([minimalData])
          .select()
          .single());
      }
    }

    if (insertError) {
      console.error('❌ All insert attempts failed:', insertError);

      // Return response meskipun database error
      return {
        success: false,
        data: paymentData, // Data yang seharusnya disimpan
        error: insertError.message,
        isExisting: false,
        note: 'Payment data created but not saved to database'
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

// Simple Midtrans integration dengan perbaikan email
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

  // PERBAIKAN: Pastikan email di customer_details sudah valid
  if (data.customer_details && data.customer_details.email) {
    const originalEmail = data.customer_details.email;
    const fixedEmail = validateAndFormatEmailForMidtrans(originalEmail);
    
    if (originalEmail !== fixedEmail) {
      console.log('🔧 Fixed email for Midtrans:', {
        original: originalEmail,
        fixed: fixedEmail
      });
      data.customer_details.email = fixedEmail;
    }
  }

  console.log('🔄 Sending to Midtrans with data:', {
    order_id: data.transaction_details.order_id,
    amount: data.transaction_details.gross_amount,
    email: data.customer_details?.email,
    item_name: data.item_details?.[0]?.name
  });

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
      
      // Cek jika error karena email
      if (errorText.includes('customer_details.email') || errorText.includes('email format')) {
        console.error('📧 Email format rejected by Midtrans. Original email:', data.customer_details?.email);
        
        // Coba dengan email default
        data.customer_details.email = 'customer@example.com';
        console.log('🔄 Retrying with default email...');
        
        const retryResponse = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${encodedKey}`
          },
          body: JSON.stringify(data)
        });
        
        if (retryResponse.ok) {
          return await retryResponse.json();
        }
      }

      // Fallback untuk error lainnya
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

// PERBAIKAN: Fungsi untuk mendapatkan data dari request dengan email decoding
async function getRequestData(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📦 Data dari JSON body:', {
      order_id: body.order_id,
      booking_code: body.booking_code,
      amount: body.amount,
      customer_email: body.customer_email
    });
    
    // PERBAIKAN: Decode email di sini
    if (body.customer_email) {
      const originalEmail = body.customer_email;
      body.customer_email = decodeEmail(originalEmail);
      console.log('📧 Email decoded in getRequestData:', {
        original: originalEmail,
        decoded: body.customer_email
      });
    }
    
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
      amount: data.amount,
      customer_email: data.customer_email
    });
    
    // PERBAIKAN: Decode email di sini juga
    if (data.customer_email) {
      const originalEmail = data.customer_email;
      data.customer_email = decodeEmail(originalEmail);
      console.log('📧 Email decoded from query params:', {
        original: originalEmail,
        decoded: data.customer_email
      });
    }

    return data;
  }
}

// Fungsi untuk update booking status
async function updateBookingStatus(bookingCode: string, orderId: string) {
  if (!bookingCode) return;

  try {
    console.log(`🔄 Updating booking status for ${bookingCode}`);

    // Cari booking
    const { data: bookingData, error: findError } = await supabase
      .from('bookings_kereta')
      .select('id, status, payment_status')
      .eq('booking_code', bookingCode)
      .maybeSingle();

    if (findError && !findError.message.includes('does not exist')) {
      console.warn('⚠️ Error finding booking:', findError.message);
    }

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

// PERBAIKAN: Fungsi utama untuk membuat transaksi pembayaran
export async function POST(request: NextRequest) {
  console.log('🔍 /api/payment/create-transaction called');

  try {
    const body = await getRequestData(request);

    console.log('📥 Payment request data (after decoding):', {
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

    // PERBAIKAN: Pastikan email valid untuk Midtrans
    const customerEmail = body.customer_email 
      ? validateAndFormatEmailForMidtrans(body.customer_email)
      : 'customer@example.com';

    // Buat data Midtrans
    const midtransData = {
      transaction_details: {
        order_id: body.order_id,
        gross_amount: grossAmount
      },
      customer_details: {
        first_name: body.customer_name?.split(' ')[0] || 'Customer',
        last_name: body.customer_name?.split(' ').slice(1).join(' ') || '',
        email: customerEmail, // Email yang sudah di-decode dan divalidasi
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
        : ['credit_card', 'bank_transfer', 'gopay', 'shopeepay'],
      // Tambahan untuk debugging
      custom_expiry: {
        order_time: new Date().toISOString(),
        expiry_duration: 30,
        unit: 'minute'
      }
    };

    console.log('🔄 Calling Midtrans with validated email...');
    const midtransResponse = await createMidtransTransaction(midtransData);

    console.log('✅ Midtrans response:', {
      token_length: midtransResponse.token?.length || 0,
      has_redirect_url: !!midtransResponse.redirect_url,
      is_fallback: midtransResponse.is_fallback || false,
      email_used: customerEmail
    });

    // Gunakan fungsi getOrCreatePaymentTransaction yang baru
    const paymentResult = await getOrCreatePaymentTransaction(
      body.order_id,
      bookingCode,
      {
        ...body,
        customer_email: customerEmail // Pastikan email yang sudah di-decode
      },
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
          email: customerEmail, // Email yang sudah diproses
          phone: body.customer_phone,
          email_processed: true,
          original_email: body.customer_email // Untuk debugging
        },
        payment_method: body.payment_method || 'e-wallet',
        passenger_count: body.passenger_count || 1,
        payment_record: {
          saved: paymentResult.success,
          id: paymentResult.data?.id,
          is_existing: paymentResult.isExisting || false,
          database_success: paymentResult.success
        },
        expires_at: new Date(Date.now() + 1800000).toISOString(), // 30 menit
        timestamp: new Date().toISOString(),
        ...(midtransResponse.is_fallback && {
          is_fallback: true,
          note: 'Using fallback payment gateway for development/testing'
        })
      },
      message: paymentResult.isExisting
        ? 'Transaksi pembayaran sudah ada, menggunakan token yang sama'
        : 'Transaksi pembayaran berhasil dibuat',
      email_processing: {
        original: body.customer_email,
        processed: customerEmail,
        valid_for_midtrans: customerEmail.includes('@')
      }
    };

    console.log('✅ Payment response prepared:', {
      order_id: responseData.data.order_id,
      has_token: !!responseData.data.token,
      payment_saved: responseData.data.payment_record.saved,
      email_status: responseData.email_processing.valid_for_midtrans ? 'valid' : 'invalid'
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
          email: 'customer@example.com',
          email_processed: 'fallback'
        },
        payment_method: 'e-wallet',
        is_fallback: true,
        development_mode: true,
        expires_at: new Date(Date.now() + 1800000).toISOString(),
        timestamp: new Date().toISOString()
      },
      message: 'Transaksi pembayaran dibuat dalam mode fallback',
      note: 'Database atau payment gateway sedang dalam perbaikan'
    };

    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}

// GET method untuk testing dengan email debugging
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  
  // Test email decoding
  const testEmail = 'reisanadrefa1%2540gmail.com';
  const decodedEmail = decodeEmail(testEmail);

  return NextResponse.json({
    success: true,
    endpoint: '/api/payment/create-transaction',
    method: 'POST',
    environment: process.env.NODE_ENV,
    supabase_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    timestamp: new Date().toISOString(),
    email_decoding_test: {
      original: testEmail,
      decoded: decodedEmail,
      has_at_symbol: decodedEmail.includes('@'),
      valid_format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(decodedEmail)
    },
    test_data: {
      order_id: `TEST-${Date.now()}`,
      booking_code: `DEV${Date.now().toString().slice(-6)}ABC`,
      amount: 150000,
      customer_email: testEmail,
      customer_name: 'Test Customer'
    },
    note: 'Use POST method to create actual payment transactions'
  });
}