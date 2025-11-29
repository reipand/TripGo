# Admin Panel Guide - TripGo

## Overview
Admin Panel TripGo menyediakan CRUD lengkap untuk mengelola users, bookings, transactions, dan notifications dengan interface yang modern dan responsif.

## Fitur Admin Panel

### 1. Dashboard
**Route**: `/admin`
- Overview statistik (Total Users, Bookings, Revenue, Pending Transactions)
- Recent bookings list
- Quick insights

### 2. Manajemen Pengguna (Users)
**Route**: `/admin/users`
- ✅ **View**: Daftar semua pengguna dengan filter dan search
- ✅ **Create**: Tambah pengguna baru (via API)
- ✅ **Update**: Edit profile, role, dan status email verification
- ✅ **Delete**: Hapus pengguna
- **Filters**: Search by email/nama, filter by role
- **Features**: 
  - Role management (user, admin, super_admin, customer_service, finance)
  - Email verification status
  - Responsive table dengan pagination-ready

### 3. Manajemen Pesanan (Bookings)
**Route**: `/admin/bookings`
- ✅ **View**: Daftar semua pesanan dengan detail lengkap
- ✅ **Update**: Edit status, customer info, total amount
- ✅ **Delete**: Hapus pesanan
- **Filters**: Search by order ID/nama/email, filter by status
- **Features**:
  - Status management (pending, confirmed, cancelled, completed)
  - Customer information display
  - Amount formatting dengan currency IDR

### 4. Manajemen Transaksi (Transactions)
**Route**: `/admin/transactions`
- ✅ **View**: Daftar semua transaksi dengan statistik
- **Filters**: Search by order ID/email/nama, filter by status
- **Features**:
  - Revenue statistics (total, pending count)
  - Payment type display
  - Status badges (settlement, capture, pending, deny, expire)
  - Transaction details (Midtrans transaction ID)

### 5. Manajemen Notifikasi (Notifications)
**Route**: `/admin/notifications`
- ✅ **View**: Daftar semua notifikasi
- ✅ **Create**: Kirim notifikasi ke user spesifik atau broadcast
- ✅ **Delete**: Hapus notifikasi
- **Filters**: Search by title/message, filter by type dan read status
- **Features**:
  - Broadcast notifications (kosongkan user_id)
  - Type selection (system, booking, payment, flight)
  - Read/unread status tracking

### 6. Analytics Dashboard
**Route**: `/admin/analytics`
- ✅ **Overview Stats**: Total users, bookings, revenue
- ✅ **Bookings by Status**: Breakdown pesanan per status
- ✅ **Top Users**: Top 5 pengguna berdasarkan total spending
- ✅ **Revenue Chart**: Pendapatan per bulan
- **Period Selection**: Week, Month, Year

## Struktur Admin Panel

### Layout Component
- **File**: `app/admin/layout.tsx`
- **Features**:
  - Sidebar navigation dengan collapsible
  - User info display
  - Logout functionality
  - Active route highlighting
  - Responsive design

### API Routes
Semua API routes menggunakan RBAC (Role-Based Access Control):

1. **Users API**
   - `GET /api/admin/users` - List users dengan filters
   - `POST /api/admin/users` - Create user
   - `PUT /api/admin/users/[id]` - Update user
   - `DELETE /api/admin/users/[id]` - Delete user

2. **Bookings API**
   - `GET /api/admin/bookings` - List bookings dengan filters
   - `POST /api/admin/bookings` - Create booking
   - `PUT /api/admin/bookings/[id]` - Update booking
   - `DELETE /api/admin/bookings/[id]` - Delete booking

3. **Transactions API**
   - `GET /api/admin/transactions` - List transactions dengan filters

4. **Notifications API** (implied, menggunakan direct Supabase calls)
   - Create, Read, Delete notifications

## Setup & Usage

### 1. Database Setup
Pastikan schema sudah di-update dengan kolom `role`:
```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('user', 'admin', 'super_admin', 'customer_service', 'finance'));
```

### 2. Set Admin Role
Set role admin untuk user pertama:
```sql
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'admin@tripgo.com';
```

### 3. Access Admin Panel
1. Login sebagai admin/super_admin
2. Navigate ke `/admin`
3. Sidebar navigation akan muncul dengan menu lengkap

### 4. Authentication
Semua admin routes dilindungi dengan `AdminRoute` component yang:
- Cek authentication
- Verifikasi role admin/super_admin
- Redirect ke dashboard jika bukan admin

## Features Details

### Search & Filter
Semua halaman memiliki:
- **Search**: Real-time search pada kolom utama (email, nama, order ID)
- **Filter**: Dropdown filters untuk status, role, type
- **Responsive**: Table scroll horizontal di mobile

### Modal Forms
- **Create Modal**: Untuk menambah data baru
- **Edit Modal**: Untuk update data existing
- **Validation**: Client-side validation
- **Error Handling**: Error messages yang user-friendly

### UI/UX Features
- **Loading States**: LoadingSpinner component
- **Empty States**: EmptyState component dengan CTA
- **Transitions**: Smooth transitions pada semua interactions
- **Responsive Design**: Mobile-friendly dengan sidebar collapse
- **Color Coding**: Status badges dengan warna konsisten

## Security

### RBAC Implementation
- Semua API routes menggunakan `requireAdmin()` helper
- Client-side protection dengan `AdminRoute` component
- Role-based permissions di database

### API Authentication
API routes menggunakan Bearer token authentication:
```typescript
// Header required
Authorization: Bearer <token>
```

### Data Validation
- Input validation di client-side
- Server-side validation di API routes
- SQL injection protection via Supabase client

## Next Steps / Improvements

### Recommended Enhancements
1. **Pagination**: Tambahkan pagination untuk large datasets
2. **Export Data**: Export ke CSV/Excel untuk reporting
3. **Bulk Operations**: Bulk delete/update untuk efficiency
4. **Activity Logs**: Track admin actions untuk audit
5. **Advanced Filters**: Date range filters, multi-select filters
6. **Real-time Updates**: WebSocket untuk real-time data updates
7. **Advanced Analytics**: Charts dengan Chart.js atau Recharts
8. **Email Notifications**: Email admin saat ada action penting

### Performance Optimizations
1. **Data Caching**: Cache frequently accessed data
2. **Lazy Loading**: Load data on-demand
3. **Optimistic Updates**: Update UI sebelum API response
4. **Debounce Search**: Debounce search input untuk reduce API calls

## Troubleshooting

### Issue: "Unauthorized" di API routes
- **Solution**: Pastikan user memiliki role admin/super_admin
- Check Authorization header dengan Bearer token

### Issue: Sidebar tidak muncul
- **Solution**: Check `AdminRoute` component wrapping
- Verify user authentication dan role

### Issue: Data tidak muncul
- **Solution**: Check Supabase connection
- Verify RLS policies untuk admin access
- Check browser console untuk errors

### Issue: Modal tidak close
- **Solution**: Check state management
- Verify form submission handling

## Support
Untuk issues atau questions:
1. Check dokumentasi ini
2. Review code di `app/admin/` directory
3. Check API routes di `app/api/admin/` directory
4. Verify database schema dan permissions

