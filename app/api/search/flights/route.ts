import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// Interface untuk response yang lebih terstruktur
interface FlightResponse {
  id: string;
  waktu_berangkat: string;
  waktu_tiba: string;
  harga: number;
  kursi_tersedia: number;
  transportasi: {
    nama: string;
    tipe: string;
    logo: string;
  };
  origin: {
    name: string;
    code: string;
  };
  destination: {
    name: string;
    code: string;
  };
  duration?: string;
  stops?: number;
  aircraft_type?: string;
  baggage_allowance?: string;
  meal_included?: boolean;
  wifi_available?: boolean;
  entertainment?: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: FlightResponse[];
  error?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Extract parameters with defaults
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const departureDate = searchParams.get('departureDate');
  const returnDate = searchParams.get('returnDate');
  const passengers = searchParams.get('passengers') || '1';
  const sortBy = searchParams.get('sortBy') || 'price';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const airline = searchParams.get('airline');
  const timeOfDay = searchParams.get('timeOfDay'); // morning, afternoon, evening, night

  // Validasi parameter wajib
  if (!origin || !destination || !departureDate) {
    return NextResponse.json({
      success: false,
      error: 'Parameter origin, destination, dan departureDate diperlukan'
    } as ApiResponse, { status: 400 });
  }

  try {
    // Validasi dan parsing tanggal
    const date = new Date(departureDate);
    if (isNaN(date.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Format tanggal tidak valid. Gunakan YYYY-MM-DD'
      } as ApiResponse, { status: 400 });
    }

    // Validasi tanggal tidak boleh di masa lalu
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return NextResponse.json({
        success: false,
        error: 'Tanggal keberangkatan tidak boleh di masa lalu'
      } as ApiResponse, { status: 400 });
    }

    // Validasi return date jika ada
    if (returnDate) {
      const returnDateObj = new Date(returnDate);
      if (isNaN(returnDateObj.getTime())) {
        return NextResponse.json({
          success: false,
          error: 'Format tanggal pulang tidak valid'
        } as ApiResponse, { status: 400 });
      }
      if (returnDateObj <= date) {
        return NextResponse.json({
          success: false,
          error: 'Tanggal pulang harus setelah tanggal keberangkatan'
        } as ApiResponse, { status: 400 });
      }
    }

    // Set waktu mulai dan akhir hari
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

<<<<<<< HEAD
    // Format ke string ISO
    const startStr = startOfDay.toISOString();
    const endStr = endOfDay.toISOString();
=======
    // Format ke string ISO tanpa 'Z'
    const startStr = startOfDay.toISOString().slice(0, 19);
    const endStr = endOfDay.toISOString().slice(0, 19);
>>>>>>> 93a879e (fix fitur)

    // Time of day filter
    let timeFilter: { gte?: string; lte?: string } = {};
    if (timeOfDay) {
      switch (timeOfDay) {
        case 'morning':
          timeFilter = { gte: '06:00:00', lte: '11:59:59' };
          break;
        case 'afternoon':
          timeFilter = { gte: '12:00:00', lte: '17:59:59' };
          break;
        case 'evening':
          timeFilter = { gte: '18:00:00', lte: '21:59:59' };
          break;
        case 'night':
          timeFilter = { gte: '22:00:00', lte: '05:59:59' };
          break;
      }
    }

    console.log('[FLIGHTS API] Query Params:', { 
      origin, destination, departureDate, returnDate, passengers, 
      sortBy, sortOrder, page, limit, minPrice, maxPrice, airline, timeOfDay 
    });

<<<<<<< HEAD
    // First, get origin and destination city IDs by code
    const { data: originCity, error: originError } = await supabase
      .from('cities')
      .select('id, code, name')
      .eq('code', origin.toUpperCase())
      .maybeSingle();

    const { data: destCity, error: destError } = await supabase
      .from('cities')
      .select('id, code, name')
      .eq('code', destination.toUpperCase())
      .maybeSingle();

    if (originError || !originCity) {
      return NextResponse.json({
        success: false,
        error: `Origin airport dengan kode '${origin}' tidak ditemukan`
      } as ApiResponse, { status: 404 });
    }

    if (destError || !destCity) {
      return NextResponse.json({
        success: false,
        error: `Destination airport dengan kode '${destination}' tidak ditemukan`
      } as ApiResponse, { status: 404 });
    }

    // Get route ID
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('id')
      .eq('origin_city_id', originCity.id)
      .eq('destination_city_id', destCity.id)
      .eq('is_active', true)
      .maybeSingle();

    if (routeError || !route) {
      // Route not found - return empty results instead of error
      console.log('[FLIGHTS API] Route not found, returning empty results');
      return NextResponse.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          hasMore: false
        }
      } as ApiResponse);
    }

    // Build query for schedules
=======
    // Build dynamic query based on filters
