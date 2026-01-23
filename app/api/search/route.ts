import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export const dynamic = 'force-dynamic';

// Types
type TrainResult = {
  id: string;
  train_id: string;
  train_number: string;
  train_name: string;
  train_type: string;
  operator: string;
  origin_station: {
    code: string;
    name: string;
    city: string;
  };
  destination_station: {
    code: string;
    name: string;
    city: string;
  };
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  duration: string;
  travel_date: string;
  status: string;
  harga: number;
  price: number;
  stok_kursi: number;
  availableSeats: number;
  class_type: string;
  trainClass: string;
  facilities: string[];
  insurance: number;
  seat_type: string;
  route_type: 'Direct' | 'Transit';
  schedule_id?: string;
  transit_details?: any[]; // For transit routes
  resultType: 'train';
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const originQuery = searchParams.get('origin') || '';
  const destinationQuery = searchParams.get('destination') || '';
  const dateQuery = searchParams.get('date'); // YYYY-MM-DD
  const transportType = searchParams.get('transportType') || 'train';

  if (!originQuery || !destinationQuery || !dateQuery) {
    return NextResponse.json({
      error: 'Missing required parameters: origin, destination, date'
    }, { status: 400 });
  }

  // Only handle trains for now as per schema availability
  if (transportType !== 'train') {
    return NextResponse.json({ results: [] });
  }

  try {
    console.log(`[SEARCH API] Searching: ${originQuery} -> ${destinationQuery} on ${dateQuery}`);

    // 1. Resolve Stations
    // We try to find stations matching the query (by code or name or city)
    const { data: originStations } = await supabase
      .from('stasiun')
      .select('id, code, name, city')
      .or(`name.ilike.%${originQuery}%,code.ilike.%${originQuery}%,city.ilike.%${originQuery}%`)
      .limit(1);

    const { data: destStations } = await supabase
      .from('stasiun')
      .select('id, code, name, city')
      .or(`name.ilike.%${destinationQuery}%,code.ilike.%${destinationQuery}%,city.ilike.%${destinationQuery}%`)
      .limit(1);

    if (!originStations?.length || !destStations?.length) {
      return NextResponse.json({
        results: [],
        message: 'Origin or Destination station not found'
      });
    }

    const origin = originStations[0];
    const dest = destStations[0];
    const results: TrainResult[] = [];

    // 2. Direct Routes Search
    // Strategy: Find schedules (jadwal_kereta) where there exists a rute_kereta from Origin and a rute_kereta to Dest
    // AND origin comes before dest in route_order

    // Fetch potential schedules for the date
    const { data: directSchedules, error: directError } = await supabase
      .from('jadwal_kereta')
      .select(`
        id,
        train_id,
        travel_date,
        status,
        kereta (
          id,
          code,
          name,
          operator,
          train_type,
          fasilitas
        ),
        rute_kereta!inner (
          id,
          origin_station_id,
          destination_station_id,
          arrival_time,
          departure_time,
          route_order,
          duration_minutes
        )
      `)
      .eq('travel_date', dateQuery)
      .eq('rute_kereta.origin_station_id', origin.id);
    // Note: This filter only grabs schedules that have a segment STARTING at origin.
    // This is a simplification. A direct train might start at A -> B -> Origin -> C -> Dest -> D.
    // Ideally we want any schedule that STOPS at origin and STOPS at dest.
    // But Supabase simple filters are limited. 
    // Better approach: Get all schedules for the day, then filter in code, 
    // OR use a more complex join if possible.
    // For now, let's try to fetch schedules that HAVE a rute_segment starting at Origin.
    // CAUTION: 'rute_kereta' entries might be "A->B", "B->C".
    // If user wants A->C, and there is no single A->C segment, this query logic needs to check connected segments.
    // However, usually detailed route tables break down A->B, B->C.
    // BUT often booking systems store "Origins" and "Destinations" available for booking.
    // Let's assume 'rute_kereta' contains legs.

    // REVISED DIRECT STRATEGY:
    // We need to find `jadwal_kereta` IDs that have:
    // - A segment departing from Origin
    // - A segment arriving at Dest
    // - Order(Origin) <= Order(Dest)

    // Let's get all schedules for the day first (assuming volume isn't massive for a demo)
    // or filter by date at least.
    const { data: daySchedules, error: daySchedError } = await supabase
      .from('jadwal_kereta')
      .select(`
         id,
         train_id,
         travel_date,
         status,
         kereta (
           id,
           code,
           name,
           operator,
           train_type,
           fasilitas
         ),
         rute_kereta (
           id,
           origin_station_id,
           destination_station_id,
           arrival_time,
           departure_time,
           route_order
         )
       `)
      .eq('travel_date', dateQuery);

    if (daySchedules) {
      for (const schedule of daySchedules) {
        const routes = schedule.rute_kereta || [];

        // Find logical departure segment (starts at origin)
        // Note: Users might depart from a station that is a 'destination' of previous segment vs 'origin' of next.
        // Usually 'origin_station_id' in rute_kereta means where the train segment starts moving from.
        const startSegment = routes.find((r: any) => r.origin_station_id === origin.id);

        // Find logical arrival segment (ends at dest)
        const endSegment = routes.find((r: any) => r.destination_station_id === dest.id);

        if (startSegment && endSegment && startSegment.route_order <= endSegment.route_order) {
          // Calculate duration and price (dummy price for now as schemas differ on price location)
          // If Start and End are same segment, it's just that segment.
          // If different, we sum up? Or just take Start.Dep and End.Arr.

          const startTime = startSegment.departure_time;
          const endTime = endSegment.arrival_time;

          // Simple duration calc (assuming same day arrival for simplicity or handling crossover)
          // For this demo, let's trust the times are ISO or HH:MM:SS
          // Convert value to simple strings

          results.push({
            id: schedule.id,
            train_id: schedule.kereta.id,
            train_number: schedule.kereta.code,
            train_name: schedule.kereta.name,
            train_type: schedule.kereta.train_type || 'Eksekutif',
            operator: schedule.kereta.operator,
            origin_station: origin,
            destination_station: dest,
            departure_time: startTime,
            arrival_time: endTime,
            duration_minutes: 0, // Calculate if needed
            duration: 'Calculating...', // improve later
            travel_date: schedule.travel_date,
            status: schedule.status,
            harga: 150000, // Placeholder or fetch from 'detail_pemesanan' historicals or 'kelas'
            price: 150000,
            stok_kursi: 50, // Placeholder
            availableSeats: 50,
            class_type: schedule.kereta.train_type || 'Eksekutif',
            trainClass: schedule.kereta.train_type || 'Eksekutif',
            facilities: schedule.kereta.fasilitas || [],
            insurance: 0,
            seat_type: 'Reserved',
            route_type: 'Direct',
            schedule_id: schedule.id,
            resultType: 'train'
          });
        }
      }
    }

    // 3. Transit Routes Search
    // Look for defined transit_routes
    const { data: transitRoutes, error: transitError } = await supabase
      .from('transit_routes')
      .select(`
        id,
        route_name,
        base_price,
        transit_segments (
          id,
          segment_order,
          origin_station_id,
          destination_station_id,
          departure_time,
          arrival_time,
          train_schedule_id,
          train_id,
          kereta (name, code, train_type),
          jadwal_kereta (travel_date)
        )
      `)
      .eq('is_active', true);

    // Post-filtering for origin matches
    if (transitRoutes) {
      for (const tr of transitRoutes) {
        const segments = tr.transit_segments || [];
        segments.sort((a: any, b: any) => a.segment_order - b.segment_order);

        if (segments.length === 0) continue;

        const firstSeg = segments[0];
        const lastSeg = segments[segments.length - 1];

        // Check if this transit route matches user request
        if (firstSeg.origin_station_id === origin.id && lastSeg.destination_station_id === dest.id) {
          // Check date match on the first segment (assuming travel starts on requested date)
          // Note: segment might not have 'jadwal_kereta' loaded if query failed, check validity
          const travelDate = firstSeg.jadwal_kereta?.travel_date;
          if (travelDate !== dateQuery) continue;

          results.push({
            id: tr.id,
            train_id: 'TRANSIT',
            train_number: tr.route_name, // e.g. "Java Exec"
            train_name: `Transit Route: ${tr.route_name}`,
            train_type: 'Mixed',
            operator: 'Multiple',
            origin_station: origin,
            destination_station: dest,
            departure_time: firstSeg.departure_time,
            arrival_time: lastSeg.arrival_time,
            duration_minutes: 0,
            duration: 'Transit',
            travel_date: dateQuery,
            status: 'available',
            harga: tr.base_price,
            price: tr.base_price,
            stok_kursi: 10, // Logic to find min(seats) of all segments needed
            availableSeats: 10,
            class_type: 'Mixed',
            trainClass: 'Mixed',
            facilities: ['Transit'],
            insurance: 0,
            seat_type: 'Reserved',
            route_type: 'Transit',
            transit_details: segments.map((s: any) => ({
              train_name: s.kereta?.name,
              origin: s.origin_station_id,
              dest: s.destination_station_id,
              dep: s.departure_time,
              arr: s.arrival_time
            })),
            resultType: 'train'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      results: results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[SEARCH API] Error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message
    }, { status: 500 });
  }
}