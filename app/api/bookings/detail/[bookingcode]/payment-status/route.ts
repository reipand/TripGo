import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bookingCode: string }> }
) {
  try {
    // PERBAIKAN PENTING: Gunakan await untuk params yang berupa Promise
    const params = await context.params;
    const bookingCode = params.bookingCode;
    
    console.log(`🔍 [DEBUG] Payment status API called`);
    console.log(`📥 Received params:`, params);
    console.log(`🎯 Booking code from params: "${bookingCode}"`);
    
    // Debug URL
    const url = request.url;
    console.log(`🔗 Full URL: ${url}`);
    console.log(`🔗 Pathname: ${request.nextUrl.pathname}`);
    
    // Ekstrak bookingCode dari URL pathname sebagai fallback
    const pathname = request.nextUrl.pathname;
    const pathParts = pathname.split('/');
    console.log(`🔗 Path parts:`, pathParts);
    
    // Coba ambil bookingCode dari URL jika params undefined
    let finalBookingCode = bookingCode;
    if (!finalBookingCode || finalBookingCode === 'undefined') {
      // bookingCode seharusnya di index -2 dari path: /api/bookings/detail/{bookingCode}/payment-status
      const bookingCodeFromUrl = pathParts[pathParts.length - 2];
      if (bookingCodeFromUrl && bookingCodeFromUrl !== 'undefined') {
        finalBookingCode = bookingCodeFromUrl;
        console.log(`🔄 Using booking code from URL: ${finalBookingCode}`);
      }
    }
    
    // 1. Validasi bookingCode
    if (!finalBookingCode || finalBookingCode === 'undefined' || finalBookingCode.trim() === '') {
      console.error(`❌ Invalid booking code: "${finalBookingCode}"`);
      return NextResponse.json({
        success: false,
        error: 'Invalid booking code',
        message: `Booking code is required. Received: "${finalBookingCode}"`,
        data: { 
          payment_status: 'error', 
          can_pay: false, 
          has_payment_url: false,
          debug: {
            params,
            pathname,
            bookingCode,
            finalBookingCode
          }
        }
      }, { status: 400 });
    }
    
    // Decode URL encoded characters
    const decodedBookingCode = decodeURIComponent(finalBookingCode);
    const cleanBookingCode = decodedBookingCode.trim();
    
    console.log(`🔍 Processing payment status for booking: "${cleanBookingCode}"`);
    console.log(`📝 Final: "${finalBookingCode}", Decoded: "${decodedBookingCode}", Cleaned: "${cleanBookingCode}"`);
    
    // 2. Find the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings_kereta')
      .select('*')
      .eq('booking_code', cleanBookingCode)
      .single();
    
    if (bookingError || !booking) {
      console.log(`❌ Booking not found in database: ${cleanBookingCode}`);
      console.log(`📊 Booking error:`, bookingError);
      
      // Coba cari dengan case-insensitive atau partial match
      const { data: similarBookings } = await supabase
        .from('bookings_kereta')
        .select('booking_code, id, status')
        .ilike('booking_code', `%${cleanBookingCode}%`)
        .limit(5);
      
      console.log(`🔍 Similar bookings found:`, similarBookings);
      
      return NextResponse.json({
        success: false,
        error: 'Booking not found',
        message: `Booking with code "${cleanBookingCode}" not found`,
        data: { 
          payment_status: 'not_found', 
          can_pay: false, 
          has_payment_url: false,
          similar_bookings: similarBookings
        }
      }, { status: 404 });
    }
    
    console.log(`✅ Booking found: ${booking.id} - ${booking.status}`);
    console.log(`📊 Booking details:`, {
      id: booking.id,
      booking_code: booking.booking_code,
      status: booking.status,
      payment_status: booking.payment_status,
      order_id: booking.order_id,
      created_at: booking.created_at
    });
    
    // 3. Cari payment transaction
    let paymentData = null;
    let paymentStatus = booking.payment_status || 'pending';
    let canPay = false;
    let hasPaymentUrl = false;
    let paymentUrl = null;
    let orderId = booking.order_id;
    
    console.log(`🔍 Searching for payment with order_id: ${orderId}`);
    
    // Strategy 1: Cari payment berdasarkan order_id
    if (orderId) {
      const { data: paymentByOrderId, error: orderIdError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!orderIdError && paymentByOrderId) {
        paymentData = paymentByOrderId;
        console.log(`💰 Payment found by order_id: ${orderId}`);
      } else {
        console.log(`ℹ️ No payment found by order_id: ${orderId}`);
      }
    } else {
      console.log(`ℹ️ No order_id found in booking`);
    }
    
    // Strategy 2: Cari payment berdasarkan booking_id
    if (!paymentData && booking.id) {
      console.log(`🔍 Searching for payment with booking_id: ${booking.id}`);
      const { data: paymentByBookingId, error: bookingIdError } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('booking_id', booking.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!bookingIdError && paymentByBookingId) {
        paymentData = paymentByBookingId;
        console.log(`💰 Payment found by booking_id: ${booking.id}`);
        
        // Update booking dengan order_id dari payment
        if (paymentData.order_id && !booking.order_id) {
          await supabase
            .from('bookings_kereta')
            .update({ 
              order_id: paymentData.order_id,
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.id);
          
          orderId = paymentData.order_id;
          console.log(`🔄 Updated booking with order_id: ${orderId}`);
        }
      } else {
        console.log(`ℹ️ No payment found by booking_id`);
      }
    }
    
    // Process payment data jika ditemukan
    if (paymentData) {
      paymentStatus = paymentData.status || paymentStatus;
      paymentUrl = paymentData.payment_url || paymentData.snap_redirect_url;
      hasPaymentUrl = !!paymentUrl;
      
      console.log(`📊 Payment data:`, {
        payment_id: paymentData.id,
        payment_status: paymentData.status,
        has_payment_url: hasPaymentUrl,
        payment_url: paymentUrl?.substring(0, 50) + '...'
      });
      
      // Determine if can pay
      canPay = (paymentData.status === 'pending' || !paymentData.status) && 
              (booking.status === 'pending' || !booking.status || booking.status === 'waiting_payment') &&
              hasPaymentUrl;
    } else {
      console.log(`⚠️ No payment record found for booking`);
    }
    
    // Check if booking status should override payment status
    if (booking.status === 'paid' || booking.status === 'confirmed' || booking.status === 'completed') {
      paymentStatus = 'paid';
      canPay = false;
      console.log(`🎯 Overriding status to 'paid' based on booking status: ${booking.status}`);
    }
    
    const result = {
      payment_status: paymentStatus,
      can_pay: canPay,
      has_payment_url: hasPaymentUrl,
      payment_url: paymentUrl,
      booking_status: booking.status,
      order_id: orderId,
      booking_code: booking.booking_code,
      booking_id: booking.id,
      payment_found: !!paymentData,
      payment_id: paymentData?.id
    };
    
    console.log(`✅ Payment status result for ${cleanBookingCode}:`, {
      payment_status: result.payment_status,
      can_pay: result.can_pay,
      has_payment_url: result.has_payment_url,
      payment_found: result.payment_found
    });
    
    return NextResponse.json({
      success: true,
      data: result,
      message: paymentData ? 'Payment data found' : 'No payment data found'
    });
    
  } catch (error: any) {
    console.error(`❌ Error in payment status API:`, error);
    console.error(`🔍 Error stack:`, error.stack);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      data: { 
        payment_status: 'error', 
        can_pay: false, 
        has_payment_url: false,
        error_message: error.message,
        error_stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
}