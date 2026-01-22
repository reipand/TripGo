// components/admin/stats-cards.tsx
import {
  BarChart3,
  Calendar,
  CreditCard,
  Ticket,
  Train,
  Users,
  Clock,
  AlertCircle
} from 'lucide-react'

interface StatsCardsProps {
  stats: {
    totalBookings: number
    todayBookings: number
    totalRevenue: number
    todayRevenue: number
    activeUsers: number
    pendingPayments: number
    availableTrains: number
    scheduledTrips: number
  }
}

export function AdminStatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Booking',
      value: stats.totalBookings.toLocaleString(),
      change: `${stats.todayBookings} hari ini`,
      icon: Ticket,
      color: 'bg-blue-500',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Pendapatan Total',
      value: `Rp${stats.totalRevenue.toLocaleString('id-ID')}`,
      change: `Rp${stats.todayRevenue.toLocaleString('id-ID')} hari ini`,
      icon: CreditCard,
      color: 'bg-green-500',
      iconColor: 'text-green-500'
    },
    {
      title: 'Pengguna Aktif',
      value: stats.activeUsers.toLocaleString(),
      change: '30 hari terakhir',
      icon: Users,
      color: 'bg-purple-500',
      iconColor: 'text-purple-500'
    },
    {
      title: 'Pembayaran Tertunda',
      value: stats.pendingPayments.toString(),
      change: 'Perlu tindakan',
      icon: AlertCircle,
      color: 'bg-yellow-500',
      iconColor: 'text-yellow-500'
    },
    {
      title: 'Kereta Tersedia',
      value: stats.availableTrains.toString(),
      change: 'Dalam operasi',
      icon: Train,
      color: 'bg-red-500',
      iconColor: 'text-red-500'
    },
    {
      title: 'Perjalanan Terjadwal',
      value: stats.scheduledTrips.toString(),
      change: '7 hari ke depan',
      icon: Calendar,
      color: 'bg-indigo-500',
      iconColor: 'text-indigo-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-xs text-gray-500 mt-1">{card.change}</p>
              </div>
              <div className={`p-3 rounded-full ${card.color} bg-opacity-10`}>
                <Icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}