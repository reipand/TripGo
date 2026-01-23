// app/api/admin/users/[id]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/api-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single user with full details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  console.log('=== /api/admin/users/[id] GET called ===');
  
  try {
    const { user: adminUser, error: authError } = await requireAdmin(request);
    
    console.log('Auth check result:', { 
      hasUser: !!adminUser, 
      authError,
      userRole: adminUser?.role,
      userId: adminUser?.id 
    });
    
    if (authError) {
      console.log('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: authError }, 
        { status: authError === 'Unauthorized' ? 401 : 403 }
      );
    }

    const supabase = createClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching user with ID:', id);

    // Fetch user basic info only - avoid complex joins
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !userData) {
      console.error('User query error:', userError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'User not found',
          details: userError?.message 
        },
        { status: 404 }
      );
    }

    console.log('User found:', { id: userData.id, email: userData.email });

    // Try to fetch bookings separately to avoid foreign key errors
    let bookings: any[] = [];
    let bookingStats = {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
      total_spent: 0
    };

    try {
      // Check if bookings_kereta table has user_id column
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings_kereta')
        .select('id, total_amount, status, created_at, booking_date')
        .eq('user_id', id);

      if (!bookingsError && bookingsData) {
        bookings = bookingsData;
        console.log('Bookings found:', bookings.length);
        
        // Calculate booking stats
        bookingStats = {
          total: bookings.length,
          confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
          pending: bookings.filter((b: any) => b.status === 'pending').length,
          cancelled: bookings.filter((b: any) => b.status === 'cancelled').length,
          completed: bookings.filter((b: any) => b.status === 'completed').length,
          total_spent: bookings.reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0)
        };
      } else {
        console.log('No bookings found or error:', bookingsError?.message);
      }
    } catch (bookingsErr) {
      console.warn('Error fetching bookings:', bookingsErr);
    }

    // Try to fetch payment transactions
    let transactions: any[] = [];
    let transactionStats = {
      total: 0,
      total_amount: 0,
      completed: 0,
      pending: 0,
      failed: 0
    };

    try {
      // Check if payment_transactions table exists and has customer_email column
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('payment_transactions')
        .select('id, amount, payment_method, status, created_at')
        .eq('customer_email', userData.email);

      if (!transactionsError && transactionsData) {
        transactions = transactionsData;
        console.log('Transactions found:', transactions.length);
        
        // Calculate transaction stats
        transactionStats = {
          total: transactions.length,
          total_amount: transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0),
          completed: transactions.filter((t: any) => t.status === 'completed' || t.status === 'settlement').length,
          pending: transactions.filter((t: any) => t.status === 'pending').length,
          failed: transactions.filter((t: any) => t.status === 'failed' || t.status === 'cancel').length
        };
      } else {
        console.log('No transactions found or error:', transactionsError?.message);
      }
    } catch (transactionsErr) {
      console.warn('Error fetching transactions:', transactionsErr);
    }

    // Remove sensitive data
    const { password, refresh_token, ...safeUserData } = userData;

    // Format response data
    const responseData = {
      ...safeUserData,
      statistics: {
        bookings: bookingStats,
        transactions: transactionStats,
        booking_count: bookingStats.total,
        total_spent: bookingStats.total_spent,
        transaction_count: transactionStats.total
      },
      formatted_dates: {
        created_at: new Date(safeUserData.created_at).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        last_login: safeUserData.last_login 
          ? new Date(safeUserData.last_login).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Never',
        email_verified_at: safeUserData.email_verified_at
          ? new Date(safeUserData.email_verified_at).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : null,
        phone_verified_at: safeUserData.phone_verified_at
          ? new Date(safeUserData.phone_verified_at).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : null
      }
    };

    console.log('User data prepared successfully');
    
    return NextResponse.json({
      success: true,
      data: responseData
    }, { status: 200 });

  } catch (error: any) {
    console.error('Get user API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Full update of user
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { user: adminUser, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json(
      { success: false, error: authError }, 
      { status: authError === 'Unauthorized' ? 401 : 403 }
    );
  }

  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent modifying super admin unless current user is super admin
    if (existingUser.role === 'super_admin' && adminUser?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify super admin user' },
        { status: 403 }
      );
    }

    // Prevent modifying own role unless super admin
    if (id === adminUser?.id && body.role && adminUser?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own role' },
        { status: 403 }
      );
    }

    // Validate role if provided
    if (body.role && !['super_admin', 'admin', 'staff', 'user'].includes(body.role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // List of fields that can be updated
    const allowedFields = [
      'name',
      'email',
      'phone',
      'role',
      'is_active',
      'email_verified',
      'phone_verified',
      'avatar_url',
      'address',
      'city',
      'province',
      'postal_code',
      'date_of_birth',
      'gender',
      'preferences',
      'metadata'
    ];

    // Filter only allowed fields
    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        // Special handling for verification fields
        if (field === 'email_verified' && body[field] === true) {
          updateData.email_verified_at = new Date().toISOString();
        }
        if (field === 'phone_verified' && body[field] === true) {
          updateData.phone_verified_at = new Date().toISOString();
        }
        updateData[field] = body[field];
      }
    });

    // Update timestamps
    updateData.updated_at = new Date().toISOString();

    // Validate email if changing
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Check if email already exists
      const { data: emailExists } = await supabase
        .from('users')
        .select('id')
        .eq('email', updateData.email)
        .neq('id', id)
        .single();

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update user
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        email,
        name,
        phone,
        role,
        is_active,
        email_verified,
        email_verified_at,
        phone_verified,
        phone_verified_at,
        avatar_url,
        address,
        city,
        province,
        postal_code,
        date_of_birth,
        gender,
        created_at,
        updated_at,
        last_login
      `)
      .single();

    if (error) {
      console.error('Update user error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'User updated successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Update user API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// PATCH - Partial update (commonly used for status toggles)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { user: adminUser, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json(
      { success: false, error: authError }, 
      { status: authError === 'Unauthorized' ? 401 : 403 }
    );
  }

  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent modifying super admin unless current user is super admin
    if (existingUser.role === 'super_admin' && adminUser?.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot modify super admin user' },
        { status: 403 }
      );
    }

    // Only allow specific partial updates
    const allowedPatchFields = [
      'is_active',
      'role',
      'email_verified',
      'phone_verified'
    ];

    // Validate request body
    const updateData: any = {};
    
    // Check if request is for status toggle
    if (body.is_active !== undefined) {
      updateData.is_active = Boolean(body.is_active);
    }
    
    // Check if request is for role change
    if (body.role && allowedPatchFields.includes('role')) {
      if (!['super_admin', 'admin', 'staff', 'user'].includes(body.role)) {
        return NextResponse.json(
          { success: false, error: 'Invalid role specified' },
          { status: 400 }
        );
      }
      updateData.role = body.role;
    }
    
    // Handle verification status
    if (body.email_verified !== undefined) {
      updateData.email_verified = Boolean(body.email_verified);
      if (body.email_verified) {
        updateData.email_verified_at = new Date().toISOString();
      }
    }
    
    if (body.phone_verified !== undefined) {
      updateData.phone_verified = Boolean(body.phone_verified);
      if (body.phone_verified) {
        updateData.phone_verified_at = new Date().toISOString();
      }
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update user
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        email,
        name,
        role,
        is_active,
        email_verified,
        phone_verified,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Patch user error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'User updated successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Patch user API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete user (mark as inactive)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const { user: adminUser, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json(
      { success: false, error: authError }, 
      { status: authError === 'Unauthorized' ? 401 : 403 }
    );
  }

  try {
    const supabase = createClient();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of super admin
    if (existingUser.role === 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete super admin user' },
        { status: 403 }
      );
    }

    // Prevent deletion of own account
    if (existingUser.id === adminUser?.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    // If already inactive, just return
    if (!existingUser.is_active) {
      return NextResponse.json({
        success: true,
        message: 'User is already inactive'
      }, { status: 200 });
    }

    // Soft delete: Mark as inactive and anonymize email
    const { data, error } = await supabase
      .from('users')
      .update({
        is_active: false,
        email: `${existingUser.email}.deleted.${Date.now()}`,
        updated_at: new Date().toISOString(),
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, email, is_active, deleted_at')
      .single();

    if (error) {
      console.error('Delete user error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log the deletion activity
    await supabase
      .from('admin_activities')
      .insert({
        admin_id: adminUser?.id,
        action: 'DELETE_USER',
        target_type: 'user',
        target_id: id,
        details: {
          original_email: existingUser.email,
          reason: 'Admin deletion',
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      data,
      message: 'User deactivated successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Delete user API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// POST - Reset user password (admin action)
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { user: adminUser, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json(
      { success: false, error: authError }, 
      { status: authError === 'Unauthorized' ? 401 : 403 }
    );
  }

  try {
    const supabase = createClient();
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a random password
    const generateRandomPassword = () => {
      const length = 12;
      const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return password;
    };

    const newPassword = generateRandomPassword();
    
    // In a real application, you would:
    // 1. Hash the password properly
    // 2. Send password reset email instead of returning plain password
    // 3. Use a secure method to set the password

    // For demo purposes, we'll just update a dummy field
    // In practice, use Supabase Auth API or your auth system
    const { data, error } = await supabase
      .from('users')
      .update({
        password_reset_required: true,
        password_reset_token: `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        password_reset_expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, email, name, password_reset_required')
      .single();

    if (error) {
      console.error('Reset password error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to reset password' },
        { status: 400 }
      );
    }

    // Log the password reset activity
    await supabase
      .from('admin_activities')
      .insert({
        admin_id: adminUser?.id,
        action: 'RESET_USER_PASSWORD',
        target_type: 'user',
        target_id: id,
        details: {
          user_email: existingUser.email,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        email: data.email,
        password_reset_required: data.password_reset_required
      },
      message: 'Password reset initiated. User will need to set a new password on next login.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}