import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('bookings_kereta')
      .select(`
        *,
        users:user_id (email, name)
      `, { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`
        booking_code.ilike.%${search}%,
        passenger_name.ilike.%${search}%,
        passenger_email.ilike.%${search}%,
        train_name.ilike.%${search}%,
        origin.ilike.%${search}%,
        destination.ilike.%${search}%
      `);
    }

    if (startDate) {
      query = query.gte('booking_date', startDate);
    }

    if (endDate) {
      query = query.lte('booking_date', endDate);
    }

    // Apply sorting
    if (sortBy === 'booking_date') {
      query = query.order('booking_date', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'total_amount') {
      query = query.order('total_amount', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    // Execute query with pagination
    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error('Bookings query error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Transform data
    const transformedData = data?.map(booking => ({
      ...booking,
      user_email: booking.users?.email,
      user_name: booking.users?.name
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
        hasNextPage: (count || 0) > to + 1,
        hasPrevPage: page > 1
      }
    });

  } catch (error: any) {
    console.error('Bookings API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'user_id', 'passenger_name', 'passenger_email',
      'train_code', 'origin', 'destination', 'total_amount'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate booking code
    const bookingCode = `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create booking
    const bookingData = {
      user_id: body.user_id,
      booking_code: bookingCode,
      passenger_name: body.passenger_name,
      passenger_email: body.passenger_email,
      passenger_phone: body.passenger_phone || '',
      train_code: body.train_code,
      train_name: body.train_name || body.train_code,
      origin: body.origin,
      destination: body.destination,
      departure_date: body.departure_date || new Date().toISOString().split('T')[0],
      departure_time: body.departure_time || '08:00',
      passenger_count: body.passenger_count || 1,
      total_amount: body.total_amount,
      status: body.status || 'pending',
      payment_status: body.payment_status || 'pending',
      payment_method: body.payment_method || 'manual',
      booking_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('bookings_kereta')
      .insert([bookingData])
      .select()
      .single();

    if (error) {
      console.error('Create booking error:', error);

      // LOGIC: Specific handling for point_transactions constraint violation
      if (error.message?.includes('point_transactions') && error.message?.includes('user_id')) {
        return NextResponse.json(
          {
            error: 'Gagal memberikan poin (Guest Booking). Silakan jalankan SQL fix di Dashboard Supabase agar booking dapat dibuat.',
            details: error.message,
            code: 'POINT_TRANSACTION_FAILED'
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Booking created successfully'
    });

  } catch (error: any) {
    console.error('Create booking API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}