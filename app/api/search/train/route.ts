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
    const tripType = searchParams.get('tripType') || 'oneWay';

    console.log('🔍 Searching trains with params:', { 
      origin, 
      destination, 
      departureDate, 
      passengers,
      tripType
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
      // Try to parse other date formats
      const parts = departureDate.split(/[/-]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          formattedDate = departureDate; // Already YYYY-MM-DD
        } else {
          const [day, month, year] = parts;
          formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      } else {
        // Default to today
        formattedDate = new Date().toISOString().split('T')[0];
      }
    }

    console.log('📅 Formatted date:', formattedDate);

    const originCode = origin.toUpperCase();
    const destinationCode = destination.toUpperCase();

    console.log('📍 Searching stations:', { originCode, destinationCode });

    // PERBAIKAN UTAMA: Query database dengan lebih robust
    let originStation = null;
    let destinationStation = null;

    try {
      // First, let's check what tables exist and their structure
      console.log('🔍 Checking database structure...');
      
      // Method 1: Try to get stations with direct query
      const { data: originData, error: originError } = await supabase
        .from('stasiun')
        .select('*')
        .or(`kode.eq.${originCode},nama.ilike.%${origin}%,kota.ilike.%${origin}%`)
        .limit(1);

      if (!originError && originData && originData.length > 0) {
        originStation = {
          id: originData[0].id || originData[0].kode || `origin-${originCode}`,
          code: originData[0].kode || originData[0].code || originCode,
          name: originData[0].nama || originData[0].name || `Stasiun ${origin}`,
          city: originData[0].kota || originData[0].city || getCityFromCode(originCode)
        };
        console.log('✅ Found origin station:', originStation);
      }

      const { data: destData, error: destError } = await supabase
        .from('stasiun')
        .select('*')
        .or(`kode.eq.${destinationCode},nama.ilike.%${destination}%,kota.ilike.%${destination}%`)
        .limit(1);

      if (!destError && destData && destData.length > 0) {
        destinationStation = {
          id: destData[0].id || destData[0].kode || `dest-${destinationCode}`,
          code: destData[0].kode || destData[0].code || destinationCode,
          name: destData[0].nama || destData[0].name || `Stasiun ${destination}`,
          city: destData[0].kota || destData[0].city || getCityFromCode(destinationCode)
        };
        console.log('✅ Found destination station:', destinationStation);
      }

    } catch (error) {
      console.error('❌ Error querying stations:', error);
    }

    // Fallback jika stasiun tidak ditemukan
    if (!originStation) {
      originStation = {
        id: `origin-${originCode}`,
        code: originCode,
        name: getStationName(originCode),
        city: getCityFromCode(originCode)
      };
    }

    if (!destinationStation) {
      destinationStation = {
        id: `dest-${destinationCode}`,
        code: destinationCode,
        name: getStationName(destinationCode),
        city: getCityFromCode(destinationCode)
      };
    }

    console.log('📍 Using stations:', {
      origin: originStation,
      destination: destinationStation
    });

    // Cari jadwal kereta dari database
    let trainResults: any[] = [];
    let foundDatabaseResults = false;

    try {
      console.log('🚂 Searching train schedules in database...');
      
      // Try multiple table names and structures
      const possibleTables = ['jadwal_kereta', 'train_schedules', 'schedules', 'jadwal'];
      
      for (const tableName of possibleTables) {
        try {
          console.log(`🔍 Trying table: ${tableName}`);
          
          const { data: schedules, error: scheduleError } = await supabase
            .from(tableName)
            .select(`
              *,
              kereta:train_id(*),
              stasiun_asal:origin_station_id(*),
              stasiun_tujuan:destination_station_id(*)
            `)
            .gte('departure_date', `${formattedDate}T00:00:00`)
            .lte('departure_date', `${formattedDate}T23:59:59`)
            .eq('status', 'available')
            .order('departure_time', { ascending: true })
            .limit(20);

          if (!scheduleError && schedules && schedules.length > 0) {
            console.log(`✅ Found ${schedules.length} schedules in ${tableName}`);
            
            for (const schedule of schedules) {
              try {
                // Get train data
                let trainData = schedule.kereta || schedule.train || {
                  id: schedule.train_id || `train-${Date.now()}`,
                  name: schedule.train_name || 'Kereta Api',
                  code: schedule.train_number || `TR-${schedule.id}`,
                  class: schedule.train_class || 'Eksekutif'
                };

                // Calculate duration
                const departureTime = schedule.departure_time || schedule.departureTime || '08:00';
                const arrivalTime = schedule.arrival_time || schedule.arrivalTime || '12:00';
                const duration = calculateDuration(departureTime, arrivalTime);

                // Prepare train result
                const trainResult = {
                  id: `train-${schedule.id}-${Date.now()}`,
                  scheduleId: schedule.id,
                  trainId: schedule.train_id || trainData.id,
                  
                  trainNumber: schedule.train_number || trainData.code,
                  trainName: schedule.train_name || trainData.name,
                  trainClass: schedule.train_class || trainData.class || 'Eksekutif',
                  operator: schedule.operator || trainData.operator || 'PT KAI',
                  
                  originStation: originStation,
                  destinationStation: destinationStation,
                  
                  departureTime: departureTime,
                  arrivalTime: arrivalTime,
                  duration: formatDuration(duration),
                  durationMinutes: duration,
                  travelDate: schedule.departure_date || schedule.date || formattedDate,
                  status: schedule.status || 'available',
                  
                  price: schedule.price || schedule.harga || 250000,
                  baseFare: schedule.base_fare || 200000,
                  seatPremium: schedule.seat_premium || 50000,
                  availableSeats: schedule.available_seats || schedule.stok_kursi || Math.floor(Math.random() * 30) + 5,
                  
                  facilities: getFacilitiesByClass(schedule.train_class || trainData.class || 'Eksekutif'),
                  isRefundable: true,
                  isCheckinAvailable: true,
                  isBestDeal: false,
                  isHighDemand: (schedule.available_seats || 50) < 10
                };

                trainResults.push(trainResult);
              } catch (trainError) {
                console.error(`❌ Error processing train ${schedule.id}:`, trainError);
                continue;
              }
            }
            
            foundDatabaseResults = true;
            break;
          }
        } catch (tableError) {
          console.log(`❌ Table ${tableName} not found or error:`, tableError);
          continue;
        }
      }
    } catch (error) {
      console.error('❌ Error querying train schedules:', error);
    }

    // Jika tidak ada hasil dari database, gunakan data dummy
    if (!foundDatabaseResults || trainResults.length === 0) {
      console.log('⚠️ No database results, using fallback data');
      trainResults = generateDummyData(originStation, destinationStation, formattedDate);
    }

    console.log(`✅ Returning ${trainResults.length} train results`);

    // Sort results by departure time
    trainResults.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

    // Mark the first train as best deal
    if (trainResults.length > 0) {
      trainResults[0].isBestDeal = true;
    }

    const response = {
      success: true,
      data: trainResults,
      count: trainResults.length,
      search: {
        origin: originStation,
        destination: destinationStation,
        departureDate: formattedDate,
        passengers: parseInt(passengers),
        tripType: tripType
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });

  } catch (error: any) {
    console.error('❌ Error in train search API:', error);
    
    // Fallback response
    const fallbackData = generateFallbackData();
    
    const response = {
      success: true,
      data: fallbackData,
      count: fallbackData.length,
      fallback: true,
      message: 'Using fallback data',
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

// Helper functions
function calculateDuration(departureTime: string, arrivalTime: string): number {
  try {
    const [depHours, depMinutes] = departureTime.split(':').map(Number);
    const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);
    
    const depTotal = (depHours || 0) * 60 + (depMinutes || 0);
    const arrTotal = (arrHours || 0) * 60 + (arrMinutes || 0);
    
    let duration = arrTotal - depTotal;
    if (duration < 0) duration += 24 * 60;
    
    return duration > 0 ? duration : 180; // Default 3 hours
  } catch {
    return 180;
  }
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) return `${hours} jam`;
  return `${hours} jam ${mins} menit`;
}

