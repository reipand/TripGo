import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import {
  BarChart3, Calendar, CreditCard, Ticket, Train, Users,
  Package, AlertCircle, TrendingUp, CheckCircle
} from 'lucide-react'
import { AdminStatsCards } from '@/app/components/admin/stats-cards'
import { RecentBookings } from '@/app/components/admin/recent-bookings'
import { RevenueChart } from '@/app/components/admin/revenue-chart'
import { TopRoutes } from '@/app/components/admin/top-routes'

export const dynamic = 'force-dynamic'

// Helper: Create Supabase Client
const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}

// Helper: Fetch Role from API
async function getUserRoleFromAPI() {
  try {
    const cookieStore = await cookies()
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/user-role`, {
      headers: { 'Cookie': cookieStore.toString() },
      cache: 'no-store'
    })
    if (response.ok) return await response.json()
  } catch (error) {
    console.error('Error fetching user role:', error)
  }
  return null
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth/login?redirect=/admin');
  }

  // Ambil role langsung dari database (bukan metadata saja agar aman)
  const { data: profile } = await supabase
    .from('profiles') // sesuaikan nama tabel profil Anda
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role?.toLowerCase() || user.user_metadata?.role?.toLowerCase();

  if (role !== 'admin' && role !== 'super_admin') {
    return redirect('/admin/dashboard');
  }

  // 3. Data Fetching
  try {
    const todayStr = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Gunakan Promise.allSettled agar jika satu tabel error, yang lain tetap jalan
    const [statsResults, recentBookingsRes, revenueChartRes] = await Promise.all([
      // Fetch Stats
      Promise.all([
        supabase.from('bookings_kereta').select('*', { count: 'exact', head: true }),
        supabase.from('bookings_kereta').select('*', { count: 'exact', head: true }).gte('booking_date', todayStr),
        supabase.from('bookings_kereta').select('total_amount').eq('status', 'confirmed'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('bookings_kereta').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending')
      ]),
      // Recent Bookings
      supabase.from('bookings_kereta').select('*').order('booking_date', { ascending: false }).limit(10),
      // Revenue Chart Data
      supabase.from('bookings_kereta').select('booking_date, total_amount').eq('status', 'confirmed').gte('booking_date', thirtyDaysAgo)
    ])

    // 4. Data Processing
    const totalBookings = statsResults[0].count || 0
    const todayBookings = statsResults[1].count || 0
    const totalRevenue = statsResults[2].data?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0
    const activeUsers = statsResults[3].count || 0
    const pendingPayments = statsResults[4].count || 0

    const stats = {
      totalBookings, todayBookings, totalRevenue,
      activeUsers, pendingPayments,
      todayRevenue: 0, // Bisa difilter dari data totalRevenue jika perlu
      availableTrains: 0, scheduledTrips: 0 // Tambahkan fetch jika tabel tersedia
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Selamat datang kembali, <strong>{userName}</strong>!</p>
          </header>

          <AdminStatsCards stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
               <h2 className="text-xl font-semibold mb-4">Pendapatan 30 Hari Terakhir</h2>
               <RevenueChart data={revenueChartRes.data || []} />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
               <h2 className="text-xl font-semibold mb-4">Rute Terpopuler</h2>
               <TopRoutes data={[]} /> {/* Isi dengan processing data rute */}
            </div>
          </div>

          <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Booking Terbaru</h2>
              <Link href="/admin/bookings" className="text-blue-600 hover:underline text-sm font-medium">Lihat Semua</Link>
            </div>
            <RecentBookings bookings={recentBookingsRes.data || []} />
          </div>
        </div>
      </div>
    )

  } catch (error) {
    console.error('Fatal Dashboard Error:', error)
    return <div className="p-10 text-center">Terjadi kesalahan memuat data.</div>
  }
}