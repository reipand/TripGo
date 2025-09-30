import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const searchQuery = `%${query}%`;

    // 1. Kueri untuk mencari jadwal
    // Menggunakan `inner join` ke tabel `routes` dan `cities` untuk mendapatkan nama kota
    const searchSchedules = supabase
      .from('schedules')
      .select(`
        id,
        waktu_berangkat,
        waktu_tiba,
        harga,
        transportations!inner (nama_transportasi, tipe),
        routes!inner (
          origin_city_id!inner (name, code),
          destination_city_id!inner (name, code)
        )
      `)
      .or(`routes.origin_city_id.name.ilike.${searchQuery},routes.destination_city_id.name.ilike.${searchQuery}`);

    // 2. Kueri untuk mencari destinasi
    const searchDestinations = supabase
      .from('destinations')
      .select('*, resultType: "destination"')
      .ilike('name', searchQuery);
      
    const [
      schedulesResult, 
      destinationsResult
    ] = await Promise.all([
      searchSchedules, 
      searchDestinations
    ]);

    if (schedulesResult.error) throw schedulesResult.error;
    if (destinationsResult.error) throw destinationsResult.error;

    // 3. Menggabungkan hasil pencarian dari kedua kueri
    const combinedResults = [
      ...(schedulesResult.data?.map(item => ({ ...item, resultType: 'schedule' })) || []),
      ...(destinationsResult.data || [])
    ];

    // Mengacak urutan hasil untuk variasi (opsional)
    combinedResults.sort(() => Math.random() - 0.5);

    return NextResponse.json(combinedResults);

  } catch (error: any) {
    console.error('Supabase query error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from database', details: error.message }, { status: 500 });
  }
}
