import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

interface AirportResponse {
  success: boolean;
  data?: {
    name: string;
    code: string;
    city: string;
    country: string;
    timezone: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  }[];
  error?: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    let supabaseQuery = supabase
      .from('cities')
      .select(`
        name,
        code,
        city,
        country,
        timezone,
        latitude,
        longitude
      `)
      .limit(limit);

    // Add search filter if query provided
    if (query && query.length > 0) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,code.ilike.%${query}%,city.ilike.%${query}%`);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('[AIRPORTS API] Supabase Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Gagal mengambil data bandara',
        details: error.message
      } as AirportResponse, { status: 500 });
    }

    // Transform data
    const transformedData = (data || []).map(airport => ({
      name: airport.name,
      code: airport.code,
      city: airport.city,
      country: airport.country,
      timezone: airport.timezone,
      coordinates: {
        latitude: airport.latitude,
        longitude: airport.longitude
      }
    }));

    return NextResponse.json({
      success: true,
      data: transformedData
    } as AirportResponse);

  } catch (error: any) {
    console.error('[AIRPORTS API] Unexpected Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan server.',
      details: error.message
    } as AirportResponse, { status: 500 });
  }
}
