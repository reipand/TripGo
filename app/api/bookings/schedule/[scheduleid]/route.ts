import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleid: string }> }
) {
  try {
    const { scheduleid } = await params;

    if (!scheduleid || scheduleid === 'undefined') {
      return NextResponse.json({ success: false, error: 'Schedule ID is required' }, { status: 400 });
    }

    console.log(`[BOOKING API] Fetching details for schedule: ${scheduleid}`);

    // Fetch schedule with train details
    const { data: schedule, error: schedError } = await supabase
      .from('jadwal_kereta')
      .select(`
        id,
        travel_date,
        status,
        kereta!inner (
          id,
          nama_kereta,
          kode_kereta,
          tipe_kereta
        )
      `)
      .eq('id', scheduleid)
      .single();

    if (schedError || !schedule) {
      console.error('[BOOKING API] Schedule error:', schedError);
      return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
    }

    // Fetch route details
    const { data: routes, error: routeError } = await supabase
      .from('rute_kereta')
      .select(`
        departure_time,
        arrival_time,
        duration_minutes,
        route_order,
        origin_station:stasiun!origin_station_id (nama_stasiun, city),
        destination_station:stasiun!destination_station_id (nama_stasiun, city)
      `)
      .eq('schedule_id', scheduleid)
      .order('route_order', { ascending: true });

    if (routeError) {
      console.error('[BOOKING API] Route error:', routeError);
    }

    // Calculate overall itinerary
    const firstLeg = routes?.[0];
    const lastLeg = routes?.[(routes?.length || 1) - 1];

    const responseData = {
      id: schedule.id,
      scheduleId: schedule.id,
      trainId: schedule.kereta.id,
      trainName: schedule.kereta.nama_kereta,
      trainType: schedule.kereta.tipe_kereta || 'Eksekutif',
      departureTime: firstLeg?.departure_time?.substring(0, 5) || '00:00',
      arrivalTime: lastLeg?.arrival_time?.substring(0, 5) || '00:00',
      duration: firstLeg && lastLeg ? calculateDuration(routes) : '0j 0m',
      origin: firstLeg?.origin_station?.nama_stasiun || 'Unknown',
      destination: lastLeg?.destination_station?.nama_stasiun || 'Unknown',
      originCity: firstLeg?.origin_station?.city || '',
      destinationCity: lastLeg?.destination_station?.city || '',
      price: 250000, // Still needs pricing table integration
      availableSeats: 50, // Placeholder for now
      departureDate: schedule.travel_date,
      status: schedule.status
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error: any) {
    console.error('[BOOKING API] Fatal error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

function calculateDuration(routes: any[]) {
  const totalMinutes = routes.reduce((acc, r) => acc + (r.duration_minutes || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours}j ${mins}m`;
}