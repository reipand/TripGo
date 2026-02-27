import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabase-admin';
import { sendTicketEmail } from '../../../lib/emailService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Deklarasi untuk jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, sendToEmail } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    console.log(`📧 Processing email request for booking: ${bookingId}`);

    // Fetch booking data dengan semua relasi
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings_kereta')
      .select(`
        *,
        schedule:jadwal_kereta(
          *,
          train:kereta(*),
          rute_kereta(
            *,
            origin_station:stasiun(*),
            destination_station:stasiun(*)
          )
        ),
        detail_pemesanan(
          *,
          passenger:penumpang(*)
        ),
        booking_items(*),
        invoice:invoices(*)
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching booking:', fetchError);
      throw fetchError;
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Booking found: ${booking.booking_code}`);

    // Get user email from users table
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', booking.user_id)
      .single();

    const customerEmail = userData?.email || '';
    const customerName = userData?.name || 'Pelanggan';

    // Generate PDF
    console.log('📄 Generating PDF...');
    let pdfBuffer: Buffer;
    
    try {
      pdfBuffer = await generateTrainTicketPDF(booking, customerName);
      console.log('✅ PDF generated successfully');
    } catch (pdfError) {
      console.error('❌ PDF generation failed:', pdfError);
      // Fallback PDF sederhana
      pdfBuffer = await generateSimpleTrainPDF(booking, customerName);
    }

    // Send email
    const emailToSend = sendToEmail || customerEmail;
    
    if (!emailToSend) {
      throw new Error('Customer email not found');
    }

    console.log(`📤 Sending email to: ${emailToSend}...`);
    
    // Prepare ticket data for email
    const ticketData = {
      id: booking.id,
      ticket_number: booking.booking_code,
      passenger_name: customerName,
      passenger_email: emailToSend,
      departure_location: getOriginStation(booking),
      destination_location: getDestinationStation(booking),
      departure_date: `${booking.schedule.travel_date} ${getDepartureTime(booking)}`,
      arrival_date: `${booking.schedule.travel_date} ${getArrivalTime(booking)}`,
      train_number: booking.schedule.train.code,
      seat_numbers: booking.booking_items?.map((item: { seat_number: any; }) => item.seat_number).join(', ') || '',
      train_name: booking.schedule.train.name,
      booking_reference: booking.booking_code,
      status: booking.status,
      total_amount: booking.total_amount,
      booking: {
        booking_number: booking.booking_code,
        total_amount: booking.total_amount,
        currency: 'IDR'
      }
    };

    const emailResult = await sendTicketEmail(
      emailToSend,
      `E-Tiket KAI Anda: ${booking.booking_code}`,
      ticketData,
      pdfBuffer
    );

    if (!emailResult.success) {
      console.error('❌ Email sending failed:', emailResult.error);
      throw new Error(emailResult.error || 'Email sending failed');
    }

    // Create ticket record if not exists
    console.log('🔄 Creating/updating ticket record...');
    const { error: ticketError } = await supabaseAdmin
      .from('tickets')
      .upsert({
        ticket_number: booking.booking_code,
        order_id: booking.booking_code,
        booking_id: booking.id,
        customer_email: emailToSend,
        customer_name: customerName,
        qr_code: null, // You can generate QR code here if needed
        pdf_url: null, // Store PDF URL if uploaded to storage
        status: 'active',
        expires_at: new Date(new Date(booking.schedule.travel_date).setDate(new Date(booking.schedule.travel_date).getDate() + 7)).toISOString(),
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        email_message_id: emailResult.messageId,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'ticket_number',
        ignoreDuplicates: false
      });

    if (ticketError) {
      console.warn('⚠️ Could not update ticket record:', ticketError);
    }

    // Update invoice with email status
    if (booking.invoice) {
      await supabaseAdmin
        .from('invoices')
        .update({
          pdf_url: null, // You can upload PDF to storage and set URL here
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.invoice.id);
    }

    console.log('✅ Email sent successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      emailTo: emailToSend,
      emailMessageId: emailResult.messageId,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Email Service API] Error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // Log to Supabase error table
    try {
      await supabaseAdmin
        .from('activity_logs')
        .insert({
          action: 'email_send_failed',
          data: {
            error: error.message,
            error_stack: error.stack,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString(),
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send email',
        details: error.message,
        code: error.code || 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function getOriginStation(booking: any): string {
  if (booking.schedule.rute_kereta && booking.schedule.rute_kereta.length > 0) {
    const sortedRoutes = [...booking.schedule.rute_kereta].sort((a, b) => a.route_order - b.route_order);
    return sortedRoutes[0].origin_station?.name || 'Unknown';
  }
  return 'Unknown';
}

function getDestinationStation(booking: any): string {
  if (booking.schedule.rute_kereta && booking.schedule.rute_kereta.length > 0) {
    const sortedRoutes = [...booking.schedule.rute_kereta].sort((a, b) => a.route_order - b.route_order);
    return sortedRoutes[sortedRoutes.length - 1].destination_station?.name || 'Unknown';
  }
  return 'Unknown';
}

function getDepartureTime(booking: any): string {
  if (booking.schedule.rute_kereta && booking.schedule.rute_kereta.length > 0) {
    const sortedRoutes = [...booking.schedule.rute_kereta].sort((a, b) => a.route_order - b.route_order);
    return sortedRoutes[0].departure_time || '00:00';
  }
  return '00:00';
}

function getArrivalTime(booking: any): string {
  if (booking.schedule.rute_kereta && booking.schedule.rute_kereta.length > 0) {
    const sortedRoutes = [...booking.schedule.rute_kereta].sort((a, b) => a.route_order - b.route_order);
    return sortedRoutes[sortedRoutes.length - 1].arrival_time || '00:00';
  }
  return '00:00';
}

// Generate detailed train ticket PDF
async function generateTrainTicketPDF(booking: any, customerName: string): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Header dengan logo KAI
  doc.setFontSize(24);
  doc.setTextColor(0, 102, 204); // KAI Blue
  doc.text('PT KERETA API INDONESIA', 20, 25);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('E-TIKET KERETA API', 20, 35);
  
  // Garis pemisah
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.5);
  doc.line(20, 40, 190, 40);

  // Informasi Booking
  doc.setFontSize(12);
  doc.text('INFORMASI PEMESANAN', 20, 50);
  
  const bookingInfo = [
    ['Kode Booking', booking.booking_code],
    ['Tanggal Pemesanan', new Date(booking.created_at).toLocaleDateString('id-ID')],
    ['Status', booking.status.toUpperCase()],
    ['Metode Pembayaran', booking.invoice?.payment_method || '-'],
    ['Status Pembayaran', booking.invoice?.payment_status || '-']
  ];

  autoTable(doc, {
    startY: 55,
    head: [['Keterangan', 'Detail']],
    body: bookingInfo,
    theme: 'grid',
    headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255] },
    margin: { left: 20, right: 20 }
  });

  // Informasi Perjalanan
  const routeInfo = getRouteInfo(booking);
  doc.setFontSize(12);
  doc.text('INFORMASI PERJALANAN', 20, doc.lastAutoTable.finalY + 15);
  
  const travelInfo = [
    ['Nama Kereta', booking.schedule.train.name],
    ['Nomor Kereta', booking.schedule.train.code],
    ['Operator', booking.schedule.train.operator],
    ['Tanggal Berangkat', new Date(booking.schedule.travel_date).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })],
    ['Stasiun Asal', routeInfo.origin],
    ['Stasiun Tujuan', routeInfo.destination],
    ['Waktu Berangkat', routeInfo.departureTime],
    ['Waktu Tiba', routeInfo.arrivalTime],
    ['Durasi', routeInfo.duration]
  ];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Keterangan', 'Detail']],
    body: travelInfo,
    theme: 'grid',
    headStyles: { fillColor: [34, 139, 34], textColor: [255, 255, 255] }, // Green
    margin: { left: 20, right: 20 }
  });

  // Informasi Penumpang
  if (booking.detail_pemesanan && booking.detail_pemesanan.length > 0) {
    doc.setFontSize(12);
    doc.text('DATA PENUMPANG', 20, doc.lastAutoTable.finalY + 15);
    
    const passengerData = booking.detail_pemesanan.map((detail: any, index: number) => [
      index + 1,
      detail.passenger?.nama || '-',
      detail.passenger?.nik || '-',
      detail.passenger?.gender || '-',
      `Rp ${detail.harga.toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['No', 'Nama', 'NIK', 'Jenis Kelamin', 'Harga']],
      body: passengerData,
      theme: 'grid',
      headStyles: { fillColor: [139, 0, 0], textColor: [255, 255, 255] }, // Red
      margin: { left: 20, right: 20 }
    });
  }

  // Informasi Kursi
  if (booking.booking_items && booking.booking_items.length > 0) {
    doc.setFontSize(12);
    doc.text('INFORMASI KURSI', 20, doc.lastAutoTable.finalY + 15);
    
    const seatData = booking.booking_items.map((item: any, index: number) => [
      index + 1,
      item.seat_number,
      `Rp ${item.price.toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['No', 'Nomor Kursi', 'Harga']],
      body: seatData,
      theme: 'grid',
      headStyles: { fillColor: [255, 140, 0], textColor: [255, 255, 255] }, // Orange
      margin: { left: 20, right: 20 }
    });
  }

  // Ringkasan Pembayaran
  doc.setFontSize(12);
  doc.text('RINGKASAN PEMBAYARAN', 20, doc.lastAutoTable.finalY + 15);
  
  const paymentSummary = [
    ['Total Tiket', `Rp ${booking.total_amount.toLocaleString('id-ID')}`],
    ['Biaya Layanan', 'Rp 0'],
    ['Diskon', 'Rp 0'],
    ['Total Dibayar', `Rp ${booking.total_amount.toLocaleString('id-ID')}`]
  ];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [['Keterangan', 'Jumlah']],
    body: paymentSummary,
    theme: 'grid',
    headStyles: { fillColor: [128, 0, 128], textColor: [255, 255, 255] }, // Purple
    margin: { left: 20, right: 20 },
    styles: { halign: 'right' }
  });

  // Informasi Penting
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const importantInfo = [
    '• E-tiket ini sah dan berlaku sebagai tiket resmi',
    '• Datang minimal 1 jam sebelum keberangkatan di stasiun',
    '• Bawa identitas asli (KTP/SIM/Paspor) untuk verifikasi',
    '• Check-in online dapat dilakukan 2-24 jam sebelum keberangkatan',
    '• Tiket tidak dapat dipindahtangankan',
    '• Untuk bantuan hubungi call center KAI 121'
  ];

  let yPos = doc.lastAutoTable.finalY + 25;
  importantInfo.forEach((info, index) => {
    if (yPos < 280) {
      doc.text(info, 25, yPos);
      yPos += 6;
    }
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 20, 285);
  doc.text('Terima kasih telah menggunakan layanan KAI', 20, 290);

  // QR Code Placeholder
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('SCAN QR CODE DI STASIUN', 130, 250);
  doc.rect(130, 255, 50, 50);
  doc.text('QR Code', 145, 280);

  const pdfBytes = doc.output('arraybuffer');
  return Buffer.from(pdfBytes);
}

