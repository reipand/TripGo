import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Get date range from query
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Fetch all stats in parallel
    const [
      bookingsData,
      revenueData,
      usersData,
      trainsData,
      transactionsData,
      topRoutesData
    ] = await Promise.all([
      // Bookings stats
      supabase
        .from('bookings_kereta')
        .select('id, status, booking_date, total_amount, payment_status')
        .gte('booking_date', startDate.toISOString()),
      
      // Revenue data
      supabase
        .from('bookings_kereta')
        .select('total_amount, booking_date')
        .eq('payment_status', 'paid')
        .gte('booking_date', startDate.toISOString())
        .order('booking_date', { ascending: true }),
      
      // Users data
      supabase
        .from('users')
        .select('id, created_at, last_login, role')
        .gte('created_at', startDate.toISOString()),
      
      // Trains data
      supabase
        .from('kereta')
        .select('id, nama_kereta, is_active, jumlah_kursi, tipe_kereta'),
      
      // Transactions data
      supabase
        .from('payment_transactions')
        .select('amount, status, created_at')
        .gte('created_at', startDate.toISOString()),
      
      // Top routes data (simplified query)
      supabase
        .from('bookings_kereta')
        .select('origin, destination, count')
        .limit(5)
    ]);

    // Calculate bookings stats
    const totalBookings = bookingsData.data?.length || 0;
    const confirmedBookings = bookingsData.data?.filter(b => 
      ['confirmed', 'paid'].includes(b.status)
    ).length || 0;
    const cancelledBookings = bookingsData.data?.filter(b => 
      b.status === 'cancelled'
    ).length || 0;
    
    // Calculate revenue stats
    const totalRevenue = revenueData.data?.reduce((sum, item) => 
      sum + (item.total_amount || 0), 0
    ) || 0;
    
    // Calculate revenue by date for chart
    const revenueByDate: Record<string, number> = {};
    revenueData.data?.forEach(item => {
      const date = new Date(item.booking_date).toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + (item.total_amount || 0);
    });
    
    const revenueChartData = Object.entries(revenueByDate).map(([date, amount]) => ({
      date,
      amount
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate users stats
    const newUsers = usersData.data?.length || 0;
    const activeUsers = usersData.data?.filter(u => 
      u.last_login && new Date(u.last_login) > startDate
    ).length || 0;
    
    // Calculate user roles distribution
    const roleDistribution = usersData.data?.reduce((acc: Record<string, number>, user) => {
      const role = user.role || 'user';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate trains stats
    const totalTrains = trainsData.data?.length || 0;
    const activeTrains = trainsData.data?.filter(t => t.is_active).length || 0;
    const totalSeats = trainsData.data?.reduce((sum, train) => 
      sum + (train.jumlah_kursi || 0), 0
    ) || 0;
    
    // Calculate train types distribution
    const trainTypeDistribution = trainsData.data?.reduce((acc: Record<string, number>, train) => {
      const type = train.tipe_kereta || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Calculate transactions stats
    const totalTransactions = transactionsData.data?.length || 0;
    const successfulTransactions = transactionsData.data?.filter(t => 
      t.status === 'success'
    ).length || 0;
    const transactionRevenue = transactionsData.data?.filter(t => 
      t.status === 'success'
    ).reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    
    // Process top routes
    const topRoutes = topRoutesData.data?.map(route => ({
      route: `${route.origin} → ${route.destination}`,
      bookings: route.count || 0,
      revenue: Math.floor(Math.random() * 100000000) + 50000000 // Mock data for now
    })) || [];

    // Calculate growth percentages (simplified - in real app, compare with previous period)
    const calculateGrowth = (current: number, previous: number = current * 0.8) => {
      if (previous === 0) return 100;
      return ((current - previous) / previous) * 100;
    };

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          bookings: {
            total: totalBookings,
            confirmed: confirmedBookings,
            cancelled: cancelledBookings,
            growth: calculateGrowth(totalBookings)
          },
          revenue: {
            total: totalRevenue,
            dailyAverage: totalRevenue / (period === '7d' ? 7 : 30),
            growth: calculateGrowth(totalRevenue)
          },
          users: {
            new: newUsers,
            active: activeUsers,
            total: (await supabase.from('users').select('*', { count: 'exact' })).count || 0,
            growth: calculateGrowth(newUsers)
          },
          trains: {
            total: totalTrains,
            active: activeTrains,
            seats: totalSeats,
            occupancy: 78.5 // This would need actual calculation
          }
        },
        charts: {
          revenue: revenueChartData,
          bookings: [], // Similar logic for bookings chart
          users: [] // Similar logic for users chart
        },
        distributions: {
          userRoles: roleDistribution,
          trainTypes: trainTypeDistribution
        },
        topRoutes: topRoutes.slice(0, 5)
      },
      period,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        code: error.code
      },
      { status: 500 }
    );
  }
}