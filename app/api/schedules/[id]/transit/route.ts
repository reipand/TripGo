import { supabase as supabaseClient, createClient } from '@/app/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params promise first
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    console.log('📋 Transit API called for:', { id, origin, destination });

    // Debug: Check if environment variables are loaded
    console.log('🔧 Debug - Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('🔧 Debug - Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

    // Validasi minimal
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Schedule ID required' },
        { status: 400 }
      );
    }

    // Handle dummy schedule case gracefully
    if (id === 'dummy-schedule-1' || id === 'undefined' || id.includes('dummy')) {
      console.log('📋 Returning dummy data for test schedule:', id);
      return NextResponse.json({
        success: true,
        transitRoutes: [
          {
            id: 'transit-1',
            schedule_id: id,
            station_id: 'station-jkt',
            station_name: 'Jakarta Kota',
            station_code: 'JKT',
            city: 'Jakarta',
            station_order: 1,
            arrival_time: '10:30',
            departure_time: '10:45',
            waiting_minutes: 15,
            station_type: 'transit',
            has_available_seats: true,
            available_seats: 20,
            additional_price: 50000,
            discount: 0,
          },
          {
            id: 'transit-2',
            schedule_id: id,
            station_id: 'station-bdg',
            station_name: 'Bandung',
            station_code: 'BDG',
            city: 'Bandung',
            station_order: 2,
            arrival_time: '12:30',
            departure_time: '12:50',
            waiting_minutes: 20,
            station_type: 'transit',
            has_available_seats: true,
            available_seats: 15,
            additional_price: 75000,
            discount: 0,
          }
        ],
        metadata: {
          total_transit_points: 2,
          has_transit: true,
          is_dummy: true
        }
      });
    }

    // Create Supabase client - FIXED: Don't redeclare 'supabase' variable
    try {
      // Option 1: Use the pre-created client
      const db = supabaseClient; // Use the imported client
      console.log('🔧 Using pre-created Supabase client');
      
      // OR Option 2: Create new client
      // const db = createClient();
      // console.log('🔧 Created new Supabase client');

      // Test the connection first
      const { error: testError } = await db.from('rute_kereta').select('count').limit(1);
      if (testError) {
        console.error('❌ Supabase connection test failed:', testError.message);
        
        // Fallback to dummy data
        return NextResponse.json({
          success: true,
          transitRoutes: [],
          metadata: {
            total_transit_points: 0,
            has_transit: false,
            is_dummy: true,
            error: testError.message
          }
        });
      }

      console.log('✅ Supabase connection successful');

      // SIMPLE QUERY: Coba cari data transit dari satu table utama
      const { data: transitData, error } = await db
        .from('rute_kereta')
        .select(`
          id,
          schedule_id,
          origin_station_id,
          destination_station_id,
          route_order,
          arrival_time,
          departure_time,
          duration_minutes,
          stasiun_asal:stasiun!rute_kereta_origin_station_id_fkey(id, nama_stasiun, kode_stasiun, city),
          stasiun_tujuan:stasiun!rute_kereta_destination_station_id_fkey(id, nama_stasiun, kode_stasiun, city)
        `)
        .eq('schedule_id', id)
        .order('route_order', { ascending: true });

      if (error) {
        console.log('⚠️ No transit data found:', error.message);
        return NextResponse.json({
          success: true,
          transitRoutes: [],
          metadata: {
            total_transit_points: 0,
            has_transit: false,
            is_dummy: false,
            error: error.message
          }
        });
      }

      // Format response
      const formattedRoutes = (transitData || []).map((route, index) => {
        const waitingMinutes = calculateWaitingTime(
          route.arrival_time,
          route.departure_time
        );

        return {
          id: `transit-${route.id}`,
          schedule_id: route.schedule_id,
          station_id: route.origin_station_id,
          station_name: route.stasiun_asal?.nama_stasiun || `Stasiun ${index + 1}`,
          station_code: route.stasiun_asal?.kode_stasiun || 'UNK',
          city: route.stasiun_asal?.city || 'Unknown',
          station_order: route.route_order,
          arrival_time: route.arrival_time || '00:00',
          departure_time: route.departure_time || '00:00',
          waiting_minutes: waitingMinutes,
          station_type: 'transit',
          has_available_seats: true,
          available_seats: 20,
          additional_price: waitingMinutes * 500,
          discount: 0,
        };
      });

      return NextResponse.json({
        success: true,
        transitRoutes: formattedRoutes,
        metadata: {
          total_transit_points: formattedRoutes.length,
          has_transit: formattedRoutes.length > 0,
          is_dummy: false
        }
      });

    } catch (dbError: any) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json({
        success: true,
        transitRoutes: [],
        metadata: {
          total_transit_points: 0,
          has_transit: false,
          is_dummy: true,
          error: dbError.message
        }
      });
    }

  } catch (error: any) {
    console.error('❌ Transit API error:', error.message);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      transitRoutes: [],
      metadata: {
        total_transit_points: 0,
        has_transit: false,
        is_dummy: true
      }
    }, { status: 500 });
  }
}

