import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const departureDate = searchParams.get('departureDate');

  console.log('🚂 Fetching trains with params:', { origin, destination, departureDate });

  // Validasi parameter
  if (!origin || !destination || !departureDate) {
    return NextResponse.json(
      { error: 'Parameter origin, destination, dan departureDate diperlukan' },
      { status: 400 }
    );
  }

  try {
    // Validasi format tanggal
    const dateObj = new Date(departureDate);
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { error: 'Format tanggal tidak valid' },
        { status: 400 }
      );
    }

    // Format tanggal untuk query SQL
    const formattedDate = dateObj.toISOString().split('T')[0];
    
    console.log('🔍 Query Supabase dengan:', {
      origin,
      destination,
      departureDate: formattedDate
    });

    // Query ke database untuk mendapatkan jadwal kereta
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        id,
        departure_time,
        arrival_time,
        price,
        available_seats,
        routes (
          origin_city,
          destination_city
        ),
        trains (
          train_name,
          train_type,
          train_class
        )
      `)
      .eq('origin_station_code', origin)
      .eq('destination_station_code', destination)
      .gte('departure_time', `${formattedDate}T00:00:00`)
      .lt('departure_time', `${formattedDate}T23:59:59`)
      .order('departure_time', { ascending: true })
      .limit(20);

    if (error) {
      console.error('❌ Supabase error:', error);
      
      // Fallback: Coba query yang lebih sederhana
      const { data: fallbackData } = await supabase
        .from('schedules')
        .select('*')
        .eq('origin_station_code', origin)
        .eq('destination_station_code', destination)
        .order('departure_time', { ascending: true })
        .limit(10);

      console.log('🔄 Using fallback query, found:', fallbackData?.length || 0);
      
      // Format fallback data
      const formattedFallbackData = (fallbackData || []).map((schedule: any) => ({
        id: schedule.id,
        waktu_berangkat: schedule.departure_time,
        waktu_tiba: schedule.arrival_time,
        harga: schedule.price || 250000,
        stok_kursi: schedule.available_seats || Math.floor(Math.random() * 50) + 10,
        routes: {
          kota_asal: schedule.origin_station_code || origin,
          kota_tujuan: schedule.destination_station_code || destination
        },
        transportations: {
          nama_transportasi: schedule.train_name || 'Kereta Eksekutif',
          tipe: schedule.train_type || 'Eksekutif'
        }
      }));
      
      return NextResponse.json(formattedFallbackData);
    }

    console.log('✅ Found schedules:', schedules?.length || 0);

    // Format data untuk konsistensi dengan frontend
    const formattedSchedules = (schedules || []).map((schedule: any) => ({
      id: schedule.id,
      waktu_berangkat: schedule.departure_time,
      waktu_tiba: schedule.arrival_time,
      harga: schedule.price || 250000,
      stok_kursi: schedule.available_seats || Math.floor(Math.random() * 50) + 10,
      routes: {
        kota_asal: schedule.routes?.origin_city || origin,
        kota_tujuan: schedule.routes?.destination_city || destination
      },
      transportations: {
        nama_transportasi: schedule.trains?.train_name || 'Kereta Api',
        tipe: schedule.trains?.train_type || 'Eksekutif'
      }
    }));

    // Jika tidak ada data, berikan data dummy untuk demo
    if (formattedSchedules.length === 0) {
      console.log('📋 No data found, returning dummy data');
      const dummyData = generateDummyTrains(origin, destination, departureDate);
      return NextResponse.json(dummyData);
    }

    return NextResponse.json(formattedSchedules);
    
  } catch (error: any) {
    console.error('❌ Error in train search:', error);
    
    // Fallback: Data dummy untuk demo
    const dummyData = generateDummyTrains(origin, destination, departureDate);
    return NextResponse.json(dummyData);
  }
}

// Helper function untuk generate data dummy
function generateDummyTrains(origin: string, destination: string, departureDate: string) {
  const trainTypes = [
    { name: 'Argo Parahyangan', type: 'Eksekutif', class: 'Executive' },
    { name: 'Taksaka', type: 'Eksekutif', class: 'Executive' },
    { name: 'Sembrani', type: 'Eksekutif', class: 'Executive' },
    { name: 'Gajayana', type: 'Eksekutif', class: 'Executive' },
    { name: 'Bima', type: 'Eksekutif', class: 'Executive' },
    { name: 'Turangga', type: 'Eksekutif', class: 'Executive' },
    { name: 'Mutiara Selatan', type: 'Eksekutif', class: 'Executive' },
    { name: 'Lodaya', type: 'Eksekutif', class: 'Executive' },
    { name: 'Jayakarta', type: 'Ekonomi', class: 'Economy' },
    { name: 'Senja Utama', type: 'Eksekutif', class: 'Executive' }
  ];

  const stations: Record<string, string> = {
    'GMR': 'Jakarta (Gambir)',
    'BD': 'Bandung',
    'SBY': 'Surabaya',
    'SMG': 'Semarang',
    'YK': 'Yogyakarta',
    'SLO': 'Solo',
    'MLG': 'Malang',
    'BKS': 'Bekasi',
    'TNG': 'Tangerang',
    'CRB': 'Cirebon'
  };

  const originName = stations[origin] || origin;
  const destinationName = stations[destination] || destination;

  const date = new Date(departureDate);
  
  // Generate 5-8 jadwal dummy
  const count = Math.floor(Math.random() * 4) + 5;
  const trains = [];

  for (let i = 0; i < count; i++) {
    const trainType = trainTypes[Math.floor(Math.random() * trainTypes.length)];
    
    // Generate waktu berangkat (06:00 - 22:00)
    const departureHour = 6 + Math.floor(Math.random() * 16);
    const departureMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
    const departureTime = new Date(date);
    departureTime.setHours(departureHour, departureMinute, 0);
    
    // Durasi perjalanan (2-8 jam)
    const durationHours = 2 + Math.floor(Math.random() * 7);
    const arrivalTime = new Date(departureTime);
    arrivalTime.setHours(arrivalTime.getHours() + durationHours);
    
    // Harga berdasarkan jenis kereta dan durasi
    const basePrice = trainType.type === 'Eksekutif' ? 300000 : 150000;
    const price = basePrice + (durationHours * 50000);
    
    // Stok kursi (0-50)
    const availableSeats = Math.floor(Math.random() * 51);
    
    trains.push({
      id: i + 1,
      waktu_berangkat: departureTime.toISOString(),
      waktu_tiba: arrivalTime.toISOString(),
      harga: price,
      stok_kursi: availableSeats,
      routes: {
        kota_asal: originName,
        kota_tujuan: destinationName
      },
      transportations: {
        nama_transportasi: trainType.name,
        tipe: trainType.type
      }
    });
  }

  // Urutkan berdasarkan waktu berangkat
  trains.sort((a, b) => 
    new Date(a.waktu_berangkat).getTime() - new Date(b.waktu_berangkat).getTime()
  );

  return trains;
}