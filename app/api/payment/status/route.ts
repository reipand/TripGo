// app/api/payment/status/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const orderId = url.searchParams.get('order_id');
    
    console.log(`[Status API] Query params request:`, {
      orderId,
      allParams: Object.fromEntries(url.searchParams.entries())
    });

    if (!orderId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'order_id query parameter is required',
          example: '/api/payment/status?order_id=TG-123456789'
        },
        { status: 400 }
      );
    }

    // Redirect ke dynamic route
    return NextResponse.redirect(
      new URL(`/api/payment/status/${orderId}`, request.url)
    );
    
  } catch (error: any) {
    console.error('[Status API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal error', error: error.message },
      { status: 500 }
    );
  }
}