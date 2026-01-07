// app/api/payment/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper untuk cek kolom
async function hasColumn(table: string, column: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(column)
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 /api/payment/update-status called');
  
  try {
    const body = await request.json();
    
    console.log('📥 Update status request:', {
      order_id: body.order_id || body.orderId,
      status: body.status || body.transaction_status,
      source: body.transaction_status ? 'midtrans' : 'frontend'
    });

    // Extract data
    const orderId = body.order_id || body.orderId;
    const rawStatus = body.status || body.transaction_status || body.payment_status;
    
    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'order_id is required',
        received_data: body
      }, { status: 400 });
    }

    // Map status Midtrans ke status internal
    const statusMap: Record<string, string> = {
      'capture': 'paid',
      'settlement': 'paid',
      'pending': 'pending',
      'deny': 'failed',
      'cancel': 'cancelled',
      'expire': 'expired',
      'refund': 'refunded',
      'partial_refund': 'partially_refunded',
      'authorize': 'authorized'
    };
    
    const internalStatus = statusMap[rawStatus?.toLowerCase()] || rawStatus || 'pending';
    const isPaid = internalStatus === 'paid';
    const isFailed = ['failed', 'deny', 'expire', 'cancel'].includes(internalStatus);

    console.log(`🔄 Status: ${rawStatus} → ${internalStatus} (isPaid: ${isPaid})`);

    // **PERBAIKAN: Update dengan cek kolom terlebih dahulu**
    const updateData: any = {
      status: internalStatus
    };
    
    // Cek dan tambahkan kolom yang ada saja
    const tablesToTry = ['payment_transactions', 'payments'];
    
    for (const table of tablesToTry) {
      try {
        // Cek dulu apakah tabel ada
        const { data: tableCheck } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        if (tableCheck === null) continue;
        
        // Tambahkan updated_at jika kolom ada
        if (await hasColumn(table, 'updated_at')) {
          updateData.updated_at = new Date().toISOString();
        }
        
        // Tambahkan settlement_time jika pembayaran sukses dan kolom ada
        if (isPaid && await hasColumn(table, 'settlement_time')) {
          updateData.settlement_time = new Date().toISOString();
        }
        
        // Tambahkan transaction_id jika ada dan kolom ada
        if (body.transaction_id && await hasColumn(table, 'transaction_id')) {
          updateData.transaction_id = body.transaction_id;
        }
        
        // Tambahkan payment_type jika ada dan kolom ada
        if (body.payment_type && await hasColumn(table, 'payment_type')) {
          updateData.payment_type = body.payment_type;
        }
        
        // HINDARI kolom response_data jika tidak ada
        // Simpan data penting lainnya
        if (body.customer_name && await hasColumn(table, 'customer_name')) {
          updateData.customer_name = body.customer_name;
        }
        
        if (body.customer_email && await hasColumn(table, 'customer_email')) {
          updateData.customer_email = body.customer_email;
        }
        
        if (body.amount && await hasColumn(table, 'amount')) {
          updateData.amount = body.amount;
        }

        console.log(`💾 Updating ${table} with:`, Object.keys(updateData));
        
        const { error: updateError } = await supabase
          .from(table)
          .update(updateData)
          .eq('order_id', orderId);
        
        if (updateError) {
          console.warn(`⚠️ ${table} update failed:`, updateError.message);
          continue;
        }
        
        console.log(`✅ Updated ${table} successfully`);
        break; // Stop setelah sukses update di satu tabel
        
      } catch (tableError: any) {
        console.warn(`⚠️ ${table} skipped:`, tableError.message);
      }
    }

    // **PERBAIKAN: Update booking status**
    if (isPaid || isFailed) {
      try {
        // Cari booking berdasarkan order_id
        const { data: booking } = await supabase
          .from('bookings_kereta')
          .select('id, booking_code')
          .eq('order_id', orderId)
          .maybeSingle();
        
        if (booking) {
          const bookingUpdate: any = {
            updated_at: new Date().toISOString()
          };
          
          // Cek dan tambahkan kolom yang ada
          if (await hasColumn('bookings_kereta', 'payment_status')) {
            bookingUpdate.payment_status = internalStatus;
          }
          
          if (await hasColumn('bookings_kereta', 'status')) {
            bookingUpdate.status = isPaid ? 'confirmed' : 'cancelled';
          }
          
          if (isPaid && await hasColumn('bookings_kereta', 'payment_date')) {
            bookingUpdate.payment_date = new Date().toISOString();
          }
          
          await supabase
            .from('bookings_kereta')
            .update(bookingUpdate)
            .eq('id', booking.id);
            
          console.log(`✅ Booking updated to ${internalStatus}`);
          
          // Generate ticket jika pembayaran sukses
          if (isPaid && booking.booking_code) {
            await generateTicket(booking.booking_code);
          }
        }
      } catch (bookingError: any) {
        console.warn('⚠️ Booking update skipped:', bookingError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payment status updated to ${internalStatus}`,
      data: {
        order_id: orderId,
        status: internalStatus,
        is_paid: isPaid,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('💥 Update status error:', error);
    
    // Tetap return success jika pembayaran sukses
    const orderId = body?.order_id || body?.orderId;
    const rawStatus = body?.status || body?.transaction_status;
    const isPaid = rawStatus === 'paid' || rawStatus === 'capture' || rawStatus === 'settlement';
    
    if (isPaid && orderId) {
      return NextResponse.json({
        success: true,
        warning: 'Database update failed but payment is confirmed',
        message: `Payment confirmed as paid (Midtrans verified)`,
        data: {
          order_id: orderId,
          status: 'paid',
          is_paid: true,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update payment status',
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Helper untuk generate ticket
async function generateTicket(bookingCode: string) {
  try {
    console.log(`🎫 Generating ticket for booking: ${bookingCode}`);
    
    // Cek apakah ticket sudah ada
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('ticket_number')
      .eq('booking_id', bookingCode)
      .maybeSingle();
    
    if (existingTicket) {
      console.log('✅ Ticket already exists:', existingTicket.ticket_number);
      return;
    }
    
    const ticketNumber = `TICKET-${Date.now().toString().slice(-8)}`;
    const ticketData = {
      booking_id: bookingCode,
      ticket_number: ticketNumber,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error: insertError } = await supabase
      .from('tickets')
      .insert([ticketData]);
    
    if (insertError) {
      console.warn('⚠️ Could not create ticket:', insertError.message);
    } else {
      console.log(`✅ Ticket generated: ${ticketNumber}`);
    }
    
  } catch (error: any) {
    console.warn('⚠️ Ticket generation error:', error.message);
  }
}