import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const departureDate = searchParams.get('departureDate');

  // Validasi parameter
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Parameter origin, destination, dan departureDate diperlukan' },
      { status: 400 }
    );
  }

  try {
    // Format tanggal dengan benar (tanpa timezone Z)
    const startOfDay = `${departureDate}T00:00:00`;
    const endOfDay = `${departureDate}T23:59:59`;

    console.log('Query params:', { origin, destination, startOfDay, endOfDay });

    // Query dengan penanganan join yang lebih baik
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        waktu_berangkat,
        waktu_tiba,
        harga,
        stok_kursi,
        routes(kota_asal, kota_tujuan),
        transportations(nama, tipe)
      `)
      .eq('routes.kota_asal', origin)
      .eq('routes.kota_tujuan', destination)
      .eq('transportations.tipe', 'kereta')
      .gte('waktu_berangkat', startOfDay)
      .lte('waktu_berangkat', endOfDay);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil data dari database', details: error.message },
        { status: 500 }
      );
    }

    console.log('Data fetched:', data);

    // Transformasi data untuk memastikan struktur yang konsisten
    const transformedData = data?.map(item => ({
      ...item,
      routes: item.routes,
      transportations: {
        nama_transportasi: item.transportations?.nama,
        tipe: item.transportations?.tipe
      }
    })) || [];

    return NextResponse.json(transformedData);
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    );
  }
}