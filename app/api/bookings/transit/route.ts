import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();

    // Validate required fields
    const requiredFields = [
      'passengerDetails',
      'contactDetails',
      'transitRouteId',
      'transitSegments',
      'totalAmount'
    ];

    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const bookingId = uuidv4();
    const bookingCode = `TRANSIT-${Date.now().toString(36).toUpperCase()}`;
    const orderId = `ORDER-TRANSIT-${Date.now()}`;

    // Start database transaction
    const { data: booking, error: bookingError } = await supabase
      .from('bookings_kereta')
      .insert({
        id: bookingId,
        booking_code: bookingCode,
        order_id: orderId,
        transit_route_id: bookingData.transitRouteId,
        transit_segments: bookingData.transitSegments,
        transit_stations: bookingData.transitStations || [],
        transit_total_adjustment: bookingData.transitTotalAdjustment || 0,
        transit_discount: bookingData.transitDiscount || 0,
        passenger_count: bookingData.passengerCount,
        passenger_details: JSON.stringify(bookingData.passengerDetails),
        customer_email: bookingData.contactDetails.email,
        passenger_name: bookingData.contactDetails.fullName,
        passenger_email: bookingData.contactDetails.email,
        passenger_phone: bookingData.contactDetails.phoneNumber,
        total_amount: bookingData.totalAmount,
        status: 'pending',
        payment_status: 'pending',
        payment_method: bookingData.paymentMethod || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // 2. Create passenger records
    const passengers = bookingData.passengerDetails.map((passenger: any, index: number) => ({
      id: uuidv4(),
      booking_id: bookingId,
      nama: passenger.fullName,
      nik: passenger.idNumber,
      email: passenger.email,
      phone: passenger.phoneNumber,
      passenger_order: index + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: passengersError } = await supabase
      .from('penumpang')
      .insert(passengers);

    if (passengersError) {
      console.error('Passengers creation error:', passengersError);
      // Rollback booking
      await supabase.from('bookings_kereta').delete().eq('id', bookingId);
      return NextResponse.json(
        { error: 'Failed to create passenger records' },
        { status: 500 }
      );
    }

    // 3. Reserve seats for each transit segment
    const seatReservations = [];
    for (const segment of bookingData.transitSegments) {
      const { data: availableSeats, error: seatsError } = await supabase
        .from('train_seats')
        .select('id, seat_number, coach_id')
        .eq('schedule_id', segment.train_schedule_id)
        .eq('status', 'available')
        .limit(bookingData.passengerCount);

      if (seatsError || !availableSeats || availableSeats.length < bookingData.passengerCount) {
        console.error('Insufficient seats for segment:', segment.id);
        // Rollback all operations
        await supabase.from('bookings_kereta').delete().eq('id', bookingId);
        await supabase.from('penumpang').delete().eq('booking_id', bookingId);
        return NextResponse.json(
          { error: `Insufficient seats for segment ${segment.segment_order}` },
          { status: 409 }
        );
      }

      // Update seat status
      const seatUpdates = availableSeats.map(seat => ({
        id: seat.id,
        status: 'reserved',
        booking_id: bookingId,
        updated_at: new Date().toISOString()
      }));

      const { error: updateError } = await supabase
        .from('train_seats')
        .upsert(seatUpdates);

      if (updateError) {
        console.error('Seat update error:', updateError);
        await supabase.from('bookings_kereta').delete().eq('id', bookingId);
        await supabase.from('penumpang').delete().eq('booking_id', bookingId);
        return NextResponse.json(
          { error: 'Failed to reserve seats' },
          { status: 500 }
        );
      }

      // Create transit seat records
      const transitSeats = availableSeats.map((seat, index) => ({
        id: uuidv4(),
        booking_id: bookingId,
        transit_segment_id: segment.id,
        seat_id: seat.id,
        seat_number: seat.seat_number,
        coach_number: `Coach-${seat.coach_id?.slice(0, 8)}`,
        passenger_name: bookingData.passengerDetails[index]?.fullName || 'Penumpang',
        from_station_id: segment.origin_station_id,
        to_station_id: segment.destination_station_id,
        price_adjustment: segment.price_adjustment || 0,
        status: 'reserved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      seatReservations.push(...transitSeats);
    }

    // 4. Insert all transit seat records
    if (seatReservations.length > 0) {
      const { error: transitSeatsError } = await supabase
        .from('transit_seats')
        .insert(seatReservations);

      if (transitSeatsError) {
        console.error('Transit seats error:', transitSeatsError);
        // Rollback all operations
        await supabase.from('bookings_kereta').delete().eq('id', bookingId);
        await supabase.from('penumpang').delete().eq('booking_id', bookingId);
        // Release reserved seats
        await supabase
          .from('train_seats')
          .update({ status: 'available', booking_id: null })
          .in('id', seatReservations.map(s => s.seat_id));
        return NextResponse.json(
          { error: 'Failed to create transit seat records' },
          { status: 500 }
        );
      }
    }

    // 5. Create booking history
    const { error: historyError } = await supabase
      .from('transit_booking_history')
      .insert({
        id: uuidv4(),
        booking_id: bookingId,
        transit_route_id: bookingData.transitRouteId,
        action: 'booked',
        details: {
          segments: bookingData.transitSegments.length,
          passengers: bookingData.passengerCount,
          total_amount: bookingData.totalAmount
        },
        performed_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('History creation error:', historyError);
      // Continue anyway - this is non-critical
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: bookingId,
        booking_code: bookingCode,
        order_id: orderId,
        total_amount: bookingData.totalAmount,
        passenger_count: bookingData.passengerCount,
        transit_segments: bookingData.transitSegments.length,
        created_at: new Date().toISOString(),
        payment_url: `/payment/transit/${bookingCode}`
      }
    });

  } catch (error: any) {
    console.error('Transit booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}