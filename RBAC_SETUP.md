# RBAC (Role-Based Access Control) Setup Guide

## Overview
Sistem RBAC menggantikan hardcoded admin ID dengan sistem role yang lebih aman dan skalabel.

## Roles yang Tersedia

1. **user** - Pengguna biasa (default)
2. **admin** - Administrator dengan akses penuh kecuali super admin features
3. **super_admin** - Super Administrator dengan akses penuh
4. **customer_service** - Customer Service dengan akses ke users dan bookings
5. **finance** - Finance dengan akses ke bookings, payments, dan reports

## Setup Database

1. Jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Add role column to users table (jika belum ada)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
CHECK (role IN ('user', 'admin', 'super_admin', 'customer_service', 'finance'));

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Set admin role untuk user tertentu
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'admin@tripgo.com';
```

## Usage

### Client-Side Components

```tsx
import { isAdmin } from '@/app/lib/rbac';
import AdminRoute from '@/app/components/AdminRoute';

// Wrap admin pages
<AdminRoute>
  <AdminPage />
</AdminRoute>
```

### API Routes

```typescript
import { requireAdmin } from '@/app/lib/api-auth';

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin(request);
  
  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }
  
  // Your admin logic here
}
```

### Check Permissions

```typescript
import { hasPermission } from '@/app/lib/rbac';

const canManageUsers = await hasPermission(userId, 'users');
const canViewReports = await hasPermission(userId, 'reports');
```

## Migration dari Hardcoded Admin

1. Update semua API routes yang menggunakan `ADMIN_USER_ID` dengan `requireAdmin()`
2. Update `AdminRoute` component untuk menggunakan `isAdmin()`
3. Set role 'super_admin' untuk admin user pertama

## Troubleshooting

### Error: "Unauthorized" pada API route
- Pastikan request mengirim header `Authorization: Bearer <token>`
- Pastikan user memiliki role admin atau super_admin

### Error: "Forbidden" pada API route
- User tidak memiliki permission yang diperlukan untuk action tersebut
- Check role permissions di `app/lib/rbac.ts`

### User tidak terdeteksi sebagai admin
- Pastikan kolom `role` sudah di-set di database
- Pastikan user memiliki role yang valid (admin, super_admin, dll)

