// app/api/payment/status/[orderId]/route.ts - PERBAIKAN UTAMA
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interface untuk params
interface RouteParams {
  params: Promise<{ orderId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // FIX: Unwrap params dengan benar untuk Next.js 14
    const { orderId } = await params;
    
    console.log(`[API GET] Getting payment status for order: "${orderId}"`);
    console.log(`[API GET] Full URL: ${request.url}`);
    
    // Juga cek dari URL query parameters (untuk redirect dari Midtrans)
    const url = new URL(request.url);
    const queryParams = {
      order_id: url.searchParams.get('order_id'),
      status_code: url.searchParams.get('status_code'),
      transaction_status: url.searchParams.get('transaction_status'),
      transaction_id: url.searchParams.get('transaction_id'),
      gross_amount: url.searchParams.get('gross_amount')
    };
    
    console.log(`[API GET] Query params:`, queryParams);
    
    // Prioritas: query param > route param
    const finalOrderId = queryParams.order_id || orderId;
    
    if (!finalOrderId || finalOrderId === 'undefined') {
      console.error(`[API GET] Invalid orderId:`, { orderId, finalOrderId, queryParams });
      return NextResponse.json(
        { 
          success: false, 
          message: 'Order ID is required',
          debug: {
            routeParam: orderId,
            queryParam: queryParams.order_id,
            finalOrderId,
            url: request.url
          }
        },
        { status: 400 }
      );
    }

    console.log(`[API GET] Final orderId to search: "${finalOrderId}"`);

    // Jika ada query params settlement dari Midtrans, update database dulu
    if (queryParams.transaction_status === 'settlement' || queryParams.transaction_status === 'capture') {
      console.log(`[API GET] Auto-updating to settlement from query params`);
      
      try {
        const updateData: any = {
          status: 'settlement',
          updated_at: new Date().toISOString()
        };
        
        // Tambahkan transaction_data jika ada
        if (Object.keys(queryParams).length > 0) {
          updateData.transaction_data = queryParams;
        }
        
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update(updateData)
          .eq('order_id', finalOrderId);
          
        if (updateError) {
          console.error(`[API GET] Auto-update error:`, updateError);
        } else {
          console.log(`[API GET] Auto-updated ${finalOrderId} to settlement`);
          
          // Coba buat booking otomatis setelah settlement
          try {
            await createBookingAfterPayment(finalOrderId, queryParams);
          } catch (bookingError) {
            console.error('[API GET] Auto-booking error:', bookingError);
          }
        }
      } catch (updateError) {
        console.error(`[API GET] Auto-update exception:`, updateError);
      }
    }

    // Cari di payment_transactions
    console.log(`[API GET] Searching in payment_transactions for: "${finalOrderId}"`);
    
    const { data: transaction, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('order_id', finalOrderId)
      .single();

    if (error) {
      console.log(`[API GET] Not found in payment_transactions:`, error.code);
      
      // Coba dengan LIKE untuk partial match
      const { data: similarTransactions } = await supabase
        .from('payment_transactions')
        .select('*')
        .ilike('order_id', `%${finalOrderId}%`)
        .limit(1);

      if (similarTransactions && similarTransactions.length > 0) {
        console.log(`[API GET] Found similar transaction: ${similarTransactions[0].order_id}`);
        return formatSuccessResponse(similarTransactions[0]);
      }

      return NextResponse.json(
        { 
          success: false, 
          message: 'Transaction not found',
          orderId: finalOrderId,
          suggestion: 'Check if transaction exists in database'
        },
        { status: 404 }
      );
    }

    console.log(`[API GET] Found transaction:`, {
      orderId: transaction.order_id,
      status: transaction.status,
      amount: transaction.amount,
      customer: transaction.customer_email
    });

    return formatSuccessResponse(transaction);
    
  } catch (error: any) {
    console.error('[API GET] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// FIX: Handler POST dengan params yang benar
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // FIX: Unwrap params dengan benar
    const { orderId } = await params;
    
    console.log(`[API POST] Updating order: "${orderId}"`);
    console.log(`[API POST] Full URL: ${request.url}`);
    console.log(`[API POST] Raw params:`, { orderId });
    
    // Ambil body
    const body = await request.json();
    const { 
      status, 
      transactionData,
      metadata 
    } = body;

    console.log(`[API POST] Body:`, { status, transactionData, metadata });

    // Jika orderId dari params kosong, coba dari body
    const finalOrderId = (orderId === 'undefined' || !orderId) ? 
      (transactionData?.order_id || body.order_id) : 
      orderId;
    
    if (!finalOrderId) {
      console.error(`[API POST] No orderId found:`, { 
        paramsOrderId: orderId, 
        bodyOrderId: transactionData?.order_id,
        body 
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Order ID is required',
          debug: {
            paramsOrderId: orderId,
            bodyOrderId: transactionData?.order_id,
            bodyKeys: Object.keys(body)
          }
        },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Status is required',
          receivedBody: body 
        },
        { status: 400 }
      );
    }

    console.log(`[API POST] Updating ${finalOrderId} to status: ${status}`);

    // Update payment_transactions
    const updateData: any = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (transactionData) {
      updateData.transaction_data = transactionData;
    }
    
    if (metadata) {
      updateData.metadata = metadata;
    }

    const { data: updatedTransaction, error } = await supabase
      .from('payment_transactions')
      .update(updateData)
      .eq('order_id', finalOrderId)
      .select()
      .single();

    if (error) {
      console.error('[API POST] Update error:', error);
      
      // Coba insert jika tidak ditemukan
      if (error.code === 'PGRST116') {
        console.log(`[API POST] Transaction not found, trying to insert new record`);
        
        const insertData = {
          order_id: finalOrderId,
          status: status,
          transaction_data: transactionData || {},
          metadata: metadata || {},
          amount: transactionData?.gross_amount || body.amount || 0,
          customer_email: transactionData?.customer_details?.email || body.customer_email || 'unknown',
          customer_name: transactionData?.customer_details?.first_name || body.customer_name || 'Unknown',
          payment_method: transactionData?.payment_type || body.payment_method || 'unknown',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: insertError } = await supabase
          .from('payment_transactions')
          .insert(insertData);
          
        if (insertError) {
          console.error('[API POST] Insert error:', insertError);
          return NextResponse.json(
            { 
              success: false, 
              message: 'Failed to create transaction',
              error: insertError.message
            },
            { status: 500 }
          );
        }
        
        console.log(`[API POST] Created new transaction: ${finalOrderId}`);
        
        return NextResponse.json({
          success: true,
          message: 'Transaction created successfully',
          orderId: finalOrderId,
          status: status
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to update transaction',
          error: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    // Jika status settlement, BUAT BOOKING BARU
    if (status === 'settlement' || status === 'capture') {
      try {
        console.log(`[API POST] Payment settled, creating booking...`);
        
        // 1. Cari user berdasarkan email di transaction
        const userEmail = updatedTransaction.customer_email;
        
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .limit(1);
        
        const userId = users?.[0]?.id;
        
          if (userId) {
          // 2. Cek apakah booking sudah ada
          const { data: existingBooking, error: existingBookingError } = await supabase
            .from('bookings_kereta')
            .select('id')
            .eq('booking_code', finalOrderId)
            .single();
          
          if (existingBookingError) {
            // treat as not found / log if needed
            // console.warn('[API POST] Existing booking check error:', existingBookingError);
          }
          
          if (!existingBooking) {
            // 3. Buat booking baru
            const bookingData = {
              user_id: userId,
              booking_code: finalOrderId,
              total_amount: updatedTransaction.amount || 0,
              status: 'confirmed',
              booking_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { data: newBooking, error: bookingError } = await supabase
              .from('bookings_kereta')
              .insert(bookingData)
              .select()
              .single();
            
            if (bookingError) {
              console.error('[API POST] Booking creation error:', bookingError);
            } else {
              console.log(`[API POST] Created booking: ${newBooking.id}`);
              
              // 4. Update transaction dengan booking_id
              await supabase
                .from('payment_transactions')
                .update({
                  booking_id: newBooking.id,
                  updated_at: new Date().toISOString()
                })
                .eq('order_id', finalOrderId);
              
              // 5. Buat invoice
              const invoiceData = {
                booking_id: newBooking.id,
                invoice_number: `INV-${Date.now()}`,
                total_amount: newBooking.total_amount,
                final_amount: newBooking.total_amount,
                payment_status: 'paid',
                payment_method: updatedTransaction.payment_method || 'midtrans',
                paid_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              await supabase
                .from('invoices')
                .insert(invoiceData)
                .match((err: any) => console.warn('[API POST] Invoice warning:', err));
            }
          } else {
            console.log(`[API POST] Booking already exists: ${existingBooking.id}`);
          }
        } else {
          console.warn(`[API POST] User not found for email: ${userEmail}`);
        }
      } catch (bookingError) {
        console.error('[API POST] Booking process error:', bookingError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction updated successfully',
      orderId: updatedTransaction.order_id,
      status: updatedTransaction.status,
      bookingCreated: status === 'settlement' || status === 'capture'
    });

  } catch (error: any) {
    console.error('[API POST] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function untuk create booking setelah payment
async function createBookingAfterPayment(orderId: string, transactionData: any) {
  try {
    console.log(`[AutoBooking] Creating booking for ${orderId}`);
    
    // Cari transaction data dulu
    let transaction = null;
try {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('*')
    .eq('order_id', orderId)
    .single();
  
  if (!error && data) {
    transaction = data;
  }
} catch (error) {
  console.log(`[AutoBooking] Transaction not found: ${orderId}`);
}
    
    // Cek apakah booking sudah ada
        const { data: existingBooking, error: existingBookingError } = await supabase
          .from('bookings_kereta')
          .select('id')
          .eq('booking_code', orderId)
          .single();
        
        if (existingBookingError) {
          console.log(`[AutoBooking] Booking check error:`, existingBookingError);
        }
        
        if (existingBooking) {
          console.log(`[AutoBooking] Booking already exists: ${existingBooking.id}`);
          return existingBooking;
        }
    
    // Cari user berdasarkan email
    const userEmail = transaction.customer_email;
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .limit(1);
    
    if (!users || users.length === 0) {
      console.log(`[AutoBooking] User not found: ${userEmail}`);
      return null;
    }
    
    const userId = users[0].id;
    
    // Buat booking baru
    const bookingData = {
      user_id: userId,
      booking_code: orderId,
      total_amount: transaction.amount || 0,
      status: 'confirmed',
      booking_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newBooking, error } = await supabase
      .from('bookings_kereta')
      .insert(bookingData)
      .select()
      .single();
    
    if (error) {
      console.error(`[AutoBooking] Error:`, error);
      return null;
    }
    
    console.log(`[AutoBooking] Booking created: ${newBooking.id}`);
    
    // Update transaction dengan booking_id
    await supabase
      .from('payment_transactions')
      .update({
        booking_id: newBooking.id,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
    
    return newBooking;
    
  } catch (error) {
    console.error(`[AutoBooking] Exception:`, error);
    return null;
  }
}

// Helper function untuk format response
function formatSuccessResponse(transaction: any) {
  // Auto-expire jika pending lebih dari 24 jam
  let finalStatus = transaction.status;
  if (transaction.status === 'pending') {
    const createdAt = new Date(transaction.created_at).getTime();
    const now = Date.now();
    const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);
    
    if (hoursElapsed > 24) {
      console.log(`[API] Auto-expiring order ${transaction.order_id} (${hoursElapsed.toFixed(1)}h old)`);
      finalStatus = 'expired';
    }
  }

  const response = {
    success: true,
    orderId: transaction.order_id,
    status: finalStatus,
    amount: transaction.amount,
    paymentMethod: transaction.payment_method,
    bookingId: transaction.booking_id,
    customerName: transaction.customer_name,
    customerEmail: transaction.customer_email,
    timestamp: transaction.updated_at,
    createdAt: transaction.created_at,
    paymentUrl: transaction.payment_url,
    metadata: transaction.metadata,
    source: 'payment_transactions'
  };

  console.log(`[API] Response:`, {
    orderId: response.orderId,
    status: response.status,
    hasBookingId: !!response.bookingId
  });

  return NextResponse.json(response);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}