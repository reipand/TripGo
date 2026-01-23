// app/api/admin/users/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/api-auth';

// GET - List users with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  console.log('=== /api/admin/users GET called ===');
  
  try {
    const { user: adminUser, error: authError } = await requireAdmin(request);
    
    console.log('Auth check result:', { 
      hasUser: !!adminUser, 
      authError, 
      userRole: adminUser?.role,
      userId: adminUser?.id 
    });
    
    if (authError) {
      // Provide more specific error messages
      if (authError === 'Unauthorized') {
        console.log('Returning 401 - Unauthorized');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Authentication required. Please login.',
            code: 'UNAUTHORIZED'
          }, 
          { status: 401 }
        );
      } else if (authError === 'Forbidden') {
        console.log('Returning 403 - Forbidden');
        return NextResponse.json(
          { 
            success: false, 
            error: `Access denied. Your role (${adminUser?.role || 'unknown'}) does not have admin privileges.`,
            code: 'FORBIDDEN',
            userRole: adminUser?.role
          }, 
          { status: 403 }
        );
      }
      
      // Fallback
      return NextResponse.json(
        { success: false, error: authError }, 
        { status: 403 }
      );
    }

    console.log('User is authorized, proceeding with query...');
    
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;

    // Log the request parameters
    console.log('Request params:', Object.fromEntries(searchParams.entries()));

    // Pagination dengan default values
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;

    // Filters - handle both naming conventions
    const search = searchParams.get('search') || searchParams.get('q') || '';
    const role = searchParams.get('role') || '';
    const isActive = searchParams.get('is_active') || searchParams.get('isActive');
    const emailVerified = searchParams.get('email_verified');
    const dateFrom = searchParams.get('date_from') || searchParams.get('startDate');
    const dateTo = searchParams.get('date_to') || searchParams.get('endDate');

    // Sorting - handle both naming conventions
    const sortBy = searchParams.get('sort_by') || searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || searchParams.get('sortOrder') || 'desc';

    console.log('Processed params:', { 
      page, limit, offset, search, role, 
      isActive, emailVerified, dateFrom, dateTo, sortBy, sortOrder 
    });

    // Build base query (without bookings join to avoid foreign key error)
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        phone,
        role,
        is_active,
        email_verified,
        phone_verified,
        last_login,
        created_at,
        updated_at,
        metadata
      `, { count: 'exact' });

    // Apply search filter
    if (search && search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply role filter
    if (role && role !== 'all' && role !== '') {
      query = query.eq('role', role);
    }

    // Apply status filters
    if (isActive !== null && isActive !== undefined) {
      const isActiveBool = isActive === 'true' || isActive === true;
      query = query.eq('is_active', isActiveBool);
    }

    if (emailVerified !== null && emailVerified !== undefined) {
      const emailVerifiedBool = emailVerified === 'true' || emailVerified === true;
      query = query.eq('email_verified', emailVerifiedBool);
    }

    // Apply date filters
    if (dateFrom) {
      try {
        const fromDate = new Date(dateFrom);
        if (!isNaN(fromDate.getTime())) {
          query = query.gte('created_at', fromDate.toISOString());
        }
      } catch (e) {
        console.warn('Invalid date_from format:', dateFrom);
      }
    }

    if (dateTo) {
      try {
        const toDate = new Date(dateTo);
        if (!isNaN(toDate.getTime())) {
          query = query.lte('created_at', toDate.toISOString());
        }
      } catch (e) {
        console.warn('Invalid date_to format:', dateTo);
      }
    }

    // Apply sorting dengan field mapping
    let sortField = 'created_at';
    if (sortBy === 'name') sortField = 'name';
    else if (sortBy === 'email') sortField = 'email';
    else if (sortBy === 'last_login') sortField = 'last_login';
    else if (sortBy === 'updated_at') sortField = 'updated_at';
    else if (sortBy === 'role') sortField = 'role';
    
    query = query.order(sortField, { 
      ascending: sortOrder.toLowerCase() === 'asc',
      nullsFirst: sortField === 'last_login' // Handle null last_login
    });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    console.log('Executing Supabase query...');
    
    // Execute query to get users
    const { data: users, count, error } = await query;

    if (error) {
      console.error('Users query error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch users from database',
          details: error.message,
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

    console.log(`Query successful: ${users?.length || 0} users found, total count: ${count}`);

    // If we have users, fetch their bookings separately
    const usersWithBookings = [];
    if (users && users.length > 0) {
      for (const user of users) {
        try {
          // Fetch bookings for each user
          const { data: bookings } = await supabase
            .from('bookings_kereta')
            .select('id, total_price, status')
            .eq('user_id', user.id); // Assuming this column exists
          
          // Add bookings to user object
          const userWithBookings = {
            ...user,
            bookings: bookings || []
          };
          usersWithBookings.push(userWithBookings);
        } catch (bookingError) {
          console.warn(`Failed to fetch bookings for user ${user.id}:`, bookingError);
          // If booking fetch fails, add user without bookings
          usersWithBookings.push({
            ...user,
            bookings: []
          });
        }
      }
    }

    // Transform data
    const transformedUsers = usersWithBookings.map(user => {
      // Remove sensitive data
      const { password, refresh_token, ...safeUserData } = user as any;
      
      // Calculate booking stats
      const bookings = user.bookings || [];
      const bookingStats = {
        count: bookings.length,
        total_spent: bookings.reduce((sum: number, b: any) => sum + (b.total_price || 0), 0),
        completed: bookings.filter((b: any) => 
          b.status === 'completed' || b.status === 'confirmed' || b.status === 'success'
        ).length,
        pending: bookings.filter((b: any) => 
          b.status === 'pending' || b.status === 'processing'
        ).length,
        cancelled: bookings.filter((b: any) => 
          b.status === 'cancelled' || b.status === 'failed'
        ).length
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
            : 'Never',
          updated_at: new Date(user.updated_at).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        },
        statistics: {
          bookings: bookingStats
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

    console.log('Returning successful response');
    
    return NextResponse.json({
      success: true,
      data: transformedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        total_pages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
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
      },
      meta: {
        currentAdmin: {
          id: adminUser?.id,
          email: adminUser?.email,
          role: adminUser?.role
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Get users API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}