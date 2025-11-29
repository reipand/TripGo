# Admin Panel Notifications & Email Guide

## Overview
Admin panel TripGo sekarang memiliki fitur lengkap untuk:
- ✅ CRUD lengkap untuk Users, Bookings, Transactions, Notifications
- ✅ Push Notifications (Real-time via Supabase)
- ✅ Email Notifications (via SMTP/Gmail)
- ✅ Automatic notifications saat CRUD operations

## Fitur Notifikasi

### 1. Push Notifications (Real-time)
- **Real-time updates** via Supabase subscriptions
- **Browser notifications** saat permission granted
- **Automatic sync** dengan database
- Tidak perlu refresh halaman

### 2. Email Notifications
- **Email HTML** dengan design modern
- **Auto-send** saat notifikasi dibuat (jika `send_email: true`)
- **Email tracking** via `sent_at` field
- **Fallback** jika email gagal (notification tetap tersimpan)

## Admin CRUD Operations dengan Notifikasi

### Users Management
**File**: `app/admin/users/page.tsx`

1. **Create User**: User baru otomatis mendapat welcome notification
2. **Update User**:
   - Jika role berubah → notification + email dengan priority 'high'
   - Pesan: "Role Anda telah diubah menjadi {role}"
3. **Delete User**: Tidak ada notification (user sudah dihapus)

### Bookings Management
**File**: `app/admin/bookings/page.tsx`

1. **Update Booking**:
   - Jika status berubah → notification + email otomatis
   - Status messages:
     - `confirmed`: "Pesanan Anda telah dikonfirmasi!"
     - `cancelled`: "Pesanan Anda telah dibatalkan." (priority: high)
     - `completed`: "Pesanan Anda telah selesai."
   - Data include: order_id, old_status, new_status

### Notifications Management
**File**: `app/admin/notifications/page.tsx`

1. **Create Notification**:
   - Opsi kirim email (checkbox `send_email`)
   - User lookup via email (auto-fill user_id)
   - Priority selection (low, medium, high, urgent)
   - JSON data support untuk metadata
   - Broadcast support (kosongkan user_id)

2. **Edit Notification**: Update notification yang sudah ada
3. **Delete Notification**: Hapus notification dari database

## API Endpoints

### 1. Send Notification (dengan Email)
**POST** `/api/admin/notifications/send`

**Request Body**:
```json
{
  "user_id": "uuid-atau-null-untuk-broadcast",
  "type": "system|booking|payment|flight",
  "title": "Judul Notifikasi",
  "message": "Pesan notifikasi",
  "priority": "low|medium|high|urgent",
  "send_email": true,
  "data": {
    "key": "value"
  }
}
```

**Response**:
```json
{
  "success": true,
  "notification": { ... },
  "email_sent": true
}
```

### 2. Update Notification
**PUT** `/api/admin/notifications/[id]`

### 3. Delete Notification
**DELETE** `/api/admin/notifications/[id]`

## Notification Helper

**File**: `app/lib/notification-helper.ts`

Fungsi helper untuk mengirim notifikasi:

```typescript
import { sendNotification } from '@/app/lib/notification-helper';

// Send notification dengan email
const result = await sendNotification(
  {
    user_id: 'user-uuid',
    type: 'booking',
    title: 'Pesanan Dikonfirmasi',
    message: 'Pesanan Anda telah dikonfirmasi',
    priority: 'high',
    data: { order_id: 'TRP123' }
  },
  { send_email: true }
);

// Broadcast notification
const result = await broadcastNotification(
  {
    type: 'system',
    title: 'Maintenance',
    message: 'Sistem akan maintenance...',
    priority: 'urgent'
  },
  ['user-id-1', 'user-id-2'],
  { send_email: true }
);
```

## Email Template

Email notifications menggunakan HTML template dengan:
- **Header**: TripGo branding dengan gradient blue
- **Personalization**: "Halo {first_name}"
- **Content**: Title dan message dengan styling
- **Data display**: JSON data jika tersedia
- **CTA button**: Link ke dashboard
- **Footer**: Copyright dan disclaimer

## Real-time Push Notifications

Push notifications bekerja via:
1. **Supabase Realtime**: Subscribe ke table `notifications`
2. **RealtimeNotifications Component**: Auto-update saat ada notifikasi baru
3. **Browser Notifications**: Show browser notification jika permission granted

**Setup**:
- Component `RealtimeNotifications` sudah ada di codebase
- Auto-subscribe saat user login
- Real-time sync dengan database

## Database Schema

**Notifications Table**:
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium',
  sent_at TIMESTAMP, -- Timestamp saat email terkirim
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Usage Examples

### 1. Admin mengubah status booking
```typescript
// Di admin bookings page
await fetch('/api/admin/bookings/[id]', {
  method: 'PUT',
  body: JSON.stringify({ status: 'confirmed' })
});

// Otomatis trigger notification + email
```

### 2. Admin mengubah role user
```typescript
// Di admin users page
await fetch('/api/admin/users/[id]', {
  method: 'PUT',
  body: JSON.stringify({ role: 'admin' })
});

// Otomatis trigger notification + email
```

### 3. Admin kirim manual notification
```typescript
// Di admin notifications page
await fetch('/api/admin/notifications/send', {
  method: 'POST',
  body: JSON.stringify({
    user_id: 'user-uuid',
    type: 'system',
    title: 'Important Update',
    message: 'Ada update penting...',
    priority: 'high',
    send_email: true
  })
});
```

## Configuration

### SMTP Setup (untuk Email)
Pastikan environment variables sudah di-set:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=TripGo <your-email@gmail.com>
```

### Base URL
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Troubleshooting

### Email tidak terkirim
1. Check SMTP credentials di `.env.local`
2. Verify Gmail App Password sudah benar
3. Check email di `sent_at` field (jika terisi berarti email terkirim)
4. Check server logs untuk error details

### Push notification tidak muncul
1. Check Supabase Realtime subscription
2. Verify `RealtimeNotifications` component sudah di-mount
3. Check browser notification permission
4. Verify user_id match dengan logged in user

### Notification tidak tersimpan
1. Check RBAC permissions (admin required)
2. Verify API endpoint authentication
3. Check database connection
4. Review error logs di browser console

## Best Practices

1. **Priority Selection**:
   - `low`: Informational updates
   - `medium`: Regular notifications
   - `high`: Important updates (role changes, booking status)
   - `urgent`: Critical alerts

2. **Email Frequency**:
   - Jangan kirim email terlalu sering
   - Use email untuk update penting saja
   - Push notification untuk real-time updates

3. **Broadcast Notifications**:
   - Gunakan untuk announcements penting
   - Pastikan message jelas dan actionable
   - Use priority 'high' atau 'urgent' untuk broadcast

4. **Error Handling**:
   - Notification tetap tersimpan meski email gagal
   - Log errors untuk debugging
   - Don't block CRUD operations jika notification gagal

## Summary

✅ **CRUD Lengkap**: Users, Bookings, Transactions, Notifications
✅ **Push Notifications**: Real-time via Supabase
✅ **Email Notifications**: HTML template via SMTP
✅ **Auto Notifications**: Trigger saat CRUD operations
✅ **Error Handling**: Proper error messages dan fallbacks
✅ **User Experience**: Smooth transitions dan loading states

Semua fitur sudah terintegrasi dan siap digunakan!

