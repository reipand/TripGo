import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// GET /api/admin/stations - Get all stations with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('stasiun')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`kode_stasiun.ilike.%${search}%,nama_stasiun.ilike.%${search}%,city.ilike.%${search}%`);
    }

    if (city && city !== 'all') {
      query = query.eq('city', city);
    }

    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (status && status !== 'all') {
      query = query.eq('is_active', status === 'active');
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error('Error fetching stations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stations: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /api/admin/stations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/stations - Create new station
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.kode_stasiun || !body.nama_stasiun || !body.city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if station code already exists
    const { data: existingStations } = await supabase
      .from('stasiun')
      .select('id')
      .eq('kode_stasiun', body.kode_stasiun);

    if (existingStations && existingStations.length > 0) {
      return NextResponse.json(
        { error: 'Station code already exists' },
        { status: 409 }
      );
    }

    const stationData = {
      ...body,
      tipe: body.type, // Ensure both fields are set
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('stasiun')
      .insert(stationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating station:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ station: data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/stations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}