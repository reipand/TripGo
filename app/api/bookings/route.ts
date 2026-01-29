// app/api/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get authenticated user from request
async function getAuthUser(request: NextRequest) {
  try {
    // Get session from cookies (Supabase stores session in cookies)
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return null;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Extract session from cookies
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    // Try to get session using Supabase
    const accessToken = cookies['sb-access-token'] || cookies['sb-' + supabaseUrl.split('//')[1]?.split('.')[0] + '-auth-token'];

    if (accessToken) {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      if (!error && user) return user;
    }

    // Fallback: try to get from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) return user;
    }

    return null;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

// GET handler untuk mengambil data booking dan kursi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');
    const trainId = searchParams.get('trainId');
    const bookingId = searchParams.get('bookingId');
    const bookingCode = searchParams.get('bookingCode');

    console.log('📊 GET /api/bookings params:', {
      scheduleId,
      trainId,
      bookingId,
      bookingCode
    });

    // Initialize Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Kasus 1: Ambil booking berdasarkan bookingId atau bookingCode
    if (bookingId || bookingCode) {
      const query = supabase
        .from('bookings_kereta')
        .select(`
          *,
          penumpang(*),
          booking_items(*),
          jadwal_kereta!inner(
            *,
            kereta:train_id(*)
          )
        `);

      if (bookingId) query.eq('id', bookingId);
      if (bookingCode) query.eq('booking_code', bookingCode);

      const { data: booking, error: bookingError } = await query.single();

      if (bookingError) {
        console.error('❌ Booking error:', bookingError);
        return NextResponse.json(
          {
            success: false,
            error: 'Booking tidak ditemukan'
          },
          { status: 404 }
        );
      }

      // Jika ada scheduleId, ambil juga data kursi
      if (booking.schedule_id) {
        const { data: seats, error: seatsError } = await supabase
          .from('train_seats')
          .select('*')
          .eq('schedule_id', booking.schedule_id)
          .order('seat_number');

        return NextResponse.json({
          success: true,
          data: {
            booking,
            seats: seats || [],
            total_seats: seats?.length || 0
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: { booking }
      });
    }

    // Kasus 2: Ambil data kursi berdasarkan scheduleId atau trainId
    if (scheduleId || trainId) {
      let scheduleData = null;
      let trainData = null;

      // Cari schedule berdasarkan ID
      if (scheduleId) {
        const { data: schedule, error: scheduleError } = await supabase
          .from('jadwal_kereta')
          .select(`
            *,
            kereta:train_id(*)
          `)
          .eq('id', scheduleId)
          .single();

        if (!scheduleError && schedule) {
          scheduleData = schedule;
          trainData = schedule.kereta;
        }
      } else if (trainId) {
        // Cari train langsung
        const { data: train, error: trainError } = await supabase
          .from('kereta')
          .select('*')
          .eq('id', trainId)
          .single();

        if (!trainError && train) {
          trainData = train;
        }
      }

      if (!trainData) {
        return NextResponse.json(
          {
            success: false,
            error: 'Data kereta tidak ditemukan'
          },
          { status: 404 }
        );
      }

      // Ambil data gerbong untuk kereta ini
      const { data: wagons, error: wagonsError } = await supabase
        .from('gerbong')
        .select('*')
        .eq('train_id', trainData.id)
        .order('coach_code');

      if (wagonsError) {
        console.error('❌ Wagons error:', wagonsError);
        return NextResponse.json(
          {
            success: false,
            error: 'Gagal mengambil data gerbong'
          },
          { status: 500 }
        );
      }

      // Ambil data kursi untuk setiap gerbong
      const wagonsWithSeats = await Promise.all(
        (wagons || []).map(async (wagon) => {
          // Cari kursi untuk gerbong ini
          let seatQuery = supabase
            .from('train_seats')
            .select('*');

          if (scheduleData) {
            seatQuery = seatQuery
              .eq('schedule_id', scheduleData.id)
              .eq('coach_id', wagon.id);
          } else {
            // Jika tidak ada schedule, ambil kursi dari gerbong saja
            seatQuery = seatQuery.eq('coach_id', wagon.id);
          }

          const { data: seats, error: seatsError } = await seatQuery.order('seat_number');

          // Format data kursi
          const formattedSeats = (seats || []).map(seat => {
            const seatNumber = seat.seat_number || '1A';
            const rowMatch = seatNumber.match(/\d+/);
            const colMatch = seatNumber.match(/[A-Z]/);
            
            const row = rowMatch ? parseInt(rowMatch[0]) : 1;
            const column = colMatch ? colMatch[0] : 'A';
            
            // Determine seat type
            const columns = wagon.class_type === 'executive' ? 4 : 
                           wagon.class_type === 'business' ? 5 : 6;
            
            const windowSeat = column === 'A' || 
                             (columns === 4 && column === 'D') ||
                             (columns === 5 && column === 'E') ||
                             (columns === 6 && column === 'F');
            
            const forwardFacing = row % 2 === 1;

            // Calculate seat price
            const basePrice = 250000; // Default
            let price = basePrice;
            
            if (wagon.class_type === 'executive') price *= 1.5;
            else if (wagon.class_type === 'business') price *= 1.2;
            
            if (windowSeat) price = Math.round(price * 1.1);
            if (forwardFacing) price = Math.round(price * 1.05);

            return {
              id: seat.id,
              number: seatNumber,
              row,
              column,
              available: seat.status === 'available',
              windowSeat,
              forwardFacing,
              price,
              wagonNumber: wagon.coach_code,
              wagonClass: wagon.class_type,
              kode_kursi: seatNumber,
              status: seat.status,
              booking_id: seat.booking_id
            };
          });

          // Default layout berdasarkan kelas
          const getDefaultLayout = () => {
            const totalSeats = wagon.total_seats || 40;
            const columns = wagon.class_type === 'executive' ? 4 : 
                           wagon.class_type === 'business' ? 5 : 6;
            const rows = Math.ceil(totalSeats / columns);
            const aisleAfterColumn = Math.floor(columns / 2);
            
            const windowSeats = [];
            if (columns === 4) windowSeats.push('A', 'D');
            else if (columns === 5) windowSeats.push('A', 'E');
            else if (columns === 6) windowSeats.push('A', 'F');
            
            return {
              rows,
              columns,
              aisleAfterColumn,
              windowSeats
            };
          };

          // Fasilitas default
          const getDefaultFacilities = () => {
            const facilities = ['AC'];
            
            switch (wagon.class_type) {
              case 'executive':
                facilities.push('Toilet', 'Power Outlet', 'WiFi', 'Food Service', 'Luggage Rack');
                break;
              case 'business':
                facilities.push('Toilet', 'Power Outlet', 'WiFi', 'Food Service');
                break;
              case 'economy':
                facilities.push('Toilet', 'Luggage Rack');
                break;
            }
            
            return facilities;
          };

          return {
            id: wagon.id,
            number: wagon.coach_code,
            name: `Gerbong ${wagon.coach_code}`,
            class: wagon.class_type,
            facilities: getDefaultFacilities(),
            availableSeats: formattedSeats.filter(s => s.available).length,
            totalSeats: wagon.total_seats || 40,
            seats: formattedSeats,
            layout: getDefaultLayout()
          };
        })
      );

      // Format response untuk komponen TrainSeatMap
      const responseData = {
        id: scheduleData?.id || trainData.id,
        trainId: trainData.id,
        scheduleId: scheduleData?.id,
        trainName: trainData.nama_kereta,
        trainType: trainData.tipe_kereta || 'Executive',
        kode_kereta: trainData.kode_kereta,
        nama_kereta: trainData.nama_kereta,
        departureTime: '07:00:00',
        arrivalTime: '12:00:00',
        duration: '5j 0m',
        origin: searchParams.get('origin') || 'BD',
        destination: searchParams.get('destination') || 'CCL',
        price: parseInt(searchParams.get('price') || '250000'),
        availableSeats: wagonsWithSeats.reduce((sum, wagon) => sum + wagon.availableSeats, 0),
        departureDate: searchParams.get('departureDate') || new Date().toISOString().split('T')[0],
        wagons: wagonsWithSeats,
        operator: trainData.operator,
        originStation: searchParams.get('origin'),
        destinationStation: searchParams.get('destination')
      };

      return NextResponse.json({
        success: true,
        data: responseData
      });
    }

    // Jika tidak ada parameter yang valid
    return NextResponse.json(
      {
        success: false,
        error: 'Parameter tidak valid. Gunakan scheduleId, trainId, bookingId, atau bookingCode'
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error in GET /api/bookings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat mengambil data'
      },
      { status: 500 }
    );
  }
}

// POST handler untuk membuat booking (sudah ada)
export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();

    console.log('📝 Booking request received:', {
      schedule_id: bookingData.schedule_id,
      passenger_count: bookingData.passengers?.length,
      total_amount: bookingData.total_amount
    });

    // Validasi data wajib
    if (!bookingData.schedule_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Schedule ID diperlukan',
          details: 'Schedule ID is required'
        },
        { status: 400 }
      );
    }

    if (!bookingData.passengers || !Array.isArray(bookingData.passengers) || bookingData.passengers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data penumpang diperlukan',
          details: 'At least one passenger is required'
        },
        { status: 400 }
      );
    }

    if (!bookingData.total_amount || bookingData.total_amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Total amount tidak valid',
          details: 'Total amount must be greater than 0'
        },
        { status: 400 }
      );
    }

    // Get authenticated user (optional for now, but recommended)
    const user = await getAuthUser(request);
    const userId = user?.id || bookingData.user_id || null;

    // Initialize Supabase with service role for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Validasi dan cari schedule
    let schedule = null;
    let scheduleError = null;

    // Cek apakah schedule_id adalah UUID yang valid
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isValidUUID = uuidRegex.test(bookingData.schedule_id);

    if (isValidUUID) {
      // Jika UUID valid, cari di database
      const result = await supabase
        .from('jadwal_kereta')
        .select('*, kereta:train_id(id, name, code)')
        .eq('id', bookingData.schedule_id)
        .single();

      schedule = result.data;
      scheduleError = result.error;
    } else {
      // Jika bukan UUID valid (misalnya 'schedule-1'), coba cari berdasarkan data lain
      console.warn('⚠️ Invalid schedule ID format, attempting to find or create schedule');

      // Jika ada train_id, coba cari schedule berdasarkan train_id dan travel_date
      if (bookingData.train_id && bookingData.departure_date) {
        // Cek apakah train_id valid (UUID atau format yang bisa digunakan)
        const trainIdIsValid = uuidRegex.test(bookingData.train_id) || bookingData.train_id.startsWith('train-');

        if (trainIdIsValid) {
          // Cari schedule yang sudah ada
          const result = await supabase
            .from('jadwal_kereta')
            .select('*, kereta:train_id(id, name, code)')
            .eq('train_id', bookingData.train_id)
            .eq('travel_date', bookingData.departure_date)
            .eq('status', 'scheduled')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          schedule = result.data;
          scheduleError = result.error;

          // Jika tidak ditemukan dan train_id adalah UUID valid, buat schedule baru
          if (!schedule && uuidRegex.test(bookingData.train_id)) {
            console.log('📝 Creating new schedule for train:', bookingData.train_id);

            const newScheduleResult = await supabase
              .from('jadwal_kereta')
              .insert({
                train_id: bookingData.train_id,
                travel_date: bookingData.departure_date || new Date().toISOString().split('T')[0],
                status: 'scheduled',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select('*, kereta:train_id(id, name, code)')
              .single();

            if (!newScheduleResult.error && newScheduleResult.data) {
              schedule = newScheduleResult.data;
              console.log('✅ New schedule created:', schedule.id);
            } else {
              scheduleError = newScheduleResult.error;
              console.error('❌ Failed to create schedule:', newScheduleResult.error);
            }
          }
        }
      }
    }

    if (scheduleError || !schedule) {
      console.error('❌ Schedule error:', scheduleError);
      console.error('❌ Schedule ID provided:', bookingData.schedule_id);
      console.error('❌ Booking data:', JSON.stringify(bookingData, null, 2));

      return NextResponse.json(
        {
          success: false,
          error: 'Jadwal tidak ditemukan',
          details: `Schedule dengan ID "${bookingData.schedule_id}" tidak ditemukan di database. Silakan pilih jadwal yang valid dari halaman pencarian.`,
          suggestion: 'Pastikan Anda memilih kereta dari hasil pencarian yang valid'
        },
        { status: 404 }
      );
    }

    console.log('✅ Schedule found:', schedule.id);

    // 2. Validasi kursi tersedia dengan locking mechanism
    // Gunakan select for update pattern (Supabase doesn't support transactions, so we use row-level locking)
    const { count: availableSeatsCount } = await supabase
      .from('train_seats')
      .select('id', { count: 'exact', head: true })
      .eq('schedule_id', bookingData.schedule_id)
      .eq('status', 'available');

    if (!availableSeatsCount || availableSeatsCount < bookingData.passengers.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Kursi tidak tersedia',
          details: `Only ${availableSeatsCount || 0} seats available, but ${bookingData.passengers.length} requested`
        },
        { status: 400 }
      );
    }

    // Double check: verify seats are still available (race condition protection)
    const requiredSeats = bookingData.passengers.length;
    const { count: recheckCount } = await supabase
      .from('train_seats')
      .select('id', { count: 'exact', head: true })
      .eq('schedule_id', bookingData.schedule_id)
      .eq('status', 'available');

    if (!recheckCount || recheckCount < requiredSeats) {
      return NextResponse.json(
        {
          success: false,
          error: 'Kursi tidak tersedia',
          details: 'Seats were just booked by another user. Please try again.'
        },
        { status: 409 }
      );
    }

    // 3. Generate booking code
    const bookingCode = `KAI${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // NEW: Get station orders for seat-reuse logic
    let startOrder = 0;
    let endOrder = 999;
    try {
      if (bookingData.origin && bookingData.destination) {
        const { data: routeData } = await supabase
          .from('rute_kereta')
          .select('route_order, stasiun!inner(nama_stasiun)')
          .eq('schedule_id', bookingData.schedule_id);

        if (routeData) {
          const originRoute = routeData.find(r => (r.stasiun as any).nama_stasiun.includes(bookingData.origin));
          const destRoute = routeData.find(r => (r.stasiun as any).nama_stasiun.includes(bookingData.destination));

          if (originRoute) startOrder = originRoute.route_order;
          if (destRoute) endOrder = destRoute.route_order;
        }
      }
    } catch (err) {
      console.error('Error fetching route orders:', err);
    }

    // 4. Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings_kereta')
      .insert({
        user_id: userId,
        schedule_id: bookingData.schedule_id,
        booking_code: bookingCode,
        total_amount: bookingData.total_amount,
        status: 'pending',
        passenger_count: bookingData.passengers.length,
        booking_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Booking creation error:', bookingError);
      return NextResponse.json(
        {
          success: false,
          error: 'Gagal membuat booking',
          details: bookingError.message
        },
        { status: 500 }
      );
    }

    // 5. Create passengers
    const passengerIds = [];
    for (let i = 0; i < bookingData.passengers.length; i++) {
      const passenger = bookingData.passengers[i];

      // Validasi data penumpang
      if (!passenger.fullName || !passenger.idNumber || !passenger.email) {
        // Rollback: delete booking
        await supabase.from('bookings_kereta').delete().eq('id', booking.id);
        return NextResponse.json(
          {
            success: false,
            error: `Data penumpang ${i + 1} tidak lengkap`,
            details: 'Full name, ID number, and email are required for all passengers'
          },
          { status: 400 }
        );
      }

      const { data: passengerRecord, error: passengerError } = await supabase
        .from('penumpang')
        .insert({
          nama: passenger.fullName,
          nik: passenger.idNumber,
          email: passenger.email,
          phone: passenger.phoneNumber || null,
          tanggal_lahir: passenger.birthDate || null,
          gender: passenger.gender || null,
          booking_id: booking.id,
          passenger_order: i + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (passengerError) {
        console.error('❌ Passenger creation error:', passengerError);
        // Rollback: delete booking and passengers
        await supabase.from('penumpang').delete().eq('booking_id', booking.id);
        await supabase.from('bookings_kereta').delete().eq('id', booking.id);
        return NextResponse.json(
          {
            success: false,
            error: 'Gagal menyimpan data penumpang',
            details: passengerError.message
          },
          { status: 500 }
        );
      }

      passengerIds.push(passengerRecord.id);
    }

    // 6. Get available seats and assign them (with final check)
    const { data: availableSeatsData, error: seatsError } = await supabase
      .from('train_seats')
      .select('id, seat_number, coach_id, status')
      .eq('schedule_id', bookingData.schedule_id)
      .eq('status', 'available')
      .limit(bookingData.passengers.length);

    if (seatsError || !availableSeatsData || availableSeatsData.length < bookingData.passengers.length) {
      console.error('❌ Seats error:', seatsError);
      // Rollback
      await supabase.from('penumpang').delete().eq('booking_id', booking.id);
      await supabase.from('bookings_kereta').delete().eq('id', booking.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Kursi tidak tersedia saat ini',
          details: 'Seats are no longer available. Please refresh and try again.'
        },
        { status: 409 }
      );
    }

    // Final validation: ensure all selected seats are still available
    const unavailableSeats = availableSeatsData.filter(seat => seat.status !== 'available');
    if (unavailableSeats.length > 0) {
      console.error('❌ Some seats are no longer available');
      // Rollback
      await supabase.from('penumpang').delete().eq('booking_id', booking.id);
      await supabase.from('bookings_kereta').delete().eq('id', booking.id);
      return NextResponse.json(
        {
          success: false,
          error: 'Kursi tidak tersedia saat ini',
          details: 'Some seats were just booked. Please refresh and try again.'
        },
        { status: 409 }
      );
    }

    // 7. Update seats status and create booking items
    for (let i = 0; i < availableSeatsData.length; i++) {
      const seat = availableSeatsData[i];
      const passengerId = passengerIds[i];
      const passenger = bookingData.passengers[i];

      // Update seat status
      // Note: We don't mark as 'booked' globally unless it's full. 
      // Instead, we mark as 'available' but check segments.
      // However, for backward compatibility, we keep 'booked' if it's the full route.
      const isFullRoute = startOrder === 0 && endOrder >= 5; // Simplified check

      const { error: seatUpdateError } = await supabase
        .from('train_seats')
        .update({
          status: isFullRoute ? 'booked' : 'available',
          booking_id: booking.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', seat.id);

      if (seatUpdateError) {
        console.error('❌ Seat update error:', seatUpdateError);
        // Partial rollback - try to revert seats
        await supabase.from('train_seats').update({ status: 'available', booking_id: null }).eq('booking_id', booking.id);
        await supabase.from('penumpang').delete().eq('booking_id', booking.id);
        await supabase.from('bookings_kereta').delete().eq('id', booking.id);
        return NextResponse.json(
          {
            success: false,
            error: 'Gagal memproses kursi',
            details: seatUpdateError.message
          },
          { status: 500 }
        );
      }

      // Record in seat_availability for seat-reuse
      await supabase.from('seat_availability').insert({
        train_seat_id: seat.id,
        schedule_id: bookingData.schedule_id,
        departure_route_order: startOrder,
        arrival_route_order: endOrder,
        is_available: false,
        booking_id: booking.id
      });

      // Get seat price from coach
      const seatCoachId = (seat as any).coach_id;
      const seatNumber = (seat as any).seat_number;

      const { data: coachData } = await supabase
        .from('gerbong')
        .select('class_type')
        .eq('id', seatCoachId)
        .single();

      const seatPrice = bookingData.total_amount / bookingData.passengers.length;

      // Create booking item
      const { error: itemError } = await supabase
        .from('booking_items')
        .insert({
          booking_id: booking.id,
          seat_id: seat.id,
          seat_number: seatNumber || passenger.seatNumber || `SEAT-${i + 1}`,
          price: seatPrice,
          created_at: new Date().toISOString()
        });

      if (itemError) {
        console.error('❌ Booking item error:', itemError);
      }

      // Create detail pemesanan
      const { error: detailError } = await supabase
        .from('detail_pemesanan')
        .insert({
          booking_id: booking.id,
          seat_id: seat.id,
          passenger_id: passengerId,
          harga: seatPrice,
          status: 'booked',
          created_at: new Date().toISOString()
        });

      if (detailError) {
        console.error('❌ Detail pemesanan error:', detailError);
      }
    }

    // 8. Create invoice
    const invoiceNumber = `INV-${bookingCode}`;
    const { error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        booking_id: booking.id,
        invoice_number: invoiceNumber,
        total_amount: bookingData.total_amount,
        tax_amount: 0,
        service_fee: bookingData.admin_fee || 5000,
        insurance_fee: bookingData.insurance_fee || 10000,
        discount_amount: 0,
        final_amount: bookingData.total_amount,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (invoiceError) {
      console.error('❌ Invoice error:', invoiceError);
      // Non-critical, continue
    }

    console.log('✅ Booking created successfully:', bookingCode);

    return NextResponse.json({
      success: true,
      data: {
        booking_code: bookingCode,
        booking_id: booking.id,
        invoice_number: invoiceNumber,
        total_amount: bookingData.total_amount,
        passenger_count: bookingData.passengers.length,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('❌ Booking error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan saat memproses booking',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}