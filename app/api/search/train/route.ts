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

  // Validasi & format tanggal
  const date = new Date(departureDate);
  if (isNaN(date.getTime())) {
    return NextResponse.json(
      { error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD' },
      { status: 400 }
    );
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const startStr = startOfDay.toISOString().slice(0, 19);
  const endStr = endOfDay.toISOString().slice(0, 19);

  try {
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        waktu_berangkat,
        waktu_tiba,
        harga,
        stok_kursi,
        routes!inner(kota_asal, kota_tujuan),
        transportations!inner(nama:nama_transportasi, tipe)
      `)
      .eq('routes.kota_asal', origin)
      .eq('routes.kota_tujuan', destination)
      .eq('transportations.tipe', 'kereta')
      .gte('waktu_berangkat', startStr)
      .lte('waktu_berangkat', endStr)
      .order('waktu_berangkat', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil data jadwal kereta', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    );
  }
}
