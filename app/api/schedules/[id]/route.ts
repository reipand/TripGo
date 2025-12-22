import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// GET /api/schedules/[id] -> detail jadwal + rute + gerbong + kursi (schema baru)
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
  }

  try {
    // Detail jadwal + info kereta
    const { data: schedule, error: schedErr } = await supabase
      .from('jadwal_kereta')
      .select('id, travel_date, status, train_id, kereta:train_id ( id, code, name, operator )')
      .eq('id', id)
      .single();

    if (schedErr) {
      return NextResponse.json({ error: 'Gagal mengambil jadwal', details: schedErr.message }, { status: 500 });
    }
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });

    // Rute berurutan
    const { data: routes, error: routeErr } = await supabase
      .from('rute_kereta')
      .select('id, schedule_id, origin_station_id, destination_station_id, route_order, arrival_time, departure_time, duration_minutes')
      .eq('schedule_id', id)
      .order('route_order', { ascending: true });

    if (routeErr) {
      return NextResponse.json({ error: 'Gagal mengambil rute', details: routeErr.message }, { status: 500 });
    }

    // Daftar gerbong
    const { data: coaches, error: coachErr } = await supabase
      .from('gerbong')
      .select('id, train_id, coach_code, class_type, total_seats, layout')
      .eq('train_id', schedule.train_id)
      .order('coach_code', { ascending: true });

    if (coachErr) {
      return NextResponse.json({ error: 'Gagal mengambil gerbong', details: coachErr.message }, { status: 500 });
    }

    // Kursi pada schedule ini
    const { data: seats, error: seatErr } = await supabase
      .from('train_seats')
      .select('id, schedule_id, coach_id, seat_number, from_route_id, to_route_id, status, booking_id')
      .eq('schedule_id', id);

    if (seatErr) {
      return NextResponse.json({ error: 'Gagal mengambil kursi', details: seatErr.message }, { status: 500 });
    }

    const responseData = {
      schedule,
      routes: routes || [],
      coaches: coaches || [],
      seats: seats || [],
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch schedule details', details: error.message }, { status: 500 });
  }
}
