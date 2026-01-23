// app/api/admin/bookings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Fetch booking with user details
    const { data: booking, error } = await supabase
      .from('bookings_kereta')
      .select(`
        *,
        users:user_id (email, name, phone),
        transaction:transaction_id (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Booking query error:', error);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Transform data
    const transformedData = {
      ...booking,
      user_email: booking.users?.email,
      user_name: booking.users?.name,
      user_phone: booking.users?.phone,
      transaction_details: booking.transaction
    };

    return NextResponse.json({
      success: true,
      data: transformedData
    });

  } catch (error: any) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Check if booking exists
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings_kereta')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Allowed fields for update
    const allowedFields = [
      'status',
      'payment_status',
      'passenger_name',
      'passenger_email',
      'passenger_phone',
      'departure_date',
      'departure_time',
      'passenger_count',
      'total_amount',
      'seat_numbers',
      'notes'
    ];

    // Filter only allowed fields
    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update booking
    const { data, error } = await supabase
      .from('bookings_kereta')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        users:user_id (email, name)
      `)
      .single();

    if (error) {
      console.error('Update booking error:', error);

      // LOGIC: Specific handling for point_transactions constraint violation
      if (error.message?.includes('point_transactions') && error.message?.includes('user_id')) {
        return NextResponse.json(
          {
            error: 'Gagal memberikan poin (Guest Booking). Silakan jalankan SQL fix di Dashboard Supabase untuk mengizinkan update status guest.',
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
      message: 'Booking updated successfully'
    });

  } catch (error: any) {
    console.error('Update booking API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = createClient();
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Check if booking exists
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings_kereta')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Soft delete: Update status to cancelled
    const { data, error } = await supabase
      .from('bookings_kereta')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Delete booking error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      data
    });

  } catch (error: any) {
    console.error('Delete booking API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}