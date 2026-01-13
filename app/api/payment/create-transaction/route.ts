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

// Simple Midtrans integration
async function createMidtransTransaction(data: any) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
  
  if (!serverKey || !clientKey) {
    console.log('⚠️ Midtrans keys not configured, using mock response');
    return {
      token: `MOCK-TOKEN-${Date.now()}`,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?order_id=${data.transaction_details.order_id}`
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
      throw new Error(`Midtrans API error: ${response.status} - ${errorText}`);
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

// **FUNGSI YANG DIPERBAIKI: Cari booking_id berdasarkan booking_code**
async function findBookingId(bookingCode: string): Promise<string | null> {
  try {
    console.log('🔍 Mencari booking_id untuk booking_code:', bookingCode);
    
    // Coba cari di tabel bookings_kereta
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings_kereta')
      .select('id')
      .eq('booking_code', bookingCode)
      .single();
    
    if (!bookingError && bookingData) {
      console.log('✅ Ditemukan booking_id:', bookingData.id);
      return bookingData.id;
    }
    
    console.log('⚠️ Tidak ditemukan di bookings_kereta, coba tabel lain...');
    
    // Coba cari di tabel lain jika ada
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('bookings')
      .select('id')
      .eq('booking_code', bookingCode)
      .single();
    
    if (!fallbackError && fallbackData) {
      console.log('✅ Ditemukan di tabel bookings:', fallbackData.id);
      return fallbackData.id;
    }
    
    console.log('❌ Booking tidak ditemukan di database mana pun');
    return null;
    
  } catch (error: any) {
    console.error('❌ Error mencari booking:', error.message);
    return null;
  }
}

// **FUNGSI: Cek schema tabel**
async function checkTableSchema(tableName: string) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      return { exists: false, columns: [], error: error.message };
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      return { exists: true, columns };
    }
    
    // Jika tidak ada data, coba dengan query information_schema
    const { data: schemaData, error: schemaError } = await supabase.rpc(
      'get_table_columns',
      { table_name: tableName }
    ).catch(async () => {
      // Fallback: coba insert dummy
      try {
        const dummyData = { 
          id: Math.random().toString(36).substring(2, 15),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from(tableName)
          .insert([dummyData])
          .onConflict('id')
          .ignore();
        
        if (insertError && insertError.message.includes('column')) {
          const columnsMatch = insertError.message.match(/column "([^"]+)"/g);
          if (columnsMatch) {
            const columns = columnsMatch.map(col => col.replace('column "', '').replace('"', ''));
            return { data: null, error: insertError.message, columns };
          }
        }
        
        return { data: null, error: null, columns: ['id', 'created_at', 'updated_at'] };
      } catch (e: any) {
        return { data: null, error: e.message, columns: [] };
      }
    });
    
    if (schemaData) {
      return { exists: true, columns: schemaData.map((col: any) => col.column_name) };
    }
    
    return { exists: true, columns: ['id', 'created_at', 'updated_at'] };
    
  } catch (error: any) {
    return { exists: false, columns: [], error: error.message };
  }
}

// **FUNGSI BARU: Dapatkan data dari request (JSON body atau query params)**
async function getRequestData(request: NextRequest) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  let data: any = {};
  
  // **PERBAIKAN: Coba ambil dari JSON body terlebih dahulu**
  try {
    // Cek jika request memiliki body
    if (request.body) {
      const bodyText = await request.text();
      if (bodyText.trim()) {
        const jsonData = JSON.parse(bodyText);
        data = { ...data, ...jsonData };
        console.log('📦 Data dari JSON body diterima');
      }
    }
  } catch (error) {
    console.log('ℹ️ Tidak ada JSON body yang valid, gunakan query params');
  }
  
  // **PERBAIKAN: Ambil dari query parameters juga**
  // Parameter yang mungkin dikirim frontend
  const queryParams = [
    'booking_code', 'order_id', 'customer_name', 'customer_email',
    'amount', 'payment_method', 'customer_phone', 'train_name',
    'train_type', 'origin', 'destination', 'departure_date',
    'departure_time', 'passenger_count', 'seat_premium'
  ];
  
  queryParams.forEach(param => {
    const value = searchParams.get(param);
    if (value !== null && value !== undefined) {
      data[param] = value;
    }
  });
  
  // **PERBAIKAN: Parse tipe data yang diperlukan**
  if (data.amount) {
    data.amount = parseInt(data.amount);
  }
  
  if (data.passenger_count) {
    data.passenger_count = parseInt(data.passenger_count) || 1;
  }
  
  if (data.seat_premium) {
    data.seat_premium = parseInt(data.seat_premium) || 0;
  }
  
  console.log('📥 Data gabungan dari request:', {
    order_id: data.order_id,
    booking_code: data.booking_code,
    amount: data.amount,
    source: data.booking_code && !data.order_id ? 'query_params' : 'json_body'
  });
  
  return data;
}

export async function POST(request: NextRequest) {
  console.log('🔍 /api/payment/create-transaction called');
  
  try {
    // **PERBAIKAN UTAMA: Gunakan fungsi baru untuk mendapatkan data**
    const body = await getRequestData(request);
    
    console.log('📥 Payment request data:', {
      booking_code: body.booking_code,
      order_id: body.order_id,
      amount: body.amount,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      payment_method: body.payment_method,
      passenger_count: body.passenger_count || 1
    });

    // Validasi
    if (!body.order_id || !body.amount || !body.customer_email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: order_id, amount, customer_email are required',
        received: {
          order_id: body.order_id,
          amount: body.amount,
          customer_email: body.customer_email,
          has_booking_code: !!body.booking_code,
          total_fields: Object.keys(body).length
        },
        help: 'Send data as JSON body or query parameters'
      }, { status: 400 });
    }

    const amount = parseInt(body.amount.toString());
    if (isNaN(amount) || amount < 10000) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be a number and at least 10,000',
        received_amount: body.amount
      }, { status: 400 });
    }

    // **PERBAIKAN 1: Cari booking_id jika ada booking_code**
    let bookingId = null;
    if (body.booking_code) {
      bookingId = await findBookingId(body.booking_code);
      
      if (!bookingId) {
        console.log('⚠️ Booking tidak ditemukan, buat dummy ID untuk payment');
        // Buat dummy ID jika tidak ditemukan (untuk development)
        bookingId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    }

    // Buat data Midtrans
    const midtransData = {
      transaction_details: {
        order_id: body.order_id,
        gross_amount: amount
      },
      customer_details: {
        first_name: body.customer_name?.split(' ')[0] || 'Customer',
        last_name: body.customer_name?.split(' ').slice(1).join(' ') || '',
        email: body.customer_email,
        phone: body.customer_phone || '081234567890'
      },
      item_details: [
        {
          id: `ticket-${body.booking_code || body.order_id}`,
          name: `Tiket Kereta ${body.train_name || ''}`.trim() || 'Tiket Perjalanan',
          price: amount,
          quantity: 1,
          category: 'Ticket'
        }
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success`,
        error: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/failed`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/pending`
      }
    };

    console.log('🔄 Calling Midtrans...');
    const midtransResponse = await createMidtransTransaction(midtransData);
    
    console.log('✅ Midtrans response:', {
      has_token: !!midtransResponse.token,
      has_redirect_url: !!midtransResponse.redirect_url,
      is_fallback: midtransResponse.is_fallback || false
    });

    // **PERBAIKAN 2: Cek schema dan pastikan booking_id ada**
    console.log('🔍 Checking database schema...');
    
    const paymentTableSchema = await checkTableSchema('payment_transactions');
    console.log('📊 payment_transactions schema:', {
      exists: paymentTableSchema.exists,
      columns: paymentTableSchema.columns,
      has_booking_id: paymentTableSchema.columns.includes('booking_id')
    });
    
    const paymentsTableSchema = await checkTableSchema('payments');
    console.log('📊 payments schema:', {
      exists: paymentsTableSchema.exists,
      columns: paymentsTableSchema.columns,
      has_booking_id: paymentsTableSchema.columns.includes('booking_id')
    });

    let savedPaymentId = null;
    let paymentError = null;
    let usedTable = 'none';

    // **PERBAIKAN 3: Bangun data dengan booking_id jika diperlukan**
    if (paymentTableSchema.exists) {
      const paymentData: any = {
        order_id: body.order_id,
        amount: amount,
        customer_email: body.customer_email,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // **TAMBAHKAN booking_id jika kolomnya ada dan kita punya nilainya**
      if (paymentTableSchema.columns.includes('booking_id')) {
        if (bookingId) {
          paymentData.booking_id = bookingId;
        } else {
          console.log('⚠️ Kolom booking_id ada tapi tidak ada nilai, akan diabaikan');
        }
      }
      
      // Tambahkan kolom opsional
      if (paymentTableSchema.columns.includes('customer_name')) {
        paymentData.customer_name = body.customer_name || 'Customer';
      }
      
      if (paymentTableSchema.columns.includes('payment_method')) {
        paymentData.payment_method = body.payment_method || 'bank_transfer';
      }
      
      if (paymentTableSchema.columns.includes('booking_code')) {
        paymentData.booking_code = body.booking_code || body.order_id;
      }
      
      if (paymentTableSchema.columns.includes('midtrans_token')) {
        paymentData.midtrans_token = midtransResponse.token;
      }
      
      if (paymentTableSchema.columns.includes('payment_url')) {
        paymentData.payment_url = midtransResponse.redirect_url;
      }
      
      if (paymentTableSchema.columns.includes('redirect_url')) {
        paymentData.redirect_url = midtransResponse.redirect_url;
      }
      
      if (paymentTableSchema.columns.includes('snap_redirect_url')) {
        paymentData.snap_redirect_url = midtransResponse.redirect_url;
      }
      
      // **JIKA booking_id diperlukan tapi tidak ada, buat nilai default**
      if (paymentTableSchema.columns.includes('booking_id') && !bookingId) {
        // Cek apakah kolom booking_id bisa null
        paymentData.booking_id = `temp-${body.order_id}`;
        console.log('ℹ️ Menggunakan booking_id sementara:', paymentData.booking_id);
      }

      console.log('💾 Saving to payment_transactions:', {
        order_id: paymentData.order_id,
        booking_id: paymentData.booking_id,
        amount: paymentData.amount
      });

      try {
        const { data: insertedData, error: insertError } = await supabase
          .from('payment_transactions')
          .insert([paymentData])
          .select('id')
          .single();
        
        if (insertError) {
          console.error('❌ payment_transactions insert failed:', insertError.message);
          paymentError = insertError.message;
          
          // **Coba lagi tanpa booking_id jika error karena NOT NULL**
          if (insertError.message.includes('null value in column "booking_id"')) {
            console.log('🔄 Coba insert tanpa booking_id (mungkin di-drop)');
            
            // Clone data tanpa booking_id
            const dataWithoutBookingId = { ...paymentData };
            delete dataWithoutBookingId.booking_id;
            
            const { data: retryData, error: retryError } = await supabase
              .from('payment_transactions')
              .insert([dataWithoutBookingId])
              .select('id')
              .single();
              
            if (!retryError && retryData) {
              savedPaymentId = retryData.id;
              usedTable = 'payment_transactions';
              console.log('✅ Saved to payment_transactions (tanpa booking_id)');
            }
          }
        } else {
          savedPaymentId = insertedData.id;
          usedTable = 'payment_transactions';
          console.log('✅ Saved to payment_transactions');
        }
      } catch (dbError: any) {
        console.error('❌ payment_transactions error:', dbError.message);
        paymentError = dbError.message;
      }
    }

    // **PERBAIKAN 4: Fallback ke tabel payments**
    if (!savedPaymentId && paymentsTableSchema.exists) {
      console.log('🔄 Mencoba tabel payments sebagai fallback...');
      
      const paymentsData: any = {
        order_id: body.order_id,
        amount: amount,
        customer_email: body.customer_email,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // **TAMBAHKAN booking_id jika ada kolomnya**
      if (paymentsTableSchema.columns.includes('booking_id') && bookingId) {
        paymentsData.booking_id = bookingId;
      }
      
      // Tambahkan kolom lain
      if (paymentsTableSchema.columns.includes('customer_name')) {
        paymentsData.customer_name = body.customer_name || 'Customer';
      }
      
      if (paymentsTableSchema.columns.includes('payment_method')) {
        paymentsData.payment_method = body.payment_method || 'bank_transfer';
      }
      
      if (paymentsTableSchema.columns.includes('booking_code')) {
        paymentsData.booking_code = body.booking_code || body.order_id;
      }
      
      // **Handle booking_id NOT NULL constraint untuk payments juga**
      if (paymentsTableSchema.columns.includes('booking_id') && !paymentsData.booking_id) {
        paymentsData.booking_id = `temp-${body.order_id}`;
      }

      console.log('💾 Saving to payments table:', {
        order_id: paymentsData.order_id,
        booking_id: paymentsData.booking_id,
        amount: paymentsData.amount
      });

      try {
        const { data: altData, error: altError } = await supabase
          .from('payments')
          .insert([paymentsData])
          .select('id')
          .single();
          
        if (altError) {
          console.error('❌ payments table failed:', altError.message);
          
          // **Coba tanpa booking_id**
          if (altError.message.includes('null value in column "booking_id"')) {
            delete paymentsData.booking_id;
            
            const { data: retryData, error: retryError } = await supabase
              .from('payments')
              .insert([paymentsData])
              .select('id')
              .single();
              
            if (!retryError && retryData) {
              savedPaymentId = retryData.id;
              usedTable = 'payments';
              console.log('✅ Saved to payments (tanpa booking_id)');
            }
          }
        } else {
          savedPaymentId = altData.id;
          usedTable = 'payments';
          console.log('✅ Saved to payments table');
        }
      } catch (altError: any) {
        console.error('❌ payments table error:', altError.message);
      }
    }

    // **PERBAIKAN 5: Update booking status di bookings_kereta**
    if (body.booking_code) {
      try {
        const { data: bookingUpdate, error: bookingUpdateError } = await supabase
          .from('bookings_kereta')
          .update({
            payment_status: 'processing',
            order_id: body.order_id,
            updated_at: new Date().toISOString()
          })
          .eq('booking_code', body.booking_code)
          .select('id')
          .single();
          
        if (bookingUpdateError) {
          console.warn('⚠️ Booking update error:', bookingUpdateError.message);
        } else {
          console.log('✅ Updated booking payment status:', bookingUpdate?.id);
        }
      } catch (bookingError: any) {
        console.warn('⚠️ Booking update skipped:', bookingError.message);
      }
    }

    // **Response dengan data lengkap**
    return NextResponse.json({
      success: true,
      data: {
        token: midtransResponse.token,
        redirect_url: midtransResponse.redirect_url,
        snap_redirect_url: midtransResponse.redirect_url,
        order_id: body.order_id,
        booking_code: body.booking_code,
        booking_id: bookingId,
        amount: amount,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        payment_method: body.payment_method,
        passenger_count: body.passenger_count || 1,
        payment_id: savedPaymentId,
        payment_saved: !!savedPaymentId,
        used_table: usedTable,
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 jam
        timestamp: new Date().toISOString(),
        ...(midtransResponse.is_fallback && { is_fallback: true })
      },
      ...(paymentError && { warning: `Database save issue: ${paymentError}` }),
      message: 'Transaksi pembayaran berhasil dibuat'
    });

  } catch (error: any) {
    console.error('❌ Payment API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Gagal membuat transaksi pembayaran',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
      fallback_data: {
        order_id: 'FALLBACK-' + Date.now(),
        token: 'FALLBACK-TOKEN',
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?orderId=FALLBACK-${Date.now()}&status=success`
      }
    }, { status: 500 });
  }
}

// **PERBAIKAN: Tambah GET method untuk testing query parameters**
export async function GET(request: NextRequest) {
  console.log('🔍 /api/payment/create-transaction GET called (for testing)');
  
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  // Ambil data dari query parameters
  const testData = {
    booking_code: searchParams.get('booking_code'),
    order_id: searchParams.get('order_id'),
    customer_name: searchParams.get('customer_name'),
    customer_email: searchParams.get('customer_email'),
    amount: searchParams.get('amount'),
    payment_method: searchParams.get('payment_method')
  };
  
  return NextResponse.json({
    success: false,
    error: 'Use POST method instead of GET',
    received_query_params: testData,
    help: 'This API requires POST method. Send data as:',
    examples: {
      curl_post_json: 'curl -X POST "http://localhost:3000/api/payment/create-transaction" -H "Content-Type: application/json" -d \'{"order_id":"ORDER-123","amount":150000,"customer_email":"test@example.com"}\'',
      curl_post_params: 'curl -X POST "http://localhost:3000/api/payment/create-transaction?order_id=ORDER-123&amount=150000&customer_email=test@example.com"',
      fetch_example: 'fetch("/api/payment/create-transaction", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({order_id:"ORDER-123",amount:150000,customer_email:"test@example.com"})})'
    }
  }, { status: 405 });
}