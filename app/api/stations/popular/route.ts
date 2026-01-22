// app/api/stations/popular/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer'; // Ganti impor ini

export async function GET(request: NextRequest) {
  try {
    console.log('📡 Fetching popular stations from database...');
    
    // Gunakan createClient dari supabaseServer
    const supabase = createClient(); // <-- Ini yang penting!
    
    // Query ke tabel stasiun dengan kolom yang benar sesuai database
    const { data: stasiunData, error: stasiunError } = await supabase
      .from('stasiun')
      .select('id, kode_stasiun, nama_stasiun, city, tipe')
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
        return NextResponse.json({
          success: true,
          data: getFallbackStations(),
          message: 'Using fallback stations data'
        });
      }
      
      if (allStations && allStations.length > 0) {
        console.log(`✅ Found ${allStations.length} stations (alternative query)`);
        const transformedStations = transformStationData(allStations);
        return NextResponse.json({
          success: true,
          data: transformedStations
        });
      }
      
      // Return fallback jika tidak ada data
      return NextResponse.json({
        success: true,
        data: getFallbackStations(),
        message: 'No stations found in database'
      });
    }

    if (!stasiunData || stasiunData.length === 0) {
      console.log('ℹ️ No active stations found in database');
      return NextResponse.json({
        success: true,
        data: getFallbackStations(),
        message: 'No active stations found'
      });
    }

    console.log(`✅ Found ${stasiunData.length} active stations`);
    
    // Transform data sesuai format yang diharapkan
    const transformedStations = transformStationData(stasiunData);
    
    return NextResponse.json({
      success: true,
      data: transformedStations,
      count: transformedStations.length
    });

  } catch (error: any) {
    console.error('❌ Error in popular stations API:', error);
    
    // Return fallback data dengan structure yang konsisten
    return NextResponse.json({
      success: true,
      data: getFallbackStations(),
      message: 'Using fallback stations data',
      error: error.message
    });
  }
}

// Helper function untuk transform data stasiun
function transformStationData(stations: any[]) {
  return stations.map((station: any) => {
    // Tentukan popularitas berdasarkan kode stasiun
    let popularity = 50; // Default
    
    // Stasiun utama lebih populer
    const popularStations = ['BD', 'GMR', 'SBY', 'YK', 'SLO', 'SMG'];
    if (popularStations.includes(station.kode_stasiun)) {
      popularity = 80 + Math.floor(Math.random() * 20);
    }
    
    // Ibu kota provinsi lebih populer
    const capitalCities = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang'];
    if (capitalCities.includes(station.city)) {
      popularity += 10;
    }
    
    return {
      id: station.id,
      code: station.kode_stasiun || station.code || '',
      name: station.nama_stasiun || station.name || `Stasiun ${station.kode_stasiun}`,
      city: station.city || '',
      region: getRegionFromCity(station.city),
      type: station.tipe || 'regular',
      popularity: Math.min(popularity, 100) // Max 100
    };
  });
}

// Helper function untuk menentukan region berdasarkan kota
function getRegionFromCity(city: string): string {
  const regions: Record<string, string> = {
    'Jakarta': 'DKI Jakarta',
    'Bandung': 'Jawa Barat',
    'Surabaya': 'Jawa Timur',
    'Yogyakarta': 'DI Yogyakarta',
    'Semarang': 'Jawa Tengah',
    'Solo': 'Jawa Tengah',
    'Malang': 'Jawa Timur',
    'Cirebon': 'Jawa Barat',
    'Tangerang': 'Banten',
    'Bekasi': 'Jawa Barat',
    'Depok': 'Jawa Barat',
    'Bogor': 'Jawa Barat',
    'Purwokerto': 'Jawa Tengah',
    'Madiun': 'Jawa Timur',
    'Kediri': 'Jawa Timur',
    'Jember': 'Jawa Timur'
  };
  
  return regions[city] || 'Jawa';
}

// Fallback data jika database kosong atau error
function getFallbackStations() {
  return [
    {
      id: 'bd',
      code: 'BD',
      name: 'Stasiun Bandung',
      city: 'Bandung',
      region: 'Jawa Barat',
      type: 'utama',
      popularity: 95
    },
    {
      id: 'gmr',
      code: 'GMR',
      name: 'Stasiun Gambir',
      city: 'Jakarta',
      region: 'DKI Jakarta',
      type: 'utama',
      popularity: 98
    },
    {
      id: 'sby',
      code: 'SBY',
      name: 'Stasiun Surabaya Gubeng',
      city: 'Surabaya',
      region: 'Jawa Timur',
      type: 'utama',
      popularity: 92
    },
    {
      id: 'yk',
      code: 'YK',
      name: 'Stasiun Yogyakarta',
      city: 'Yogyakarta',
      region: 'DI Yogyakarta',
      type: 'utama',
      popularity: 90
    },
    {
      id: 'slo',
      code: 'SLO',
      name: 'Stasiun Solo Balapan',
      city: 'Solo',
      region: 'Jawa Tengah',
      type: 'utama',
      popularity: 85
    },
    {
      id: 'smg',
      code: 'SMG',
      name: 'Stasiun Semarang Tawang',
      city: 'Semarang',
      region: 'Jawa Tengah',
      type: 'utama',
      popularity: 88
    },
    {
      id: 'mlg',
      code: 'MLG',
      name: 'Stasiun Malang',
      city: 'Malang',
      region: 'Jawa Timur',
      type: 'utama',
      popularity: 82
    },
    {
      id: 'crb',
      code: 'CRB',
      name: 'Stasiun Cirebon',
      city: 'Cirebon',
      region: 'Jawa Barat',
      type: 'perantara',
      popularity: 78
    }
  ];
}