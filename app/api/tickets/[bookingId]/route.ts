import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huwcvhngslkmfljfnxrv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1d2N2aG5nc2xrbWZsamZueHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODA0NjQsImV4cCI6MjA3MjQ1NjQ2NH0.EFKYTaaftNNV0W_4buhjPA5hFS35CHYCqr5nWw54TWg';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Fetch booking details with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        transactions (
          order_id,
          status,
          payment_type,
          amount
        ),
        passengers (
          name,
          email,
          seat_number,
          seat_type
        ),
        schedules (
          departure_time,
          arrival_time,
          price,
          routes (
            origin_city_id,
            destination_city_id,
            origin:cities!origin_city_id (
              name,
              code
            ),
            destination:cities!destination_city_id (
              name,
              code
            )
          ),
          transportations (
            name,
            type,
            logo_url
          )
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Transform data to match ETicket interface
    const schedule = booking.schedules;
    const route = schedule?.routes;
    const transportation = schedule?.transportations;
    const transaction = booking.transactions?.[0];
    const passenger = booking.passengers?.[0];

    if (!schedule || !route || !transportation || !passenger) {
      return NextResponse.json(
        { error: 'Incomplete booking data' },
        { status: 400 }
      );
    }

    // Calculate flight duration
    const departureTime = new Date(schedule.departure_time);
    const arrivalTime = new Date(schedule.arrival_time);
    const durationMs = arrivalTime.getTime() - departureTime.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = `${durationHours}j ${durationMinutes}m`;

    // Format dates and times
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTime = (dateString: string) => {
      return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const ticketData = {
      bookingId: booking.id,
      orderId: transaction?.order_id || booking.id,
      passengerName: passenger.name,
      passengerEmail: passenger.email,
      flightDetails: {
        airline: transportation.name,
        flightNumber: `TG${bookingId.slice(-6)}`, // Generate flight number
        aircraft: 'Boeing 737-800', // Default aircraft
        origin: route.origin?.name || 'Unknown',
        destination: route.destination?.name || 'Unknown',
        departure: {
          airport: `${route.origin?.name} (${route.origin?.code})`,
          terminal: 'Terminal 1',
          date: formatDate(schedule.departure_time),
          time: formatTime(schedule.departure_time)
        },
        arrival: {
          airport: `${route.destination?.name} (${route.destination?.code})`,
          terminal: 'Terminal 1',
          date: formatDate(schedule.arrival_time),
          time: formatTime(schedule.arrival_time)
        },
        duration: duration,
        class: passenger.seat_type || 'Economy'
      },
      seatDetails: {
        seatNumber: passenger.seat_number || 'N/A',
        seatType: passenger.seat_type || 'Economy',
        price: schedule.price || 0
      },
      bookingDetails: {
        bookingDate: formatDate(booking.booking_date),
        totalAmount: booking.total_amount || transaction?.amount || 0,
        paymentMethod: transaction?.payment_type || 'Unknown',
        status: booking.status || 'confirmed'
      },
      qrCode: `TRP-${bookingId}-${passenger.name.replace(/\s+/g, '-').toUpperCase()}`,
      barcode: `|||${bookingId}|||`
    };

    return NextResponse.json(ticketData);

  } catch (error) {
    console.error('Ticket API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update ticket status (for real-time updates)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await request.json();
    const { status, notes } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
        ...(notes && { notes })
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Booking updated successfully',
      status: status 
    });

  } catch (error) {
    console.error('Update API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
