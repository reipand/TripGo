// app/api/search/trains/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const departureDate = searchParams.get('departureDate');
    const passengers = searchParams.get('passengers') || '1';

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log(`[API] Searching trains: ${origin} → ${destination} on ${departureDate}`);

    // Query database untuk data real
    const result = await sql`
      SELECT 
        jk.id,
        jk.train_id,
        k.kode_kereta,
        k.nama_kereta,
        k.tipe_kereta,
        k.operator,
        rk.departure_time,
        rk.arrival_time,
        rk.duration_minutes,
        s1.kode_stasiun as origin_code,
        s1.nama_stasiun as origin_name,
        s1.city as origin_city,
        s2.kode_stasiun as dest_code,
        s2.nama_stasiun as dest_name,
        s2.city as dest_city,
        jk.status,
        (
          SELECT COUNT(*) 
          FROM train_seats ts 
          WHERE ts.schedule_id = jk.id 
          AND ts.status = 'available'
        ) as available_seats
      FROM jadwal_kereta jk
      JOIN kereta k ON jk.train_id = k.id
      JOIN rute_kereta rk ON jk.id = rk.schedule_id
      JOIN stasiun s1 ON rk.origin_station_id = s1.id
      JOIN stasiun s2 ON rk.destination_station_id = s2.id
      WHERE jk.travel_date = ${departureDate}
        AND s1.kode_stasiun = ${origin}
        AND s2.kode_stasiun = ${destination}
        AND k.is_active = true
      ORDER BY rk.departure_time
    `;

    const schedules = result.rows;

    console.log(`[API] Found ${schedules.length} schedules from database`);

    return NextResponse.json({
      success: true,
      schedules: schedules,
      count: schedules.length,
      search: {
        origin,
        destination,
        departureDate,
        passengers: parseInt(passengers)
      }
    });

  } catch (error) {
    console.error('[API ERROR]', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch train schedules',
        success: false,
        schedules: []
      },
      { status: 500 }
    );
  }
}