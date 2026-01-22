// app/api/admin/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        users:user_id (email, name),
        bookings:booking_id (booking_code, passenger_name)
      `, { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (paymentMethod && paymentMethod !== 'all') {
      query = query.eq('payment_method', paymentMethod);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (minAmount) {
      query = query.gte('amount', parseFloat(minAmount));
    }

    if (maxAmount) {
      query = query.lte('amount', parseFloat(maxAmount));
    }

    // Apply sorting
    const validSortFields = ['created_at', 'amount', 'transaction_date'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Execute query with pagination
    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error('Transactions query error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Transform data
    const transformedData = data?.map(transaction => ({
      ...transaction,
      user_email: transaction.users?.email,
      user_name: transaction.users?.name,
      booking_code: transaction.bookings?.booking_code,
      passenger_name: transaction.bookings?.passenger_name
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
        hasNextPage: (count || 0) > to + 1,
        hasPrevPage: page > 1
      }
    });

  } catch (error: any) {
    console.error('Transactions API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['user_id', 'booking_id', 'amount', 'payment_method'];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Generate transaction ID
    const transactionId = `TRX${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create transaction
    const transactionData = {
      transaction_id: transactionId,
      user_id: body.user_id,
      booking_id: body.booking_id,
      amount: body.amount,
      payment_method: body.payment_method,
      payment_status: body.payment_status || 'pending',
      status: body.status || 'pending',
      transaction_date: new Date().toISOString(),
      notes: body.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select(`
        *,
        users:user_id (email, name)
      `)
      .single();

    if (error) {
      console.error('Create transaction error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Transaction created successfully'
    });

  } catch (error: any) {
    console.error('Create transaction API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}