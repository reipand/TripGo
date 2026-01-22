// app/api/admin/transactions/[id]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/api-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/transactions/[id] - Get transaction by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { user, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json(
      { error: authError }, 
      { status: authError === 'Unauthorized' ? 401 : 403 }
    );
  }

  try {
    const supabase = createClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Fetch transaction with related data
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        users:user_id (
          id,
          email,
          name,
          phone
        ),
        bookings:booking_id (
          id,
          booking_code,
          passenger_name,
          passenger_email,
          train_code,
          train_name,
          origin,
          destination,
          departure_date,
          departure_time,
          total_amount
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Transaction query error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Transaction not found' 
        },
        { status: 404 }
      );
    }

    // Format transaction data
    const formattedTransaction = {
      ...transaction,
      user_email: transaction.users?.email,
      user_name: transaction.users?.name,
      user_phone: transaction.users?.phone,
      booking_code: transaction.bookings?.booking_code,
      passenger_name: transaction.bookings?.passenger_name,
      passenger_email: transaction.bookings?.passenger_email,
      train_info: {
        train_code: transaction.bookings?.train_code,
        train_name: transaction.bookings?.train_name,
        origin: transaction.bookings?.origin,
        destination: transaction.bookings?.destination,
        departure_date: transaction.bookings?.departure_date,
        departure_time: transaction.bookings?.departure_time
      },
      // Format dates for better readability
      transaction_date_formatted: new Date(transaction.transaction_date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      created_at_formatted: new Date(transaction.created_at).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      amount_formatted: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
      }).format(transaction.amount)
    };

    return NextResponse.json({
      success: true,
      data: formattedTransaction,
      message: 'Transaction details retrieved successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Get transaction API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch transaction details'
    }, { status: 500 });
  }
}

// PUT /api/admin/transactions/[id] - Update transaction (full update)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { user, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json(
      { error: authError }, 
      { status: authError === 'Unauthorized' ? 401 : 403 }
    );
  }

  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const { data: existingTransaction, error: checkError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Transaction not found' 
        },
        { status: 404 }
      );
    }

    // Validate required fields
    const requiredFields = ['amount', 'payment_method', 'status', 'payment_status'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { 
            success: false,
            error: `Missing required field: ${field}` 
          },
          { status: 400 }
        );
      }
    }

    // Validate amount
    if (body.amount <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Amount must be greater than 0' 
        },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid transaction status' 
        },
        { status: 400 }
      );
    }

    // Validate payment status
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validPaymentStatuses.includes(body.payment_status)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid payment status' 
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      amount: body.amount,
      payment_method: body.payment_method,
      payment_status: body.payment_status,
      status: body.status,
      transaction_date: body.transaction_date || existingTransaction.transaction_date,
      notes: body.notes || existingTransaction.notes,
      metadata: body.metadata || existingTransaction.metadata,
      updated_at: new Date().toISOString(),
      updated_by: user?.id || 'admin'
    };

    // Update transaction
    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        users:user_id (email, name),
        bookings:booking_id (booking_code)
      `)
      .single();

    if (error) {
      console.error('Update transaction error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 400 }
      );
    }

    // If transaction status changed to 'completed', update related booking payment status
    if (body.status === 'completed' && existingTransaction.status !== 'completed') {
      await supabase
        .from('bookings_kereta')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTransaction.booking_id);
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Transaction updated successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Update transaction API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update transaction'
    }, { status: 500 });
  }
}

// PATCH /api/admin/transactions/[id] - Partial update transaction
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { user, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json(
      { error: authError }, 
      { status: authError === 'Unauthorized' ? 401 : 403 }
    );
  }

  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const { data: existingTransaction, error: checkError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Transaction not found' 
        },
        { status: 404 }
      );
    }

    // Allowed fields for partial update
    const allowedFields = [
      'status',
      'payment_status',
      'notes',
      'metadata'
    ];

    // Validate status if provided
    if (body.status) {
      const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid transaction status' 
          },
          { status: 400 }
        );
      }
    }

    // Validate payment status if provided
    if (body.payment_status) {
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
      if (!validPaymentStatuses.includes(body.payment_status)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid payment status' 
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No valid fields to update' 
        },
        { status: 400 }
      );
    }

    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = user?.id || 'admin';

    // Update transaction
    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Patch transaction error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 400 }
      );
    }

    // If transaction status changed to 'completed', update related booking
    if (body.status === 'completed' && existingTransaction.status !== 'completed') {
      await supabase
        .from('bookings_kereta')
        .update({
          payment_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTransaction.booking_id);
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Transaction updated successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Patch transaction API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update transaction'
    }, { status: 500 });
  }
}

// DELETE /api/admin/transactions/[id] - Delete transaction
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { user, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json(
      { error: authError }, 
      { status: authError === 'Unauthorized' ? 401 : 403 }
    );
  }

  try {
    const supabase = createClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const { data: existingTransaction, error: checkError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Transaction not found' 
        },
        { status: 404 }
      );
    }

    // Check if transaction can be deleted
    if (existingTransaction.status === 'completed') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cannot delete completed transactions. Consider marking as cancelled instead.' 
        },
        { status: 400 }
      );
    }

    // Soft delete: Mark as cancelled
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status: 'cancelled',
        payment_status: 'failed',
        updated_at: new Date().toISOString(),
        updated_by: user?.id || 'admin',
        notes: existingTransaction.notes 
          ? `${existingTransaction.notes}\n[Cancelled by admin on ${new Date().toISOString()}]`
          : `[Cancelled by admin on ${new Date().toISOString()}]`
      })
      .eq('id', id)
      .select('id, transaction_id, status, payment_status')
      .single();

    if (error) {
      console.error('Delete transaction error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: error.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Transaction cancelled successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Delete transaction API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete transaction'
    }, { status: 500 });
  }
}