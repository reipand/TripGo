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
        routes!inner (kota_asal, kota_tujuan),
        transportations!inner (nama_transportasi, tipe)
      `)
      .eq('transportations.tipe', 'pesawat')
      .eq('routes.kota_asal', origin)
      .eq('routes.kota_tujuan', destination)
      .gte('waktu_berangkat', `${departureDate}T00:00:00.000Z`)
      .lte('waktu_berangkat', `${departureDate}T23:59:59.999Z`);

    if (error) {
      // PERBAIKAN: Lemparkan error dengan pesan yang lebih spesifik
      // Ini akan ditangkap oleh blok catch di bawah
      throw new Error(`Supabase error: ${error.message}`);
    }

    // Jika tidak ada error, kembalikan data (bisa berupa array kosong jika tidak ditemukan)
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('API Error:', error.message);
    // PERBAIKAN: Kembalikan pesan error yang lebih informatif ke frontend
    return NextResponse.json({ error: 'Gagal mengambil data dari database.', details: error.message }, { status: 500 });
  }
}

