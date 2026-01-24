// /app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const origin = searchParams.get('origin')?.toUpperCase() || '';
    const destination = searchParams.get('destination')?.toUpperCase() || '';
    const date = searchParams.get('date');
    const transportType = searchParams.get('transportType') || 'train';

    console.log(`[SEARCH API] Origin: ${origin}, Dest: ${destination}, Date: ${date}`);

    if (!origin || !destination || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validasi tanggal
    const travelDate = new Date(date);
    if (isNaN(travelDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // 1. Cari stasiun berdasarkan kode
    const [originStation, destStation] = await Promise.all([
      supabase
        .from('stasiun')
        .select('id, kode_stasiun, nama_stasiun')
        .eq('kode_stasiun', origin)
        .eq('is_active', true)
        .single(),
      supabase
        .from('stasiun')
        .select('id, kode_stasiun, nama_stasiun')
        .eq('kode_stasiun', destination)
        .eq('is_active', true)
        .single()
    ]);

    if (originStation.error || !originStation.data) {
      return NextResponse.json(
        { error: `Origin station ${origin} not found` },
        { status: 404 }
      );
    }

    if (destStation.error || !destStation.data) {
      return NextResponse.json(
        { error: `Destination station ${destination} not found` },
        { status: 404 }
      );
    }

    const originId = originStation.data.id;
    const destId = destStation.data.id;

    console.log(`[SEARCH DEBUG] Matched Origin ID: ${originId}, Dest ID: ${destId}`);

    // 2. Cari jadwal untuk tanggal tersebut
    const { data: schedules, error: schedulesError } = await supabase
      .from('jadwal_kereta')
      .select(`
        id,
        travel_date,
        status,
        kereta (
          id,
          kode_kereta,
          nama_kereta,
          operator,
          tipe_kereta,
          is_active
        )
      `)
      .eq('travel_date', date)
      .eq('status', 'scheduled');

    if (schedulesError) {
      console.error('❌ Error fetching schedules:', schedulesError);
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      );
    }

    console.log(`[SEARCH DEBUG] Found ${schedules?.length || 0} schedules for date ${date}`);

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        origin: originStation.data,
        destination: destStation.data,
        date: date,
        schedules: [],
        total: 0
      });
    }

    // 3. Filter jadwal yang memiliki rute dari origin ke destination
    const validSchedules = [];
    
    for (const schedule of schedules) {
      if (!schedule.kereta?.is_active) continue;

      // Cari semua rute untuk jadwal ini
      const { data: routes, error: routesError } = await supabase
        .from('rute_kereta')
        .select('*')
        .eq('schedule_id', schedule.id)
        .order('route_order');

      if (routesError) continue;

      // Cari route yang sesuai
      let originRoute = null;
      let destRoute = null;

      for (const route of routes) {
        if (route.origin_station_id === originId) {
          originRoute = route;
        }
        if (route.destination_station_id === destId) {
          destRoute = route;
        }
      }

      // Pastikan ada rute dan rute tujuan setelah rute asal
      if (originRoute && destRoute && destRoute.route_order > originRoute.route_order) {
        // Hitung durasi
        const depTime = new Date(`1970-01-01T${originRoute.departure_time}`);
        const arrTime = new Date(`1970-01-01T${destRoute.arrival_time}`);
        const durationMinutes = (arrTime.getTime() - depTime.getTime()) / (1000 * 60);

        // Hitung kursi tersedia
        const { count: availableSeats, error: seatsError } = await supabase
          .from('train_seats')
          .select('*', { count: 'exact', head: true })
          .eq('schedule_id', schedule.id)
          .eq('from_route_id', originRoute.id)
          .eq('to_route_id', destRoute.id)
          .eq('status', 'available');

        const seatCount = seatsError ? 0 : (availableSeats || 0);

        // Tentukan harga
        let basePrice = 200000;
        const trainType = schedule.kereta.tipe_kereta?.toLowerCase();
        if (trainType === 'executive') basePrice = 300000;
        else if (trainType === 'business') basePrice = 250000;
        else if (trainType === 'economy') basePrice = 150000;

        validSchedules.push({
          schedule_id: schedule.id,
          travel_date: schedule.travel_date,
          status: schedule.status,
          train_id: schedule.kereta.id,
          train_code: schedule.kereta.kode_kereta,
          train_name: schedule.kereta.nama_kereta,
          operator: schedule.kereta.operator,
          train_type: schedule.kereta.tipe_kereta,
          departure_time: originRoute.departure_time,
          arrival_time: destRoute.arrival_time,
          duration_minutes: Math.round(durationMinutes),
          available_seats: seatCount,
          base_price: basePrice,
          routes: {
            origin_route_id: originRoute.id,
            dest_route_id: destRoute.id
          }
        });
      }
    }

    console.log(`[SEARCH DEBUG] Found ${validSchedules.length} valid schedules`);

    // Urutkan berdasarkan waktu keberangkatan
    validSchedules.sort((a, b) => a.departure_time.localeCompare(b.departure_time));

    return NextResponse.json({
      origin: {
        id: originStation.data.id,
        code: originStation.data.kode_stasiun,
        name: originStation.data.nama_stasiun
      },
      destination: {
        id: destStation.data.id,
        code: destStation.data.kode_stasiun,
        name: destStation.data.nama_stasiun
      },
      date: date,
      schedules: validSchedules,
      total: validSchedules.length
    });

  } catch (error: any) {
    console.error('[SEARCH ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}