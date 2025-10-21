import { type NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

interface BookingPayload {
    user_id: string; 
    schedule_id: number;
    total_price: number;
    passengers: { nama_penumpang: string; nomor_identitas: string }[];
    seats: { nomor_kursi: string; rute_asal_id: number; rute_tujuan_id: number }[];
}

export async function POST(request: NextRequest) {
    try {
        const body: BookingPayload = await request.json();

  
        const { user_id, schedule_id, total_price, passengers, seats } = body;
        if (!user_id || !schedule_id || !total_price || !passengers || !seats || passengers.length === 0 || seats.length === 0) {
            return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
        }

        const { data, error } = await supabase.rpc('create_new_booking', {
            p_user_id: user_id,
            p_schedule_id: schedule_id,
            p_total_price: total_price,
            p_passengers: JSON.stringify(passengers), 
        });

        if (error) {
     
            throw error;
        }

 
        return NextResponse.json({ 
            message: 'Booking berhasil dibuat!',
            booking_id: data 
        }, { status: 201 });

    } catch (error: any) {
        console.error('API booking error:', error);
        return NextResponse.json({ error: 'Gagal membuat pemesanan', details: error.message }, { status: 500 });
    }
}
