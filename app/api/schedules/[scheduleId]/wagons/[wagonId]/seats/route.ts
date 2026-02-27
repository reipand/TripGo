import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { scheduleId: string; wagonId: string } }
) {
  try {
    const { data: seats, error } = await supabase
      .from('train_seats')
      .select(`
        *,
        booking:bookings_kereta(
          id,
          booking_code,
          passenger_name,
          passenger_email
        )
      `)
      .eq('schedule_id', params.scheduleId)
      .eq('coach_id', params.wagonId)
      .order('seat_number');

    if (error) throw error;

    return NextResponse.json(seats);
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil data kursi' },
      { status: 500 }
    );
  }
}
