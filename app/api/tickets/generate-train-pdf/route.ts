import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    // Fetch booking data
    const { data: booking, error } = await supabaseAdmin
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
        booking_items(*)
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;

    // Generate PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(0, 102, 204); // Blue KAI color
    doc.text('PT KERETA API INDONESIA', 20, 30);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('E-TIKET KERETA API', 20, 45);
    
    // Booking Info
    doc.setFontSize(12);
    doc.text(`Kode Booking: ${booking.booking_code}`, 20, 60);
    doc.text(`Tanggal Pemesanan: ${new Date(booking.created_at).toLocaleDateString('id-ID')}`, 20, 70);
    
    // Train Info
    const route = booking.schedule.rute_kereta?.[0];
    if (route) {
      doc.text('Informasi Perjalanan', 20, 85);
      const trainData = [
        ['Kereta', booking.schedule.train.name],
        ['Tanggal', new Date(booking.schedule.travel_date).toLocaleDateString('id-ID')],
        ['Stasiun Asal', route.origin_station.name],
        ['Stasiun Tujuan', route.destination_station.name],
        ['Berangkat', route.departure_time],
        ['Tiba', route.arrival_time]
      ];
      
      autoTable(doc, {
        startY: 90,
        head: [['Keterangan', 'Detail']],
        body: trainData,
        theme: 'grid',
        headStyles: { fillColor: [0, 102, 204] }
      });
    }
    
    // Passengers
    if (booking.detail_pemesanan && booking.detail_pemesanan.length > 0) {
      doc.text('Data Penumpang', 20, doc.lastAutoTable.finalY + 15);
      
      const passengerData = booking.detail_pemesanan.map((detail: any, index: number) => [
        index + 1,
        detail.passenger.nama,
        detail.passenger.nik || '-',
        detail.harga.toLocaleString('id-ID')
      ]);
      
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [['No', 'Nama', 'NIK', 'Harga']],
        body: passengerData,
        theme: 'grid',
        headStyles: { fillColor: [34, 139, 34] } // Green
      });
    }
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('• Tiket harus dibawa saat check-in', 20, doc.lastAutoTable.finalY + 20);
    doc.text('• Datang minimal 1 jam sebelum keberangkatan', 20, doc.lastAutoTable.finalY + 28);
    doc.text('• E-tiket ini sah dan berlaku sebagai tiket resmi', 20, doc.lastAutoTable.finalY + 36);
    
    const pdfBytes = doc.output('arraybuffer');
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KAI-Ticket-${booking.booking_code}.pdf"`
      }
    });
    
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}