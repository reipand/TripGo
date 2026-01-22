// components/admin/top-routes.tsx

interface TopRoute {
  route: string
  bookings: number
  revenue: number
  average_price: number
}

interface TopRoutesProps {
  data: TopRoute[]
}

export function TopRoutes({ data }: TopRoutesProps) {
  return (
    <div className="space-y-4">
      {data.slice(0, 5).map((route, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">{route.route}</div>
            <div className="text-sm text-gray-600">
              {route.bookings} booking • Rp{route.average_price.toLocaleString('id-ID')}/booking
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-gray-900">
              Rp{route.revenue.toLocaleString('id-ID')}
            </div>
            <div className="text-xs text-gray-500">total revenue</div>
          </div>
        </div>
      ))}
      {data.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          Tidak ada data rute
        </div>
      )}
    </div>
  )
}