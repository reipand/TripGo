
// Buat file: app/api/multi-segment/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const passengers = parseInt(searchParams.get('passengers') || '1');

    if (!origin || !destination || !date) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak lengkap' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 1. Cari stasiun berdasarkan nama
    const { data: originStations, error: originError } = await supabase
      .from('stasiun')
      .select('id, nama_stasiun, city')
      .or(`nama_stasiun.ilike.%${origin}%,city.ilike.%${origin}%`)
      .eq('is_active', true)
      .limit(1);

    const { data: destStations, error: destError } = await supabase
      .from('stasiun')
      .select('id, nama_stasiun, city')
      .or(`nama_stasiun.ilike.%${destination}%,city.ilike.%${destination}%`)
      .eq('is_active', true)
      .limit(1);

    if (originError || destError || !originStations?.[0] || !destStations?.[0]) {
      return NextResponse.json(
        { success: false, error: 'Stasiun tidak ditemukan' },
        { status: 404 }
      );
    }

    const originStation = originStations[0];
    const destStation = destStations[0];

    // 2. Cari rute langsung terlebih dahulu
    const { data: directRoutes, error: directError } = await supabase
      .from('rute_kereta')
      .select(`
        id,
        schedule_id,
        origin_station_id,
        destination_station_id,
        departure_time,
        arrival_time,
        duration_minutes,
        jadwal_kereta!inner (
          id,
          travel_date,
          kereta!inner (
            id,
            kode_kereta,
            nama_kereta,
            tipe_kereta,
            operator
          )
        )
      `)
      .eq('origin_station_id', originStation.id)
      .eq('destination_station_id', destStation.id)
      .eq('jadwal_kereta.travel_date', date)
      .order('departure_time');

    if (directError) {
      console.error('Error fetching direct routes:', directError);
    }

    // 3. Cari opsi multi-segmen dengan transit
    const { data: segmentOptions, error: segmentError } = await supabase
      .from('transit_segments')
      .select(`
        id,
        segment_order,
        departure_time,
        arrival_time,
        duration_minutes,
        waiting_minutes,
        available_seats,
        price_adjustment,
        transit_routes!inner (
          id,
          route_name,
          base_price,
          description
        ),
        origin_station:origin_station_id (
          id,
          nama_stasiun,
          city
        ),
        destination_station:destination_station_id (
          id,
          nama_stasiun,
          city
        ),
        train:train_id (
          id,
          nama_kereta,
          tipe_kereta,
          kode_kereta
        )
      `)
      .eq('transit_routes.is_active', true)
      .order('segment_order');

    if (segmentError) {
      console.error('Error fetching segment options:', segmentError);
    }

    // 4. Format data untuk response
    const options: any[] = [];

    // Opsi langsung
    if (directRoutes && directRoutes.length > 0) {
      for (const route of directRoutes) {
        const train = route.jadwal_kereta.kereta;
        const price = 265000; // Harga default, bisa diambil dari tabel harga
        
        options.push({
          segments: [{
            id: route.id,
            trainId: train.id,
            trainName: train.nama_kereta,
            trainType: train.tipe_kereta,
            departureTime: route.departure_time,
            arrivalTime: route.arrival_time,
            duration: `${Math.floor(route.duration_minutes / 60)}j ${route.duration_minutes % 60}m`,
            origin: originStation.nama_stasiun,
            destination: destStation.nama_stasiun,
            price: price,
            availableSeats: await getAvailableSeats(route.schedule_id, passengers),
            departureDate: date,
            scheduleId: route.schedule_id
          }],
          totalPrice: price,
          totalDuration: `${Math.floor(route.duration_minutes / 60)}j ${route.duration_minutes % 60}m`,
          isMultiSegment: false
        });
      }
    }

    // Opsi multi-segmen
    if (segmentOptions && segmentOptions.length > 0) {
      // Kelompokkan berdasarkan transit_route_id
      const groupedByRoute: Record<string, any[]> = {};
      
      segmentOptions.forEach(segment => {
        const routeId = segment.transit_routes.id;
        if (!groupedByRoute[routeId]) {
          groupedByRoute[routeId] = [];
        }
        groupedByRoute[routeId].push(segment);
      });

      // Filter hanya rute yang sesuai dengan origin dan destination
      Object.values(groupedByRoute).forEach(segments => {
        if (segments.length > 1) {
          const firstSegment = segments[0];
          const lastSegment = segments[segments.length - 1];
          
          // Cek apakah rute ini menghubungkan origin ke destination
          if (firstSegment.origin_station.nama_stasiun.includes(origin) && 
              lastSegment.destination_station.nama_stasiun.includes(destination)) {
            
            const totalDuration = segments.reduce((sum, seg) => sum + seg.duration_minutes + (seg.waiting_minutes || 0), 0);
            const totalPrice = segments.reduce((sum, seg) => sum + (seg.transit_routes.base_price || 0) + (seg.price_adjustment || 0), 0);
            
            options.push({
              segments: segments.map(seg => ({
                id: seg.id,
                trainId: seg.train?.id,
                trainName: seg.train?.nama_kereta || 'Train',
                trainType: seg.train?.tipe_kereta || 'Executive',
                departureTime: seg.departure_time,
                arrivalTime: seg.arrival_time,
                duration: `${Math.floor(seg.duration_minutes / 60)}j ${seg.duration_minutes % 60}m`,
                origin: seg.origin_station.nama_stasiun,
                destination: seg.destination_station.nama_stasiun,
                price: (seg.transit_routes.base_price || 0) + (seg.price_adjustment || 0),
                availableSeats: seg.available_seats,
                departureDate: date,
                scheduleId: seg.train_schedule_id,
                waitingMinutes: seg.waiting_minutes
              })),
              totalPrice: totalPrice,
              totalDuration: `${Math.floor(totalDuration / 60)}j ${totalDuration % 60}m`,
              isMultiSegment: true,
              connectionTime: segments.reduce((sum, seg, idx) => {
                if (idx < segments.length - 1) {
                  return sum + (seg.waiting_minutes || 0);
                }
                return sum;
              }, 0)
            });
          }
        }
      });
    }

    // Urutkan berdasarkan harga
    options.sort((a, b) => a.totalPrice - b.totalPrice);

    return NextResponse.json({
      success: true,
      options: options
    });

  } catch (error: any) {
    console.error('Error in multi-segment API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function getAvailableSeats(scheduleId: string, passengerCount: number): Promise<number> {
  const supabase = createClient();
  
  const { data: seats, error } = await supabase
    .from('train_seats')
    .select('id, status')
    .eq('schedule_id', scheduleId)
    .eq('status', 'available');

  if (error || !seats) {
    return 0;
  }

  return Math.max(0, Math.min(seats.length, 50)); // Batasi maksimal 50 kursi
}