>>>>>>> 93a879e (fix fitur)
    let query = supabase
      .from('schedules')
      .select(`
        id,
        departure_time,
        arrival_time,
        price,
        total_seats,
        booked_seats,
        route_id,
        transportation_id,
        aircraft_type,
        baggage_allowance,
        meal_included,
        wifi_available,
        entertainment,
<<<<<<< HEAD
        routes!inner (
=======
        routes (
>>>>>>> 93a879e (fix fitur)
          origin_city_id,
          destination_city_id,
          origin:cities!origin_city_id (
            name,
            code
          ),
          destination:cities!destination_city_id (
            name,
            code
          )
        ),
<<<<<<< HEAD
        transportations!inner (
=======
        transportations (
>>>>>>> 93a879e (fix fitur)
          name,
          type,
          logo_url
        )
      `)
<<<<<<< HEAD
      .eq('route_id', route.id)
      .eq('transportations.type', 'Pesawat')
      .gte('departure_time', startStr)
      .lte('departure_time', endStr)
      .neq('status', 'cancelled');
=======
      .eq('transportations.type', 'Pesawat')
      .gte('departure_time', startStr)
      .lte('departure_time', endStr);

    // Apply origin filter
    query = query.eq('routes.origin.name', origin);
    
    // Apply destination filter  
    query = query.eq('routes.destination.name', destination);
>>>>>>> 93a879e (fix fitur)

    // Apply airline filter
    if (airline) {
      query = query.eq('transportations.name', airline);
    }

    // Apply price filters
    if (minPrice) {
      query = query.gte('price', parseInt(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice));
    }

    // Apply time of day filter
    if (timeOfDay && timeFilter.gte && timeFilter.lte) {
<<<<<<< HEAD
      const timeStart = `${startStr.slice(0, 10)}T${timeFilter.gte}:00.000Z`;
      const timeEnd = `${startStr.slice(0, 10)}T${timeFilter.lte}:59.999Z`;
      query = query.gte('departure_time', timeStart);
      query = query.lte('departure_time', timeEnd);
=======
      query = query.gte('departure_time', `${startStr.slice(0, 10)}T${timeFilter.gte}`);
      query = query.lte('departure_time', `${startStr.slice(0, 10)}T${timeFilter.lte}`);
>>>>>>> 93a879e (fix fitur)
    }

    // Apply sorting
    const sortColumn = sortBy === 'price' ? 'price' : 
                      sortBy === 'departure' ? 'departure_time' : 
                      sortBy === 'duration' ? 'arrival_time' : 'price';
    
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    // Handle error dari Supabase
    if (error) {
      console.error('[FLIGHTS API] Supabase Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Gagal mengambil data penerbangan',
        details: error.message
      } as ApiResponse, { status: 500 });
    }

    // Helper function to calculate duration
    const calculateDuration = (departure: string, arrival: string): string => {
      const dep = new Date(departure);
      const arr = new Date(arrival);
      const diffMs = arr.getTime() - dep.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}j ${diffMinutes}m`;
    };

    // Transform data with enhanced information
    const transformedData: FlightResponse[] = (data || []).map((item: any) => {
<<<<<<< HEAD
      const routes = Array.isArray(item.routes) ? item.routes[0] : item.routes;
      const transportations = Array.isArray(item.transportations) ? item.transportations[0] : item.transportations;
      const originCity = routes?.origin || {};
      const destCity = routes?.destination || {};
      
      const availableSeats = (item.total_seats || 0) - (item.booked_seats || 0);
=======
      const availableSeats = item.total_seats - item.booked_seats;
>>>>>>> 93a879e (fix fitur)
      const duration = calculateDuration(item.departure_time, item.arrival_time);
      
      return {
        id: item.id,
        waktu_berangkat: item.departure_time,
        waktu_tiba: item.arrival_time,
        harga: item.price,
        kursi_tersedia: Math.max(0, availableSeats),
        duration,
        stops: 0, // Direct flights for now
        transportasi: {
<<<<<<< HEAD
          nama: transportations?.name || '',
          tipe: transportations?.type || '',
          logo: transportations?.logo_url || ''
        },
        origin: {
          name: originCity?.name || origin,
          code: originCity?.code || origin.toUpperCase()
        },
        destination: {
          name: destCity?.name || destination,
          code: destCity?.code || destination.toUpperCase()
=======
          nama: item.transportations?.name || '',
          tipe: item.transportations?.type || '',
          logo: item.transportations?.logo_url || ''
        },
        origin: {
          name: item.routes?.origin?.name || '',
          code: item.routes?.origin?.code || ''
        },
        destination: {
          name: item.routes?.destination?.name || '',
          code: item.routes?.destination?.code || ''
>>>>>>> 93a879e (fix fitur)
        },
        aircraft_type: item.aircraft_type || 'Boeing 737',
        baggage_allowance: item.baggage_allowance || '20kg',
        meal_included: item.meal_included || false,
        wifi_available: item.wifi_available || false,
        entertainment: item.entertainment || false
      };
    });

    // Calculate pagination info
    const total = count || transformedData.length;
    const hasMore = (page * limit) < total;

    console.log(`[FLIGHTS API] Found ${transformedData.length} flights (page ${page}/${Math.ceil(total / limit)})`);

    // Return structured response
    return NextResponse.json({
      success: true,
      data: transformedData,
      meta: {
        total,
        page,
        limit,
        hasMore
      }
    } as ApiResponse);

  } catch (error: any) {
    console.error('[FLIGHTS API] Unexpected Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan server.',
      details: error.message
    } as ApiResponse, { status: 500 });
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 93a879e (fix fitur)
