import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// GET /api/admin/trains -> list kereta (+ optional ringkasan gerbong)
export async function GET() {
  try {
    const { data: trains, error } = await supabase
      .from('kereta')
      .select('id, code, name, operator, is_active, created_at, updated_at');

    if (error) {
      return NextResponse.json({ error: 'Gagal mengambil data kereta', details: error.message }, { status: 500 });
    }

    // Ambil jumlah gerbong per kereta (opsional)
    const trainIds = (trains || []).map((t: any) => t.id);
    let wagonsCount: Record<string, number> = {};

    if (trainIds.length > 0) {
      const { data: coaches, error: coachErr } = await supabase
        .from('gerbong')
        .select('id, train_id');
      if (coachErr) {
        return NextResponse.json({ error: 'Gagal mengambil data gerbong', details: coachErr.message }, { status: 500 });
      }
      for (const c of coaches || []) {
        wagonsCount[c.train_id] = (wagonsCount[c.train_id] || 0) + 1;
      }
    }

    const result = (trains || []).map((t: any) => ({
      ...t,
      wagons: wagonsCount[t.id] || 0,
    }));

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan server', details: e.message }, { status: 500 });
  }
}

// POST /api/admin/trains -> buat kereta baru (+opsional gerbong[])
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, operator, is_active = true, wagons } = body || {};

    if (!code || !name || !operator) {
      return NextResponse.json({ error: 'code, name, dan operator wajib diisi' }, { status: 400 });
    }

    const { data: train, error } = await supabase
      .from('kereta')
      .insert([{ code, name, operator, is_active }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Gagal membuat kereta', details: error.message }, { status: 500 });
    }

    // Jika ada gerbong yang disertakan
    if (Array.isArray(wagons) && wagons.length > 0) {
      const payload = wagons.map((w: any) => ({
        train_id: train.id,
        coach_code: w.coach_code,
        class_type: w.class_type, // 'ekonomi' | 'bisnis' | 'eksekutif' | 'premium'
        total_seats: w.total_seats,
        layout: w.layout || {},
      }));
      const { error: coachErr } = await supabase.from('gerbong').insert(payload);
      if (coachErr) {
        return NextResponse.json({ error: 'Kereta dibuat, namun gagal menambahkan gerbong', details: coachErr.message }, { status: 207 });
      }
    }

    return NextResponse.json(train, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan server', details: e.message }, { status: 500 });
  }
}
