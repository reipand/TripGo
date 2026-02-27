import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// GET /api/admin/stations/[id] - Get single station
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stationId } = await context.params;

    const { data, error } = await supabase
      .from('stasiun')
      .select('*')
      .eq('id', stationId)
      .single();

    if (error) {
      console.error('Error fetching station:', error);
      return NextResponse.json(
        { error: 'Station not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ station: data });
  } catch (error) {
    console.error('Error in GET /api/admin/stations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/stations/[id] - Update station
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stationId } = await context.params;
    const body = await request.json();

    // Validate required fields
    if (!body.kode_stasiun || !body.nama_stasiun || !body.city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if station code already exists (excluding current station)
    const { data: existingStations } = await supabase
      .from('stasiun')
      .select('id')
      .eq('kode_stasiun', body.kode_stasiun)
      .neq('id', stationId);

    if (existingStations && existingStations.length > 0) {
      return NextResponse.json(
        { error: 'Station code already exists' },
        { status: 409 }
      );
    }

    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('stasiun')
      .update(updateData)
      .eq('id', stationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating station:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ station: data });
  } catch (error) {
    console.error('Error in PUT /api/admin/stations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/stations/[id] - Delete station
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stationId } = await context.params;

    // Check if station is used in routes
    const station = await supabase
      .from('stasiun')
      .select('nama_stasiun')
      .eq('id', stationId)
      .single();

    if (station.data) {
      const { count: routeCount } = await supabase
        .from('routes')
        .select('*', { count: 'exact', head: true })
        .or(`origin_station.eq.${station.data.nama_stasiun},destination_station.eq.${station.data.nama_stasiun}`);

      if (routeCount && routeCount > 0) {
        return NextResponse.json(
          { error: 'Cannot delete station that is being used in routes' },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from('stasiun')
      .delete()
      .eq('id', stationId);

    if (error) {
      console.error('Error deleting station:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/stations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
