import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';
import { requireAdmin } from '@/app/lib/api-auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json({ error: authError }, { status: authError === 'Unauthorized' ? 401 : 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { data, error } = await supabase
      .from('bookings')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json({ error: authError }, { status: authError === 'Unauthorized' ? 401 : 403 });
  }

  try {
    const { id } = await params;
    const { error } = await supabase.from('bookings').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ message: 'Booking deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
