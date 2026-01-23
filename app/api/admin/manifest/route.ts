import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

/**
 * GET /api/admin/manifest
 * Fetch passenger manifest with advanced filtering
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const scheduleId = searchParams.get('scheduleId');
        const trainId = searchParams.get('trainId');
        const date = searchParams.get('date');
        const status = searchParams.get('status') || 'confirmed';

        const supabase = createClient();

        // 1. Build query for penumpang joined with bookings and details
        let query = supabase
            .from('penumpang')
            .select(`
        id,
        nama,
        nik,
        email,
        phone,
        booking_id,
        booking:booking_id!inner (
          id,
          booking_code,
          status,
          schedule_id,
          origin,
          destination,
          customer_name:passenger_name,
          jadwal:schedule_id!inner (
            id,
            travel_date,
            departure_time,
            arrival_time,
            train_id,
            kereta:train_id!inner (
              id,
              nama_kereta,
              kode_kereta,
              tipe_kereta
            )
          )
        ),
        details:detail_pemesanan (
          id,
          seat_id,
          kursi:seat_id (
            seat_number,
            gerbong:coach_id (
              coach_code,
              class_type
            )
          )
        )
      `);

        // 2. Apply filters
        if (scheduleId) {
            query = query.eq('booking.schedule_id', scheduleId);
        }

        if (trainId) {
            query = query.eq('booking.jadwal.train_id', trainId);
        }

        if (date) {
            query = query.eq('booking.jadwal.travel_date', date);
        }

        if (status !== 'all') {
            query = query.eq('booking.status', status);
        }

        // 3. Execute query
        const { data, error } = await query.order('nama', { ascending: true });

        if (error) {
            console.error('Manifest query error:', error);
            return NextResponse.json(
                { success: false, error: 'Database error', details: error.message },
                { status: 500 }
            );
        }

        // 4. Post-process data to flatten structure for UI
        const manifest = data?.map((p: any) => {
            const seatDetail = p.details?.[0]?.kursi;

            return {
                id: p.id,
                name: p.nama,
                nik: p.nik,
                email: p.email,
                phone: p.phone,
                bookingCode: p.booking?.booking_code,
                bookingStatus: p.booking?.status,
                origin: p.booking?.origin,
                destination: p.booking?.destination,
                trainName: p.booking?.jadwal?.kereta?.nama_kereta,
                trainCode: p.booking?.jadwal?.kereta?.kode_kereta,
                travelDate: p.booking?.jadwal?.travel_date,
                departureTime: p.booking?.jadwal?.departure_time,
                seatNumber: seatDetail?.seat_number || 'N/A',
                coach: seatDetail?.gerbong?.coach_code || 'N/A',
                class: seatDetail?.gerbong?.class_type || 'N/A'
            };
        });

        return NextResponse.json({
            success: true,
            data: manifest,
            count: manifest?.length || 0
        });

    } catch (err: any) {
        console.error('Error in manifest API:', err);
        return NextResponse.json(
            { success: false, error: 'Internal server error', message: err.message },
            { status: 500 }
        );
    }
}
