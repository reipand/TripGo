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

// Helper untuk cek kolom dengan query yang lebih aman
async function hasColumn(table: string, column: string): Promise<boolean> {
  try {
    // Query sederhana untuk cek tabel dan kolom
    const { error } = await supabase
      .from(table)
      .select(column)
      .limit(1);

    // Jika error adalah "column does not exist", maka kolom tidak ada
    if (error && error.message.includes('does not exist')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Helper untuk cek apakah tabel ada
async function tableExists(table: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(table)
      .select('*')
      .limit(0); // Cukup cek metadata

    return !error;
  } catch {
    return false;
  }
}

// Helper untuk generate ticket number
function generateTicketNumber(): string {
  const prefix = 'TKT';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

// Helper untuk update payment_transactions
async function updatePaymentTransaction(orderId: string, updateData: any) {
  try {
    if (!(await tableExists('payment_transactions'))) {
      console.log('ℹ️ Table payment_transactions does not exist');
      return { success: false, error: 'Table not found' };
    }

    console.log(`💾 Updating payment_transactions for order_id: ${orderId}`);

    const { error } = await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('order_id', orderId);

    if (error) {
      console.error('❌ Error updating payment_transactions:', error.message);
      return { success: false, error: error.message };
    }

    console.log('✅ payment_transactions updated successfully');
    return { success: true };

  } catch (error: any) {
    console.error('💥 Exception updating payment_transactions:', error.message);
    return { success: false, error: error.message };
  }
}

// Helper untuk update booking
async function updateBooking(orderId: string, bookingCode: string, updateData: any) {
  try {
    if (!(await tableExists('bookings_kereta'))) {
      console.log('ℹ️ Table bookings_kereta does not exist');
      return { success: false, error: 'Table not found' };
    }

    // Update menggunakan order_id jika ada, atau booking_code
    let query = supabase
      .from('bookings_kereta')
      .update(updateData);

    if (orderId) {
      query = query.eq('order_id', orderId);
    } else if (bookingCode) {
      query = query.eq('booking_code', bookingCode);
    } else {
      return { success: false, error: 'No identifier provided for booking update' };
    }

    const { error } = await query;

    if (error) {
      console.error('❌ Error updating bookings_kereta:', error.message);

      // LOGIC: Specific handling for point_transactions constraint violation
      // This usually happens because user_id is missing or null
      if (error.message.includes('point_transactions') && error.message.includes('not-null constraint')) {
        console.warn('⚠️ Point transaction failed due to missing user_id. This is likely a Guest booking.');
        // We might want to try updating without triggering point award if possible, 
        // but database triggers are automatic. For now, we return failure but log the specific reason.
      }

      return { success: false, error: error.message };
    }

    console.log('✅ bookings_kereta updated successfully');
    return { success: true };

  } catch (error: any) {
    console.error('💥 Exception updating bookings_kereta:', error.message);
    return { success: false, error: error.message };
  }
}

// Fungsi untuk generate atau update ticket
async function handleTicketGeneration(bookingCode: string, isPaid: boolean) {
  if (!isPaid) return; // Hanya generate ticket untuk pembayaran sukses

  try {
    if (!(await tableExists('tickets'))) {
      console.log('ℹ️ Table tickets does not exist, skipping ticket generation');
      return;
    }

    console.log(`🎫 Handling ticket for booking: ${bookingCode}`);

    // Cek apakah ticket sudah ada
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('booking_id', bookingCode);

    if (existingTickets && existingTickets.length > 0) {
      console.log('✅ Ticket already exists, updating status');

      // Update existing ticket
      await supabase
        .from('tickets')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingCode);

      return;
    }

    // Generate ticket baru
    const ticketNumber = generateTicketNumber();
    const ticketData: any = {
      booking_id: bookingCode,
      ticket_number: ticketNumber,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Tambahkan kolom opsional jika ada
    if (await hasColumn('tickets', 'qr_code')) {
      // Generate dummy QR code data
      ticketData.qr_code = `data:image/svg+xml;base64,${Buffer.from(`<svg>${ticketNumber}</svg>`).toString('base64')}`;
    }

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

// Main POST handler
export async function POST(request: NextRequest) {
  console.log('🔄 /api/payment/update-status called');

  let body: any;
  try {
    body = await request.json();

    console.log('📥 Update status request:', {
      order_id: body.order_id || body.orderId,
      booking_code: body.booking_code || body.bookingCode,
      status: body.status || body.transaction_status,
      source: body.signature_key ? 'midtrans' : 'frontend'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Invalid JSON body',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }

  // Extract data
  const orderId = body.order_id || body.orderId;
  const bookingCode = body.booking_code || body.bookingCode;
  const rawStatus = body.status || body.transaction_status || body.payment_status;

  if (!orderId && !bookingCode) {
    return NextResponse.json({
      success: false,
      error: 'order_id or booking_code is required',
      received_data: {
        orderId: orderId,
        bookingCode: bookingCode,
        status: rawStatus
      }
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
    'authorize': 'authorized',
    'success': 'paid',
    'failed': 'failed',
    'paid': 'paid',
    'completed': 'paid'
  };

  const internalStatus = statusMap[rawStatus?.toLowerCase()] || rawStatus || 'pending';
  const isPaid = internalStatus === 'paid';
  const isFailed = ['failed', 'deny', 'expire', 'cancel'].includes(internalStatus);
  const isPending = internalStatus === 'pending';

  console.log(`🔄 Status mapping: ${rawStatus} → ${internalStatus}`);
  console.log(`📊 Status flags: isPaid=${isPaid}, isFailed=${isFailed}, isPending=${isPending}`);

  // Build update data untuk payment_transactions
  const paymentUpdateData: any = {
    status: internalStatus,
    updated_at: new Date().toISOString()
  };

  // Tambahkan data tambahan jika tersedia
  if (body.transaction_id && await hasColumn('payment_transactions', 'transaction_id')) {
    paymentUpdateData.transaction_id = body.transaction_id;
  }

  if (body.payment_type && await hasColumn('payment_transactions', 'payment_type')) {
    paymentUpdateData.payment_type = body.payment_type;
  }

  if (body.fraud_status && await hasColumn('payment_transactions', 'fraud_status')) {
    paymentUpdateData.fraud_status = body.fraud_status;
  }

  if (isPaid && await hasColumn('payment_transactions', 'settlement_time')) {
    paymentUpdateData.settlement_time = new Date().toISOString();
  }

  // Simpan response data Midtrans jika ada
  if (body.signature_key && await hasColumn('payment_transactions', 'metadata')) {
    paymentUpdateData.metadata = JSON.stringify({
      midtrans_response: body,
      updated_at: new Date().toISOString()
    });
  }

  // 1. Update payment_transactions
  console.log('💾 Step 1: Updating payment transaction...');
  const paymentUpdateResult = await updatePaymentTransaction(orderId, paymentUpdateData);

  // 2. Update bookings_kereta
  console.log('💾 Step 2: Updating booking...');
  let bookingUpdateData: any = {
    updated_at: new Date().toISOString()
  };

  // Tambahkan status pembayaran jika kolom ada
  if (await hasColumn('bookings_kereta', 'payment_status')) {
    bookingUpdateData.payment_status = internalStatus;
  }

  // Update status booking jika pembayaran sukses atau gagal
  if (await hasColumn('bookings_kereta', 'status')) {
    if (isPaid) {
      bookingUpdateData.status = 'confirmed';
    } else if (isFailed) {
      bookingUpdateData.status = 'cancelled';
    } else if (isPending) {
      bookingUpdateData.status = 'pending';
    }
  }

  // Tambahkan payment_date jika pembayaran sukses
  if (isPaid && await hasColumn('bookings_kereta', 'payment_date')) {
    bookingUpdateData.payment_date = new Date().toISOString();
  }

  // Tambahkan payment_method jika ada
  if (body.payment_method && await hasColumn('bookings_kereta', 'payment_method')) {
    bookingUpdateData.payment_method = body.payment_method;
  }

  const bookingUpdateResult = await updateBooking(orderId, bookingCode, bookingUpdateData);

  // 3. Handle ticket generation untuk pembayaran sukses
  if (isPaid && bookingCode) {
    console.log('🎫 Step 3: Generating ticket...');
    await handleTicketGeneration(bookingCode, isPaid);
  }

  // Prepare response
  const responseData = {
    success: true,
    message: `Payment status updated to ${internalStatus}`,
    data: {
      order_id: orderId,
      booking_code: bookingCode,
      status: internalStatus,
      is_paid: isPaid,
      payment_updated: paymentUpdateResult.success,
      booking_updated: bookingUpdateResult.success,
      timestamp: new Date().toISOString()
    },
    warnings: []
  };

  // Add warnings if any updates failed
  if (!paymentUpdateResult.success) {
    responseData.warnings.push(`Payment transaction update failed: ${paymentUpdateResult.error}`);
  }

  if (!bookingUpdateResult.success) {
    responseData.warnings.push(`Booking update failed: ${bookingUpdateResult.error}`);
  }

  console.log('✅ Status update completed:', {
    orderId,
    status: internalStatus,
    warnings: responseData.warnings.length
  });

  return NextResponse.json(responseData);
}

// GET handler untuk debugging
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('order_id');
  const bookingCode = url.searchParams.get('booking_code');

  console.log('🔍 /api/payment/update-status GET called');

  try {
    let paymentData = null;
    let bookingData = null;
    let ticketData = null;

    // Get payment data
    if (orderId && await tableExists('payment_transactions')) {
      const { data } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      paymentData = data;
    }

    // Get booking data
    if (orderId && await tableExists('bookings_kereta')) {
      const { data } = await supabase
        .from('bookings_kereta')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      bookingData = data;
    }

    // Get ticket data
    if (bookingCode && await tableExists('tickets')) {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('booking_id', bookingCode)
        .maybeSingle();
      ticketData = data;
    }

    return NextResponse.json({
      success: true,
      endpoint: '/api/payment/update-status',
      status_check: {
        order_id: orderId,
        booking_code: bookingCode,
        payment_exists: !!paymentData,
        booking_exists: !!bookingData,
        ticket_exists: !!ticketData
      },
      data: {
        payment: paymentData,
        booking: bookingData,
        ticket: ticketData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Error fetching data',
      detail: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}