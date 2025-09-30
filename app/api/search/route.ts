import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// Tentukan tipe data untuk hasil yang dikombinasikan
type ScheduleResult = {
  id: number;
  waktu_berangkat: string;
  waktu_tiba: string;
  harga: number;
  resultType: 'schedule';
  routes: {
    kota_asal: string;
    kota_tujuan: string;
  };
  transportations: {
    nama_transportasi: string;
    tipe: string;
  };
};

type DestinationResult = {
  id: number;
  name: string;
  description: string;
  resultType: 'destination';
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const searchQuery = `%${query}%`;
    const searchFilter = `ilike.${searchQuery}`;

    // 1. Cari jadwal (schedule) — Join yang disederhanakan dan filter yang diperluas
    // Catatan: Asumsi city table memiliki kolom 'name' dan 'code'.
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('schedules')
      .select(`
        id,
        waktu_berangkat,
        waktu_tiba,
        harga,
        route_id,
        transport_id,
        // Join ke routes
        routes!inner (
          origin_city_id,
          destination_city_id,
          // Join ke cities (Pastikan relasi FK name sudah benar di Supabase)
          origin_city:cities!routes_origin_city_id_fkey (name, code),
          destination_city:cities!routes_destination_city_id_fkey (name, code)
        ),
        // Join ke transportations
        transportations!inner (
          nama_transportasi,
          tipe
        )
      `)
      // Perluas filter untuk mencakup nama kota ASAL, nama kota TUJUAN, dan NAMA TRANSPORTASI
      .or(
        `routes.origin_city.name.${searchFilter},routes.destination_city.name.${searchFilter},transportations.nama_transportasi.${searchFilter}`
      );

    if (schedulesError) {
      console.error('[SEARCH API] Schedules query error:', schedulesError);
      throw schedulesError;
    }

    // 2. Cari destinasi
    const { data: destinationsData, error: destinationsError } = await supabase
      .from('destinations')
      .select('id, name, description') // Hanya ambil kolom yang relevan
      .ilike('name', searchQuery);

    if (destinationsError) {
      console.error('[SEARCH API] Destinations query error:', destinationsError);
      throw destinationsError;
    }

    // 3. Transformasi hasil schedules agar sesuai frontend
    const transformedSchedules: ScheduleResult[] = (schedulesData || []).map((item: any) => ({
      id: item.id,
      waktu_berangkat: item.waktu_berangkat,
      waktu_tiba: item.waktu_tiba,
      harga: item.harga,
      resultType: 'schedule' as const,
      routes: {
        // Akses properti 'name' yang sudah di-alias di dalam objek 'routes'
        kota_asal: item.routes.origin_city?.name || '',
        kota_tujuan: item.routes.destination_city?.name || ''
      },
      transportations: {
        nama_transportasi: item.transportations?.nama_transportasi || '',
        tipe: item.transportations?.tipe || ''
      }
    }));

    // 4. Tambahkan resultType ke destinations
    const transformedDestinations: DestinationResult[] = (destinationsData || []).map((item: any) => ({
      ...item,
      resultType: 'destination' as const
    }));

    // 5. Gabungkan & acak
    const combinedResults = [
      ...transformedSchedules,
      ...transformedDestinations
    ];

    // Acak urutan agar tidak monoton, namun untuk UI yang lebih baik,
    // biasanya Schedule dan Destination dipisah atau diurutkan berdasarkan relevansi.
    combinedResults.sort(() => Math.random() - 0.5);

    console.log(`[SEARCH API] Found ${combinedResults.length} results for query: "${query}"`);

    return NextResponse.json(combinedResults);

  } catch (error: any) {
    console.error('[SEARCH API] Unexpected Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from database', details: error.message },
      { status: 500 }
    );
  }
}
