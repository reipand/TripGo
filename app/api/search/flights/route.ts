import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const departureDate = searchParams.get('departureDate');

  if (!origin || !destination || !departureDate) {
    return NextResponse.json({ error: 'Parameter origin, destination, dan departureDate diperlukan' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        waktu_berangkat,
        waktu_tiba,
        harga,
        stok_kursi,
        routes!inner (
          origin_city_id!inner (name, code),
          destination_city_id!inner (name, code)
        ),
        transportations!inner (nama_transportasi, tipe)
      `)
      .eq('transportations.tipe', 'Pesawat')
      .eq('routes.origin_city_id.name', origin)
      .eq('routes.destination_city_id.name', destination)
      .gte('waktu_berangkat', `${departureDate}T00:00:00.000Z`)
      .lte('waktu_berangkat', `${departureDate}T23:59:59.999Z`);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: 'Gagal mengambil data dari database.', details: error.message }, { status: 500 });
  }
}
