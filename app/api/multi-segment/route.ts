import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
    const passengers = parseInt(searchParams.get('passengers') || '1');

    if (!origin || !destination || !date) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak lengkap' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 1. Cari stasiun berdasarkan nama
    const { data: originStations, error: originError } = await supabase
      .from('stasiun')
      .select('id, nama_stasiun, city')
      .or(`nama_stasiun.ilike.%${origin}%,city.ilike.%${origin}%`)
      .eq('is_active', true)
      .limit(1);

    const { data: destStations, error: destError } = await supabase
      .from('stasiun')
      .select('id, nama_stasiun, city')
      .or(`nama_stasiun.ilike.%${destination}%,city.ilike.%${destination}%`)
      .eq('is_active', true)
      .limit(1);

    if (originError || destError || !originStations?.[0] || !destStations?.[0]) {
      console.error('Stasiun tidak ditemukan:', { originError, destError });
      return NextResponse.json(
        { 
          success: true, 
          options: getFallbackMultiSegmentOptions(origin, destination, date, passengers) 
        }
      );
    }

    const originStation = originStations[0];
    const destStation = destStations[0];

    // 2. Cari rute langsung (single segment)
    const { data: directRoutes, error: directError } = await supabase
      .from('rute_kereta')
      .select(`
        id,
        schedule_id,
        origin_station_id,
        destination_station_id,
        departure_time,
        arrival_time,
        duration_minutes,
        jadwal_kereta!inner (
          id,
          travel_date,
          kereta!inner (
            id,
            kode_kereta,
            nama_kereta,
            tipe_kereta,
            operator
          )
        )
      `)
      .eq('origin_station_id', originStation.id)
      .eq('destination_station_id', destStation.id)
      .eq('jadwal_kereta.travel_date', date)
      .order('departure_time');

    if (directError) {
      console.error('Error fetching direct routes:', directError);
    }

    // 3. Cari opsi multi-segmen dengan transit
    const { data: segmentOptions, error: segmentError } = await supabase
      .from('transit_segments')
      .select(`
        id,
        segment_order,
        departure_time,
        arrival_time,
        duration_minutes,
        waiting_minutes,
        price_adjustment,
        available_seats,
        transit_routes!inner (
          id,
          route_name,
          base_price,
          description
        ),
        origin_station:origin_station_id (
          id,
          nama_stasiun,
          city
        ),
        destination_station:destination_station_id (
          id,
          nama_stasiun,
          city
        ),
        train:train_id (
          id,
          nama_kereta,
          tipe_kereta,
          kode_kereta
        )
      `)
      .eq('transit_routes.is_active', true)
      .order('segment_order');

    if (segmentError) {
      console.error('Error fetching segment options:', segmentError);
    }

    // 4. Format data untuk response
    const options: any[] = [];

    // Opsi langsung (single segment)
    if (directRoutes && directRoutes.length > 0) {
      for (const route of directRoutes) {
        const train = route.jadwal_kereta.kereta;
        const price = 265000; // Harga default, bisa diambil dari tabel harga
        
        options.push({
          segments: [{
            id: `segment-${route.id}`,
            segmentId: `segment-${route.id}`,
            trainId: train.id,
            trainName: train.nama_kereta,
            trainType: train.tipe_kereta,
            departureTime: route.departure_time,
            arrivalTime: route.arrival_time,
            duration: `${Math.floor(route.duration_minutes / 60)}j ${route.duration_minutes % 60}m`,
            origin: originStation.nama_stasiun,
            destination: destStation.nama_stasiun,
            price: price,
            availableSeats: route.available_seats || await getAvailableSeats(route.schedule_id, passengers),
            departureDate: date,
            scheduleId: route.schedule_id,
            selectedSeats: [],
            schedule_id: route.schedule_id,
            train_code: train.kode_kereta,
            origin_city: originStation.city,
            destination_city: destStation.city
          }],
          totalPrice: price * passengers,
          totalDuration: `${Math.floor(route.duration_minutes / 60)}j ${route.duration_minutes % 60}m`,
          isMultiSegment: false
        });
      }
    }

    // Opsi multi-segmen
    if (segmentOptions && segmentOptions.length > 0) {
      // Kelompokkan berdasarkan transit_route_id
      const groupedByRoute: Record<string, any[]> = {};
      
      segmentOptions.forEach(segment => {
        const routeId = segment.transit_routes.id;
        if (!groupedByRoute[routeId]) {
          groupedByRoute[routeId] = [];
        }
        groupedByRoute[routeId].push(segment);
      });

      // Filter hanya rute yang sesuai dengan origin dan destination
      Object.values(groupedByRoute).forEach((segments, routeIndex) => {
        if (segments.length >= 1) {
          const firstSegment = segments[0];
          const lastSegment = segments[segments.length - 1];
          
          // Cek apakah rute ini menghubungkan origin ke destination
          if ((firstSegment.origin_station?.nama_stasiun?.toLowerCase().includes(origin.toLowerCase()) || 
               firstSegment.origin_station?.city?.toLowerCase().includes(origin.toLowerCase())) && 
              (lastSegment.destination_station?.nama_stasiun?.toLowerCase().includes(destination.toLowerCase()) ||
               lastSegment.destination_station?.city?.toLowerCase().includes(destination.toLowerCase()))) {
            
            const totalDuration = segments.reduce((sum, seg) => sum + seg.duration_minutes + (seg.waiting_minutes || 0), 0);
            const totalPrice = segments.reduce((sum, seg) => 
              sum + (seg.transit_routes.base_price || 265000) + (seg.price_adjustment || 0), 0
            );
            
            const segmentDetails = segments.map((seg, index) => ({
              id: `segment-${seg.id}-${index}`,
              segmentId: `segment-${seg.id}-${index}`,
              trainId: seg.train?.id || `train-${routeIndex}-${index}`,
              trainName: seg.train?.nama_kereta || `Kereta ${index + 1}`,
              trainType: seg.train?.tipe_kereta || 'Executive',
              departureTime: seg.departure_time || '08:00',
              arrivalTime: seg.arrival_time || '10:00',
              duration: `${Math.floor((seg.duration_minutes || 120) / 60)}j ${(seg.duration_minutes || 120) % 60}m`,
              origin: seg.origin_station?.nama_stasiun || origin,
              destination: seg.destination_station?.nama_stasiun || destination,
              price: (seg.transit_routes.base_price || 265000) + (seg.price_adjustment || 0),
              availableSeats: seg.available_seats || 20,
              departureDate: date,
              scheduleId: seg.train_schedule_id || `schedule-${routeIndex}-${index}`,
              selectedSeats: [],
              schedule_id: seg.train_schedule_id,
              train_code: seg.train?.kode_kereta || `T${routeIndex}${index}`,
              origin_city: seg.origin_station?.city || origin,
              destination_city: seg.destination_station?.city || destination,
              waiting_minutes: seg.waiting_minutes || 0
            }));

            options.push({
              segments: segmentDetails,
              totalPrice: totalPrice * passengers,
              totalDuration: `${Math.floor(totalDuration / 60)}j ${totalDuration % 60}m`,
              isMultiSegment: segments.length > 1,
              connectionTime: segments.reduce((sum, seg, idx) => {
                if (idx < segments.length - 1) {
                  return sum + (seg.waiting_minutes || 30);
                }
                return sum;
              }, 0)
            });
          }
        }
      });
    }

    // Jika tidak ada opsi, gunakan fallback data
    if (options.length === 0) {
      return NextResponse.json({
        success: true,
        options: getFallbackMultiSegmentOptions(origin, destination, date, passengers)
      });
    }

    // Urutkan berdasarkan harga
    options.sort((a, b) => a.totalPrice - b.totalPrice);

    return NextResponse.json({
      success: true,
      options: options
    });

  } catch (error: any) {
    console.error('Error in multi-segment API:', error);
    return NextResponse.json({
      success: true,
      options: getFallbackMultiSegmentOptions(
        searchParams.get('origin') || '',
        searchParams.get('destination') || '',
        searchParams.get('date') || new Date().toISOString().split('T')[0],
        parseInt(searchParams.get('passengers') || '1')
      )
    });
  }
}

