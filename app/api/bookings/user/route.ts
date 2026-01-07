// app/api/bookings/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API bookings/user GET called');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userEmail = searchParams.get('userEmail') || searchParams.get('email');
    
    console.log('📋 Query params:', { userId, userEmail });
    
    if (!userId && !userEmail) {
      console.log('❌ No userId or email provided');
      return NextResponse.json(
        { 
          success: false, 
          message: 'User ID atau email diperlukan',
          code: 'MISSING_PARAMS'
        },
        { status: 400 }
      );
    }
    
    let allBookings: any[] = [];
    let queryPromises = [];
    
    console.log('🔄 Searching bookings with multiple criteria...');
    
    // **STRATEGI 1: Cari berdasarkan user_id**
    if (userId && userId !== 'undefined' && userId !== 'null') {
      console.log(`🔍 Strategy 1: Filter by userId: ${userId}`);
      const promise1 = supabase
        .from('bookings_kereta')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      queryPromises.push(promise1);
    }
    
    // **STRATEGY 2: Cari berdasarkan email penumpang**
    if (userEmail && userEmail !== 'undefined' && userEmail !== 'null') {
      console.log(`🔍 Strategy 2: Filter by passenger_email: ${userEmail}`);
      const promise2 = supabase
        .from('bookings_kereta')
        .select('*')
        .eq('passenger_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(50);
      queryPromises.push(promise2);
    }
    
    // **STRATEGY 3: Cari berdasarkan nama penumpang**
    if (userEmail) {
      const userName = userEmail.split('@')[0];
      if (userName && userName.length > 2) {
        console.log(`🔍 Strategy 3: Filter by passenger_name: ${userName}`);
        const promise3 = supabase
          .from('bookings_kereta')
          .select('*')
          .ilike('passenger_name', `%${userName}%`)
          .order('created_at', { ascending: false })
          .limit(20);
        queryPromises.push(promise3);
      }
    }
    
    // **STRATEGY 4: Cari semua booking yang memiliki email mirip**
    if (userEmail) {
      console.log(`🔍 Strategy 4: Search any bookings with email`);
      const promise4 = supabase
        .from('bookings_kereta')
        .select('*')
        .or(`passenger_email.ilike.%${userEmail}%,passenger_email.is.null`)
        .order('created_at', { ascending: false })
        .limit(30);
      queryPromises.push(promise4);
    }
    
    // Jalankan semua query secara paralel
    console.log(`📡 Executing ${queryPromises.length} database queries in parallel...`);
    const results = await Promise.allSettled(queryPromises);
    
    // Proses hasil query
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { data, error } = result.value;
        if (!error && data && Array.isArray(data)) {
          console.log(`✅ Strategy ${index + 1} found ${data.length} bookings`);
          allBookings = [...allBookings, ...data];
        } else if (error) {
          console.warn(`⚠️ Strategy ${index + 1} error:`, error.message);
        }
      }
    });
    
    // Hapus duplikat berdasarkan booking_code
    const uniqueBookings = Array.from(
      new Map(allBookings.map(item => [item.booking_code || item.id, item])).values()
    );
    
    console.log(`📊 Total unique bookings found: ${uniqueBookings.length}`);
    
    if (uniqueBookings.length > 0) {
      console.log('📋 Sample bookings:', uniqueBookings.slice(0, 3).map(b => ({
        code: b.booking_code,
        status: b.status,
        user_id: b.user_id,
        email: b.passenger_email,
        amount: b.total_amount
      })));
    }
    
    // Jika tidak ada booking, coba lihat tabel payment_transactions
    if (uniqueBookings.length === 0) {
      console.log('🔄 No bookings found, checking payment_transactions...');
      
      if (userEmail) {
        const { data: payments, error: paymentsError } = await supabase
          .from('payment_transactions')
          .select('*')
          .eq('customer_email', userEmail)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (!paymentsError && payments && payments.length > 0) {
          console.log(`✅ Found ${payments.length} payments for email ${userEmail}`);
          
          for (const payment of payments) {
            if (payment.booking_id) {
              const { data: booking, error: bookingError } = await supabase
                .from('bookings_kereta')
                .select('*')
                .eq('booking_code', payment.booking_id)
                .single();
                
              if (!bookingError && booking) {
                allBookings.push(booking);
              }
            }
          }
          
          const updatedUniqueBookings = Array.from(
            new Map(allBookings.map(item => [item.booking_code || item.id, item])).values()
          );
          
          console.log(`📊 After payment check: ${updatedUniqueBookings.length} bookings`);
          uniqueBookings.push(...updatedUniqueBookings);
        }
      }
    }
    
    if (uniqueBookings.length === 0) {
      console.log('ℹ️ No bookings found after all strategies');
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Tidak ada booking ditemukan',
        count: 0,
        debug: {
          userId,
          userEmail,
          strategiesUsed: queryPromises.length,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // **PERBAIKAN: Enhanced bookings dengan data lengkap**
    const enhancedBookings = await Promise.all(
      uniqueBookings.map(async (booking) => {
        try {
          // **1. Cari data pembayaran terkait**
          let paymentData: any = null;
          if (booking.order_id) {
            const { data: payment } = await supabase
              .from('payment_transactions')
              .select('*')
              .eq('order_id', booking.order_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            paymentData = payment;
          }
          
          // **2. Cek apakah ada data terkait lainnya**
          const [passengersResult, ticketResult] = await Promise.allSettled([
            supabase
              .from('penumpang')
              .select('id')
              .eq('booking_id', booking.id)
              .limit(1),
            supabase
              .from('tickets')
              .select('id')
              .eq('booking_id', booking.booking_code)
              .limit(1)
          ]);
          
          const has_passengers = passengersResult.status === 'fulfilled' && 
                                passengersResult.value.data && 
                                passengersResult.value.data.length > 0;
          
          const has_ticket = ticketResult.status === 'fulfilled' && 
                            ticketResult.value.data && 
                            ticketResult.value.data.length > 0;
          
          const has_payment = !!paymentData;
          
          // **3. Tentukan apakah booking bisa dibayar**
          const can_pay = (booking.status === 'pending' || 
                          booking.status === 'waiting_payment' ||
                          booking.payment_status === 'pending') && 
                         !!paymentData?.payment_url && 
                         paymentData?.status === 'pending';
          
          // **4. Siapkan payment_url (prioritaskan snap_redirect_url)**
          const payment_url = paymentData?.snap_redirect_url || 
                            paymentData?.payment_url || 
                            null;
          
          // **5. Tentukan sumber booking**
          const _source = booking.user_id === userId ? 'user_id' : 
                         booking.passenger_email === userEmail ? 'passenger_email' : 
                         'other';
          
          return {
            id: booking.id,
            booking_code: booking.booking_code || `BOOK-${booking.id?.slice(0, 8) || 'UNKNOWN'}`,
            created_at: booking.created_at || new Date().toISOString(),
            total_amount: Number(booking.total_amount) || 0,
            status: booking.status || 'pending',
            passenger_count: Number(booking.passenger_count) || 1,
            order_id: booking.order_id,
            passenger_name: booking.passenger_name,
            passenger_email: booking.passenger_email,
            passenger_phone: booking.passenger_phone,
            train_name: booking.train_name || 'Kereta Api',
            train_type: booking.train_type,
            origin: booking.origin,
            destination: booking.destination,
            departure_date: booking.departure_date,
            departure_time: booking.departure_time,
            arrival_time: booking.arrival_time,
            payment_status: booking.payment_status || paymentData?.status || 'pending',
            payment_method: booking.payment_method || paymentData?.payment_method,
            payment_date: booking.payment_date || paymentData?.created_at,
            user_id: booking.user_id,
            
            // **DATA PEMBAYARAN PENTING:**
            payment_url: payment_url,
            snap_redirect_url: paymentData?.snap_redirect_url,
            midtrans_token: paymentData?.midtrans_token,
            can_pay: can_pay,
            
            // **DATA TAMBAHAN:**
            payment_data: paymentData ? {
              id: paymentData.id,
              status: paymentData.status,
              amount: paymentData.amount,
              payment_method: paymentData.payment_method,
              transaction_id: paymentData.transaction_id,
              created_at: paymentData.created_at
            } : null,
            
            // **METADATA:**
            has_passengers: has_passengers,
            has_ticket: has_ticket,
            has_payment: has_payment,
            _source: _source,
            
            // **DEBUG INFO:**
            _debug: {
              has_order_id: !!booking.order_id,
              has_payment_data: !!paymentData,
              payment_status: paymentData?.status,
              payment_url_available: !!payment_url
            }
          };
          
        } catch (error) {
          console.error(`❌ Error processing booking ${booking.booking_code}:`, error);
          
          // Return minimal data jika error
          return {
            id: booking.id,
            booking_code: booking.booking_code,
            created_at: booking.created_at,
            total_amount: Number(booking.total_amount) || 0,
            status: booking.status || 'pending',
            passenger_count: Number(booking.passenger_count) || 1,
            order_id: booking.order_id,
            passenger_name: booking.passenger_name,
            passenger_email: booking.passenger_email,
            train_name: booking.train_name,
            origin: booking.origin,
            destination: booking.destination,
            payment_status: booking.payment_status,
            payment_url: null,
            can_pay: false,
            has_payment: false,
            _source: 'error_fallback',
            _debug: { error: 'Processing error' }
          };
        }
      })
    );
    
    // Urutkan berdasarkan tanggal (terbaru dulu)
    enhancedBookings.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    console.log(`🎉 Returning ${enhancedBookings.length} enhanced bookings`);
    
    // **STATISTIK UNTUK DEBUGGING**
    const stats = {
      total: enhancedBookings.length,
      pending: enhancedBookings.filter(b => b.status === 'pending' || b.payment_status === 'pending').length,
      paid: enhancedBookings.filter(b => b.payment_status === 'paid').length,
      with_payment_url: enhancedBookings.filter(b => b.payment_url).length,
      can_pay: enhancedBookings.filter(b => b.can_pay).length,
      sources: {
        user_id: enhancedBookings.filter(b => b._source === 'user_id').length,
        passenger_email: enhancedBookings.filter(b => b._source === 'passenger_email').length,
        other: enhancedBookings.filter(b => b._source === 'other').length
      }
    };
    
    console.log('📈 Booking statistics:', stats);
    
    return NextResponse.json({
      success: true,
      data: enhancedBookings,
      count: enhancedBookings.length,
      message: `${enhancedBookings.length} booking ditemukan`,
      stats: stats,
      debug: {
        userId,
        userEmail,
        timestamp: new Date().toISOString(),
        strategiesUsed: queryPromises.length
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error in bookings/user API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Terjadi kesalahan saat mengambil data bookings',
        error: error.message,
        code: 'API_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}