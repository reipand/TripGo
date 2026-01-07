import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[CreateBooking] Request body:', JSON.stringify(body, null, 2));

    const {
      order_id,
      booking_code,
      customer_details,
      gross_amount,
      bookingData
    } = body;

    // Validasi input
    if (!order_id || !booking_code) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id and booking_code are required' },
        { status: 400 }
      );
    }

    console.log(`[CreateBooking] Processing order: ${order_id}, booking: ${booking_code}`);

    // 1. Cek apakah booking sudah ada
    const { data: existingBooking, error: checkError } = await supabaseAdmin
      .from('bookings_kereta')
      .select('id, booking_code, status')
      .eq('booking_code', booking_code)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[CreateBooking] Check booking error:', checkError);
      return NextResponse.json(
        { error: `Database error: ${checkError.message}` },
        { status: 500 }
      );
    }

    if (existingBooking) {
      console.log(`[CreateBooking] Booking already exists: ${existingBooking.id}`);
      return NextResponse.json({
        success: true,
        message: 'Booking already exists',
        data: {
          bookingId: existingBooking.id,
          bookingCode: existingBooking.booking_code,
          status: existingBooking.status
        }
      });
    }

    // 2. Cari schedule_id (gunakan yang ada atau buat dummy)
    let scheduleId = bookingData?.schedule_id;
    const trainCode = bookingData?.train_code;
    const departureDate = bookingData?.departure_date;

    // Validasi UUID
    const isValidUUID = (uuid: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    };

    if (!scheduleId || !isValidUUID(scheduleId)) {
      // Generate UUID v4 yang valid
      scheduleId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      console.log(`[CreateBooking] Generated schedule ID: ${scheduleId}`);
    }

    // 3. Buat booking di bookings_kereta
    console.log(`[CreateBooking] Creating booking with code: ${booking_code}`);
    
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings_kereta')
      .insert({
        booking_code: booking_code,
        schedule_id: scheduleId,
        total_amount: gross_amount || bookingData?.total_amount || 0,
        status: 'confirmed', // Langsung confirmed karena sudah bayar
        booking_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, booking_code, total_amount, status')
      .single();

    if (bookingError) {
      console.error('[CreateBooking] Booking creation error:', bookingError);
      return NextResponse.json(
        { 
          error: `Failed to create booking: ${bookingError.message}`,
          suggestion: 'Check RLS policies on bookings_kereta table'
        },
        { status: 500 }
      );
    }

    console.log(`[CreateBooking] Booking created successfully:`, booking);

    // 4. Simpan data penumpang
    const passengerIds = [];
    if (bookingData?.passengers && Array.isArray(bookingData.passengers)) {
      console.log(`[CreateBooking] Processing ${bookingData.passengers.length} passengers`);
      
      for (const [index, passenger] of bookingData.passengers.entries()) {
        try {
          const passengerData: any = {
            nama: passenger.full_name || passenger.name || '',
            nik: passenger.id_number || passenger.nik || ''
          };

          // Tambahkan field optional jika ada di schema
          if (passenger.email) passengerData.email = passenger.email;
          if (passenger.phone_number) passengerData.phone = passenger.phone_number;
          if (passenger.date_of_birth) passengerData.tanggal_lahir = passenger.date_of_birth;
          if (passenger.gender) passengerData.gender = passenger.gender;

          const { data: penumpang, error: penumpangError } = await supabaseAdmin
            .from('penumpang')
            .insert(passengerData)
            .select('id')
            .single();

          if (penumpangError) {
            console.error(`[CreateBooking] Passenger ${index + 1} error:`, penumpangError);
            
            // Coba insert hanya dengan field required
            const { data: penumpangSimple } = await supabaseAdmin
              .from('penumpang')
              .insert({
                nama: passenger.full_name || passenger.name || '',
                nik: passenger.id_number || passenger.nik || ''
              })
              .select('id')
              .single();

            if (penumpangSimple) {
              passengerIds.push(penumpangSimple.id);
              console.log(`[CreateBooking] Passenger ${index + 1} created (simple):`, penumpangSimple.id);
            }
          } else if (penumpang) {
            passengerIds.push(penumpang.id);
            console.log(`[CreateBooking] Passenger ${index + 1} created:`, penumpang.id);
          }
        } catch (passengerErr) {
          console.error(`[CreateBooking] Error processing passenger ${index + 1}:`, passengerErr);
        }
      }
    }

    // 5. Buat invoice
    const invoiceNumber = `INV-${booking_code}`;
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert({
        booking_id: booking.id,
        invoice_number: invoiceNumber,
        total_amount: booking.total_amount,
        final_amount: booking.total_amount,
        payment_status: 'paid',
        payment_method: bookingData?.payment_method || 'midtrans',
        paid_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 jam
      })
      .select('id, invoice_number')
      .single();

    if (invoiceError) {
      console.error('[CreateBooking] Invoice creation error:', invoiceError);
      // Lanjutkan tanpa invoice, tidak fatal
    } else {
      console.log(`[CreateBooking] Invoice created: ${invoice.invoice_number}`);
    }

    // 6. Update payment transaction jika ada
    if (order_id) {
      const { error: updateError } = await supabaseAdmin
        .from('payment_transactions')
        .update({
          booking_id: booking.booking_code,
          status: 'paid',
          metadata: {
            ...bookingData,
            passenger_ids: passengerIds,
            booking_created: true
          }
        })
        .eq('order_id', order_id);

      if (updateError) {
        console.error('[CreateBooking] Update payment error:', updateError);
      } else {
        console.log(`[CreateBooking] Payment transaction updated for order: ${order_id}`);
      }
    }

    // 7. Return success response
    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        invoiceNumber: invoiceNumber,
        amount: booking.total_amount,
        status: booking.status,
        passengerCount: passengerIds.length,
        createdAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[CreateBooking] Server error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: `Internal server error: ${error.message}`,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}