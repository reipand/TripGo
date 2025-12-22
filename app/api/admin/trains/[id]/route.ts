import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// GET /api/admin/trains/[id] -> detail kereta + daftar gerbong
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { data: train, error } = await supabase
      .from('kereta')
      .select('id, code, name, operator, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil kereta', details: error.message }, { status: 500 });
    }
    if (!train) return NextResponse.json({ error: 'Kereta tidak ditemukan' }, { status: 404 });

    const { data: coaches, error: coachErr } = await supabase
      .from('gerbong')
      .select('id, train_id, coach_code, class_type, total_seats, layout, created_at, updated_at')
      .eq('train_id', id)
      .order('coach_code', { ascending: true });

    if (coachErr) {
      return NextResponse.json({ error: 'Gagal mengambil gerbong', details: coachErr.message }, { status: 500 });
    }

    return NextResponse.json({ ...train, wagons: coaches || [] });
  } catch (e: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan server', details: e.message }, { status: 500 });
  }
}

// PATCH /api/admin/trains/[id] -> update kereta dan sinkronisasi gerbong
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { code, name, operator, is_active, wagons } = body || {};

    if (!code && !name && !operator && typeof is_active === 'undefined' && !Array.isArray(wagons)) {
      return NextResponse.json({ error: 'Tidak ada perubahan' }, { status: 400 });
    }

    if (code || name || operator || typeof is_active !== 'undefined') {
      const { error: upErr } = await supabase
        .from('kereta')
        .update({ code, name, operator, is_active })
        .eq('id', id);
      if (upErr) return NextResponse.json({ error: 'Gagal update kereta', details: upErr.message }, { status: 500 });
    }

    // Sinkronisasi gerbong jika dikirim
    if (Array.isArray(wagons)) {
      for (const w of wagons) {
        if (w._action === 'insert') {
          const { error: insErr } = await supabase.from('gerbong').insert({
            train_id: id,
            coach_code: w.coach_code,
            class_type: w.class_type,
            total_seats: w.total_seats,
            layout: w.layout || {},
          });
          if (insErr) return NextResponse.json({ error: 'Gagal menambah gerbong', details: insErr.message }, { status: 500 });
        } else if (w._action === 'update' && w.id) {
          const { error: upCErr } = await supabase.from('gerbong').update({
            coach_code: w.coach_code,
            class_type: w.class_type,
            total_seats: w.total_seats,
            layout: w.layout || {},
          }).eq('id', w.id);
          if (upCErr) return NextResponse.json({ error: 'Gagal memperbarui gerbong', details: upCErr.message }, { status: 500 });
        } else if (w._action === 'delete' && w.id) {
          const { error: delErr } = await supabase.from('gerbong').delete().eq('id', w.id);
          if (delErr) return NextResponse.json({ error: 'Gagal menghapus gerbong', details: delErr.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan server', details: e.message }, { status: 500 });
  }
}

// DELETE /api/admin/trains/[id]
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { error } = await supabase.from('kereta').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Gagal menghapus kereta', details: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan server', details: e.message }, { status: 500 });
  }
}
