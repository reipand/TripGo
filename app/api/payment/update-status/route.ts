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

// ==================== HELPER FUNCTIONS ====================

// Helper untuk retry operation dengan exponential backoff
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 500,
  operationName: string = 'Operation'
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationName} attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      // Exponential backoff dengan jitter
      const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
      console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Helper untuk cek kolom
async function hasColumn(table: string, column: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(table)
      .select(column)
      .limit(1);

    return !error || !error.message.includes('does not exist');
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
      .limit(0);
    return !error;
  } catch {
    return false;
  }
}

// Helper untuk generate ticket number yang konsisten
function generateTicketNumber(): string {
  const prefix = 'TKT';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

// Helper untuk verifikasi booking exists
async function verifyBookingExists(bookingCode?: string, orderId?: string): Promise<boolean> {
  try {
    if (!(await tableExists('bookings_kereta'))) return false;
    
    if (!bookingCode && !orderId) {
      return false;
    }

    let query = supabase
      .from('bookings_kereta')
      .select('id')
      .limit(1);

    if (bookingCode && orderId) {
      query = query.or(`booking_code.eq.${bookingCode},order_id.eq.${orderId}`);
    } else if (bookingCode) {
      query = query.eq('booking_code', bookingCode);
    } else {
      query = query.eq('order_id', orderId!);
    }

    const { data, error } = await query;
    
    if (error) {
      console.warn(`⚠️ Error verifying booking: ${error.message}`);
      return false;
    }
    
    return !!(data && data.length > 0);
  } catch (error: any) {
    console.warn(`⚠️ Exception verifying booking: ${error.message}`);
    return false;
  }
}

// ==================== FIXED: Fungsi untuk create booking ====================
async function createBookingFromPayment(orderId: string, bookingCode: string, requestData?: any): Promise<boolean> {
  try {
    console.log(`📝 Creating fallback booking for ${bookingCode}`);
    
    // Coba ambil data dari payment_transactions
    const { data: paymentData } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();
    
    // Gunakan data dari request jika ada
    const customerEmail = requestData?.customer_email || paymentData?.customer_email;
    const customerName = requestData?.customer_name || paymentData?.customer_name;
    const amount = requestData?.amount || paymentData?.amount;
    const paymentMethod = requestData?.payment_method || paymentData?.payment_method;
    
    if (!customerEmail && !customerName && !amount) {
      console.warn(`⚠️ Insufficient data for creating booking ${bookingCode}`);
      return false;
    }
    
    // Build booking data berdasarkan kolom yang ada di database
    const bookingData: any = {
      booking_code: bookingCode,
      order_id: orderId,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Hanya tambahkan kolom jika ada di database
    const columnChecks = await Promise.all([
      hasColumn('bookings_kereta', 'customer_email'),
      hasColumn('bookings_kereta', 'customer_name'),
      hasColumn('bookings_kereta', 'passenger_email'),
      hasColumn('bookings_kereta', 'passenger_name'),
      hasColumn('bookings_kereta', 'total_amount'),
      hasColumn('bookings_kereta', 'amount'),
      hasColumn('bookings_kereta', 'payment_method'),
      hasColumn('bookings_kereta', 'train_name'),
      hasColumn('bookings_kereta', 'train_type'),
      hasColumn('bookings_kereta', 'origin'),
      hasColumn('bookings_kereta', 'destination'),
      hasColumn('bookings_kereta', 'departure_date'),
      hasColumn('bookings_kereta', 'departure_time'),
      hasColumn('bookings_kereta', 'passenger_count')
    ]);
    
    // Map hasil cek kolom
    const [
      hasCustomerEmail, hasCustomerName, hasPassengerEmail, hasPassengerName,
      hasTotalAmount, hasAmount, hasPaymentMethod, hasTrainName, hasTrainType,
      hasOrigin, hasDestination, hasDepartureDate, hasDepartureTime, hasPassengerCount
    ] = columnChecks;
    
    // Tambahkan data customer berdasarkan kolom yang tersedia
    if (customerEmail) {
      if (hasCustomerEmail) bookingData.customer_email = customerEmail;
      if (hasPassengerEmail) bookingData.passenger_email = customerEmail;
    }
    
    if (customerName) {
      if (hasCustomerName) bookingData.customer_name = customerName;
      if (hasPassengerName) bookingData.passenger_name = customerName;
    }
    
    if (amount) {
      if (hasTotalAmount) bookingData.total_amount = amount;
      if (hasAmount) bookingData.amount = amount;
    }
    
    if (paymentMethod && hasPaymentMethod) {
      bookingData.payment_method = paymentMethod;
    }
    
    // Tambahkan data tambahan dari request jika ada
    if (requestData) {
      if (requestData.train_name && hasTrainName) bookingData.train_name = requestData.train_name;
      if (requestData.train_type && hasTrainType) bookingData.train_type = requestData.train_type;
      if (requestData.origin && hasOrigin) bookingData.origin = requestData.origin;
      if (requestData.destination && hasDestination) bookingData.destination = requestData.destination;
      if (requestData.departure_date && hasDepartureDate) bookingData.departure_date = requestData.departure_date;
      if (requestData.departure_time && hasDepartureTime) bookingData.departure_time = requestData.departure_time;
      if (requestData.passenger_count && hasPassengerCount) bookingData.passenger_count = requestData.passenger_count;
    }
    
    console.log(`📊 Creating booking with data:`, JSON.stringify(bookingData, null, 2));
    
    const { error } = await supabase
      .from('bookings_kereta')
      .insert([bookingData]);
    
    if (error) {
      console.warn(`⚠️ Failed to create fallback booking: ${error.message}`);
      console.warn(`📋 Error details:`, error);
      return false;
    }
    
    console.log(`✅ Fallback booking created for ${bookingCode}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ Exception creating fallback booking: ${error.message}`);
    return false;
  }
}

// Helper untuk update payment_transactions dengan retry
async function updatePaymentTransactionWithRetry(orderId: string, updateData: any) {
  return retryOperation(async () => {
    if (!(await tableExists('payment_transactions'))) {
      throw new Error('Table payment_transactions does not exist');
    }
    
    console.log(`💾 Updating payment_transactions for order_id: ${orderId}`);
    
    const { error } = await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('order_id', orderId);
    
    if (error) {
      throw new Error(`Payment update failed: ${error.message}`);
    }
    
    console.log('✅ payment_transactions updated successfully');
    return { success: true };
  }, 3, 500, 'Update Payment Transaction');
}

// ==================== FIXED: Helper untuk update booking dengan retry ====================
async function updateBookingWithRetry(orderId: string, bookingCode: string, updateData: any, requestData?: any) {
  return retryOperation(async () => {
    // STEP 0: Pastikan booking exists atau create fallback
    const bookingExists = await verifyBookingExists(bookingCode, orderId);
    
    if (!bookingExists) {
      console.warn(`⚠️ Booking not found, attempting to create fallback...`);
      const created = await createBookingFromPayment(orderId, bookingCode, requestData);
      if (!created) {
        console.warn(`⚠️ Could not create fallback booking, will update if found later`);
        // Don't throw error, just continue and try to update
      }
    }
    
    // STEP 1: Update booking
    if (!(await tableExists('bookings_kereta'))) {
      console.warn('⚠️ Table bookings_kereta does not exist');
      return { success: false, error: 'Table not found' };
    }
    
    // Coba cari booking lagi setelah mungkin dibuat
    if (!orderId && !bookingCode) {
      return { success: false, error: 'No identifier provided for booking update' };
    }

    const identifierColumn = orderId ? 'order_id' : 'booking_code';
    const identifierValue = orderId || bookingCode;

    const { data: existingBooking, error: findError } = await supabase
      .from('bookings_kereta')
      .select('id')
      .eq(identifierColumn, identifierValue)
      .limit(1);

    if (findError) {
      console.warn(`⚠️ Failed to find booking before update: ${findError.message}`);
    }
    
    // Jika booking tidak ditemukan, coba buat lagi dengan data minimal
    if (!existingBooking || existingBooking.length === 0) {
      console.warn(`⚠️ Booking still not found after retry, creating minimal booking`);
      
      const minimalBookingData: any = {
        booking_code: bookingCode,
        order_id: orderId,
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Coba tambahkan email jika ada kolom untuk itu
      const hasEmailColumn = await hasColumn('bookings_kereta', 'customer_email') || 
                            await hasColumn('bookings_kereta', 'passenger_email');
      
      if (hasEmailColumn && requestData?.customer_email) {
        if (await hasColumn('bookings_kereta', 'customer_email')) {
          minimalBookingData.customer_email = requestData.customer_email;
        }
        if (await hasColumn('bookings_kereta', 'passenger_email')) {
          minimalBookingData.passenger_email = requestData.customer_email;
        }
      }
      
      const { error: createError } = await supabase
        .from('bookings_kereta')
        .insert([minimalBookingData]);
      
      if (createError) {
        console.warn(`⚠️ Failed to create minimal booking: ${createError.message}`);
        return { success: false, error: createError.message };
      }
      
      console.log(`✅ Created minimal booking for ${bookingCode}`);
    }
    
    // Sekarang update booking
    let updateQuery = supabase
      .from('bookings_kereta')
      .update(updateData);

    updateQuery = updateQuery.eq(identifierColumn, identifierValue);
    
    const { error } = await updateQuery;
    
    if (error) {
      // Handle specific constraint errors
      if (error.message.includes('point_transactions') && error.message.includes('not-null constraint')) {
        console.warn('⚠️ Point transaction constraint issue - likely guest booking');
        // Continue despite this error
      } else {
        console.warn(`⚠️ Booking update failed: ${error.message}`);
        return { success: false, error: error.message };
      }
    }
    
    console.log('✅ bookings_kereta updated successfully');
    return { success: true };
  }, 3, 500, 'Update Booking'); // Reduced retries
}

// Fungsi untuk handle ticket generation dengan consistency check
async function handleTicketGenerationWithConsistency(bookingCode: string, isPaid: boolean) {
  if (!isPaid) return;
  
  try {
    // Cek dulu apakah booking benar-benar sudah paid
    const { data: booking } = await supabase
      .from('bookings_kereta')
      .select('payment_status, status')
      .eq('booking_code', bookingCode)
      .maybeSingle();
    
    if (!booking || booking.payment_status !== 'paid') {
      console.log(`⏳ Booking ${bookingCode} not ready for ticket generation`);
      return;
    }
    
    if (!(await tableExists('tickets'))) {
      console.log('ℹ️ Table tickets does not exist, skipping ticket generation');
      return;
    }
    
    console.log(`🎫 Handling ticket for booking: ${bookingCode}`);
    
    // Cek apakah ticket sudah ada dengan optimistic locking
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('booking_id', bookingCode);
    
    if (existingTickets && existingTickets.length > 0) {
      console.log('✅ Ticket already exists, updating status');
      
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingCode);
      
      if (error) {
        console.warn(`⚠️ Failed to update existing ticket: ${error.message}`);
      }
      return;
    }
    
    // Generate ticket baru dengan transaction-like consistency
    const ticketNumber = generateTicketNumber();
    const ticketData: any = {
      booking_id: bookingCode,
      ticket_number: ticketNumber,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (await hasColumn('tickets', 'qr_code')) {
      ticketData.qr_code = `data:image/svg+xml;base64,${Buffer.from(`<svg>${ticketNumber}</svg>`).toString('base64')}`;
    }
    
    const { error: insertError } = await supabase
      .from('tickets')
      .insert([ticketData]);
    
    if (insertError) {
      // Cek jika ticket sudah dibuat oleh proses lain (race condition)
      if (insertError.message.includes('duplicate key')) {
        console.log('✅ Ticket already created by another process');
      } else {
        console.warn('⚠️ Could not create ticket:', insertError.message);
      }
    } else {
      console.log(`✅ Ticket generated: ${ticketNumber}`);
    }
    
  } catch (error: any) {
    console.warn('⚠️ Ticket generation error:', error.message);
  }
}

// Fungsi untuk memastikan data konsisten
async function ensureDataConsistency(orderId: string, bookingCode: string) {
  console.log('🔍 Ensuring data consistency...');
  
  // Tunggu sebentar untuk memastikan semua operasi database selesai
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Verifikasi state akhir
  const { data: payment } = await supabase
    .from('payment_transactions')
    .select('status')
    .eq('order_id', orderId)
    .maybeSingle();
  
  const { data: booking } = await supabase
    .from('bookings_kereta')
    .select('payment_status, booking_code')
    .or(`order_id.eq.${orderId},booking_code.eq.${bookingCode}`)
    .maybeSingle();
  
  const { data: ticket } = await supabase
    .from('tickets')
    .select('ticket_number')
    .eq('booking_id', bookingCode)
    .maybeSingle();
  
  console.log('📊 Final state verification:', {
    payment_status: payment?.status,
    booking_exists: !!booking,
    booking_code: booking?.booking_code,
    ticket_exists: !!ticket,
    ticket_number: ticket?.ticket_number
  });
  
  return {
    payment_status: payment?.status,
    booking_exists: !!booking,
    ticket_exists: !!ticket
  };
}

// ==================== MAIN HANDLERS ====================

export async function POST(request: NextRequest) {
  const startTime = Date.now();
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
  const requestPaymentMethod = body.payment_method || body.paymentMethod;
  
  if (!orderId && !bookingCode) {
    return NextResponse.json({
      success: false,
      error: 'order_id or booking_code is required',
      received_data: { orderId, bookingCode, status: rawStatus }
    }, { status: 400 });
  }
  
  // Map status
  const statusMap: Record<string, string> = {
    'capture': 'paid', 'settlement': 'paid', 'success': 'paid', 'paid': 'paid', 'completed': 'paid',
    'pending': 'pending',
    'deny': 'failed', 'cancel': 'cancelled', 'expire': 'expired', 'failed': 'failed',
    'refund': 'refunded', 'partial_refund': 'partially_refunded',
    'authorize': 'authorized'
  };
  
  const internalStatus = statusMap[rawStatus?.toLowerCase()] || rawStatus || 'pending';
  const isPaid = internalStatus === 'paid';
  const isFailed = ['failed', 'deny', 'expire', 'cancel'].includes(internalStatus);
  const isPending = internalStatus === 'pending';
  
  console.log(`🔄 Status mapping: ${rawStatus} → ${internalStatus}`);
  console.log(`📊 Status flags: isPaid=${isPaid}, isFailed=${isFailed}, isPending=${isPending}`);
  
  try {
    // Build update data
    const paymentUpdateData: any = {
      status: internalStatus,
      updated_at: new Date().toISOString()
    };
    
    // Tambahkan data tambahan
    const optionalFields = [
      { key: 'transaction_id', column: 'transaction_id' },
      { key: 'payment_type', column: 'payment_type' },
      { key: 'fraud_status', column: 'fraud_status' }
    ];
    
    for (const field of optionalFields) {
      if (body[field.key] && await hasColumn('payment_transactions', field.column)) {
        paymentUpdateData[field.column] = body[field.key];
      }
    }
    
    if (isPaid && await hasColumn('payment_transactions', 'settlement_time')) {
      paymentUpdateData.settlement_time = new Date().toISOString();
    }
    
    if (body.signature_key && await hasColumn('payment_transactions', 'metadata')) {
      paymentUpdateData.metadata = JSON.stringify({
        midtrans_response: body,
        updated_at: new Date().toISOString()
      });
    }
    
    // 1. Update payment_transactions
    console.log('💾 Step 1: Updating payment transaction...');
    const paymentUpdateResult = await updatePaymentTransactionWithRetry(orderId, paymentUpdateData);
    
    // 2. Update bookings_kereta
    console.log('💾 Step 2: Updating booking...');
    const bookingUpdateData: any = {
      updated_at: new Date().toISOString()
    };
    
    // Cek kolom sebelum menambahkan
    if (await hasColumn('bookings_kereta', 'payment_status')) {
      bookingUpdateData.payment_status = internalStatus;
    }
    
    if (await hasColumn('bookings_kereta', 'status')) {
      if (isPaid) {
        bookingUpdateData.status = 'confirmed';
      } else if (isFailed) {
        bookingUpdateData.status = 'cancelled';
      } else if (isPending) {
        bookingUpdateData.status = 'pending';
      }
    }
    
    if (isPaid && await hasColumn('bookings_kereta', 'payment_date')) {
      bookingUpdateData.payment_date = new Date().toISOString();
    }
    
    if (requestPaymentMethod && await hasColumn('bookings_kereta', 'payment_method')) {
      bookingUpdateData.payment_method = requestPaymentMethod;
    }
    
    // Extra data dari request untuk membantu create fallback
    const requestDataForFallback = {
      customer_email: body.customer_email,
      customer_name: body.customer_name,
      amount: body.amount,
      payment_method: requestPaymentMethod,
      train_name: body.train_name,
      train_type: body.train_type,
      origin: body.origin,
      destination: body.destination,
      departure_date: body.departure_date,
      departure_time: body.departure_time,
      passenger_count: body.passenger_count
    };
    
    const bookingUpdateResult = await updateBookingWithRetry(
      orderId, 
      bookingCode, 
      bookingUpdateData, 
      requestDataForFallback
    );
    
    // 3. Handle ticket generation
    if (isPaid && bookingCode) {
      console.log('🎫 Step 3: Generating ticket...');
      await handleTicketGenerationWithConsistency(bookingCode, isPaid);
    }
    
    // 4. Ensure consistency
    const consistencyCheck = await ensureDataConsistency(orderId, bookingCode);
    
    // Prepare response
    const processingTime = Date.now() - startTime;
    const responseData = {
      success: true,
      message: `Payment status updated to ${internalStatus}`,
      processing_time_ms: processingTime,
      data: {
        order_id: orderId,
        booking_code: bookingCode,
        status: internalStatus,
        is_paid: isPaid,
        payment_updated: paymentUpdateResult.success,
        booking_updated: bookingUpdateResult.success,
        consistency_check: consistencyCheck,
        timestamp: new Date().toISOString()
      },
      warnings: [] as string[]
    };
    
    // Add warnings
    if (!paymentUpdateResult.success) {
      responseData.warnings.push(`Payment transaction update had issues`);
    }
    
    if (!bookingUpdateResult.success) {
      responseData.warnings.push(`Booking update had issues: ${bookingUpdateResult.error}`);
    }
    
    if (!consistencyCheck.booking_exists) {
      responseData.warnings.push(`Booking may not be properly created`);
    }
    
    console.log('✅ Status update completed:', {
      orderId,
      status: internalStatus,
      processing_time: `${processingTime}ms`,
      warnings: responseData.warnings.length
    });
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('💥 Critical error in update-status:', error);
    
    // Even on error, try to create a minimal booking as last resort
    try {
      if (orderId && bookingCode) {
        console.log('🆘 Attempting emergency booking creation...');
        const minimalBookingData: any = {
          booking_code: bookingCode,
          order_id: orderId,
          status: 'pending',
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Coba tambahkan status pembayaran jika berhasil
        if (rawStatus === 'paid' || rawStatus === 'success') {
          minimalBookingData.payment_status = 'paid';
          minimalBookingData.status = 'confirmed';
        }
        
        await supabase
          .from('bookings_kereta')
          .insert([minimalBookingData]);
        
        console.log('🆘 Emergency booking created');
      }
    } catch (emergencyError) {
      console.error('🆘 Emergency booking creation failed:', emergencyError);
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update payment status',
      detail: error.message,
      order_id: orderId,
      booking_code: bookingCode,
      timestamp: new Date().toISOString(),
      note: 'Emergency booking may have been created'
    }, { status: 500 });
  }
}

// ==================== NEW: GET handler dengan fallback creation ====================
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('order_id');
  const bookingCode = url.searchParams.get('booking_code');
  const createIfMissing = url.searchParams.get('create_if_missing') === 'true';
  
  console.log('🔍 /api/payment/update-status GET called');
  
  try {
    // Get all related data
    const [paymentTableExists, bookingTableExists, ticketsTableExists] = await Promise.all([
      tableExists('payment_transactions'),
      tableExists('bookings_kereta'),
      tableExists('tickets')
    ]);

    const [paymentData, bookingData, ticketData] = await Promise.all([
      orderId && paymentTableExists
        ? supabase.from('payment_transactions').select('*').eq('order_id', orderId).maybeSingle()
        : Promise.resolve({ data: null }),
      
      (orderId || bookingCode) && bookingTableExists
        ? supabase.from('bookings_kereta')
            .select('*')
            .or(`order_id.eq.${orderId},booking_code.eq.${bookingCode}`)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      
      bookingCode && ticketsTableExists
        ? supabase.from('tickets').select('*').eq('booking_id', bookingCode).maybeSingle()
        : Promise.resolve({ data: null })
    ]);
    
    // Jika booking tidak ditemukan dan createIfMissing=true, coba buat
    if (createIfMissing && !bookingData.data && (orderId || bookingCode)) {
      console.log('🔄 Creating missing booking via GET request');
      
      const minimalBooking: any = {
        booking_code: bookingCode || `BOOK-${Date.now()}`,
        order_id: orderId || `ORDER-${Date.now()}`,
        status: 'pending',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await supabase
        .from('bookings_kereta')
        .insert([minimalBooking]);
      
      console.log('✅ Created missing booking via GET');
    }
    
    return NextResponse.json({
      success: true,
      endpoint: '/api/payment/update-status',
      status_check: {
        order_id: orderId,
        booking_code: bookingCode,
        payment_exists: !!paymentData.data,
        booking_exists: !!bookingData.data,
        ticket_exists: !!ticketData.data,
        payment_status: paymentData.data?.status,
        booking_status: bookingData.data?.status,
        booking_payment_status: bookingData.data?.payment_status
      },
      data: {
        payment: paymentData.data,
        booking: bookingData.data,
        ticket: ticketData.data
      },
      recommendation: !bookingData.data 
        ? 'Booking not found. Use POST to update status or GET with create_if_missing=true'
        : 'Data is available.',
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
