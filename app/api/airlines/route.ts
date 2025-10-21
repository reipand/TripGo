import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

interface AirlineResponse {
  success: boolean;
  data?: {
    name: string;
    code: string;
    logo_url: string;
    country: string;
    fleet_size: number;
    founded_year: number;
    hub_airports: string[];
  }[];
  error?: string;
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('transportations')
      .select(`
        name,
        code,
        logo_url,
        country,
        fleet_size,
        founded_year,
        hub_airports
      `)
      .eq('type', 'Pesawat')
      .order('name');

    if (error) {
      console.error('[AIRLINES API] Supabase Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Gagal mengambil data maskapai',
        details: error.message
      } as AirlineResponse, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    } as AirlineResponse);

  } catch (error: any) {
    console.error('[AIRLINES API] Unexpected Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan server.',
      details: error.message
    } as AirlineResponse, { status: 500 });
  }
}
