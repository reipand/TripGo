import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// POST /api/admin/trains/generate-schedules
// Body: { train_id: string, dates: string[], routes: { origin_station_code: string, destination_station_code: string, route_order: number, arrival_time: string, departure_time: string, duration_minutes: number }[] }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { train_id, dates, routes } = body || {};

    if (!train_id || !Array.isArray(dates) || dates.length === 0 || !Array.isArray(routes) || routes.length === 0) {
      return NextResponse.json({ error: 'train_id, dates[], dan routes[] wajib diisi' }, { status: 400 });
    }

    // Resolve stasiun code -> id
    const stationCodes = Array.from(new Set(routes.flatMap((r: any) => [r.origin_station_code, r.destination_station_code])));
    const { data: stations, error: stErr } = await supabase
      .from('stasiun')
      .select('id, code')
      .in('code', stationCodes);
    if (stErr) return NextResponse.json({ error: 'Gagal mengambil stasiun', details: stErr.message }, { status: 500 });

    const stationMap = new Map<string, string>();
    for (const s of stations || []) stationMap.set(s.code, s.id);

    for (const date of dates) {
      // Cek duplikasi jadwal (train_id + travel_date)
      const { data: exist, error: chkErr } = await supabase
        .from('jadwal_kereta')
        .select('id')
        .eq('train_id', train_id)
        .eq('travel_date', date)
        .maybeSingle();
      if (chkErr) return NextResponse.json({ error: 'Gagal cek jadwal', details: chkErr.message }, { status: 500 });
      if (exist) continue; // skip tanggal yang sudah ada

      // Insert schedule
      const { data: schedule, error: schErr } = await supabase
        .from('jadwal_kereta')
        .insert([{ train_id, travel_date: date, status: 'scheduled' }])
        .select()
        .single();
      if (schErr) return NextResponse.json({ error: 'Gagal membuat jadwal', details: schErr.message }, { status: 500 });

      // Insert routes
      const routesPayload = routes.map((r: any) => ({
        schedule_id: schedule.id,
        origin_station_id: stationMap.get(r.origin_station_code),
        destination_station_id: stationMap.get(r.destination_station_code),
        route_order: r.route_order,
        arrival_time: r.arrival_time,
        departure_time: r.departure_time,
        duration_minutes: r.duration_minutes,
      }));

      const { error: rtErr } = await supabase.from('rute_kereta').insert(routesPayload);
      if (rtErr) return NextResponse.json({ error: 'Gagal membuat rute', details: rtErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan server', details: e.message }, { status: 500 });
  }
}
