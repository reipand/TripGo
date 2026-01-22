// app/api/admin/users/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/api-auth';

// GET - List users with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json(
      { success: false, error: authError }, 
      { status: authError === 'Unauthorized' ? 401 : 403 }
    );
  }

  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Filters
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const isActive = searchParams.get('is_active');
    const emailVerified = searchParams.get('email_verified');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    // Sorting
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // Build query
    let query = supabase
      .from('users')
      .select(`
        *,
        bookings:bookings_kereta(
          id,
          total_price,
          status
        )
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply role filter
    if (role) {
      query = query.eq('role', role);
    }

    // Apply status filters
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (emailVerified !== null) {
      query = query.eq('email_verified', emailVerified === 'true');
    }

    // Apply date filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Apply sorting
    if (['created_at', 'updated_at', 'last_login', 'name'].includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: users, count, error } = await query;

    if (error) {
      console.error('Users query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Transform data
    const transformedUsers = (users || []).map(user => {
      const { password, refresh_token, ...safeUserData } = user;
      
      // Calculate booking stats
      const bookings = user.bookings || [];
      const bookingStats = {
        count: bookings.length,
        total_spent: bookings.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0),
        confirmed: bookings.filter((b: any) => b.status === 'confirmed').length,
        pending: bookings.filter((b: any) => b.status === 'pending').length
      };

      return {
        ...safeUserData,
        booking_count: bookingStats.count,
        total_spent: bookingStats.total_spent,
        formatted_dates: {
          created_at: new Date(user.created_at).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          last_login: user.last_login 
            ? new Date(user.last_login).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Never'
        }
      };
    });

    // Calculate statistics
    const stats = {
      total: count || 0,
      active: (users || []).filter((u: any) => u.is_active).length,
      verified: (users || []).filter((u: any) => u.email_verified).length,
      super_admin: (users || []).filter((u: any) => u.role === 'super_admin').length,
      admin: (users || []).filter((u: any) => u.role === 'admin').length,
      staff: (users || []).filter((u: any) => u.role === 'staff').length,
      regular: (users || []).filter((u: any) => u.role === 'user').length
    };

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: transformedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      },
      statistics: stats,
      filters: {
        search,
        role,
        is_active: isActive,
        email_verified: emailVerified,
        date_from: dateFrom,
        date_to: dateTo
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Get users API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  const { user: adminUser, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json(
      { success: false, error: authError }, 
      { status: authError === 'Unauthorized' ? 401 : 403 }
    );
  }

  try {
    const supabase = createClient();
    const body = await request.json();

    // Validate required fields
    const { email, name, role = 'user', phone, password } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['super_admin', 'admin', 'staff', 'user'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already in use' },
        { status: 409 }
      );
    }

    // Create user data
    const userData: any = {
      email,
      name,
      phone: phone || null,
      role,
      is_active: true,
      email_verified: false,
      phone_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // In a real application, you would:
    // 1. Hash the password properly
    // 2. Use Supabase Auth API for user creation
    // 3. Send verification email
    if (password && password.length >= 6) {
      // Note: This is just for demo. In production, use proper password hashing
      userData.password = password; // Should be hashed
    }

    // Insert user
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select(`
        id,
        email,
        name,
        phone,
        role,
        is_active,
        email_verified,
        phone_verified,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Create user error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Log the creation activity
    await supabase
      .from('admin_activities')
      .insert({
        admin_id: adminUser?.id,
        action: 'CREATE_USER',
        target_type: 'user',
        target_id: data.id,
        details: {
          user_email: data.email,
          role: data.role,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      data,
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create user API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}