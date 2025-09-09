import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {

    const searchSchedules = supabase
      .from('schedules')
      .select(`
        *,
        routes (kota_asal, kota_tujuan),
        transportations (nama_transportasi, tipe)
      `)
      .or(`routes.kota_asal.ilike.%${query}%,routes.kota_tujuan.ilike.%${query}%`);


    const searchDestinations = supabase
      .from('destinations')
      .select('*')
      .eq('type', 'Destinasi')
      .ilike('name', `%${query}%`);
      

    const [
      schedulesResult, 
      destinationsResult
    ] = await Promise.all([
      searchSchedules, 
      searchDestinations
    ]);

    if (schedulesResult.error) throw schedulesResult.error;
    if (destinationsResult.error) throw destinationsResult.error;

    const combinedResults = [
      ...(schedulesResult.data?.map(item => ({ ...item, resultType: 'schedule' })) || []),
      ...(destinationsResult.data?.map(item => ({ ...item, resultType: 'destination' })) || [])
    ];

    combinedResults.sort(() => Math.random() - 0.5);

    return NextResponse.json(combinedResults);

  } catch (error: any) {
    console.error('Supabase query error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from database', details: error.message }, { status: 500 });
  }
}

