//app/api/bookings/my-bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const email = searchParams.get('email');
    const bookingCode = searchParams.get('booking_code');

    console.log('📥 Fetching bookings for:', { userId, email, bookingCode });

    let query = supabase
      .from('bookings_kereta')
      .select(`
        *,
        schedule:jadwal_kereta (
          travel_date,
          status,
          kereta:train_id (
            code,
            name,
            operator
          )
        ),
        penumpang (*),
        invoices (*)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    // Filter berdasarkan parameter
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      // Cari booking melalui email penumpang
      const { data: passengers } = await supabase
        .from('penumpang')
        .select('booking_id')
        .eq('email', email);

      if (passengers && passengers.length > 0) {
        const bookingIds = passengers.map(p => p.booking_id);
        query = query.in('id', bookingIds);
      } else {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Tidak ada booking ditemukan untuk email ini'
        });
      }
    } else if (bookingCode) {
      query = query.eq('booking_code', bookingCode);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('❌ Error fetching bookings:', error);
      throw error;
    }

    // Format response
    const formattedBookings = bookings?.map(booking => ({
      id: booking.id,
      booking_code: booking.booking_code,
      status: booking.status,
      total_amount: booking.total_amount,
      passenger_count: booking.passenger_count,
      booking_date: booking.booking_date,
      schedule: booking.schedule,
      train: booking.schedule?.kereta,
      passengers: booking.penumpang,
      invoice: booking.invoices?.[0],
      can_cancel: booking.status === 'confirmed' && 
        new Date(booking.schedule?.travel_date) > new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 jam sebelum keberangkatan
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedBookings,
      count: formattedBookings.length
    });

  } catch (error: any) {
    console.error('❌ Error in my-bookings API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal mengambil data bookings'
      },
      { status: 500 }
    );
  }
}