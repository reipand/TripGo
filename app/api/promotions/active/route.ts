import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching promotions...');
    const currentDate = new Date().toISOString();
    console.log('Current date:', currentDate);
    
    const { data: promotions, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', currentDate)
      .gte('end_date', currentDate)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Promotions found:', promotions?.length || 0);
    
    return NextResponse.json({
      success: true,
      promotions: promotions || [],
      count: promotions?.length || 0
    });
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch promotions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}