// POST method remains the same...
export async function POST(request: NextRequest) {
  try {
    console.log('📞 Transit booking API called');
    
    // Cek method
    if (request.method !== 'POST') {
      return NextResponse.json(
        { success: false, error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('📥 Request body received:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid JSON format in request body',
          message: 'Format data tidak valid'
        },
        { status: 400 }
      );
    }

    // Validasi minimal
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Request body is empty' },
        { status: 400 }
      );
    }

    // Log untuk debugging
    console.log('🔍 Validating booking data...');
    console.log('Schedule ID:', body.scheduleId);
    console.log('Origin Station ID:', body.originStationId);
    console.log('Destination Station ID:', body.destinationStationId);
    console.log('Passenger Count:', body.passengerCount);
    console.log('Passenger Details:', body.passengerDetails?.length || 0, 'passengers');

    // Validasi input minimal
    if (!body.scheduleId) {
      console.warn('❌ Missing scheduleId');
      return NextResponse.json(
        { success: false, error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    if (!body.originStationId || !body.destinationStationId) {
      console.warn('❌ Missing station IDs');
      return NextResponse.json(
        { success: false, error: 'Origin and destination station IDs are required' },
        { status: 400 }
      );
    }

    if (!body.passengerCount || body.passengerCount < 1) {
      console.warn('❌ Invalid passenger count');
      return NextResponse.json(
        { success: false, error: 'Valid passenger count is required' },
        { status: 400 }
      );
    }

    // Jika tidak ada passenger details, buat default
    if (!body.passengerDetails || !Array.isArray(body.passengerDetails)) {
      console.warn('⚠️ No passenger details, creating default');
      body.passengerDetails = [
        {
          fullName: body.contactDetails?.fullName || 'Passenger',
          idNumber: '0000000000000000',
          email: body.contactDetails?.email || 'passenger@example.com',
          phoneNumber: body.contactDetails?.phoneNumber || '081234567890'
        }
      ];
    }

    // Simplifikasi: Buat booking langsung tanpa validasi database kompleks
    // (untuk development/testing)
    console.log('🚀 Creating simplified booking for development...');
    
    // Generate booking details
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingCode = `DEV${timestamp.toString().slice(-6)}${randomSuffix}`;
    const orderId = `ORDER-${timestamp}-${randomSuffix}`;
    
    // Default price calculation
    const basePrice = body.totalAmount || 265000 * body.passengerCount;
    const seatPremium = body.selectedSeats?.reduce((sum: any, seat: any) => sum + (seat.price_adjustment || 0), 0) || 0;
    const discountAmount = body.discountAmount || 0;
    const transitDiscount = body.transitDiscount || 0;
    const transitAdditionalPrice = body.transitAdditionalPrice || 0;
    const adminFee = 5000;
    const insuranceFee = 10000;
    const paymentFee = 0; // sementara 0
    
    const totalAmount = basePrice + seatPremium + adminFee + insuranceFee + paymentFee 
                       - discountAmount - transitDiscount + transitAdditionalPrice;

    // Buat response sukses sederhana
    const bookingResponse = {
      success: true,
      booking: {
        id: `dev-${timestamp}`,
        booking_code: bookingCode,
        order_id: orderId,
        schedule_id: body.scheduleId,
        total_amount: Math.max(totalAmount, 0),
        status: 'pending',
        passenger_count: body.passengerCount,
        payment_method: body.paymentMethod || 'bank-transfer',
        departure_date: new Date().toISOString().split('T')[0],
        departure_time: '05:00',
        arrival_time: '10:00',
        origin_station_id: body.originStationId,
        destination_station_id: body.destinationStationId,
        transit_station_id: body.transitStationId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      payment: {
        order_id: orderId,
        amount: Math.max(totalAmount, 0),
        status: 'pending',
        payment_method: body.paymentMethod || 'bank-transfer'
      },
      message: 'Booking berhasil dibuat (Development Mode)',
      note: 'Database integration is disabled in development mode'
    };

    console.log('✅ Booking created:', bookingResponse.booking.booking_code);
    
    // Simpan ke localStorage untuk development
    if (typeof window !== 'undefined') {
      const devBookings = JSON.parse(localStorage.getItem('dev_bookings') || '[]');
      devBookings.push(bookingResponse.booking);
      localStorage.setItem('dev_bookings', JSON.stringify(devBookings));
      console.log('💾 Saved to localStorage for development');
    }

    return NextResponse.json(bookingResponse, { status: 201 });

  } catch (error: any) {
    console.error('💥 Error in transit booking API:', error);
    
    // Fallback response jika ada error
    const fallbackResponse = {
      success: false,
      error: error.message || 'Terjadi kesalahan server',
      fallback_booking: {
        id: 'fallback-' + Date.now(),
        booking_code: `FALLBACK-${Date.now().toString().slice(-6)}`,
        order_id: `ORDER-FALLBACK-${Date.now()}`,
        total_amount: 332500,
        status: 'pending',
        message: 'Booking dibuat dalam mode fallback karena error'
      },
      note: 'Silakan lanjutkan ke pembayaran dengan data sementara'
    };

    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}

// Helper function
function calculateWaitingTime(arrival: string, departure: string): number {
  if (!arrival || !departure) return 15;
  
  try {
    const [arrHour, arrMin] = arrival.split(':').map(Number);
    const [depHour, depMin] = departure.split(':').map(Number);
    return (depHour * 60 + depMin) - (arrHour * 60 + arrMin);
  } catch {
    return 15;
  }
}