import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const departureDate = searchParams.get('departureDate');

  // Validasi parameter wajib
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Parameter origin, destination, dan departureDate diperlukan' },
      { status: 400 }
    );
  }

  try {
    // Validasi dan parsing tanggal
    const date = new Date(departureDate);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Set waktu mulai dan akhir hari (tanpa timezone Z)
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Format ke string ISO tanpa 'Z' — untuk timestamp without timezone
    const startStr = startOfDay.toISOString().slice(0, 19); // "2025-06-01T00:00:00"
    const endStr = endOfDay.toISOString().slice(0, 19);     // "2025-06-01T23:59:59"

    console.log('[FLIGHTS API] Query Params:', { origin, destination, departureDate });
    console.log('[FLIGHTS API] Time Range:', { startStr, endStr });

    // Updated Supabase query to match new schema
    interface SupabaseFlightRow {
      id: string;
      departure_time: string;
      arrival_time: string;
      price: number;
      total_seats: number;
      booked_seats: number;
      route_id: string;
      transportation_id: string;
      routes: {
        origin_city_id: number;
        destination_city_id: number;
      };
      transportations: {
        name: string;
        type: string;
        logo_url: string;
      };
      origin: {
        name: string;
        code: string;
      };
      destination: {
        name: string;
        code: string;
      };
    }

    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        departure_time,
        arrival_time,
        price,
        total_seats,
        booked_seats,
        route_id,
        transportation_id,
        routes!inner (
          origin_city_id,
          destination_city_id
        ),
        transportations!inner (
          name,
          type,
          logo_url
        ),
        origin:routes!inner.origin_city_id!inner (
          name,
          code
        ),
        destination:routes!inner.destination_city_id!inner (
          name,
          code
        )
      `)
      .eq('transportations.type', 'Pesawat')
      .eq('origin.name', origin)
      .eq('destination.name', destination)
      .gte('departure_time', startStr)
      .lte('departure_time', endStr) as { data: SupabaseFlightRow[] | null, error: any };

    // Handle error dari Supabase
    if (error) {
      console.error('[FLIGHTS API] Supabase Error:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil data penerbangan', details: error.message },
        { status: 500 }
      );
    }

    // Transform data
    const transformedData = (data || []).map(item => ({
      id: item.id,
      waktu_berangkat: item.departure_time,
      waktu_tiba: item.arrival_time,
      harga: item.price,
      kursi_tersedia: item.total_seats - item.booked_seats,
      transportasi: {
        nama: item.transportations.name,
        tipe: item.transportations.type,
        logo: item.transportations.logo_url
      },
      origin: {
        name: item.origin.name,
        code: item.origin.code
      },
      destination: {
        name: item.destination.name,
        code: item.destination.code
      }
    }));

    console.log(`[FLIGHTS API] Found ${transformedData.length} flights`);

    // Respons sukses
    return NextResponse.json(transformedData);

  } catch (error: any) {
    console.error('[FLIGHTS API] Unexpected Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server.', details: error.message },
      { status: 500 }
    );
  }
}