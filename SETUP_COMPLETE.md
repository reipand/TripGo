# TripGo Setup Complete - Quick Start Guide

## ✅ Setup yang Sudah Dilakukan

### 1. Database Schema ✅
- **File**: `supabase-minimal-schema.sql` (run ini terlebih dahulu)
- **File**: `supabase-flights-schema.sql` (untuk flights/schedules)
- **Tables**: users, transactions, bookings, notifications, cities, routes, transportations, schedules

### 2. Midtrans Sandbox ✅
- **API Endpoint**: `/api/payment/create-transaction` (menggunakan Midtrans Snap)
- **Webhook**: `/api/payment/webhook` (verifikasi signature)
- **Component**: `PaymentGateway.tsx` (integrasi Snap.js)
- **Config**: Environment variables di `.env.local`

### 3. Admin Panel ✅
- **Layout**: `/app/admin/layout.tsx` (sidebar navigation)
- **Dashboard**: `/app/admin/page.tsx` (overview stats)
- **Users**: `/app/admin/users/page.tsx` (CRUD lengkap)
- **Bookings**: `/app/admin/bookings/page.tsx` (CRUD lengkap)
- **Transactions**: `/app/admin/transactions/page.tsx` (view & filter)
- **Notifications**: `/app/admin/notifications/page.tsx` (CRUD + email)
- **Analytics**: `/app/admin/analytics/page.tsx` (charts & stats)

### 4. RBAC System ✅
- **File**: `app/lib/rbac.ts` (role-based access control)
- **File**: `app/lib/api-auth.ts` (API authentication)
- **Component**: `app/components/AdminRoute.tsx` (protected routes)
- **Roles**: user, admin, super_admin, customer_service, finance

### 5. Notifications System ✅
- **Push Notifications**: Real-time via Supabase subscriptions
- **Email Notifications**: SMTP/Gmail integration
- **API**: `/api/admin/notifications/send` (send dengan email)
- **Helper**: `app/lib/notification-helper.ts`

### 6. SMTP Email ✅
- **File**: `app/lib/mailer.ts` (Nodemailer setup)
- **API**: `/api/email/send` (send email endpoint)
- **Config**: Environment variables untuk Gmail SMTP

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=TripGo <your_gmail@gmail.com>

# Midtrans Sandbox
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
MIDTRANS_BASE_URL=https://api.sandbox.midtrans.com/v2

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Setup Database

Jalankan SQL berikut di Supabase SQL Editor (urutan penting):

**Step 1**: Run `supabase-minimal-schema.sql`
- Creates: users, transactions, bookings, notifications
- Sets up RLS policies
- Creates triggers

**Step 2**: Run `supabase-flights-schema.sql`
- Creates: cities, routes, transportations, schedules
- Inserts sample data (CGK-DPS route)
- Sets up RLS policies

### 4. Set Admin Role

Set role admin untuk user pertama:
```sql
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'your-admin-email@example.com';
```

### 5. Start Development Server
```bash
npm run dev
```

## 📋 Setup Checklist

### Database
- [ ] Run `supabase-minimal-schema.sql`
- [ ] Run `supabase-flights-schema.sql`
- [ ] Verify tables created
- [ ] Set admin role untuk user pertama

### Environment Variables
- [ ] Supabase URL & Keys
- [ ] SMTP credentials (Gmail)
- [ ] Midtrans Sandbox keys
- [ ] Base URL

### Gmail SMTP Setup
- [ ] Enable 2-Step Verification
- [ ] Create App Password
- [ ] Set SMTP_PASS dengan App Password

### Midtrans Sandbox
- [ ] Create Sandbox account
- [ ] Get Server Key & Client Key
- [ ] Set environment variables
- [ ] Configure webhook URL (untuk production)

### Testing
- [ ] Test user registration
- [ ] Test login
- [ ] Test flight search
- [ ] Test payment dengan test card
- [ ] Test admin panel access

## 🔍 Troubleshooting

### Database Error: "Cannot coerce the result to a single JSON object"
**Solution**: Query menggunakan `.single()` harus diganti dengan `.maybeSingle()` jika data mungkin tidak ada.

**Fixed in**:
- `app/api/search/flights/route.ts`
- `app/api/payment/create-transaction/route.ts`

### Payment Error: "Failed to create transaction token"
**Solution**: 
1. Check `MIDTRANS_SERVER_KEY` di `.env.local`
2. Verify key format: `SB-Mid-server-xxxxxxxx`
3. Restart dev server setelah update env vars

### Email Not Sending
**Solution**:
1. Verify SMTP credentials di `.env.local`
2. Check Gmail App Password (bukan password biasa)
3. Check server logs untuk SMTP errors

### Admin Panel Access Denied
**Solution**:
1. Verify user memiliki role admin/super_admin
2. Check `app/components/AdminRoute.tsx` permission logic
3. Update role di database:
```sql
UPDATE public.users SET role = 'super_admin' WHERE email = 'your-email@example.com';
```

## 📚 Documentation

Lihat file-file berikut untuk dokumentasi lengkap:
- `MIDTRANS_SETUP.md` - Midtrans setup guide
- `MIDTRANS_SANDBOX_SETUP.md` - Sandbox integration guide
- `RBAC_SETUP.md` - RBAC setup guide
- `ADMIN_PANEL_GUIDE.md` - Admin panel documentation
- `ADMIN_NOTIFICATIONS_GUIDE.md` - Notifications system guide

## 🎯 Next Steps

1. **Setup Database**: Run SQL files di Supabase
2. **Configure Environment**: Set semua env variables
3. **Test Payment**: Test dengan Midtrans Sandbox test cards
4. **Setup Webhook**: Configure webhook di Midtrans Dashboard (untuk production)
5. **Test Admin Panel**: Login sebagai admin dan test semua fitur

## 📞 Support

Jika ada masalah:
1. Check documentation files
2. Check error logs di browser console
3. Check server logs di terminal
4. Verify environment variables
5. Test dengan sample data

