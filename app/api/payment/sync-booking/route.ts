// app/api/payment/sync-booking/route.ts
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

export async function POST(request: NextRequest) {
  console.log('🔄 /api/payment/sync-booking called');
  
  try {
    const body = await request.json();
    const { bookingCode, orderId } = body;
    
    if (!bookingCode && !orderId) {
      return NextResponse.json({
        success: false,
        error: 'bookingCode or orderId is required'
      }, { status: 400 });
    }
    
    console.log('📥 Sync request:', { bookingCode, orderId });
    
    // 1. Cari di payment_transactions untuk data booking
    let paymentData = null;
    if (orderId) {
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      paymentData = data;
    }
    
    // 2. Cari atau buat booking di bookings_kereta
    let bookingExists = false;
    if (bookingCode) {
      const { data } = await supabase
        .from('bookings_kereta')
        .select('id')
        .eq('booking_code', bookingCode)
        .maybeSingle();
      bookingExists = !!data;
    } else if (orderId) {
      const { data } = await supabase
        .from('bookings_kereta')
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();
      bookingExists = !!data;
    }
    
    // 3. Jika booking tidak ada, buat baru
    if (!bookingExists && (bookingCode || orderId)) {
      console.log(`📝 Creating missing booking: ${bookingCode || orderId}`);
      
      const bookingData: any = {
        booking_code: bookingCode || `BOOK-${Date.now()}`,
        order_id: orderId || `ORDER-${Date.now()}`,
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Tambahkan data dari payment jika ada
      if (paymentData) {
        if (paymentData.customer_email) {
          // Cek kolom yang tersedia
          const hasCustomerEmail = await checkColumnExists('bookings_kereta', 'customer_email');
          const hasPassengerEmail = await checkColumnExists('bookings_kereta', 'passenger_email');
          
          if (hasCustomerEmail) bookingData.customer_email = paymentData.customer_email;
          if (hasPassengerEmail) bookingData.passenger_email = paymentData.customer_email;
        }
        
        if (paymentData.amount) {
          const hasTotalAmount = await checkColumnExists('bookings_kereta', 'total_amount');
          const hasAmount = await checkColumnExists('bookings_kereta', 'amount');
          
          if (hasTotalAmount) bookingData.total_amount = paymentData.amount;
          if (hasAmount) bookingData.amount = paymentData.amount;
        }
      }
      
      const { error } = await supabase
        .from('bookings_kereta')
        .insert([bookingData]);
      
      if (error) {
        console.warn('⚠️ Error creating booking:', error.message);
      } else {
        console.log('✅ Booking created via sync');
      }
    }
    
    // 4. Update status jika perlu
    if (paymentData && paymentData.status === 'paid') {
      const updateData: any = {
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString()
      };
      
      let query = supabase
        .from('bookings_kereta')
        .update(updateData);
      
      if (bookingCode) {
        query = query.eq('booking_code', bookingCode);
      } else if (orderId) {
        query = query.eq('order_id', orderId);
      }
      
      await query;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Booking sync completed',
      data: {
        booking_code: bookingCode,
        order_id: orderId,
        booking_created: !bookingExists,
        payment_exists: !!paymentData,
        payment_status: paymentData?.status
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error in sync-booking:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Sync failed',
      detail: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper untuk cek kolom
async function checkColumnExists(table: string, column: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(table)
      .select(column)
      .limit(1);
    
    return !error || !error.message.includes('does not exist');
  } catch {
    return false;
  }
}