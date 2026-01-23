import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promotionId, bookingId, discountAmount } = body;

    if (!promotionId || !bookingId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Mulai transaksi
    const { data: promo, error: promoError } = await supabase
      .from('promotions')
      .select('usage_count')
      .eq('id', promotionId)
      .single();

    if (promoError) {
      console.error('Error fetching promotion:', promoError);
      return NextResponse.json(
        { success: false, error: 'Promotion not found' },
        { status: 404 }
      );
    }

    // Update usage count
    const { error: updateError } = await supabase
      .from('promotions')
      .update({ usage_count: promo.usage_count + 1 })
      .eq('id', promotionId);

    if (updateError) {
      console.error('Error updating promotion usage:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update promotion usage' },
        { status: 500 }
      );
    }

    // Catat penggunaan promo
    const { error: usageError } = await supabase
      .from('user_promo_usage')
      .insert({
        promotion_id: promotionId,
        booking_id: bookingId,
        discount_applied: discountAmount || 0
      });

    if (usageError) {
      console.error('Error recording promo usage:', usageError);
      // Tidak throw error karena promo sudah terpakai, hanya log
    }

    return NextResponse.json({
      success: true,
      message: 'Promo usage recorded successfully'
    });

  } catch (error: any) {
    console.error('Error in promo usage API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}