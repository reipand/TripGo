// app/api/tickets/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingCode, passengerName, trainName } = body;
    
    if (!bookingCode) {
      return NextResponse.json(
        { success: false, error: 'Booking code is required' },
        { status: 400 }
      );
    }
    
    console.log(`🎫 Generating ticket for booking: ${bookingCode}`);
    
    // Generate ticket number
    const ticketNumber = `TKT-${bookingCode}-${Date.now().toString().slice(-6)}`;
    
    // Create QR code
    const qrData = {
      booking_code: bookingCode,
      ticket_number: ticketNumber,
      passenger_name: passengerName || 'Penumpang',
      train_name: trainName || 'Kereta Api',
      status: 'active',
      generated_at: new Date().toISOString()
    };
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`;
    
    // Prepare ticket data
    const ticketData = {
      booking_id: bookingCode,
      ticket_number: ticketNumber,
      qr_code: qrCodeUrl,
      status: 'active',
      passenger_name: passengerName || 'Penumpang',
      train_name: trainName || 'Kereta Api',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 Inserting ticket:', ticketData);
    
    // Insert to database
    const { data, error } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      
      // Return ticket data anyway (for frontend to use locally)
      return NextResponse.json({
        success: true,
        data: {
          ...ticketData,
          id: `temp-${Date.now()}`,
          local: true
        },
        warning: 'Ticket saved locally due to database error'
      });
    }
    
    return NextResponse.json({
      success: true,
      data: data
    });
    
  } catch (error: any) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}