function getStationName(code: string): string {
  const stations: Record<string, string> = {
    'GMR': 'Stasiun Gambir',
    'BD': 'Stasiun Bandung',
    'BDO': 'Stasiun Bandung',
    'SBY': 'Stasiun Surabaya Gubeng',
    'YK': 'Stasiun Yogyakarta',
    'SLO': 'Stasiun Solo Balapan',
    'MLG': 'Stasiun Malang',
    'SMG': 'Stasiun Semarang Tawang',
    'CRB': 'Stasiun Cirebon',
    'TNG': 'Stasiun Tangerang',
    'BKS': 'Stasiun Bekasi',
    'DPK': 'Stasiun Depok',
    'JKT': 'Stasiun Jakarta Kota',
    'KNG': 'Stasiun Kiaracondong'
  };
  
  return stations[code] || `Stasiun ${code}`;
}

function getCityFromCode(code: string): string {
  const cities: Record<string, string> = {
    'GMR': 'Jakarta',
    'BD': 'Bandung',
    'BDO': 'Bandung',
    'SBY': 'Surabaya',
    'YK': 'Yogyakarta',
    'SLO': 'Solo',
    'MLG': 'Malang',
    'SMG': 'Semarang',
    'CRB': 'Cirebon',
    'TNG': 'Tangerang',
    'BKS': 'Bekasi',
    'DPK': 'Depok',
    'JKT': 'Jakarta',
    'KNG': 'Bandung'
  };
  
  return cities[code] || code;
}

