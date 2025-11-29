import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        transactions (
          order_id,
          status,
          payment_type,
          amount,
          created_at
        )
      `)
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError) {
      console.error('Booking query error:', bookingError);
      return NextResponse.json(
        { error: 'Failed to fetch booking' },
        { status: 500 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get transaction if exists
    const transaction = Array.isArray(booking.transactions) 
      ? booking.transactions[0] 
      : booking.transactions;

    // Format dates
    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTime = (dateString: string | null) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Calculate pricing from booking data
    const totalBasePrice = Number(booking.total_amount || 0);
    const tax = Math.round(totalBasePrice * 0.1); // 10% tax
    const serviceFee = 50000; // Fixed service fee
    const totalPrice = totalBasePrice + tax + serviceFee;

    // Transform booking data
    const bookingData = {
      id: booking.id,
      status: booking.status || 'pending',
      bookingDate: formatDate(booking.booking_date || booking.created_at),
      flight: {
        airline: 'TripGo Airlines',
        flightNumber: `TG${booking.order_id?.slice(-6) || booking.id.slice(-6)}`,
        departureTime: '08:00',
        arrivalTime: '10:00',
        duration: '2j 0m',
        originCode: 'CGK',
        destinationCode: 'DPS',
        origin: 'Jakarta',
        destination: 'Bali',
        departureDate: formatDate(booking.booking_date || booking.created_at),
        class: 'Economy'
      },
      passengers: [
        {
          title: 'Mr',
          firstName: booking.customer_name?.split(' ')[0] || 'N/A',
          lastName: booking.customer_name?.split(' ').slice(1).join(' ') || '',
          fullName: booking.customer_name || 'N/A',
          dateOfBirth: '',
          passportNumber: '',
          nationality: 'Indonesia',
          email: booking.customer_email || '',
          seatNumber: 'N/A',
          seatType: 'Economy'
        }
      ],
      passengerCount: 1,
      totalBasePrice: totalBasePrice,
      tax: tax,
      serviceFee: serviceFee,
      totalPrice: totalPrice,
      paymentMethod: transaction?.payment_type || 'Unknown',
      paymentStatus: transaction?.status || booking.status || 'pending',
      orderId: transaction?.order_id || booking.order_id || booking.id,
      transactionId: transaction?.id || null
    };

    return NextResponse.json(bookingData);

  } catch (error: any) {
    console.error('Booking API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
