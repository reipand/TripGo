// app/api/routes/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GUNAKAN SERVICE ROLE KEY
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // <-- INI YANG PENTING
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📝 Creating route with data:', body);
    
    // Validasi data minimal
    if (!body.schedule_id || !body.origin_station_id || !body.destination_station_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Insert menggunakan admin client (bypass RLS)
    const { data, error } = await supabaseAdmin
      .from('rute_kereta')
      .insert([{
        schedule_id: body.schedule_id,
        origin_station_id: body.origin_station_id,
        destination_station_id: body.destination_station_id,
        route_order: body.route_order || 1,
        departure_time: body.departure_time || '07:00',
        arrival_time: body.arrival_time || '10:00',
        duration_minutes: body.duration_minutes || 180
      }])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }
    
    console.log('✅ Route created successfully:', data);
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Route created successfully'
    });
    
  } catch (error: any) {
    console.error('💥 Error creating route:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create route',
        details: error.message,
        solution: 'Please disable RLS on rute_kereta table or use service role key'
      },
      { status: 500 }
    );
  }
}