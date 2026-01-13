import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const promoId = searchParams.get('promoId');
    
    if (!userId || !promoId) {
      return NextResponse.json(
        { error: 'User ID and Promo ID are required' },
        { status: 400 }
      );
    }

    // Hitung penggunaan promo oleh user
    const { data: usage, error } = await supabase
      .from('user_promo_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('promotion_id', promoId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      usage_count: usage?.length || 0,
      usages: usage || []
    });

  } catch (error) {
    console.error('Error fetching user promo usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user promo usage' },
      { status: 500 }
    );
  }
}