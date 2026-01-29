// app/api/payment/force-sync/route.ts
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
  console.log('⚡ /api/payment/force-sync called');
  
  try {
    const body = await request.json();
    const { bookingCode, orderId, force = false } = body;
    
    if (!bookingCode && !orderId) {
      return NextResponse.json({
        success: false,
        error: 'bookingCode or orderId is required'
      }, { status: 400 });
    }
    
    console.log('📥 Force sync request:', { bookingCode, orderId, force });
    
    // 1. Cari payment data
    let paymentData = null;
    if (orderId) {
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      paymentData = data;
    }
    
    // 2. Cari booking
    let bookingData = null;
    if (bookingCode) {
      const { data } = await supabase
        .from('bookings_kereta')
        .select('*')
        .eq('booking_code', bookingCode)
        .maybeSingle();
      bookingData = data;
    } else if (orderId) {
      const { data } = await supabase
        .from('bookings_kereta')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      bookingData = data;
    }
    
    // 3. Jika booking tidak ada, BUAT PAKSA
    if (!bookingData || force) {
      console.log(`🔄 Force creating/updating booking`);
      
      const bookingPayload: any = {
        booking_code: bookingCode || `BOOK-${Date.now()}`,
        order_id: orderId || `ORDER-${Date.now()}`,
        updated_at: new Date().toISOString()
      };
      
      // Set status berdasarkan payment
      if (paymentData) {
        bookingPayload.payment_status = paymentData.status === 'paid' ? 'paid' : 'pending';
        bookingPayload.status = paymentData.status === 'paid' ? 'confirmed' : 'pending';
        
        // Tambahkan data payment
        if (paymentData.customer_email) {
          const hasCustomerEmail = await checkColumnExists('bookings_kereta', 'customer_email');
          const hasPassengerEmail = await checkColumnExists('bookings_kereta', 'passenger_email');
          
          if (hasCustomerEmail) bookingPayload.customer_email = paymentData.customer_email;
          if (hasPassengerEmail) bookingPayload.passenger_email = paymentData.customer_email;
        }
        
        if (paymentData.amount) {
          const hasTotalAmount = await checkColumnExists('bookings_kereta', 'total_amount');
          const hasAmount = await checkColumnExists('bookings_kereta', 'amount');
          
          if (hasTotalAmount) bookingPayload.total_amount = paymentData.amount;
          if (hasAmount) bookingPayload.amount = paymentData.amount;
        }
        
        if (paymentData.payment_method) {
          const hasPaymentMethod = await checkColumnExists('bookings_kereta', 'payment_method');
          if (hasPaymentMethod) bookingPayload.payment_method = paymentData.payment_method;
        }
      } else {
        bookingPayload.payment_status = 'pending';
        bookingPayload.status = 'pending';
      }
      
      // Jika booking sudah ada, update
      if (bookingData) {
        bookingPayload.created_at = bookingData.created_at || new Date().toISOString();
        
        const { error } = await supabase
          .from('bookings_kereta')
          .update(bookingPayload)
          .or(`booking_code.eq.${bookingCode},order_id.eq.${orderId}`);
        
        if (error) {
          console.warn('⚠️ Error updating booking:', error.message);
        } else {
          console.log('✅ Booking force updated');
        }
      } else {
        // Jika booking belum ada, insert
        bookingPayload.created_at = new Date().toISOString();
        
        const { error } = await supabase
          .from('bookings_kereta')
          .insert([bookingPayload]);
        
        if (error) {
          console.warn('⚠️ Error creating booking:', error.message);
        } else {
          console.log('✅ Booking force created');
        }
      }
    }
    
    // 4. Generate ticket jika pembayaran sukses
    if (paymentData?.status === 'paid' && (bookingCode || bookingData?.booking_code)) {
      const targetBookingCode = bookingCode || bookingData?.booking_code;
      console.log(`🎫 Generating ticket for: ${targetBookingCode}`);
      
      await generateTicket(targetBookingCode!);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Force sync completed',
      data: {
        booking_code: bookingCode,
        order_id: orderId,
        booking_exists: !!bookingData,
        payment_exists: !!paymentData,
        action_taken: !bookingData || force ? 'created/updated' : 'no action'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('💥 Error in force-sync:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Force sync failed',
      detail: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper untuk generate ticket
async function generateTicket(bookingCode: string) {
  try {
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('*')
      .eq('booking_id', bookingCode)
      .maybeSingle();
    
    if (existingTicket) {
      console.log('✅ Ticket already exists');
      return;
    }
    
    const ticketNumber = `TKT-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const ticketData: any = {
      booking_id: bookingCode,
      ticket_number: ticketNumber,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Cek kolom tambahan
    const hasQrCode = await checkColumnExists('tickets', 'qr_code');
    if (hasQrCode) {
      ticketData.qr_code = `data:image/svg+xml;base64,placeholder`;
    }
    
    await supabase
      .from('tickets')
      .insert([ticketData]);
    
    console.log(`✅ Ticket generated: ${ticketNumber}`);
    
  } catch (error) {
    console.warn('⚠️ Ticket generation failed:', error);
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