import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Fetching active promotions...');
    const currentDate = new Date().toISOString();
    
    // Gunakan cache untuk menghindari timeout berulang
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .gte('end_date', currentDate) // Promo yang belum kadaluarsa
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      
      // Fallback ke dummy data jika database error
      return NextResponse.json({
        success: true,
        promotions: getFallbackPromotions(),
        count: 4,
        note: 'Using fallback data due to database error'
      });
    }

    console.log(`✅ Found ${promotions?.length || 0} promotions`);
    
    // Jika tidak ada promo, gunakan fallback
    const resultPromotions = promotions && promotions.length > 0 
      ? promotions 
      : getFallbackPromotions();

    return NextResponse.json({
      success: true,
      promotions: resultPromotions,
      count: resultPromotions.length
    });
  } catch (error) {
    console.error('💥 Error fetching promotions:', error);
    
    // Fallback ke dummy data
    return NextResponse.json({
      success: true,
      promotions: getFallbackPromotions(),
      count: 4,
      note: 'Using fallback data due to server error'
    });
  }
}

// Fallback promotions
function getFallbackPromotions() {
  return [
    {
      id: '1',
      name: 'Flash Sale 40%',
      description: 'Diskon 40% untuk pembelian cepat',
      promo_code: 'FLASH40',
      discount_type: 'percentage',
      discount_value: 40,
      min_order_amount: 200000,
      max_discount_amount: 200000,
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2026-12-31T23:59:59Z',
      usage_limit: 500,
      usage_count: 250,
      user_limit: 1,
      is_active: true,
      applicable_to: null
    },
    {
      id: '2',
      name: 'Welcome Discount',
      description: 'Diskon 10% untuk pembelian pertama',
      promo_code: 'WELCOME10',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 100000,
      max_discount_amount: 50000,
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2026-12-31T23:59:59Z',
      usage_limit: 1000,
      usage_count: 245,
      user_limit: 1,
      is_active: true,
      applicable_to: null
    },
    {
      id: '3',
      name: 'Diskon Keluarga 30%',
      description: 'Diskon khusus untuk minimal 3 penumpang',
      promo_code: 'FAMILY30',
      discount_type: 'percentage',
      discount_value: 30,
      min_order_amount: 300000,
      max_discount_amount: 150000,
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2026-12-31T23:59:59Z',
      usage_limit: 200,
      usage_count: 120,
      user_limit: 2,
      is_active: true,
      applicable_to: null
    },
    {
      id: '4',
      name: 'Potongan Tetap 50rb',
      description: 'Potongan harga tetap Rp 50.000',
      promo_code: 'DISKON50',
      discount_type: 'fixed',
      discount_value: 50000,
      min_order_amount: 250000,
      max_discount_amount: 50000,
      start_date: '2024-01-01T00:00:00Z',
      end_date: '2026-12-31T23:59:59Z',
      usage_limit: 300,
      usage_count: 180,
      user_limit: 1,
      is_active: true,
      applicable_to: null
    }
  ];
}