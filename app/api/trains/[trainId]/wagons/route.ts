import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trainId: string }> }
) {
  try {
    const { trainId } = await params;
    const { data: wagons, error } = await supabase
      .from('gerbong')
      .select('*')
      .eq('train_id', trainId)
      .order('coach_code');

    if (error) throw error;

    return NextResponse.json(wagons);
  } catch (error) {
    return NextResponse.json(
      { error: 'Gagal mengambil data gerbong' },
      { status: 500 }
    );
  }
}
