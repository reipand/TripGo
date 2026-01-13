import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      );
    }

    const { data: promo, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('promo_code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !promo) {
      return NextResponse.json(
        { promo: null, message: 'Promo code not found' },
        { status: 404 }
      );
    }

    // Cek tanggal berlaku
    const now = new Date();
    const startDate = new Date(promo.start_date);
    const endDate = new Date(promo.end_date);

    if (now < startDate) {
      return NextResponse.json({
        promo,
        valid: false,
        message: 'Promo belum berlaku'
      });
    }

    if (now > endDate) {
      return NextResponse.json({
        promo,
        valid: false,
        message: 'Promo telah kadaluarsa'
      });
    }

    // Cek kuota
    if (promo.usage_limit > 0 && promo.usage_count >= promo.usage_limit) {
      return NextResponse.json({
        promo,
        valid: false,
        message: 'Kuota promo telah habis'
      });
    }

    return NextResponse.json({
      promo,
      valid: true,
      message: 'Promo code is valid'
    });

  } catch (error) {
    console.error('Error validating promo:', error);
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}