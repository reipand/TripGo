// app/api/tickets/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_code, passenger_name, order_id } = body;
    
    // Validasi input
    if (!booking_code) {
      return NextResponse.json(
        { success: false, error: 'Booking code is required' },
        { status: 400 }
      );
    }
    
    if (!passenger_name) {
      return NextResponse.json(
        { success: false, error: 'Passenger name is required' },
        { status: 400 }
      );
    }
    
    console.log(`🎫 Generating ticket for booking: ${booking_code}`);
    
    // Cek apakah booking ada
    const { data: booking, error: bookingError } = await supabase
      .from('bookings_kereta')
      .select('*')
      .eq('booking_code', booking_code)
      .single();
    
    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Cek apakah tiket sudah ada
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('*')
      .eq('booking_id', booking_code)
      .single();
    
    if (existingTicket) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ticket already exists',
          data: existingTicket 
        },
        { status: 400 }
      );
    }
    
    // Generate ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Create QR code
    const qrCodeData = JSON.stringify({
      ticket_number: ticketNumber,
      booking_code: booking_code,
      passenger_name: passenger_name,
      date: new Date().toISOString()
    });
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}`;
    
    // Insert ticket to database
    const { data: newTicket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        ticket_number: ticketNumber,
        booking_id: booking_code,
        qr_code: qrCodeUrl,
        status: 'active',
        passenger_name: passenger_name,
        train_name: booking.train_name || 'Kereta Api',
        departure_date: booking.departure_date,
        departure_time: booking.departure_time,
        arrival_time: booking.arrival_time,
        origin: booking.origin || 'Stasiun A',
        destination: booking.destination || 'Stasiun B',
        order_id: order_id || booking.order_id,
        user_id: booking.user_id
      })
      .select()
      .single();
    
    if (ticketError) {
      console.error('Database error:', ticketError);
      return NextResponse.json(
        { success: false, error: 'Failed to save ticket to database' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Ticket generated successfully',
      data: newTicket
    });
    
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}