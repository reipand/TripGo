import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// Tipe data untuk hasil pencarian
type TrainResult = {
  id: string;
  train_id: string;
  train_number: string;
  train_name: string;
  train_type: string;
  operator: string;
  origin_station: {
    code: string;
    name: string;
    city: string;
  };
  destination_station: {
    code: string;
    name: string;
    city: string;
  };
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  duration: string;
  travel_date: string;
  status: string;
  harga: number;
  price: number;
  stok_kursi: number;
  availableSeats: number;
  class_type: string;
  trainClass: string;
  facilities: string[];
  insurance: number;
  seat_type: string;
  route_type: string;
  schedule_id?: string;
  resultType: 'train';
};

type StationResult = {
  id: string;
  code: string;
  name: string;
  city: string;
  resultType: 'station';
};

type CityResult = {
  id: string;
  name: string;
  province: string;
  resultType: 'city';
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'all'; // all, station, city, train

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ 
      error: 'Query parameter "q" is required and must be at least 2 characters' 
    }, { status: 400 });
  }

  try {
    const searchQuery = `%${query.trim()}%`;
    console.log(`[SEARCH API] Searching for: "${query}", type: ${type}`);

    const results = [];

    // 1. Cari stasiun berdasarkan nama atau kota (kecuali type 'train')
    if (type === 'all' || type === 'station') {
      const { data: stationsData, error: stationsError } = await supabase
        .from('stasiun')
        .select('id, code, name, city')
        .or(`name.ilike.${searchQuery},city.ilike.${searchQuery},code.ilike.${searchQuery}`)
        .limit(10);

      if (stationsError) {
        console.error('[SEARCH API] Stations query error:', stationsError);
      } else {
        const transformedStations: StationResult[] = (stationsData || []).map((station: any) => ({
          id: `station-${station.id}`,
          code: station.code,
          name: station.name,
          city: station.city,
          resultType: 'station' as const
        }));
        results.push(...transformedStations);
        console.log(`[SEARCH API] Found ${transformedStations.length} stations`);
      }
    }

    // 2. Cari kota (jika ada tabel kota)
    if (type === 'all' || type === 'city') {
      try {
        // Coba cari di tabel kota jika ada
        const { data: citiesData, error: citiesError } = await supabase
          .from('cities')
          .select('id, name, province')
          .ilike('name', searchQuery)
          .limit(5);

        if (!citiesError && citiesData) {
          const transformedCities: CityResult[] = citiesData.map((city: any) => ({
            id: `city-${city.id}`,
            name: city.name,
            province: city.province,
            resultType: 'city' as const
          }));
          results.push(...transformedCities);
          console.log(`[SEARCH API] Found ${transformedCities.length} cities`);
        }
      } catch (error) {
        // Table cities mungkin tidak ada, itu ok
        console.log('[SEARCH API] Cities table not available, skipping');
      }
    }

    // 3. Cari kereta berdasarkan nama (kecuali type 'station' atau 'city')
    if (type === 'all' || type === 'train') {
      const { data: trainsData, error: trainsError } = await supabase
        .from('kereta')
        .select('id, code, name, operator, train_type')
        .or(`name.ilike.${searchQuery},code.ilike.${searchQuery}`)
        .limit(5);

      if (trainsError) {
        console.error('[SEARCH API] Trains query error:', trainsError);
      } else {
        // Untuk setiap kereta yang ditemukan, buat data dummy
        const transformedTrains: TrainResult[] = (trainsData || []).map((train: any, index: number) => {
          // Buat stasiun dummy untuk contoh
          const originStation = {
            code: 'BD',
            name: 'Stasiun Bandung',
            city: 'Bandung'
          };
          
          const destinationStation = {
            code: 'GMR',
            name: 'Stasiun Gambir',
            city: 'Jakarta'
          };

          // Generate waktu dummy berdasarkan index
          const departureHours = 7 + (index * 3);
          const departureTime = `${departureHours.toString().padStart(2, '0')}:00:00`;
          const arrivalHours = departureHours + 3;
          const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:30:00`;
          
          // Tentukan harga berdasarkan tipe kereta
          let harga = 250000;
          let class_type = 'Eksekutif';
          
          switch (train.train_type?.toLowerCase()) {
            case 'premium':
              harga = 500000;
              class_type = 'Premium';
              break;
            case 'eksekutif':
              harga = 350000;
              class_type = 'Eksekutif';
              break;
            case 'bisnis':
              harga = 250000;
              class_type = 'Bisnis';
              break;
            case 'ekonomi':
              harga = 150000;
              class_type = 'Ekonomi';
              break;
          }

          return {
            id: `train-${train.id}`,
            train_id: train.id,
            train_number: train.code,
            train_name: train.name,
            train_type: train.train_type || 'Eksekutif',
            operator: train.operator || 'PT KAI',
            origin_station: originStation,
            destination_station: destinationStation,
            departure_time: departureTime,
            arrival_time: arrivalTime,
            duration_minutes: 180 + (index * 30),
            duration: `${3 + (index * 0.5)}j ${(index * 30)}m`,
            travel_date: new Date().toISOString().split('T')[0],
            status: 'scheduled',
            harga: harga,
            price: harga,
            stok_kursi: Math.floor(Math.random() * 40) + 5,
            availableSeats: Math.floor(Math.random() * 40) + 5,
            class_type: class_type,
            trainClass: class_type,
            facilities: getFacilitiesByClass(class_type),
            insurance: 5000,
            seat_type: 'Reserved Seat',
            route_type: 'Direct',
            schedule_id: `schedule-${train.id}`,
            resultType: 'train' as const
          };
        });
        results.push(...transformedTrains);
        console.log(`[SEARCH API] Found ${transformedTrains.length} trains`);
      }
    }

    // 4. Cari di jadwal berdasarkan kota asal/tujuan
    if (type === 'all' || type === 'schedule') {
      try {
        // Cari jadwal yang berhubungan dengan stasiun yang cocok dengan query
        const { data: schedulesData, error: schedulesError } = await supabase
          .from('jadwal_kereta')
          .select(`
            id,
            travel_date,
            status,
            train_id,
            kereta (
              id,
              code,
              name,
              operator,
              train_type
            )
          `)
          .limit(5);

        if (!schedulesError && schedulesData) {
          const today = new Date().toISOString().split('T')[0];
          
          const transformedSchedules: TrainResult[] = schedulesData.map((schedule: any, index: number) => {
            const train = Array.isArray(schedule.kereta) ? schedule.kereta[0] : schedule.kereta;
            
            if (!train) return null;

            const originStation = {
              code: 'BD',
              name: 'Stasiun Bandung',
              city: 'Bandung'
            };
            
            const destinationStation = {
              code: 'GMR',
              name: 'Stasiun Gambir',
              city: 'Jakarta'
            };

            const departureHours = 8 + (index * 2);
            const departureTime = `${departureHours.toString().padStart(2, '0')}:30:00`;
            const arrivalHours = departureHours + 4;
            const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:00:00`;
            
            let harga = 300000;
            let class_type = train.train_type || 'Eksekutif';
            
            switch (class_type.toLowerCase()) {
              case 'premium':
                harga = 550000;
                break;
              case 'eksekutif':
                harga = 350000;
                break;
              case 'bisnis':
                harga = 250000;
                break;
              case 'ekonomi':
                harga = 120000;
                break;
            }

            return {
              id: `schedule-${schedule.id}`,
              train_id: schedule.train_id,
              train_number: train.code,
              train_name: train.name,
              train_type: train.train_type || 'Eksekutif',
              operator: train.operator || 'PT KAI',
              origin_station: originStation,
              destination_station: destinationStation,
              departure_time: departureTime,
              arrival_time: arrivalTime,
              duration_minutes: 240,
              duration: '4j 0m',
              travel_date: schedule.travel_date || today,
              status: schedule.status || 'scheduled',
              harga: harga,
              price: harga,
              stok_kursi: Math.floor(Math.random() * 50) + 10,
              availableSeats: Math.floor(Math.random() * 50) + 10,
              class_type: class_type,
              trainClass: class_type,
              facilities: getFacilitiesByClass(class_type),
              insurance: 5000,
              seat_type: 'Reserved Seat',
              route_type: 'Direct',
              schedule_id: schedule.id,
              resultType: 'train' as const
            };
          }).filter(Boolean) as TrainResult[];

          results.push(...transformedSchedules);
          console.log(`[SEARCH API] Found ${transformedSchedules.length} schedules`);
        }
      } catch (error) {
        console.log('[SEARCH API] Schedules search error, skipping:', error);
      }
    }

    console.log(`[SEARCH API] Total results found: ${results.length}`);

    // Urutkan berdasarkan tipe untuk UX yang lebih baik
    results.sort((a, b) => {
      // Prioritas: station -> city -> train
      const priority = { station: 1, city: 2, train: 3, schedule: 4 };
      return priority[a.resultType] - priority[b.resultType];
    });

    // Tambahkan metadata
    const response = {
      success: true,
      query: query,
      type: type,
      count: results.length,
      results: results,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('[SEARCH API] Unexpected Error:', error);
    
    // Fallback to dummy data
    const dummyResults = generateDummyResults(query, type);
    
    return NextResponse.json({
      success: true,
      query: query,
      type: type,
      count: dummyResults.length,
      results: dummyResults,
      fallback: true,
      message: 'Using fallback data',
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function untuk fasilitas berdasarkan kelas
function getFacilitiesByClass(trainClass: string): string[] {
  switch (trainClass.toLowerCase()) {
    case 'premium':
    case 'eksekutif':
      return ['AC', 'Makanan', 'WiFi', 'Toilet Bersih', 'Stop Kontak', 'TV', 'Pemandangan', 'Selimut', 'Bantal'];
    case 'bisnis':
      return ['AC', 'Makanan Ringan', 'Toilet Bersih', 'Stop Kontak', 'Pemandangan', 'Selimut'];
    case 'ekonomi':
      return ['AC', 'Toilet', 'Kipas Angin', 'Pemandangan'];
    default:
      return ['AC', 'Toilet'];
  }
}

// Generate dummy results for fallback
function generateDummyResults(query: string, type: string): any[] {
  const results = [];
  const queryLower = query.toLowerCase();
  
  // Stations dummy data
  const stations = [
    { code: 'GMR', name: 'Gambir', city: 'Jakarta' },
    { code: 'BD', name: 'Bandung', city: 'Bandung' },
    { code: 'SBY', name: 'Surabaya Gubeng', city: 'Surabaya' },
    { code: 'YK', name: 'Yogyakarta', city: 'Yogyakarta' },
    { code: 'SMG', name: 'Semarang Tawang', city: 'Semarang' },
    { code: 'CRB', name: 'Cirebon', city: 'Cirebon' },
    { code: 'BKS', name: 'Bekasi', city: 'Bekasi' },
    { code: 'TNG', name: 'Tangerang', city: 'Tangerang' },
    { code: 'SLO', name: 'Solo Balapan', city: 'Solo' },
    { code: 'MLG', name: 'Malang', city: 'Malang' }
  ];

  // Cities dummy data
  const cities = [
    { name: 'Jakarta', province: 'DKI Jakarta' },
    { name: 'Bandung', province: 'Jawa Barat' },
    { name: 'Surabaya', province: 'Jawa Timur' },
    { name: 'Yogyakarta', province: 'DI Yogyakarta' },
    { name: 'Semarang', province: 'Jawa Tengah' },
    { name: 'Medan', province: 'Sumatera Utara' },
    { name: 'Makassar', province: 'Sulawesi Selatan' },
    { name: 'Denpasar', province: 'Bali' },
    { name: 'Palembang', province: 'Sumatera Selatan' },
    { name: 'Balikpapan', province: 'Kalimantan Timur' }
  ];

  // Trains dummy data
  const trains = [
    { code: 'ARGO-001', name: 'Argo Parahyangan', type: 'Eksekutif' },
    { code: 'TAK-001', name: 'Taksaka', type: 'Eksekutif' },
    { code: 'SMT-001', name: 'Sembrani', type: 'Premium' },
    { code: 'GMR-001', name: 'Gumarang', type: 'Bisnis' },
    { code: 'BMS-001', name: 'Bima', type: 'Eksekutif' },
    { code: 'KRD-001', name: 'Commuter Line', type: 'Ekonomi' },
    { code: 'HARINA-001', name: 'Harina', type: 'Eksekutif' },
    { code: 'TURANGA-001', name: 'Turangga', type: 'Eksekutif' },
    { code: 'MS-001', name: 'Mutiara Selatan', type: 'Bisnis' },
    { code: 'SINGO-001', name: 'Singo', type: 'Eksekutif' }
  ];

  // Filter stations based on query
  if (type === 'all' || type === 'station') {
    const filteredStations = stations.filter(station => 
      station.name.toLowerCase().includes(queryLower) || 
      station.city.toLowerCase().includes(queryLower) ||
      station.code.toLowerCase().includes(queryLower)
    ).slice(0, 5);
    
    filteredStations.forEach((station, index) => {
      results.push({
        id: `station-dummy-${index}`,
        code: station.code,
        name: station.name,
        city: station.city,
        resultType: 'station'
      });
    });
  }

  // Filter cities based on query
  if (type === 'all' || type === 'city') {
    const filteredCities = cities.filter(city => 
      city.name.toLowerCase().includes(queryLower) ||
      city.province.toLowerCase().includes(queryLower)
    ).slice(0, 3);
    
    filteredCities.forEach((city, index) => {
      results.push({
        id: `city-dummy-${index}`,
        name: city.name,
        province: city.province,
        resultType: 'city'
      });
    });
  }

  // Filter trains based on query
  if (type === 'all' || type === 'train') {
    const filteredTrains = trains.filter(train => 
      train.name.toLowerCase().includes(queryLower) ||
      train.code.toLowerCase().includes(queryLower)
    ).slice(0, 3);
    
    filteredTrains.forEach((train, index) => {
      const today = new Date().toISOString().split('T')[0];
      const departureHours = 8 + (index * 3);
      const departureTime = `${departureHours.toString().padStart(2, '0')}:00:00`;
      const arrivalHours = departureHours + 4;
      const arrivalTime = `${arrivalHours.toString().padStart(2, '0')}:30:00`;
      
      let harga = 300000;
      switch (train.type.toLowerCase()) {
        case 'premium': harga = 550000; break;
        case 'eksekutif': harga = 350000; break;
        case 'bisnis': harga = 250000; break;
        case 'ekonomi': harga = 80000; break;
      }
      
      results.push({
        id: `train-dummy-${index}`,
        train_id: `train-${index}`,
        train_number: train.code,
        train_name: train.name,
        train_type: train.type,
        operator: 'PT KAI',
        origin_station: { code: 'BD', name: 'Stasiun Bandung', city: 'Bandung' },
        destination_station: { code: 'GMR', name: 'Stasiun Gambir', city: 'Jakarta' },
        departure_time: departureTime,
        arrival_time: arrivalTime,
        duration_minutes: 270,
        duration: '4j 30m',
        travel_date: today,
        status: 'scheduled',
        harga: harga,
        price: harga,
        stok_kursi: Math.floor(Math.random() * 40) + 10,
        availableSeats: Math.floor(Math.random() * 40) + 10,
        class_type: train.type,
        trainClass: train.type,
        facilities: getFacilitiesByClass(train.type),
        insurance: 5000,
        seat_type: 'Reserved Seat',
        route_type: 'Direct',
        resultType: 'train'
      });
    });
  }

  // Urutkan berdasarkan tipe
  results.sort((a, b) => {
    const priority = { station: 1, city: 2, train: 3 };
    return priority[a.resultType] - priority[b.resultType];
  });

  return results;
}