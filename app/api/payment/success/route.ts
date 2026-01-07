// app/api/payment/success/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const bookingCode = searchParams.get('booking_code');
    const status = searchParams.get('status') || 'success';

    if (!orderId || !bookingCode) {
      return NextResponse.json(
        { success: false, error: 'Parameter tidak lengkap' },
        { status: 400 }
      );
    }

    console.log(`🔄 Processing payment success for: ${bookingCode}, order: ${orderId}`);

    // 1. Update booking status
    const { data: updatedBooking, error: bookingError } = await supabase
      .from('bookings_kereta')
      .update({
        payment_status: status === 'success' ? 'paid' : 'failed',
        status: status === 'success' ? 'confirmed' : 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('booking_code', bookingCode)
      .eq('order_id', orderId)
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Error updating booking:', bookingError);
    }

    // 2. Update payment status
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: status === 'success' ? 'paid' : 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (paymentError) {
      console.warn('⚠️ Payment update warning:', paymentError);
    }

    // 3. Update payment transaction
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .update({
        status: status === 'success' ? 'paid' : 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);

    if (transactionError) {
      console.warn('⚠️ Transaction update warning:', transactionError);
    }

    // 4. Create invoice jika pembayaran sukses
    if (status === 'success' && updatedBooking) {
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
      
      const invoiceRecord = {
        id: uuidv4(),
        booking_id: updatedBooking.id,
        invoice_number: invoiceNumber,
        total_amount: updatedBooking.total_amount,
        tax_amount: 0,
        service_fee: 0,
        insurance_fee: 0,
        discount_amount: 0,
        final_amount: updatedBooking.total_amount,
        payment_method: updatedBooking.payment_method,
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceRecord]);

      if (invoiceError) {
        console.warn('⚠️ Invoice creation warning:', invoiceError);
      }

      console.log(`✅ Created invoice: ${invoiceNumber} for booking ${bookingCode}`);
    }

    // 5. Create notification
    const notificationRecord = {
      id: uuidv4(),
      user_id: updatedBooking?.user_id || null,
      type: 'payment',
      title: status === 'success' ? 'Pembayaran Berhasil' : 'Pembayaran Gagal',
      message: status === 'success' 
        ? `Pembayaran untuk booking ${bookingCode} berhasil. Tiket Anda sudah aktif.`
        : `Pembayaran untuk booking ${bookingCode} gagal. Silakan coba lagi.`,
      is_read: false,
      booking_id: updatedBooking?.id,
      booking_code: bookingCode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([notificationRecord]);

    if (notificationError) {
      console.warn('⚠️ Notification creation warning:', notificationError);
    }

    console.log(`✅ Payment ${status} processed for booking: ${bookingCode}`);

    return NextResponse.json({
      success: true,
      data: {
        booking_code: bookingCode,
        order_id: orderId,
        status: status,
        message: status === 'success' ? 'Pembayaran berhasil diproses' : 'Pembayaran gagal'
      }
    });

  } catch (error: any) {
    console.error('❌ Payment success error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memproses pembayaran' },
      { status: 500 }
    );
  }
}