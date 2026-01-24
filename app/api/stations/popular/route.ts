// /app/api/stations/popular/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('📡 Fetching popular stations from database...');
    
    const supabase = createClient();
    
    // Query ke tabel stasiun dengan kolom yang benar sesuai database
    // Hanya ambil kolom yang ada di tabel
    const { data: stasiunData, error: stasiunError } = await supabase
      .from('stasiun')
      .select('id, kode_stasiun, nama_stasiun, city, tipe, is_active')
      .eq('is_active', true)
      .order('kode_stasiun')
      .limit(8);

    if (stasiunError) {
      console.error('❌ Error querying stasiun table:', stasiunError);
      
      // Coba query alternatif tanpa filter is_active
      const { data: allStations, error: allError } = await supabase
        .from('stasiun')
        .select('id, kode_stasiun, nama_stasiun, city, tipe')
        .limit(8);
      
      if (allError) {
        console.error('❌ Error with alternative query:', allError);
        // Return fallback data
        return NextResponse.json(getFallbackStations());
      }
      
      if (allStations && allStations.length > 0) {
        console.log(`✅ Found ${allStations.length} stations (alternative query)`);
        const formattedStations = formatStations(allStations);
        return NextResponse.json(formattedStations);
      }
      
      // Return fallback jika tidak ada data
      return NextResponse.json(getFallbackStations());
    }

    if (!stasiunData || stasiunData.length === 0) {
      console.log('ℹ️ No active stations found in database');
      return NextResponse.json(getFallbackStations());
    }

    console.log(`✅ Found ${stasiunData.length} active stations`);
    
    // Format data
    const formattedStations = formatStations(stasiunData);
    
    return NextResponse.json(formattedStations);

  } catch (error: any) {
    console.error('❌ Error in popular stations API:', error);
    
    // Return fallback data
    return NextResponse.json(getFallbackStations());
  }
}

function formatStations(stations: any[]) {
  return stations.map((station: any) => ({
    id: station.id,
    code: station.kode_stasiun || '',
    name: station.nama_stasiun || `Stasiun ${station.kode_stasiun}`,
    city: station.city || '',
    type: station.tipe || 'regular',
    is_active: station.is_active !== false
  }));
}

// Fallback data jika database kosong atau error
function getFallbackStations() {
  return [
    {
      id: '1',
      code: 'GMR',
      name: 'Stasiun Gambir',
      city: 'Jakarta',
      type: 'utama',
      is_active: true
    },
    {
      id: '2',
      code: 'BD',
      name: 'Stasiun Bandung',
      city: 'Bandung',
      type: 'utama',
      is_active: true
    },
    {
      id: '3',
      code: 'SBY',
      name: 'Stasiun Surabaya Gubeng',
      city: 'Surabaya',
      type: 'utama',
      is_active: true
    },
    {
      id: '4',
      code: 'YK',
      name: 'Stasiun Yogyakarta',
      city: 'Yogyakarta',
      type: 'utama',
      is_active: true
    },
    {
      id: '5',
      code: 'SMG',
      name: 'Stasiun Semarang Tawang',
      city: 'Semarang',
      type: 'utama',
      is_active: true
    },
    {
      id: '6',
      code: 'SLO',
      name: 'Stasiun Solo Balapan',
      city: 'Solo',
      type: 'utama',
      is_active: true
    },
    {
      id: '7',
      code: 'ML',
      name: 'Stasiun Malang',
      city: 'Malang',
      type: 'besar',
      is_active: true
    },
    {
      id: '8',
      code: 'CRB',
      name: 'Stasiun Cirebon',
      city: 'Cirebon',
      type: 'besar',
      is_active: true
    }
  ];
}