async function getAvailableSeats(scheduleId: string, passengerCount: number): Promise<number> {
  const supabase = createClient();
  
  try {
    const { data: seats, error } = await supabase
      .from('train_seats')
      .select('id, status')
      .eq('schedule_id', scheduleId)
      .eq('status', 'available');

    if (error || !seats) {
      return 20; // Default value
    }

    return Math.max(passengerCount, Math.min(seats.length, 50));
  } catch {
    return 20;
  }
}

function getFallbackMultiSegmentOptions(origin: string, destination: string, date: string, passengers: number) {
  // Data fallback untuk development/testing
  return [
    {
      segments: [{
        id: 'segment-direct-1',
        segmentId: 'segment-direct-1',
        trainId: 1,
        trainName: 'Argo Wilis',
        trainType: 'Executive',
        departureTime: '08:00',
        arrivalTime: '13:00',
        duration: '5j 0m',
        origin: origin,
        destination: destination,
        price: 265000,
        availableSeats: 25,
        departureDate: date,
        scheduleId: 'schedule-direct-1',
        selectedSeats: [],
        schedule_id: 'schedule-direct-1',
        train_code: 'ARW',
        origin_city: origin,
        destination_city: destination
      }],
      totalPrice: 265000 * passengers,
      totalDuration: '5j 0m',
      isMultiSegment: false,
      connectionTime: 0
    },
    {
      segments: [
        {
          id: 'segment-multi-1-1',
          segmentId: 'segment-multi-1-1',
          trainId: 2,
          trainName: 'Turangga',
          trainType: 'Executive',
          departureTime: '07:00',
          arrivalTime: '10:30',
          duration: '3j 30m',
          origin: origin,
          destination: 'Yogyakarta',
          price: 150000,
          availableSeats: 20,
          departureDate: date,
          scheduleId: 'schedule-multi-1-1',
          selectedSeats: [],
          schedule_id: 'schedule-multi-1-1',
          train_code: 'TGA',
          origin_city: origin,
          destination_city: 'Yogyakarta'
        },
        {
          id: 'segment-multi-1-2',
          segmentId: 'segment-multi-1-2',
          trainId: 3,
          trainName: 'Gajayana',
          trainType: 'Executive',
          departureTime: '11:30',
          arrivalTime: '15:00',
          duration: '3j 30m',
          origin: 'Yogyakarta',
          destination: destination,
          price: 180000,
          availableSeats: 20,
          departureDate: date,
          scheduleId: 'schedule-multi-1-2',
          selectedSeats: [],
          schedule_id: 'schedule-multi-1-2',
          train_code: 'GJY',
          origin_city: 'Yogyakarta',
          destination_city: destination
        }
      ],
      totalPrice: 330000 * passengers,
      totalDuration: '7j 0m',
      isMultiSegment: true,
      connectionTime: 60
    },
    {
      segments: [
        {
          id: 'segment-multi-2-1',
          segmentId: 'segment-multi-2-1',
          trainId: 4,
          trainName: 'Bima',
          trainType: 'Executive',
          departureTime: '09:00',
          arrivalTime: '12:00',
          duration: '3j 0m',
          origin: origin,
          destination: 'Semarang',
          price: 120000,
          availableSeats: 15,
          departureDate: date,
          scheduleId: 'schedule-multi-2-1',
          selectedSeats: [],
          schedule_id: 'schedule-multi-2-1',
          train_code: 'BMA',
          origin_city: origin,
          destination_city: 'Semarang'
        },
        {
          id: 'segment-multi-2-2',
          segmentId: 'segment-multi-2-2',
          trainId: 5,
          trainName: 'Sancaka',
          trainType: 'Executive',
          departureTime: '13:30',
          arrivalTime: '17:00',
          duration: '3j 30m',
          origin: 'Semarang',
          destination: destination,
          price: 140000,
          availableSeats: 15,
          departureDate: date,
          scheduleId: 'schedule-multi-2-2',
          selectedSeats: [],
          schedule_id: 'schedule-multi-2-2',
          train_code: 'SCK',
          origin_city: 'Semarang',
          destination_city: destination
        }
      ],
      totalPrice: 260000 * passengers,
      totalDuration: '6j 30m',
      isMultiSegment: true,
      connectionTime: 90
    }
  ];
}