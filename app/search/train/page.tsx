import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Mengambil parameter dari URL
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const departureDate = searchParams.get('departureDate');

  // Validasi dasar
  if (!origin || !destination || !departureDate) {
    return NextResponse.json({ error: 'Parameter origin, destination, dan departureDate diperlukan' }, { status: 400 });
  }

  try {
    // Membangun query ke Supabase, dengan filter tipe 'kereta'
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
      .eq('transportations.tipe', 'kereta') // <-- Perubahan utama di sini
      .eq('routes.kota_asal', origin)
      .eq('routes.kota_tujuan', destination)
      .gte('waktu_berangkat', `${departureDate}T00:00:00.000Z`)
      .lte('waktu_berangkat', `${departureDate}T23:59:59.999Z`);

    if (error) {
      // Jika ada error dari Supabase, lemparkan error tersebut
      throw error;
    }

    // Jika berhasil, kembalikan data sebagai JSON
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Supabase query error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data dari database', details: error.message }, { status: 500 });
  }
}
