import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

interface PriceAlertResponse {
  success: boolean;
  data?: {
    id: string;
    origin: string;
    destination: string;
    target_price: number;
    current_price: number;
    is_active: boolean;
    created_at: string;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, target_price, user_id } = body;

    // Validate required fields
    if (!origin || !destination || !target_price || !user_id) {
      return NextResponse.json({
        success: false,
        error: 'Parameter origin, destination, target_price, dan user_id diperlukan'
      } as PriceAlertResponse, { status: 400 });
    }

    // Check if price alert already exists
    const { data: existingAlert } = await supabase
      .from('price_alerts')
      .select('id')
      .eq('user_id', user_id)
      .eq('origin', origin)
      .eq('destination', destination)
      .eq('is_active', true)
      .single();

    if (existingAlert) {
      return NextResponse.json({
        success: false,
        error: 'Price alert sudah ada untuk rute ini'
      } as PriceAlertResponse, { status: 409 });
    }

    // Create new price alert
    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id,
        origin,
        destination,
        target_price,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('[PRICE ALERTS API] Supabase Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Gagal membuat price alert',
        details: error.message
      } as PriceAlertResponse, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        origin: data.origin,
        destination: data.destination,
        target_price: data.target_price,
        current_price: 0, // Will be updated by background job
        is_active: data.is_active,
        created_at: data.created_at
      }
    } as PriceAlertResponse);

  } catch (error: any) {
    console.error('[PRICE ALERTS API] Unexpected Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan server.',
      details: error.message
    } as PriceAlertResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return NextResponse.json({
      success: false,
      error: 'Parameter user_id diperlukan'
    } as PriceAlertResponse, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('price_alerts')
      .select(`
        id,
        origin,
        destination,
        target_price,
        current_price,
        is_active,
        created_at
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PRICE ALERTS API] Supabase Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Gagal mengambil price alerts',
        details: error.message
      } as PriceAlertResponse, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || []
    } as PriceAlertResponse);

  } catch (error: any) {
    console.error('[PRICE ALERTS API] Unexpected Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan server.',
      details: error.message
    } as PriceAlertResponse, { status: 500 });
  }
}
