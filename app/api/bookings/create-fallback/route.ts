// app/api/bookings/create-fallback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();
    
    console.log('📝 Creating fallback booking:', {
      booking_code: bookingData.booking_code,
      passenger_email: bookingData.passenger_email
    });

    // Coba insert dengan kolom minimal
    const insertData: any = {
      booking_code: bookingData.booking_code || `BOOK-${Date.now()}`,
      train_name: bookingData.train_name || 'Kereta Api',
      passenger_count: bookingData.passenger_count || 1,
      total_amount: bookingData.total_amount || 0,
      status: bookingData.status || 'pending',
      created_at: new Date().toISOString()
    };

    // Tambahkan kolom opsional hanya jika ada
    if (bookingData.order_id) insertData.order_id = bookingData.order_id;
    if (bookingData.passenger_name) insertData.passenger_name = bookingData.passenger_name;
    if (bookingData.passenger_email) insertData.passenger_email = bookingData.passenger_email;
    if (bookingData.passenger_phone) insertData.passenger_phone = bookingData.passenger_phone;
    if (bookingData.train_type) insertData.train_type = bookingData.train_type;
    if (bookingData.origin) insertData.origin = bookingData.origin;
    if (bookingData.destination) insertData.destination = bookingData.destination;
    if (bookingData.departure_date) insertData.departure_date = bookingData.departure_date;
    if (bookingData.departure_time) insertData.departure_time = bookingData.departure_time;
    if (bookingData.payment_status) insertData.payment_status = bookingData.payment_status;
    if (bookingData.payment_method) insertData.payment_method = bookingData.payment_method;

    const { data, error } = await supabase
      .from('bookings_kereta')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ Fallback booking error:', error);
      
      // Coba lagi dengan kolom lebih sedikit
      const simplifiedData = {
        booking_code: bookingData.booking_code,
        train_name: bookingData.train_name,
        passenger_count: bookingData.passenger_count || 1,
        total_amount: bookingData.total_amount || 0,
        status: bookingData.status || 'pending',
        created_at: new Date().toISOString()
      };

      const { data: simpleData, error: simpleError } = await supabase
        .from('bookings_kereta')
        .insert([simplifiedData])
        .select()
        .single();

      if (simpleError) {
        console.error('❌ Simple fallback also failed:', simpleError);
        return NextResponse.json({
          success: false,
          message: 'Failed to create booking',
          error: simpleError.message,
          fallback_stored: true // Meski gagal, data sudah disimpan di localStorage
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Fallback booking created (simplified)',
        data: simpleData
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Fallback booking created',
      data
    });

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error.message,
      fallback_stored: true
    });
  }
}