// Helper function untuk mendapatkan informasi rute
function getRouteInfo(booking: any): any {
  if (booking.schedule.rute_kereta && booking.schedule.rute_kereta.length > 0) {
    const sortedRoutes = [...booking.schedule.rute_kereta].sort((a, b) => a.route_order - b.route_order);
    const firstRoute = sortedRoutes[0];
    const lastRoute = sortedRoutes[sortedRoutes.length - 1];
    
    const totalMinutes = sortedRoutes.reduce((sum, route) => sum + route.duration_minutes, 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return {
      origin: firstRoute.origin_station?.name || 'Unknown',
      destination: lastRoute.destination_station?.name || 'Unknown',
      departureTime: firstRoute.departure_time,
      arrivalTime: lastRoute.arrival_time,
      duration: `${hours} jam ${minutes} menit`
    };
  }
  
  return {
    origin: 'Unknown',
    destination: 'Unknown',
    departureTime: '00:00',
    arrivalTime: '00:00',
    duration: '0 jam'
  };
}

// Generate simple fallback PDF
async function generateSimpleTrainPDF(booking: any, customerName: string): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(0, 102, 204);
  doc.text('E-TIKET KERETA API', 20, 30);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Kode Booking: ${booking.booking_code}`, 20, 50);
  doc.text(`Nama: ${customerName}`, 20, 65);
  
  // Train Info
  doc.text('Informasi Perjalanan:', 20, 85);
  doc.setFontSize(12);
  
  const routeInfo = getRouteInfo(booking);
  doc.text(`Kereta: ${booking.schedule.train.name} (${booking.schedule.train.code})`, 25, 100);
  doc.text(`Tanggal: ${new Date(booking.schedule.travel_date).toLocaleDateString('id-ID')}`, 25, 110);
  doc.text(`Asal: ${routeInfo.origin}`, 25, 120);
  doc.text(`Tujuan: ${routeInfo.destination}`, 25, 130);
  doc.text(`Berangkat: ${routeInfo.departureTime}`, 25, 140);
  doc.text(`Tiba: ${routeInfo.arrivalTime}`, 25, 150);
  
  // Passengers
  if (booking.detail_pemesanan && booking.detail_pemesanan.length > 0) {
    doc.setFontSize(14);
    doc.text('Penumpang:', 20, 170);
    doc.setFontSize(12);
    
    let yPos = 185;
    booking.detail_pemesanan.forEach((detail: any, index: number) => {
      if (yPos < 280) {
        doc.text(`${index + 1}. ${detail.passenger?.nama || '-'}`, 25, yPos);
        yPos += 10;
      }
    });
  }
  
  // Total
  doc.setFontSize(14);
  doc.text(`Total: Rp ${booking.total_amount.toLocaleString('id-ID')}`, 20, 250);
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Tiket ini sah sebagai bukti pembayaran', 20, 270);
  doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 20, 280);
  
  const pdfBytes = doc.output('arraybuffer');
  return Buffer.from(pdfBytes);
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
