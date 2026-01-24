// /app/api/stations/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim().toUpperCase() || '';
    const limit = parseInt(searchParams.get('limit') || '15');

    console.log(`[STATIONS SEARCH] Query: "${query}"`);

    if (!query || query.length < 1) {
      return NextResponse.json([]);
    }

    // Multi-condition search
    // Coba beberapa pendekatan berbeda untuk mencari
    const searchPattern = `%${query}%`;
    
    // Pendekatan 1: Cari dengan multiple conditions
    const { data: stations, error } = await supabase
      .from('stasiun')
      .select('id, kode_stasiun, nama_stasiun, city, tipe')
      .or(`kode_stasiun.ilike.${searchPattern},nama_stasiun.ilike.${searchPattern},city.ilike.${searchPattern}`)
      .eq('is_active', true)
      .limit(limit);

    if (error) {
      console.error('❌ Search error:', error);
      
      // Pendekatan 2: Coba tanpa .or() syntax
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('stasiun')
        .select('id, kode_stasiun, nama_stasiun, city, tipe')
        .eq('is_active', true)
        .limit(limit);
      
      if (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return NextResponse.json([]);
      }
      
      // Filter secara manual di client side
      if (fallbackData) {
        const filteredStations = fallbackData.filter(station => 
          (station.kode_stasiun && station.kode_stasiun.includes(query)) ||
          (station.nama_stasiun && station.nama_stasiun.toLowerCase().includes(query.toLowerCase())) ||
          (station.city && station.city.toLowerCase().includes(query.toLowerCase()))
        );
        
        return NextResponse.json(formatStationData(filteredStations.slice(0, limit)));
      }
      
      return NextResponse.json([]);
    }

    if (!stations || stations.length === 0) {
      console.log(`ℹ️ No stations found for query: ${query}`);
      return NextResponse.json([]);
    }

    console.log(`✅ Found ${stations.length} stations for query: ${query}`);
    
    return NextResponse.json(formatStationData(stations));

  } catch (error: any) {
    console.error('❌ Station search API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

function formatStationData(stations: any[]) {
  return stations.map(station => ({
    id: station.id,
    code: station.kode_stasiun || '',
    name: station.nama_stasiun || `Stasiun ${station.kode_stasiun}`,
    city: station.city || '',
    type: station.tipe || 'regular'
  }));
}