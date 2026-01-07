import { NextRequest, NextResponse } from 'next/server';
import { TransitService } from '@/app/services/transitService';

// GET /api/transit/seats - Check seat availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const scheduleId = searchParams.get('scheduleId');
    const departureStation = searchParams.get('departure');
    const arrivalStation = searchParams.get('arrival');
    const travelDate = searchParams.get('date');
    const seatClass = searchParams.get('class');

    if (!scheduleId || !departureStation || !arrivalStation || !travelDate) {
      return NextResponse.json(
        { error: 'Parameter tidak lengkap' },
        { status: 400 }
      );
    }

    const availableSeats = await TransitService.getAvailableSeats({
      scheduleId,
      departureStationCode: departureStation,
      arrivalStationCode: arrivalStation,
      travelDate,
      seatClass: seatClass || undefined
    });

    return NextResponse.json({
      success: true,
      data: {
        available_seats: availableSeats,
        count: availableSeats.length
      }
    });

  } catch (error: any) {
    console.error('Error getting available seats:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/transit/book - Book transit seat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      bookingId,
      scheduleId,
      seatId,
      departureStationCode,
      arrivalStationCode,
      passengerDetails
    } = body;

    // Validasi
    if (!bookingId || !scheduleId || !seatId || !departureStationCode || !arrivalStationCode) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    // Get station orders
    const departureOrder = await TransitService.getStationOrder(
      scheduleId, 
      departureStationCode
    );
    const arrivalOrder = await TransitService.getStationOrder(
      scheduleId, 
      arrivalStationCode
    );

    if (!departureOrder || !arrivalOrder) {
      return NextResponse.json(
        { error: 'Stasiun tidak valid' },
        { status: 400 }
      );
    }

    // Book the seat segment
    const success = await TransitService.bookSeatSegment(
      bookingId,
      scheduleId,
      seatId,
      departureOrder,
      arrivalOrder,
      departureStationCode,
      arrivalStationCode
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Gagal membooking kursi' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kursi berhasil dipesan',
      data: {
        booking_id: bookingId,
        seat_id: seatId,
        departure_station: departureStationCode,
        arrival_station: arrivalStationCode,
        departure_order: departureOrder,
        arrival_order: arrivalOrder
      }
    });

  } catch (error: any) {
    console.error('Error booking transit seat:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/transit/book - Cancel booking
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const bookingId = searchParams.get('bookingId');
    const seatId = searchParams.get('seatId');
    const scheduleId = searchParams.get('scheduleId');

    if (!bookingId || !seatId || !scheduleId) {
      return NextResponse.json(
        { error: 'Parameter tidak lengkap' },
        { status: 400 }
      );
    }

    const success = await TransitService.cancelSeatSegment(
      bookingId,
      seatId,
      scheduleId
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Gagal membatalkan booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking berhasil dibatalkan'
    });

  } catch (error: any) {
    console.error('Error canceling booking:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}