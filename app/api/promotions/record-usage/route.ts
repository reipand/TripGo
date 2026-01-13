import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promo_id, user_id, booking_id, discount_applied } = body;

    if (!promo_id || !user_id || !booking_id || discount_applied === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Mulai transaction
    const { data: promo, error: promoError } = await supabase
      .from('promotions')
      .select('usage_count, usage_limit')
      .eq('id', promo_id)
      .single();

    if (promoError) {
      throw promoError;
    }

    // Cek apakah masih ada kuota
    if (promo.usage_limit > 0 && promo.usage_count >= promo.usage_limit) {
      return NextResponse.json(
        { error: 'Promo quota exceeded' },
        { status: 400 }
      );
    }

    // Update usage_count di promotions table
    const { error: updateError } = await supabase
      .from('promotions')
      .update({ usage_count: promo.usage_count + 1 })
      .eq('id', promo_id);

    if (updateError) {
      throw updateError;
    }

    // Insert ke user_promo_usage
    const { data: usageData, error: usageError } = await supabase
      .from('user_promo_usage')
      .insert({
        promotion_id: promo_id,
        user_id: user_id,
        booking_id: booking_id,
        discount_applied: discount_applied,
        usage_date: new Date().toISOString()
      })
      .select()
      .single();

    if (usageError) {
      throw usageError;
    }

    return NextResponse.json({
      success: true,
      usage: usageData,
      message: 'Promo usage recorded successfully'
    });

  } catch (error) {
    console.error('Error recording promo usage:', error);
    return NextResponse.json(
      { error: 'Failed to record promo usage' },
      { status: 500 }
    );
  }
}