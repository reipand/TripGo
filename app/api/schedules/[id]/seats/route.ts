import { NextRequest, NextResponse } from 'next/server';
import { TransitService } from '@/app/services/transitService';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: scheduleId } = await context.params;
        const { searchParams } = new URL(request.url);
        const departure = searchParams.get('departure');
        const arrival = searchParams.get('arrival');

        if (!scheduleId) {
            return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(scheduleId) && scheduleId.startsWith('dummy')) {
            console.log('⚠️ Using dummy schedule ID, returning fallback empty wagons');
            return NextResponse.json({
                success: true,
                data: { wagons: [] }
            });
        }

        // 1. Get basic seat data
        const { data: coaches, error: coachErr } = await supabase
            .from('gerbong')
            .select(`
        id, 
        coach_code, 
        class_type, 
        total_seats, 
        layout,
        train_id
      `)
            .order('coach_code', { ascending: true });

        if (coachErr) throw coachErr;

        // Filter coaches for the train in this schedule
        const { data: schedule } = await supabase
            .from('jadwal_kereta')
            .select('train_id')
            .eq('id', scheduleId)
            .single();

        const filteredCoaches = coaches.filter((c: any) => c.train_id === schedule?.train_id);

        // 2. Get all seats
        const { data: allSeats, error: seatErr } = await supabase
            .from('train_seats')
            .select('*')
            .eq('schedule_id', scheduleId);

        if (seatErr) throw seatErr;

        // 3. If departure and arrival are provided, check segmented availability
        let seatAvailabilityMap = new Map<string, boolean>();

        if (departure && arrival) {
            try {
                const departureOrder = await TransitService.getStationOrder(scheduleId, departure);
                const arrivalOrder = await TransitService.getStationOrder(scheduleId, arrival);

                if (departureOrder !== null && arrivalOrder !== null) {
                    for (const seat of (allSeats as any[])) {
                        const isAvailable = await TransitService.checkSeatAvailability(
                            scheduleId,
                            seat.id,
                            departureOrder,
                            arrivalOrder
                        );
                        seatAvailabilityMap.set(seat.id, isAvailable);
                    }
                }
            } catch (err) {
                console.error('Error checking segmented availability:', err);
            }
        }

        // 4. Format response
        const wagons = filteredCoaches.map((coach: any) => ({
            coach_code: coach.coach_code,
            class_type: coach.class_type,
            total_seats: coach.total_seats,
            available_seats: (allSeats as any[]).filter((s: any) => s.coach_id === coach.id && (seatAvailabilityMap.has(s.id) ? seatAvailabilityMap.get(s.id) : s.status === 'available')).length,
            seats: (allSeats as any[])
                .filter((s: any) => s.coach_id === coach.id)
                .map((s: any) => ({
                    id: s.id,
                    seat_number: s.seat_number,
                    status: seatAvailabilityMap.has(s.id)
                        ? (seatAvailabilityMap.get(s.id) ? 'available' : 'booked')
                        : s.status
                }))
        }));

        return NextResponse.json({
            success: true,
            data: {
                wagons
            }
        });

    } catch (error: any) {
        console.error('Error in /api/schedules/[id]/seats:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
