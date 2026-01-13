import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingCode = searchParams.get('bookingCode');

    if (!bookingCode) {
      return NextResponse.json(
        { success: false, error: 'Booking Code diperlukan' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('booking_id', bookingCode)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || null
    });

  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengambil data tiket' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      booking_id,
      booking_code,
      passenger_name,
      passenger_email,
      train_name,
      departure_date,
      departure_time,
      arrival_time,
      origin,
      destination,
      seat_number,
      coach_number
    } = body;

    // Generate ticket number
    const ticketNumber = `TICKET-${Date.now().toString().slice(-10)}`;

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        booking_id,
        ticket_number: ticketNumber,
        passenger_name,
        passenger_email,
        train_name,
        departure_date,
        departure_time,
        arrival_time,
        origin,
        destination,
        seat_number,
        coach_number,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal membuat tiket' },
      { status: 500 }
    );
  }
}