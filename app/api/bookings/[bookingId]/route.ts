import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

<<<<<<< HEAD
// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
=======
// Initialize Supabase client with fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huwcvhngslkmfljfnxrv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1d2N2aG5nc2xrbWZsamZueHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODA0NjQsImV4cCI6MjA3MjQ1NjQ2NH0.EFKYTaaftNNV0W_4buhjPA5hFS35CHYCqr5nWw54TWg';
>>>>>>> 93a879e (fix fitur)

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

<<<<<<< HEAD
    // Fetch booking details
=======
    // Fetch booking details with related data
>>>>>>> 93a879e (fix fitur)
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
<<<<<<< HEAD
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
=======
        ),
        passengers (
          name,
          email,
          seat_number,
          seat_type,
          title,
          first_name,
          last_name,
          date_of_birth,
          passport_number,
          nationality
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
>>>>>>> 93a879e (fix fitur)
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

<<<<<<< HEAD
    // Get transaction if exists
    const transaction = Array.isArray(booking.transactions) 
      ? booking.transactions[0] 
      : booking.transactions;

    // Format dates
    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'N/A';
=======
    // Transform data to match booking confirmation interface
    const schedule = booking.schedules;
    const route = schedule?.routes;
    const transportation = schedule?.transportations;
    const transaction = booking.transactions?.[0];

    if (!schedule || !route || !transportation) {
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
>>>>>>> 93a879e (fix fitur)
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

<<<<<<< HEAD
    const formatTime = (dateString: string | null) => {
      if (!dateString) return 'N/A';
=======
    const formatTime = (dateString: string) => {
>>>>>>> 93a879e (fix fitur)
      return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

<<<<<<< HEAD
    // Calculate pricing from booking data
    const totalBasePrice = Number(booking.total_amount || 0);
=======
    // Calculate pricing
    const basePrice = schedule.price || 0;
    const passengerCount = booking.passengers?.length || 1;
    const totalBasePrice = basePrice * passengerCount;
>>>>>>> 93a879e (fix fitur)
    const tax = Math.round(totalBasePrice * 0.1); // 10% tax
    const serviceFee = 50000; // Fixed service fee
    const totalPrice = totalBasePrice + tax + serviceFee;

<<<<<<< HEAD
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
=======
    const bookingData = {
      id: booking.id,
      status: booking.status,
      bookingDate: formatDate(booking.booking_date),
      flight: {
        airline: transportation.name,
        flightNumber: `TG${booking.id.slice(-6)}`,
        departureTime: formatTime(schedule.departure_time),
        arrivalTime: formatTime(schedule.arrival_time),
        duration: duration,
        originCode: route.origin?.code || 'N/A',
        destinationCode: route.destination?.code || 'N/A',
        origin: route.origin?.name || 'Unknown',
        destination: route.destination?.name || 'Unknown',
        departureDate: formatDate(schedule.departure_time),
        class: booking.passengers?.[0]?.seat_type || 'Economy'
      },
      passengers: booking.passengers?.map((passenger: any) => ({
        title: passenger.title || 'Mr',
        firstName: passenger.first_name || '',
        lastName: passenger.last_name || '',
        fullName: passenger.name || `${passenger.first_name} ${passenger.last_name}`,
        dateOfBirth: passenger.date_of_birth || '',
        passportNumber: passenger.passport_number || '',
        nationality: passenger.nationality || 'Indonesia',
        email: passenger.email || '',
        seatNumber: passenger.seat_number || 'N/A',
        seatType: passenger.seat_type || 'Economy'
      })) || [],
      passengerCount: passengerCount,
>>>>>>> 93a879e (fix fitur)
      totalBasePrice: totalBasePrice,
      tax: tax,
      serviceFee: serviceFee,
      totalPrice: totalPrice,
      paymentMethod: transaction?.payment_type || 'Unknown',
<<<<<<< HEAD
      paymentStatus: transaction?.status || booking.status || 'pending',
      orderId: transaction?.order_id || booking.order_id || booking.id,
=======
      paymentStatus: transaction?.status || 'pending',
      orderId: transaction?.order_id || booking.id,
>>>>>>> 93a879e (fix fitur)
      transactionId: transaction?.id || null
    };

    return NextResponse.json(bookingData);

<<<<<<< HEAD
  } catch (error: any) {
    console.error('Booking API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
=======
  } catch (error) {
    console.error('Booking API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
>>>>>>> 93a879e (fix fitur)
      { status: 500 }
    );
  }
}
