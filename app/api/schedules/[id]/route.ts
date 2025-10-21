import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    if (!id) {
        return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    try {

        const scheduleDetailPromise = supabase
            .from('schedules')
            .select(`
                id,
                waktu_berangkat,
                waktu_tiba,
                harga,
                stok_kursi,
                routes (kota_asal, kota_tujuan),
                transportations (nama_transportasi, tipe)
            `)
            .eq('id', id)
            .single(); 


        const bookedSeatsPromise = supabase
            .from('booking_seat_segments')
            .select('nomor_kursi, rute_asal_id, rute_tujuan_id')
            .eq('jadwal_id', id);

  
        const [scheduleResult, bookedSeatsResult] = await Promise.all([
            scheduleDetailPromise,
            bookedSeatsPromise
        ]);

        if (scheduleResult.error) throw scheduleResult.error;
        if (bookedSeatsResult.error) throw bookedSeatsResult.error;

        if (!scheduleResult.data) {
             return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }


        const responseData = {
            ...scheduleResult.data,
            booked_seats: bookedSeatsResult.data || []
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('Supabase query error:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule details', details: error.message }, { status: 500 });
    }
}
