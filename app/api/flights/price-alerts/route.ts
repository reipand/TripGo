import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

interface PriceAlert {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  target_price: number;
  current_price: number;
  is_active: boolean;
  created_at: string;
}

interface PriceAlertResponse {
  success: boolean;
  data?: PriceAlert | PriceAlert[];
  error?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { origin, destination, target_price, user_id } = body;

    // Validate required fields
    if (!origin || !destination || !target_price || !user_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Parameter origin, destination, target_price, dan user_id diperlukan'
      } as PriceAlertResponse, { status: 400 });
    }

    // Validate target_price is a positive number
    if (isNaN(target_price) || target_price <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid target price',
        message: 'Harga target harus berupa angka positif'
      } as PriceAlertResponse, { status: 400 });
    }

    // Check if price alert already exists (active ones only)
    const { data: existingAlert, error: checkError } = await supabase
      .from('price_alerts')
      .select('id')
      .eq('user_id', user_id)
      .eq('origin', origin)
      .eq('destination', destination)
      .eq('is_active', true)
      .limit(1);

    if (checkError) {
      console.error('[PRICE ALERTS API] Check existing error:', checkError);
    }

    if (existingAlert && existingAlert.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Duplicate price alert',
        message: 'Price alert sudah ada untuk rute ini'
      } as PriceAlertResponse, { status: 409 });
    }

    // Get current price for this route (you might need to fetch from schedules/routes table)
    let current_price = 0;
    try {
      const { data: latestFlight } = await supabase
        .from('schedules')
        .select('price')
        .eq('routes.origin.name', origin)
        .eq('routes.destination.name', destination)
        .eq('transportations.type', 'Pesawat')
        .order('departure_time', { ascending: false })
        .limit(1)
        .single();

      current_price = latestFlight?.price || 0;
    } catch (e) {
      console.warn('[PRICE ALERTS API] Could not fetch current price:', e);
      // Continue without current price
    }

    // Create new price alert
    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id,
        origin,
        destination,
        target_price,
        current_price,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('[PRICE ALERTS API] Supabase Insert Error:', error);
      
      // Handle specific Supabase errors
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({
          success: false,
          error: 'Duplicate entry',
          message: 'Price alert sudah ada untuk rute ini'
        } as PriceAlertResponse, { status: 409 });
      }
      
      if (error.code === '23503') { // Foreign key violation
        return NextResponse.json({
          success: false,
          error: 'Invalid user',
          message: 'User ID tidak valid'
        } as PriceAlertResponse, { status: 400 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Gagal membuat price alert',
        details: error.message
      } as PriceAlertResponse, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Price alert berhasil dibuat'
    } as PriceAlertResponse, { status: 201 });

  } catch (error: any) {
    console.error('[PRICE ALERTS API] Unexpected Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'Terjadi kesalahan server'
    } as PriceAlertResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const user_id = searchParams.get('user_id');
  const is_active = searchParams.get('is_active');

  if (!user_id) {
    return NextResponse.json({
      success: false,
      error: 'Missing user_id',
      message: 'Parameter user_id diperlukan'
    } as PriceAlertResponse, { status: 400 });
  }

  try {
    let query = supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', user_id);

    // Filter by active status if provided
    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[PRICE ALERTS API] Supabase Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Gagal mengambil price alerts'
      } as PriceAlertResponse, { status: 500 });
    }

    // Update current prices if data exists
    if (data && data.length > 0) {
      const updatedAlerts = await Promise.all(
        data.map(async (alert) => {
          try {
            const { data: latestFlight } = await supabase
              .from('schedules')
              .select('price')
              .eq('routes.origin.name', alert.origin)
              .eq('routes.destination.name', alert.destination)
              .eq('transportations.type', 'Pesawat')
              .order('departure_time', { ascending: false })
              .limit(1)
              .single();

            if (latestFlight && latestFlight.price !== alert.current_price) {
              // Update current price in database
              await supabase
                .from('price_alerts')
                .update({ current_price: latestFlight.price })
                .eq('id', alert.id);
                
              return { ...alert, current_price: latestFlight.price };
            }
          } catch (e) {
            console.error(`[PRICE ALERTS API] Error updating price for alert ${alert.id}:`, e);
          }
          return alert;
        })
      );

      return NextResponse.json({
        success: true,
        data: updatedAlerts
      } as PriceAlertResponse);
    }

    return NextResponse.json({
      success: true,
      data: data || []
    } as PriceAlertResponse);

  } catch (error: any) {
    console.error('[PRICE ALERTS API] Unexpected Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'Terjadi kesalahan server'
    } as PriceAlertResponse, { status: 500 });
  }
}

// Add DELETE method for removing price alerts
export async function DELETE(request: NextRequest) {
  try {
    const { id, user_id } = await request.json();

    if (!id || !user_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Parameter id dan user_id diperlukan'
      } as PriceAlertResponse, { status: 400 });
    }

    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      console.error('[PRICE ALERTS API] Delete Error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database error',
        message: 'Gagal menghapus price alert'
      } as PriceAlertResponse, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Price alert berhasil dihapus'
    } as PriceAlertResponse);

  } catch (error: any) {
    console.error('[PRICE ALERTS API] Delete Unexpected Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: 'Terjadi kesalahan server'
    } as PriceAlertResponse, { status: 500 });
  }
}