function getFacilitiesByClass(trainClass: string): string[] {
  const baseFacilities = ['AC', 'Toilet Bersih', 'Pemandangan'];
  
  switch (trainClass.toLowerCase()) {
    case 'premium':
      return [...baseFacilities, 'Makanan', 'WiFi', 'Stop Kontak', 'TV', 'Selimut', 'Bantal', 'Pelayanan VIP'];
    case 'eksekutif':
      return [...baseFacilities, 'Makanan Ringan', 'Stop Kontak', 'Selimut'];
    case 'bisnis':
      return [...baseFacilities, 'Stop Kontak'];
    case 'ekonomi':
      return baseFacilities;
    default:
      return baseFacilities;
  }
}

function generateDummyData(origin: any, destination: any, date: string): any[] {
  const dummyTrains = [
    {
      trainNumber: 'PARAHYANGAN-131',
      trainName: 'Parahyangan',
      trainClass: 'Eksekutif',
      departureTime: '05:00',
      duration: 180,
      basePrice: 265000
    },
    {
      trainNumber: 'PARAHYANGAN-135',
      trainName: 'Parahyangan',
      trainClass: 'Eksekutif',
      departureTime: '08:00',
      duration: 180,
      basePrice: 265000
    },
    {
      trainNumber: 'ARGO-001',
      trainName: 'Argo Parahyangan',
      trainClass: 'Eksekutif',
      departureTime: '07:00',
      duration: 150,
      basePrice: 350000
    },
    {
      trainNumber: 'TAKSAKA-101',
      trainName: 'Taksaka',
      trainClass: 'Eksekutif',
      departureTime: '10:00',
      duration: 210,
      basePrice: 300000
    },
    {
      trainNumber: 'GUMARANG-201',
      trainName: 'Gumarang',
      trainClass: 'Bisnis',
      departureTime: '14:00',
      duration: 240,
      basePrice: 250000
    }
  ];

  return dummyTrains.map((train, index) => {
    const departureTime = train.departureTime;
    const [hours, minutes] = departureTime.split(':').map(Number);
    const departureDate = new Date();
    departureDate.setHours(hours, minutes, 0);
    
    const arrivalDate = new Date(departureDate.getTime() + train.duration * 60000);
    const arrivalTime = `${arrivalDate.getHours().toString().padStart(2, '0')}:${arrivalDate.getMinutes().toString().padStart(2, '0')}`;
    
    const availableSeats = index === 0 ? 15 : Math.floor(Math.random() * 40) + 5;
    const isHighDemand = availableSeats < 10;
    
    let price = train.basePrice;
    if (isHighDemand) price += 50000;
    
    return {
      id: `dummy-${index + 1}-${Date.now()}`,
      scheduleId: `schedule-${index + 1}`,
      trainId: `train-${index + 1}`,
      
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      trainClass: train.trainClass,
      operator: 'PT KAI',
      
      originStation: origin,
      destinationStation: destination,
      
      departureTime: departureTime,
      arrivalTime: arrivalTime,
      duration: formatDuration(train.duration),
      durationMinutes: train.duration,
      travelDate: date,
      status: 'available',
      
      price: price,
      baseFare: train.basePrice,
      seatPremium: 50000,
      availableSeats: availableSeats,
      
      facilities: getFacilitiesByClass(train.trainClass),
      isRefundable: true,
      isCheckinAvailable: true,
      isBestDeal: index === 0,
      isHighDemand: isHighDemand
    };
  });
}

function generateFallbackData(): any[] {
  // Simple fallback data for error cases
  return [
    {
      id: 'fallback-1',
      trainNumber: 'PARAHYANGAN-131',
      trainName: 'Parahyangan',
      trainClass: 'Eksekutif',
      departureTime: '08:00',
      arrivalTime: '12:00',
      duration: '4 jam',
      durationMinutes: 240,
      price: 265000,
      availableSeats: 25,
      isRefundable: true,
      isBestDeal: true
    }
  ];
}