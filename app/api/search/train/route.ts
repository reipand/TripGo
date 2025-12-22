import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// Endpoint pencarian kereta berbasis schema Supabase baru:
// - stasiun (code, name, city)
// - kereta (code, name, operator)
// - jadwal_kereta (travel_date, status, train_id)
// - rute_kereta (schedule_id, origin_station_id, destination_station_id, route_order, arrival_time, departure_time, duration_minutes)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const originCode = searchParams.get('origin'); // di UI berisi nama kota; kita dukung code atau nama kota
  const destinationCode = searchParams.get('destination');
  const departureDate = searchParams.get('departureDate'); // YYYY-MM-DD

  if (!originCode || !destinationCode || !departureDate) {
    return NextResponse.json(
      { error: 'Parameter origin, destination, dan departureDate diperlukan' },
      { status: 400 }
    );
  }

  // Validasi tanggal
  const date = new Date(`${departureDate}T00:00:00`);
  if (isNaN(date.getTime())) {
    return NextResponse.json(
      { error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD' },
      { status: 400 }
    );
  }

  try {
    // Ambil stasiun origin & destination berdasarkan code ATAU nama kota (fallback untuk kompatibilitas UI)
    const { data: allStations, error: stationsErr } = await supabase
      .from('stasiun')
      .select('id, code, name, city');

    if (stationsErr) {
      return NextResponse.json(
        { error: 'Gagal mengambil data stasiun', details: stationsErr.message },
        { status: 500 }
      );
    }

    const originStation = (allStations || []).find(
      (s) => s.code === originCode || s.city === originCode || s.name === originCode
    );
    const destinationStation = (allStations || []).find(
      (s) => s.code === destinationCode || s.city === destinationCode || s.name === destinationCode
    );

    if (!originStation || !destinationStation) {
      return NextResponse.json(
        { error: 'Stasiun asal atau tujuan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Ambil semua jadwal pada tanggal tsb (status scheduled/boarding) beserta kereta dan rute-rutenya
    const { data: schedules, error: schedErr } = await supabase
      .from('jadwal_kereta')
      .select(
        `id, travel_date, status, train_id,
         kereta:train_id ( id, code, name, operator ),
         rute_kereta:jadwal_kereta!inner ( id )`
      )
      .eq('travel_date', departureDate)
      .in('status', ['scheduled', 'boarding']);

    if (schedErr) {
      return NextResponse.json(
        { error: 'Gagal mengambil jadwal kereta', details: schedErr.message },
        { status: 500 }
      );
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json([]);
    }

    // Ambil rute per schedule untuk memeriksa apakah mencakup origin -> destination
    const scheduleIds = schedules.map((s) => s.id);
    const { data: routes, error: routeErr } = await supabase
      .from('rute_kereta')
      .select('id, schedule_id, origin_station_id, destination_station_id, route_order, arrival_time, departure_time, duration_minutes')
      .in('schedule_id', scheduleIds)
      .order('route_order', { ascending: true });

    if (routeErr) {
      return NextResponse.json(
        { error: 'Gagal mengambil data rute', details: routeErr.message },
        { status: 500 }
      );
    }

    const routesBySchedule = new Map<string, any[]>();
    for (const r of routes || []) {
      const arr = routesBySchedule.get(r.schedule_id) || [];
      arr.push(r);
      routesBySchedule.set(r.schedule_id, arr);
    }

    // Filter jadwal yang memiliki segmen origin -> destination (route_order origin < dest dalam schedule yang sama)
    const results: any[] = [];

    for (const s of schedules) {
      const rts = routesBySchedule.get(s.id) || [];
      if (rts.length === 0) continue;

      // cari titik origin dan destination berdasarkan stasiun
      const originNodes = rts.filter((r) => r.origin_station_id === originStation.id || r.destination_station_id === originStation.id);
      const destNodes = rts.filter((r) => r.origin_station_id === destinationStation.id || r.destination_station_id === destinationStation.id);

      // Tentukan order index untuk origin dan destination dalam rute linear
      // Kita anggap rute disusun linear menaik berdasar route_order dan
      // origin berada di node lebih awal daripada destination.
      const orders = rts.map((r) => r.route_order);
      // Cari index berdasarkan pasangan segmen yang melintasi stasiun
      const findOrderForStation = (stationId: string) => {
        for (const seg of rts) {
          if (seg.origin_station_id === stationId) return seg.route_order;
          if (seg.destination_station_id === stationId) return seg.route_order + 1; // station as arrival point of segment
        }
        return Number.MAX_SAFE_INTEGER;
      };

      const originOrder = findOrderForStation(originStation.id);
      const destOrder = findOrderForStation(destinationStation.id);

      if (originOrder === Number.MAX_SAFE_INTEGER || destOrder === Number.MAX_SAFE_INTEGER) continue;
      if (originOrder >= destOrder) continue;

      // Ambil waktu berangkat dari segmen yang berawal di origin dan waktu tiba dari segmen yang berakhir di destination
      const originSeg = rts.find((r) => r.origin_station_id === originStation.id) || rts.find((r) => r.destination_station_id === originStation.id);
      const destSeg = rts.find((r) => r.destination_station_id === destinationStation.id) || rts.find((r) => r.origin_station_id === destinationStation.id);

      const waktu_berangkat = originSeg?.departure_time || '00:00:00';
      const waktu_tiba = destSeg?.arrival_time || '00:00:00';

      // Placeholder harga & stok kursi (karena schema tidak mendefinisikan price per schedule langsung)
      // Harga bisa dihitung dari penjumlahan duration_minutes * tariff/menit atau metadata lain.
      const totalDuration = rts
        .filter((r) => r.route_order >= originOrder && r.route_order < destOrder)
        .reduce((acc, cur) => acc + (cur.duration_minutes || 0), 0);

      const harga = Math.max(50000, totalDuration * 1500); // heuristik simple: 1.5k per menit, min 50k

      // Ketersediaan kursi: hitung kursi available pada schedule (tanpa segmentasi from/to untuk sederhana)
      const { data: seatsAgg, error: seatsErr } = await supabase
        .from('train_seats')
        .select('status', { count: 'exact', head: true })
        .eq('schedule_id', s.id)
        .eq('status', 'available');

      if (seatsErr) {
        return NextResponse.json(
          { error: 'Gagal menghitung ketersediaan kursi', details: seatsErr.message },
          { status: 500 }
        );
      }

      const stok_kursi = seatsAgg?.length === 0 ? 0 : (seatsAgg as any).count ?? 0;

      results.push({
        id: s.id,
        waktu_berangkat: `${departureDate}T${waktu_berangkat}`,
        waktu_tiba: `${departureDate}T${waktu_tiba}`,
        harga,
        stok_kursi,
        routes: {
          kota_asal: originStation.city || originStation.code,
          kota_tujuan: destinationStation.city || destinationStation.code,
        },
        transportations: {
          nama_transportasi: s.kereta?.name || 'Kereta',
          tipe: 'Kereta',
        },
      });
    }

    // Urutkan berdasarkan waktu berangkat
    results.sort((a, b) => new Date(a.waktu_berangkat).getTime() - new Date(b.waktu_berangkat).getTime());

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    );
  }
}
