// app/api/search/train/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin') || searchParams.get('from');
    const destination = searchParams.get('destination') || searchParams.get('to');
    const departureDate = searchParams.get('departureDate') || searchParams.get('date');
    const passengers = searchParams.get('passengers') || '1';

    console.log('🔍 Searching trains with params:', { 
      origin, 
      destination, 
      departureDate, 
      passengers,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (!origin || !destination || !departureDate) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters', 
          required: ['origin', 'destination', 'departureDate'],
          received: { origin, destination, departureDate }
        },
        { status: 400 }
      );
    }

    // Validate date format
    let formattedDate: string;
    try {
      const dateObj = new Date(departureDate);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }
      formattedDate = dateObj.toISOString().split('T')[0];
    } catch {
      // Try parsing as DD/MM/YYYY or other formats
      const parts = departureDate.split(/[/-]/);
      if (parts.length === 3) {
        // Try to parse as YYYY-MM-DD or DD/MM/YYYY
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          formattedDate = departureDate;
        } else {
          // DD/MM/YYYY to YYYY-MM-DD
          const [day, month, year] = parts;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      } else {
        // Default to today
        formattedDate = new Date().toISOString().split('T')[0];
      }
    }

    console.log('📅 Formatted date:', formattedDate);

    // Cari stasiun berdasarkan kode - tambahkan fallback untuk berbagai format
    const originCode = origin.toUpperCase();
    const destinationCode = destination.toUpperCase();

    console.log('📍 Searching stations:', { originCode, destinationCode });

    // Coba berbagai format pencarian stasiun
    const { data: originStation, error: originError } = await supabase
      .from('stasiun')
      .select('id, code, name, city')
      .or(`code.eq.${originCode},name.ilike.%${origin}%,city.ilike.%${origin}%`)
      .limit(1);

    const { data: destinationStation, error: destError } = await supabase
      .from('stasiun')
      .select('id, code, name, city')
      .or(`code.eq.${destinationCode},name.ilike.%${destination}%,city.ilike.%${destination}%`)
      .limit(1);

    if (originError || destError) {
      console.error('❌ Stations query error:', { originError, destError });
    }

    const originStationData = originStation?.[0];
    const destinationStationData = destinationStation?.[0];

    if (!originStationData || !destinationStationData) {
      console.log('⚠️ Stations not found, using fallback data');
      
      // Fallback to dummy data if stations not found
      const dummyData = generateDummyData(origin, destination, formattedDate);
      return NextResponse.json(dummyData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }

    console.log('📍 Found stations:', {
      origin: originStationData,
      destination: destinationStationData
    });

    // Cari jadwal kereta berdasarkan tanggal - query yang lebih fleksibel
    let schedules: any[] = [];
    let scheduleError: any = null;

    try {
      // Coba query pertama dengan join
      const { data: schedulesData, error: sError } = await supabase
        .from('jadwal_kereta')
        .select(`
          id,
          travel_date,
          status,
          train_id,
          departure_time,
          arrival_time,
          harga,
          stok_kursi,
          class_type,
          kereta!inner (
            id,
            code,
            name,
            operator,
            train_type
          )
        `)
        .eq('travel_date', formattedDate)
        .eq('status', 'scheduled')
        .order('departure_time', { ascending: true });

      scheduleError = sError;
      schedules = schedulesData || [];

      // Jika tidak ada data, coba query tanpa join
      if (!schedules || schedules.length === 0) {
        console.log('📅 No schedules with join, trying simple query');
        const { data: simpleSchedules } = await supabase
          .from('jadwal_kereta')
          .select('id, travel_date, status, train_id, departure_time, arrival_time')
          .eq('travel_date', formattedDate)
          .eq('status', 'scheduled')
          .order('departure_time', { ascending: true });

        schedules = simpleSchedules || [];
      }
    } catch (joinError) {
      console.error('❌ Join query error, trying simple query:', joinError);
      // Fallback to simple query
      const { data: simpleSchedules } = await supabase
        .from('jadwal_kereta')
        .select('id, travel_date, status, train_id, departure_time, arrival_time')
        .eq('travel_date', formattedDate)
        .eq('status', 'scheduled')
        .order('departure_time', { ascending: true });

      schedules = simpleSchedules || [];
    }

    console.log(`📅 Found ${schedules?.length || 0} schedules`);

    const trainResults = [];

    // Jika ada jadwal di database, proses data
    if (schedules && schedules.length > 0) {
      for (const schedule of schedules) {
        try {
          // Dapatkan data kereta
          let trainData: any = null;
          if (schedule.kereta) {
            trainData = Array.isArray(schedule.kereta) ? schedule.kereta[0] : schedule.kereta;
          } else {
            // Query terpisah untuk data kereta
            const { data: train } = await supabase
              .from('kereta')
              .select('id, code, name, operator, train_type')
              .eq('id', schedule.train_id)
              .single();

            trainData = train;
          }

          // Jika tidak ada data kereta, skip
          if (!trainData) {
            continue;
          }

          // Cari rute kereta atau gunakan data langsung dari jadwal
          let routes: any[] = [];
          
          // Coba cari rute terlebih dahulu
          const { data: routeData, error: routeError } = await supabase
            .from('rute_kereta')
            .select(`
              id,
              departure_time,
              arrival_time,
              duration_minutes,
              harga,
              stok_kursi,
              class_type
            `)
            .eq('schedule_id', schedule.id)
            .eq('origin_station_id', originStationData.id)
            .eq('destination_station_id', destinationStationData.id)
            .limit(1);

          if (!routeError && routeData && routeData.length > 0) {
            routes = routeData;
          } else {
            // Gunakan data dari jadwal sebagai rute default
            routes = [{
              id: schedule.id,
              departure_time: schedule.departure_time,
              arrival_time: schedule.arrival_time,
              duration_minutes: calculateDuration(schedule.departure_time, schedule.arrival_time),
              harga: schedule.harga,
              stok_kursi: schedule.stok_kursi,
              class_type: schedule.class_type
            }];
          }

          for (const route of routes) {
            // Hitung kursi tersedia
            let availableSeats = route.stok_kursi || schedule.stok_kursi;
            if (!availableSeats) {
              const { count: seatCount, error: seatError } = await supabase
                .from('train_seats')
                .select('*', { count: 'exact', head: true })
                .eq('schedule_id', schedule.id)
                .eq('status', 'available');

              if (!seatError) {
                availableSeats = seatCount;
              }
            }

            // Tentukan harga dan kelas
            let harga = route.harga || schedule.harga || 250000;
            let class_type = route.class_type || schedule.class_type || 'Eksekutif';
            let stok_kursi = availableSeats || Math.floor(Math.random() * 30) + 5;

            // Adjust harga berdasarkan kelas jika tidak ada harga
            if (!route.harga && !schedule.harga) {
              switch (class_type.toLowerCase()) {
                case 'premium':
                  harga = 500000;
                  break;
                case 'eksekutif':
                  harga = 350000;
                  break;
                case 'bisnis':
                  harga = 250000;
                  break;
                case 'ekonomi':
                  harga = 150000;
                  break;
                default:
                  harga = 250000;
              }

              // Adjust harga berdasarkan tipe kereta
              if (trainData.code) {
                if (trainData.code.includes('ARGO')) {
                  harga += 50000;
                } else if (trainData.code.includes('SMT') || trainData.code.includes('SEMB')) {
                  harga += 100000;
                } else if (trainData.code.includes('KRD') || trainData.code.includes('COMMUTER')) {
                  harga = Math.max(harga - 50000, 50000);
                }
              }
            }

            // Format data untuk response
            trainResults.push({
              // ID untuk frontend
              id: `${schedule.id}-${route.id}`,
              // Data untuk booking
              train_id: schedule.train_id,
              schedule_id: schedule.id,
              route_id: route.id,
              
              // Data kereta
              train_number: trainData.code || `TR-${schedule.train_id}`,
              train_name: trainData.name || 'Kereta',
              train_type: trainData.train_type || class_type,
              operator: trainData.operator || 'PT KAI',
              
              // Data stasiun
              origin_station: {
                code: originStationData.code,
                name: originStationData.name,
                city: originStationData.city
              },
              destination_station: {
                code: destinationStationData.code,
                name: destinationStationData.name,
                city: destinationStationData.city
              },
              
              // Jadwal
              departure_time: route.departure_time || schedule.departure_time || '08:00:00',
              arrival_time: route.arrival_time || schedule.arrival_time || '12:00:00',
              duration_minutes: route.duration_minutes || calculateDuration(
                route.departure_time || schedule.departure_time || '08:00:00',
                route.arrival_time || schedule.arrival_time || '12:00:00'
              ),
              duration: formatDuration(
                route.duration_minutes || calculateDuration(
                  route.departure_time || schedule.departure_time || '08:00:00',
                  route.arrival_time || schedule.arrival_time || '12:00:00'
                )
              ),
              travel_date: schedule.travel_date || formattedDate,
              status: schedule.status || 'scheduled',
              
              // Harga dan ketersediaan
              harga: harga,
              price: harga,
              stok_kursi: stok_kursi,
              availableSeats: stok_kursi,
              
              // Kelas
              class_type: class_type,
              trainClass: class_type,
              
              // Fasilitas
              facilities: getFacilitiesByClass(class_type),
              insurance: 5000,
              seat_type: 'Reserved Seat',
              route_type: 'Direct'
            });
          }
        } catch (error) {
          console.error(`❌ Error processing schedule ${schedule.id}:`, error);
          continue;
        }
      }
    }

    console.log(`✅ Processed ${trainResults.length} train results from database`);

    // Jika tidak ada hasil dari database, gunakan data dummy
    if (trainResults.length === 0) {
      console.log('⚠️ No train results from database, using dummy data');
      const dummyData = generateDummyData(origin, destination, formattedDate);
      return NextResponse.json(dummyData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
    }

    // Sort by departure time by default
    trainResults.sort((a, b) => {
      const timeA = a.departure_time || '00:00:00';
      const timeB = b.departure_time || '00:00:00';
      return timeA.localeCompare(timeB);
    });

    // Add metadata
    const response = {
      success: true,
      data: trainResults,
      count: trainResults.length,
      search: {
        origin: originStationData,
        destination: destinationStationData,
        date: formattedDate,
        passengers: parseInt(passengers)
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('❌ Error in train search API:', error);
    
    // Always return dummy data on error for development
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin') || searchParams.get('from') || '';
    const destination = searchParams.get('destination') || searchParams.get('to') || '';
    const date = searchParams.get('departureDate') || searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const dummyData = generateDummyData(origin, destination, date);
    
    const response = {
      success: true,
      data: dummyData,
      count: dummyData.length,
      fallback: true,
      message: 'Using fallback data due to error',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
}

// Helper function untuk menghitung durasi dari waktu berangkat dan tiba
function calculateDuration(departureTime: string, arrivalTime: string): number {
  try {
    const [depHours, depMinutes] = departureTime.split(':').map(Number);
    const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);
    
    const depTotalMinutes = (depHours || 0) * 60 + (depMinutes || 0);
    const arrTotalMinutes = (arrHours || 0) * 60 + (arrMinutes || 0);
    
    let duration = arrTotalMinutes - depTotalMinutes;
    
    // Handle overnight trains
    if (duration < 0) {
      duration += 24 * 60; // Add 24 hours
    }
    
    return duration > 0 ? duration : 180; // Default 3 hours
  } catch {
    return 180; // Default 3 hours
  }
}

// Helper function untuk format durasi
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}j ${mins}m`;
}

// Helper function untuk fasilitas berdasarkan kelas
function getFacilitiesByClass(trainClass: string): string[] {
  switch (trainClass.toLowerCase()) {
    case 'eksekutif':
    case 'premium':
      return ['AC', 'Makanan', 'WiFi', 'Toilet Bersih', 'Stop Kontak', 'TV', 'Pemandangan', 'Selimut', 'Bantal'];
    case 'bisnis':
      return ['AC', 'Makanan Ringan', 'Toilet Bersih', 'Stop Kontak', 'Pemandangan', 'Selimut'];
    case 'ekonomi':
      return ['AC', 'Toilet', 'Kipas Angin', 'Pemandangan'];
    default:
      return ['AC', 'Toilet'];
  }
}

// Fungsi untuk generate data dummy sebagai fallback
function generateDummyData(origin: string, destination: string, date: string): any[] {
  const stations: Record<string, {city: string, name: string, code: string}> = {
    'GMR': { city: 'Jakarta', name: 'Stasiun Gambir', code: 'GMR' },
    'BD': { city: 'Bandung', name: 'Stasiun Bandung', code: 'BD' },
    'BANDUNG': { city: 'Bandung', name: 'Stasiun Bandung', code: 'BD' },
    'SBY': { city: 'Surabaya', name: 'Stasiun Surabaya Gubeng', code: 'SBY' },
    'SURABAYA': { city: 'Surabaya', name: 'Stasiun Surabaya', code: 'SBY' },
    'YK': { city: 'Yogyakarta', name: 'Stasiun Yogyakarta', code: 'YK' },
    'YOGYAKARTA': { city: 'Yogyakarta', name: 'Stasiun Yogyakarta', code: 'YK' },
    'JOGJA': { city: 'Yogyakarta', name: 'Stasiun Yogyakarta', code: 'YK' },
    'SMG': { city: 'Semarang', name: 'Stasiun Semarang Tawang', code: 'SMG' },
    'SEMARANG': { city: 'Semarang', name: 'Stasiun Semarang', code: 'SMG' },
    'CRB': { city: 'Cirebon', name: 'Stasiun Cirebon', code: 'CRB' },
    'CIREBON': { city: 'Cirebon', name: 'Stasiun Cirebon', code: 'CRB' },
    'TNG': { city: 'Tangerang', name: 'Stasiun Tangerang', code: 'TNG' },
    'TANGERANG': { city: 'Tangerang', name: 'Stasiun Tangerang', code: 'TNG' },
    'BKS': { city: 'Bekasi', name: 'Stasiun Bekasi', code: 'BKS' },
    'BEKASI': { city: 'Bekasi', name: 'Stasiun Bekasi', code: 'BKS' },
    'SLO': { city: 'Solo', name: 'Stasiun Solo Balapan', code: 'SLO' },
    'SOLO': { city: 'Solo', name: 'Stasiun Solo', code: 'SLO' },
    'MLG': { city: 'Malang', name: 'Stasiun Malang', code: 'MLG' },
    'MALANG': { city: 'Malang', name: 'Stasiun Malang', code: 'MLG' },
    'JKT': { city: 'Jakarta', name: 'Stasiun Jakarta Kota', code: 'JKT' },
    'JAKARTA': { city: 'Jakarta', name: 'Stasiun Jakarta', code: 'GMR' },
    'BDO': { city: 'Bandung', name: 'Stasiun Bandung', code: 'BD' }
  };

  const originUpper = origin.toUpperCase();
  const destinationUpper = destination.toUpperCase();

  const originStation = stations[originUpper] || stations[originUpper.slice(0, 3)] || { 
    city: origin, 
    name: `Stasiun ${origin}`, 
    code: originUpper.slice(0, 2) || 'ST'
  };
  
  const destStation = stations[destinationUpper] || stations[destinationUpper.slice(0, 3)] || { 
    city: destination, 
    name: `Stasiun ${destination}`, 
    code: destinationUpper.slice(0, 2) || 'DT'
  };

  // Generate beberapa jadwal dummy dengan variasi waktu
  const baseTrains = [
    {
      code: 'PARAHYANGAN-131',
      name: 'Parahyangan',
      class_type: 'Eksekutif',
      basePrice: 265000,
      departure: '05:00:00',
      duration: 181 // 3h 1m
    },
    {
      code: 'PARAHYANGAN-135',
      name: 'Parahyangan',
      class_type: 'Eksekutif',
      basePrice: 265000,
      departure: '08:01:00',
      duration: 181
    },
    {
      code: 'ARGO-001',
      name: 'Argo Parahyangan',
      class_type: 'Eksekutif',
      basePrice: 350000,
      departure: '07:00:00',
      duration: 150
    },
    {
      code: 'TAK-001',
      name: 'Taksaka',
      class_type: 'Eksekutif',
      basePrice: 300000,
      departure: '10:00:00',
      duration: 210
    },
    {
      code: 'GMR-001',
      name: 'Gumarang',
      class_type: 'Bisnis',
      basePrice: 250000,
      departure: '14:00:00',
      duration: 210
    },
    {
      code: 'SMT-001',
      name: 'Sembrani',
      class_type: 'Premium',
      basePrice: 500000,
      departure: '18:00:00',
      duration: 240
    },
    {
      code: 'KRD-001',
      name: 'Commuter Line',
      class_type: 'Ekonomi',
      basePrice: 80000,
      departure: '06:30:00',
      duration: 180
    }
  ];

  const trains = baseTrains.map((train, index) => {
    const stok_kursi = index === 0 ? 15 : Math.floor(Math.random() * 40) + 5;
    const isLimited = stok_kursi <= 10;
    const isHighDemand = index === 1;
    
    // Adjust price based on availability
    let harga = train.basePrice;
    if (isLimited) {
      harga += 50000;
    }
    
    // Add small random variation untuk kereta selain Parahyangan
    if (!train.code.includes('PARAHYANGAN')) {
      harga += Math.floor(Math.random() * 20000) - 10000;
    }
    
    // Calculate arrival time
    const departureTime = train.departure;
    const [hours, minutes] = departureTime.split(':').map(Number);
    const departureDate = new Date();
    departureDate.setHours(hours, minutes, 0);
    
    const arrivalDate = new Date(departureDate.getTime() + train.duration * 60000);
    const arrivalTime = `${arrivalDate.getHours().toString().padStart(2, '0')}:${arrivalDate.getMinutes().toString().padStart(2, '0')}:00`;
    
    const id = `dummy-${index + 1}-${Date.now()}`;
    
    return {
      id: id,
      train_id: `train-${index + 1}`,
      schedule_id: `schedule-${index + 1}`,
      route_id: `route-${index + 1}`,
      
      train_number: train.code,
      train_name: train.name,
      train_type: train.class_type,
      operator: 'PT KAI',
      
      origin_station: originStation,
      destination_station: destStation,
      
      departure_time: departureTime,
      arrival_time: arrivalTime,
      duration_minutes: train.duration,
      duration: formatDuration(train.duration),
      travel_date: date,
      status: 'scheduled',
      
      harga: harga,
      price: harga,
      stok_kursi: stok_kursi,
      availableSeats: stok_kursi,
      
      class_type: train.class_type,
      trainClass: train.class_type,
      
      facilities: getFacilitiesByClass(train.class_type),
      insurance: 5000,
      seat_type: 'Reserved Seat',
      route_type: 'Direct'
    };
  });

  // Sort by departure time
  trains.sort((a, b) => a.departure_time.localeCompare(b.departure_time));

  return trains;
}