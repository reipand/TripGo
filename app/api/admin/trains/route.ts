import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('kereta')
      .select('*', { count: 'exact' });

    if (type && type !== 'all') {
      query = query.eq('tipe_kereta', type);
    }

    if (status && status !== 'all') {
      query = query.eq('is_active', status === 'active');
    }

    if (search) {
      query = query.or(`
        kode_kereta.ilike.%${search}%,
        nama_kereta.ilike.%${search}%,
        operator.ilike.%${search}%
      `);
    }

    query = query.order('created_at', { ascending: false });

    const { data, count, error } = await query.range(from, to);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error: any) {
    console.error('Trains API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['kode_kereta', 'nama_kereta', 'operator', 'tipe_kereta'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Check if train code already exists
    const { data: existingTrain } = await supabase
      .from('kereta')
      .select('kode_kereta')
      .eq('kode_kereta', body.kode_kereta)
      .single();

    if (existingTrain) {
      return NextResponse.json(
        { error: 'Train code already exists' },
        { status: 400 }
      );
    }

    const trainData = {
      ...body,
      is_active: body.is_active !== undefined ? body.is_active : true,
      fasilitas: body.fasilitas || {},
      jumlah_kursi: body.jumlah_kursi || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('kereta')
      .insert([trainData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: 'Train created successfully'
    });

  } catch (error: any) {
    console.error('Create train API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}