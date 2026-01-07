// app/api/tickets/[bookingCode]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

interface Params {
  params: Promise<{ bookingCode: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { bookingCode } = await params;

    if (!bookingCode) {
      return NextResponse.json(
        { success: false, error: 'Kode booking diperlukan' },
        { status: 400 }
      );
    }

    console.log(`🎫 Fetching ticket for booking: ${bookingCode}`);

    // **PERBAIKAN: Cari data dari tabel bookings_kereta yang sesuai**
    const { data: booking, error: bookingError } = await supabase
      .from('bookings_kereta')
      .select(`
        *,
        tickets:tickets (
          id,
          ticket_number,
          qr_code,
          status,
          passenger_name,
          train_name,
          departure_date,
          departure_time,
          arrival_time,
          origin,
          destination,
          created_at
        )
      `)
      .eq('booking_code', bookingCode)
      .single();

    if (bookingError) {
      console.error('❌ Error fetching booking:', bookingError);
      
      // Coba cari di tabel bookings
      const { data: altBooking, error: altError } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_code', bookingCode)
        .single();
        
      if (altError) {
        return NextResponse.json(
          { success: false, error: 'Booking tidak ditemukan' },
          { status: 404 }
        );
      }
      
      // Gunakan data dari tabel alternatif
      const ticketData = {
        success: true,
        data: {
          bookingCode: altBooking.booking_code,
          orderId: altBooking.order_id,
          passengerName: altBooking.passenger_name || 'Penumpang',
          passengerEmail: altBooking.passenger_email || '',
          trainDetails: {
            trainName: altBooking.train_name || 'Kereta Api',
            trainType: altBooking.train_type || 'Eksekutif',
            origin: altBooking.origin || 'Stasiun Asal',
            destination: altBooking.destination || 'Stasiun Tujuan',
            departure: {
              date: altBooking.departure_date || new Date().toISOString().split('T')[0],
              time: altBooking.departure_time || '08:00'
            },
            arrival: {
              date: altBooking.departure_date || new Date().toISOString().split('T')[0],
              time: altBooking.arrival_time || altBooking.departure_time || '10:00'
            }
          },
          bookingDetails: {
            bookingDate: altBooking.created_at ? new Date(altBooking.created_at).toLocaleDateString('id-ID') : 'Tanggal tidak tersedia',
            totalAmount: altBooking.total_amount || 0,
            paymentMethod: altBooking.payment_method || 'Tidak tersedia',
            status: altBooking.status || 'pending',
            passengerCount: altBooking.passenger_count || 1
          },
          // Generate QR code jika tidak ada
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(altBooking.booking_code)}`,
          note: 'Data dari tabel alternatif'
        }
      };
      
      return NextResponse.json(ticketData);
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking tidak ditemukan' },
        { status: 404 }
      );
    }

    // Format waktu
    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return 'Tanggal tidak tersedia';
      try {
        return new Date(dateString).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        return dateString;
      }
    };

    const formatTime = (timeString: string | null | undefined) => {
      if (!timeString) return '--:--';
      // Jika sudah format HH:mm
      if (/^\d{2}:\d{2}$/.test(timeString)) {
        return timeString;
      }
      try {
        // Coba parse sebagai Date
        const [hours, minutes] = timeString.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      } catch (error) {
        return timeString;
      }
    };

    // Format mata uang
    const formatCurrency = (amount: number | null) => {
      if (!amount && amount !== 0) return 'Rp0';
      return `Rp${amount.toLocaleString('id-ID')}`;
    };

    // Ambil tiket jika ada
    const ticket = booking.tickets && Array.isArray(booking.tickets) 
      ? booking.tickets[0] 
      : null;

    // Siapkan response data
    const responseData = {
      success: true,
      data: {
        bookingCode: booking.booking_code,
        orderId: booking.order_id,
        passengerName: booking.passenger_name || 'Penumpang',
        passengerEmail: booking.passenger_email || '',
        passengerPhone: booking.passenger_phone || '',
        trainDetails: {
          trainName: booking.train_name || 'Kereta Api',
          trainType: booking.train_type || 'Eksekutif',
          trainCode: booking.train_code || 'N/A',
          origin: booking.origin || 'Stasiun Asal',
          destination: booking.destination || 'Stasiun Tujuan',
          departure: {
            date: formatDate(booking.departure_date),
            time: formatTime(booking.departure_time),
            station: booking.origin || 'Stasiun Keberangkatan'
          },
          arrival: {
            date: formatDate(booking.departure_date), // Sama dengan departure date untuk perjalanan langsung
            time: formatTime(booking.arrival_time),
            station: booking.destination || 'Stasiun Tujuan'
          },
          duration: booking.departure_time && booking.arrival_time 
            ? calculateDuration(booking.departure_time, booking.arrival_time)
            : 'Duration not available'
        },
        bookingDetails: {
          bookingDate: formatDate(booking.created_at),
          bookingTime: booking.created_at 
            ? new Date(booking.created_at).toLocaleTimeString('id-ID')
            : 'Waktu tidak tersedia',
          totalAmount: formatCurrency(booking.total_amount),
          paymentMethod: booking.payment_method || 'Belum dibayar',
          paymentStatus: booking.payment_status || 'pending',
          bookingStatus: booking.status || 'pending',
          passengerCount: booking.passenger_count || 1,
          ticketStatus: ticket?.status || 'belum digenerate'
        },
        ticketDetails: ticket ? {
          ticketId: ticket.id,
          ticketNumber: ticket.ticket_number,
          qrCode: ticket.qr_code || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(booking.booking_code)}`,
          status: ticket.status,
          issueDate: formatDate(ticket.created_at),
          passengerDetails: {
            name: ticket.passenger_name || booking.passenger_name,
            train: ticket.train_name || booking.train_name,
            route: `${ticket.origin || booking.origin} → ${ticket.destination || booking.destination}`,
            schedule: `${formatTime(ticket.departure_time || booking.departure_time)} - ${formatTime(ticket.arrival_time || booking.arrival_time)}`
          }
        } : {
          ticketNumber: 'Tiket belum digenerate',
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(booking.booking_code)}`,
          status: 'not_generated',
          note: 'Tiket belum dibuat. Klik tombol "Generate Tiket" untuk membuat tiket.'
        },
        // Tambahan: Detail penumpang jika ada di passenger_details
        passengerList: booking.passenger_details 
          ? (() => {
              try {
                const details = JSON.parse(booking.passenger_details);
                return Array.isArray(details) ? details : [details];
              } catch (error) {
                return [];
              }
            })()
          : []
      }
    };

    console.log(`✅ Ticket data fetched for ${bookingCode}`);
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function untuk menghitung durasi
function calculateDuration(startTime: string, endTime: string): string {
  try {
    const parseTime = (timeStr: string): Date => {
      const today = new Date();
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date(today);
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    const start = parseTime(startTime);
    const end = parseTime(endTime);
    
    // Jika end time lebih kecil dari start time, berarti melewati tengah malam
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}j ${minutes}m`;
  } catch (error) {
    return 'Duration not available';
  }
}

// **API untuk generate tiket baru**
export async function POST(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { bookingCode } = await params;

    if (!bookingCode) {
      return NextResponse.json(
        { success: false, error: 'Kode booking diperlukan' },
        { status: 400 }
      );
    }

    console.log(`🎫 Generating new ticket for booking: ${bookingCode}`);

    // 1. Cek apakah booking ada
    const { data: booking, error: bookingError } = await supabase
      .from('bookings_kereta')
      .select('*')
      .eq('booking_code', bookingCode)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking tidak ditemukan' },
        { status: 404 }
      );
    }

    // 2. Cek apakah tiket sudah ada
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('booking_id', bookingCode)
      .limit(1);

    if (existingTickets && existingTickets.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Tiket sudah ada',
        data: existingTickets[0]
      });
    }

    // 3. Generate nomor tiket
    const ticketNumber = `TKT-${bookingCode}-${Date.now().toString().slice(-6)}`;
    
    // 4. Buat QR code
    const qrData = {
      booking_code: bookingCode,
      ticket_number: ticketNumber,
      passenger_name: booking.passenger_name || 'Penumpang',
      train_name: booking.train_name || 'Kereta Api',
      departure_date: booking.departure_date,
      departure_time: booking.departure_time,
      origin: booking.origin,
      destination: booking.destination,
      status: 'active',
      generated_at: new Date().toISOString()
    };
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`;

    // 5. Buat record tiket
    const ticketRecord = {
      booking_id: bookingCode,
      ticket_number: ticketNumber,
      qr_code: qrCodeUrl,
      status: 'active',
      passenger_name: booking.passenger_name || 'Penumpang',
      passenger_email: booking.passenger_email || '',
      train_name: booking.train_name || 'Kereta Api',
      departure_date: booking.departure_date,
      departure_time: booking.departure_time,
      arrival_time: booking.arrival_time,
      origin: booking.origin,
      destination: booking.destination,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Creating ticket record:', ticketRecord);

    // 6. Insert ke database
    const { data: newTicket, error: ticketError } = await supabase
      .from('tickets')
      .insert([ticketRecord])
      .select()
      .single();

    if (ticketError) {
      console.error('❌ Ticket creation error:', ticketError);
      
      // Fallback: Kembalikan data tiket tanpa menyimpan ke database
      return NextResponse.json({
        success: true,
        data: {
          ...ticketRecord,
          id: `temp-${Date.now()}`,
          local: true
        },
        warning: 'Ticket generated locally due to database error'
      });
    }

    // 7. Update status booking jika perlu
    if (booking.status === 'pending' || booking.status === 'paid') {
      await supabase
        .from('bookings_kereta')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('booking_code', bookingCode);
    }

    console.log(`✅ Ticket ${ticketNumber} created successfully`);

    return NextResponse.json({
      success: true,
      message: 'Tiket berhasil dibuat',
      data: newTicket
    });

  } catch (error: any) {
    console.error('❌ Ticket generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat tiket', details: error.message },
      { status: 500 }
    );
  }
}

// **API untuk update status tiket**
export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { bookingCode } = await params;
    const body = await request.json();
    const { status, notes } = body;

    if (!bookingCode) {
      return NextResponse.json(
        { success: false, error: 'Kode booking diperlukan' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status diperlukan' },
        { status: 400 }
      );
    }

    console.log(`🔄 Updating ticket status for ${bookingCode} to ${status}`);

    // Cari tiket berdasarkan booking code
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('booking_id', bookingCode)
      .limit(1);

    if (!tickets || tickets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tiket tidak ditemukan' },
        { status: 404 }
      );
    }

    const ticket = tickets[0];

    // Update status tiket
    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
        ...(notes && { notes })
      })
      .eq('id', ticket.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Gagal mengupdate tiket' },
        { status: 500 }
      );
    }

    // Jika status tiket berubah menjadi 'used' atau 'cancelled', update booking juga
    if (status === 'used' || status === 'cancelled') {
      await supabase
        .from('bookings_kereta')
        .update({
          status: status === 'used' ? 'completed' : 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('booking_code', bookingCode);
    }

    return NextResponse.json({
      success: true,
      message: 'Status tiket berhasil diupdate',
      data: updatedTicket
    });

  } catch (error: any) {
    console.error('❌ Update error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengupdate tiket' },
      { status: 500 }
    );
  }
}