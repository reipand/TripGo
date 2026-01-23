import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scheduleId } = await params;
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    // Validate UUID format to prevent Postgres errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(scheduleId)) {
      console.warn(`Invalid schedule ID format: ${scheduleId} (likely mock data)`);
      return NextResponse.json(
        { error: 'Transit routes not available for mock schedules' },
        { status: 404 }
      );
    }

    // 1. Get base schedule information
    const { data: schedule, error: scheduleError } = await supabase
      .from('jadwal_kereta')
      .select(`
        *,
        train:kereta(*),
        routes:rute_kereta(*)
      `)
      .eq('id', scheduleId)
      .single();

    if (scheduleError) {
      console.error('Schedule error:', scheduleError);
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // 2. Find all possible transit routes
    const { data: allStations, error: stationsError } = await supabase
      .from('stasiun')
      .select('*')
      .order('nama_stasiun');

    if (stationsError) {
      console.error('Stations error:', stationsError);
      return NextResponse.json(
        { error: 'Failed to load stations' },
        { status: 500 }
      );
    }

    // 3. Find transit routes between origin and destination
    const { data: transitRoutes, error: routesError } = await supabase
      .from('transit_routes')
      .select(`
        *,
        segments:transit_segments(
          *,
          origin_station:stasiun!origin_station_id(*),
          destination_station:stasiun!destination_station_id(*),
          train_schedule:jadwal_kereta(*)
        ),
        stations:transit_stations(
          *,
          station:stasiun(*)
        )
      `)
      .eq('is_active', true)
      .order('base_price');

    if (routesError) {
      console.error('Transit routes error:', routesError);
      return NextResponse.json(
        { error: 'Failed to load transit routes' },
        { status: 500 }
      );
    }

    // 4. Filter relevant transit routes
    const relevantRoutes = transitRoutes.filter(route => {
      const segments = route.segments || [];
      if (segments.length < 2) return false;

      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];

      // Check if route connects origin to destination
      const originMatch = firstSegment.origin_station?.nama_stasiun?.toLowerCase().includes(origin.toLowerCase()) ||
        firstSegment.origin_station?.city?.toLowerCase().includes(origin.toLowerCase());

      const destinationMatch = lastSegment.destination_station?.nama_stasiun?.toLowerCase().includes(destination.toLowerCase()) ||
        lastSegment.destination_station?.city?.toLowerCase().includes(destination.toLowerCase());

      return originMatch && destinationMatch;
    });

    // 5. Process each route with real-time availability
    const processedRoutes = await Promise.all(
      relevantRoutes.map(async (route) => {
        const segments = await Promise.all(
          route.segments.map(async (segment: any) => {
            // Check real-time seat availability for each segment
            const { data: availableSeats, error: seatsError } = await supabase
              .from('train_seats')
              .select('id')
              .eq('schedule_id', segment.train_schedule_id)
              .eq('status', 'available');

            const seatCount = seatsError ? 0 : (availableSeats?.length || 0);

            return {
              ...segment,
              real_time: {
                available_seats: seatCount,
                last_updated: new Date().toISOString()
              }
            };
          })
        );

        return {
          ...route,
          segments,
          total_duration: segments.reduce((sum, seg) => sum + seg.duration_minutes + seg.waiting_minutes, 0),
          total_adjustment: segments.reduce((sum, seg) => sum + (seg.price_adjustment || 0), 0),
          min_available_seats: Math.min(...segments.map(s => s.real_time.available_seats))
        };
      })
    );

    // 6. Sort by best options
    const sortedRoutes = processedRoutes.sort((a, b) => {
      // Sort by available seats first, then price
      if (a.min_available_seats === 0 && b.min_available_seats > 0) return 1;
      if (b.min_available_seats === 0 && a.min_available_seats > 0) return -1;

      const priceA = a.base_price + (a.total_adjustment || 0);
      const priceB = b.base_price + (b.total_adjustment || 0);
      return priceA - priceB;
    });

    return NextResponse.json({
      success: true,
      routes: sortedRoutes,
      count: sortedRoutes.length,
      base_schedule: {
        id: schedule.id,
        train_name: schedule.train?.nama_kereta,
        departure_date: schedule.travel_date,
        origin,
        destination
      }
    });

  } catch (error: any) {
    console.error('Transit route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}