// app/api/schedules/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// GET /api/schedules/[id] -> detail jadwal + rute + gerbong + kursi (schema baru)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    console.log(`🔍 Fetching schedule details for ID: ${id}`);

    // 1. Detail jadwal + info kereta
    const { data: schedule, error: schedErr } = await supabase
      .from('jadwal_kereta')
      .select(`
        id,
        travel_date,
        status,
        train_id,
        kereta:train_id (
          id,
          kode_kereta,
          nama_kereta,
          operator,
          tipe_kereta,
          jumlah_kursi,
          fasilitas
        )
      `)
      .eq('id', id)
      .single();

    if (schedErr) {
      console.error('❌ Error fetching schedule:', schedErr);
      return NextResponse.json({ 
        error: 'Gagal mengambil jadwal', 
        details: schedErr.message,
        hint: schedErr.hint 
      }, { status: 500 });
    }

    if (!schedule) {
      console.log(`⚠️ Schedule not found for ID: ${id}`);
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    console.log(`✅ Schedule found: ${schedule.kereta?.nama_kereta || 'Unknown'}`);

    // 2. Rute berurutan
    const { data: routes, error: routeErr } = await supabase
      .from('rute_kereta')
      .select(`
        id,
        schedule_id,
        origin_station_id,
        destination_station_id,
        route_order,
        arrival_time,
        departure_time,
        duration_minutes,
        origin_station:origin_station_id (
          id,
          kode_stasiun,
          nama_stasiun,
          city,
          tipe
        ),
        destination_station:destination_station_id (
          id,
          kode_stasiun,
          nama_stasiun,
          city,
          tipe
        )
      `)
      .eq('schedule_id', id)
      .order('route_order', { ascending: true });

    if (routeErr) {
      console.error('❌ Error fetching routes:', routeErr);
      return NextResponse.json({ 
        error: 'Gagal mengambil rute', 
        details: routeErr.message 
      }, { status: 500 });
    }

    console.log(`✅ Found ${routes?.length || 0} routes`);

    // 3. Daftar gerbong
    const { data: coaches, error: coachErr } = await supabase
      .from('gerbong')
      .select(`
        id,
        train_id,
        coach_code,
        class_type,
        total_seats,
        layout
      `)
      .eq('train_id', schedule.train_id)
      .order('coach_code', { ascending: true });

    if (coachErr) {
      console.error('❌ Error fetching coaches:', coachErr);
      return NextResponse.json({ 
        error: 'Gagal mengambil gerbong', 
        details: coachErr.message 
      }, { status: 500 });
    }

    console.log(`✅ Found ${coaches?.length || 0} coaches`);

    // 4. Kursi pada schedule ini
    const { data: seats, error: seatErr } = await supabase
      .from('train_seats')
      .select(`
        id,
        schedule_id,
        coach_id,
        seat_number,
        from_route_id,
        to_route_id,
        status,
        booking_id,
        coach:coach_id (
          id,
          coach_code,
          class_type
        )
      `)
      .eq('schedule_id', id);

    if (seatErr) {
      console.error('❌ Error fetching seats:', seatErr);
      return NextResponse.json({ 
        error: 'Gagal mengambil kursi', 
        details: seatErr.message 
      }, { status: 500 });
    }

    console.log(`✅ Found ${seats?.length || 0} seats`);

    // Transform data untuk response yang lebih clean
    const responseData = {
      schedule: {
        id: schedule.id,
        travel_date: schedule.travel_date,
        status: schedule.status,
        train: schedule.kereta ? {
          id: schedule.kereta.id,
          code: schedule.kereta.kode_kereta,
          name: schedule.kereta.nama_kereta,
          operator: schedule.kereta.operator,
          type: schedule.kereta.tipe_kereta,
          total_seats: schedule.kereta.jumlah_kursi,
          facilities: schedule.kereta.fasilitas
        } : null
      },
      routes: (routes || []).map(route => ({
        id: route.id,
        schedule_id: route.schedule_id,
        route_order: route.route_order,
        arrival_time: route.arrival_time,
        departure_time: route.departure_time,
        duration_minutes: route.duration_minutes,
        origin_station: route.origin_station ? {
          id: route.origin_station.id,
          code: route.origin_station.kode_stasiun,
          name: route.origin_station.nama_stasiun,
          city: route.origin_station.city,
          type: route.origin_station.tipe
        } : null,
        destination_station: route.destination_station ? {
          id: route.destination_station.id,
          code: route.destination_station.kode_stasiun,
          name: route.destination_station.nama_stasiun,
          city: route.destination_station.city,
          type: route.destination_station.tipe
        } : null
      })),
      coaches: (coaches || []).map(coach => ({
        id: coach.id,
        train_id: coach.train_id,
        coach_code: coach.coach_code,
        class_type: coach.class_type,
        total_seats: coach.total_seats,
        layout: coach.layout,
        available_seats: (seats || []).filter(seat => 
          seat.coach_id === coach.id && seat.status === 'available'
        ).length
      })),
      seats: (seats || []).map(seat => ({
        id: seat.id,
        schedule_id: seat.schedule_id,
        coach_id: seat.coach_id,
        seat_number: seat.seat_number,
        from_route_id: seat.from_route_id,
        to_route_id: seat.to_route_id,
        status: seat.status,
        booking_id: seat.booking_id,
        coach: seat.coach ? {
          id: seat.coach.id,
          coach_code: seat.coach.coach_code,
          class_type: seat.coach.class_type
        } : null
      }))
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('❌ Unexpected error in schedule details API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch schedule details', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}