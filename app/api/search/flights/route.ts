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

    // Query ke Supabase dengan join yang benar
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        id,
        waktu_berangkat,
        waktu_tiba,
        harga,
        stok_kursi,
        route_id,
        transport_id,
        routes!inner (
          origin_city_id,
          destination_city_id
        ),
        transportations!inner (
          nama_transportasi,
          tipe
        ),
        origin_city:routes!inner.origin_city_id (
          name:origin_city_name,
          code:origin_city_code
        ),
        destination_city:routes!inner.destination_city_id (
          name:destination_city_name,
          code:destination_city_code
        )
      `)
      .eq('transportations.tipe', 'Pesawat')
      .eq('origin_city.name', origin)
      .eq('destination_city.name', destination)
      .gte('waktu_berangkat', startStr)
      .lte('waktu_berangkat', endStr);

    // Handle error dari Supabase
    if (error) {
      console.error('[FLIGHTS API] Supabase Error:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil data penerbangan', details: error.message },
        { status: 500 }
      );
    }

    // Transformasi data agar sesuai struktur frontend
    const transformedData = (data || []).map(item => ({
      id: item.id,
      waktu_berangkat: item.waktu_berangkat,
      waktu_tiba: item.waktu_tiba,
      harga: item.harga,
      stok_kursi: item.stok_kursi,
      routes: {
        kota_asal: item.origin_city?.name || item.origin_city_name || '',
        kota_tujuan: item.destination_city?.name || item.destination_city_name || ''
      },
      transportations: {
        nama_transportasi: item.transportations?.nama_transportasi || '',
        tipe: item.transportations?.tipe || ''
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