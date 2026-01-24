// app/api/trains/database/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');

    if (!origin || !destination || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters', success: false },
        { status: 400 }
      );
    }

    console.log(`[DB API] Searching trains: ${origin} → ${destination} on ${date}`);

    // Query 1: Ambil data stasiun untuk origin dan destination
    const stationQuery = await sql`
      SELECT 
        kode_stasiun,
        nama_stasiun,
        city
      FROM stasiun 
      WHERE kode_stasiun IN (${origin}, ${destination})
    `;

    const stations = stationQuery.rows.reduce((acc, station) => {
      acc[station.kode_stasiun] = station;
      return acc;
    }, {} as Record<string, any>);

    // Query 2: Ambil data kereta berdasarkan rute dan tanggal
    const trainsQuery = await sql`
      SELECT 
        jk.id as schedule_id,
        jk.travel_date,
        k.id as train_id,
        k.kode_kereta,
        k.nama_kereta,
        k.tipe_kereta,
        k.operator,
        rk.departure_time,
        rk.arrival_time,
        rk.duration_minutes,
        rk.origin_station_id,
        rk.destination_station_id,
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
      WHERE jk.travel_date = ${date}
        AND rk.origin_station_id = (
          SELECT id FROM stasiun WHERE kode_stasiun = ${origin}
        )
        AND rk.destination_station_id = (
          SELECT id FROM stasiun WHERE kode_stasiun = ${destination}
        )
        AND k.is_active = true
        AND jk.status = 'scheduled'
      ORDER BY rk.departure_time
    `;

    const trains = trainsQuery.rows;

    // Format data untuk frontend
    const formattedTrains = trains.map(train => {
      const originStation = stations[origin];
      const destStation = stations[destination];
      
      // Tentukan harga berdasarkan tipe kereta
      let basePrice = 200000;
      if (train.tipe_kereta?.toLowerCase().includes('executive') || 
          train.tipe_kereta?.toLowerCase().includes('eksekutif')) {
        basePrice = 320000;
      } else if (train.tipe_kereta?.toLowerCase().includes('business') || 
                 train.tipe_kereta?.toLowerCase().includes('bisnis')) {
        basePrice = 270000;
      } else if (train.tipe_kereta?.toLowerCase().includes('economy') || 
                 train.tipe_kereta?.toLowerCase().includes('ekonomi')) {
        basePrice = 180000;
      }

      // Variasi harga (±10%)
      const priceVariation = Math.floor(Math.random() * 40000) - 20000;
      const finalPrice = Math.max(basePrice + priceVariation, 100000);

      return {
        id: train.schedule_id,
        train_id: train.train_id,
        schedule_id: train.schedule_id,
        train_number: train.kode_kereta,
        train_name: train.nama_kereta,
        train_type: train.tipe_kereta || 'Executive',
        operator: train.operator || 'PT KAI',
        origin_station: {
          code: origin,
          name: originStation?.nama_stasiun || `Stasiun ${origin}`,
          city: originStation?.city || origin
        },
        destination_station: {
          code: destination,
          name: destStation?.nama_stasiun || `Stasiun ${destination}`,
          city: destStation?.city || destination
        },
        departure_time: train.departure_time?.slice(0, 8) || '07:00:00',
        arrival_time: train.arrival_time?.slice(0, 8) || '10:00:00',
        duration_minutes: train.duration_minutes || 180,
        duration: formatDuration(train.duration_minutes || 180),
        travel_date: train.travel_date || date,
        status: train.status || 'scheduled',
        harga: finalPrice,
        price: finalPrice,
        stok_kursi: train.available_seats || 20,
        availableSeats: train.available_seats || 20,
        class_type: train.tipe_kereta || 'Executive',
        trainClass: train.tipe_kereta || 'Executive',
        facilities: getFacilitiesByClass(train.tipe_kereta || 'Executive'),
        insurance: 5000,
        seat_type: 'AD',
        route_type: 'Direct',
        isRefundable: true,
        isCheckinAvailable: true,
        isBestDeal: (train.available_seats || 0) > 15 && finalPrice < 250000,
        isHighDemand: (train.available_seats || 0) < 5
      };
    });

    console.log(`[DB API] Found ${trains.length} trains, returning ${formattedTrains.length} formatted trains`);

    return NextResponse.json({
      success: true,
      trains: formattedTrains,
      count: formattedTrains.length,
      source: 'database',
      stations: stations
    });

  } catch (error: any) {
    console.error('[DB API ERROR]', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Database query failed',
        trains: []
      },
      { status: 500 }
    );
  }
}

// Helper functions untuk API
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}j ${mins}m`;
};

const getFacilitiesByClass = (trainClass: string): string[] => {
  const classLower = trainClass.toLowerCase();
  
  if (classLower.includes('executive') || classLower.includes('eksekutif')) {
    return ['AC Dingin', 'Makanan Premium', 'WiFi Gratis', 'Stop Kontak', 
            'Bantal & Selimut', 'TV Personal', 'Toilet Premium'];
  } else if (classLower.includes('business') || classLower.includes('bisnis')) {
    return ['AC', 'Makanan Ringan', 'Stop Kontak', 'Bantal', 
            'TV Komunal', 'Toilet Bersih'];
  } else {
    return ['AC', 'Toilet', 'Kipas Angin', 'Jendela'];
  }
};