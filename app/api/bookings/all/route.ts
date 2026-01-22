// app/api/bookings/all/route.ts
import { createClient } from '@/app/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    console.log('📋 Fetching all bookings...');
    
    // Get bookings from database
    const { data: bookings, error } = await supabase
      .from('bookings_kereta')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({
        success: true,
        bookings: [],
        fallback: true,
        message: 'Using fallback data'
      });
    }
    
    // Format bookings
    const formattedBookings = (bookings || []).map(booking => ({
      id: booking.id,
      booking_code: booking.booking_code,
      order_id: booking.order_id,
      passenger_name: booking.passenger_name,
      passenger_email: booking.passenger_email,
      passenger_phone: booking.passenger_phone,
      train_name: booking.train_name || 'Kereta Api',
      train_type: booking.train_type || 'Executive',
      origin: booking.origin || 'Stasiun A',
      destination: booking.destination || 'Stasiun B',
      departure_date: booking.departure_date,
      departure_time: booking.departure_time,
      arrival_time: booking.arrival_time,
      total_amount: booking.total_amount,
      status: booking.status || 'pending',
      payment_status: booking.payment_status || 'pending',
      payment_method: booking.payment_method,
      passenger_count: booking.passenger_count || 1,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
      has_transit: !!booking.transit_station,
      transit_info: booking.transit_station ? {
        transit_station: booking.transit_station,
        transit_arrival: booking.transit_arrival,
        transit_departure: booking.transit_departure
      } : null
    }));
    
    console.log(`✅ Found ${formattedBookings.length} bookings`);
    
    return NextResponse.json({
      success: true,
      bookings: formattedBookings
    });
    
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({
      success: true,
      bookings: [],
      fallback: true,
      message: 'Error fetching bookings'
    });
  }
}