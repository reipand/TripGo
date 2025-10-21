# 📧 Setup Email Verification System untuk TripGo

## 🚀 Overview

Sistem email verifikasi TripGo memungkinkan user untuk:
- Mendaftar dengan email dan password
- Menerima kode verifikasi 6 digit via email
- Memverifikasi akun dengan kode yang dikirim
- Mengakses dashboard setelah verifikasi berhasil

## 📋 Langkah-langkah Setup

### 1. Setup Database di Supabase

1. **Buka Supabase Dashboard:**
   - Pergi ke: https://supabase.com/dashboard/project/huwcvhngslkmfljfnxrv
   - Klik **SQL Editor** di sidebar

2. **Jalankan SQL Script:**
   - Copy semua isi dari file `supabase-setup.sql`
   - Paste ke SQL Editor
   - Klik **Run** untuk menjalankan script

3. **Verifikasi Table:**
   - Pergi ke **Table Editor**
   - Pastikan table `users` sudah dibuat
   - Pastikan ada trigger `on_auth_user_created`

### 2. Konfigurasi Email di Supabase

1. **Pergi ke Authentication Settings:**
   - Klik **Authentication** > **Settings**
   - Scroll ke bagian **Email**

2. **Enable Email Confirmation:**
   - ✅ Centang **Enable email confirmations**
   - Set **Site URL**: `http://localhost:3000` (untuk development)
   - Set **Redirect URLs**: `http://localhost:3000/auth/verify-email`

3. **Konfigurasi Email Templates (Opsional):**
   - Anda bisa customize email template di **Email Templates**
   - Atau gunakan template yang sudah dibuat di folder `email-templates/`

### 3. Update Environment Variables

Pastikan file `.env.local` sudah dikonfigurasi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://huwcvhngslkmfljfnxrv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Test Sistem

1. **Restart Development Server:**
   ```bash
   npm run dev
   ```

2. **Test Registration Flow:**
   - Buka `http://localhost:3000/auth/register`
   - Isi form registrasi
   - Submit form
   - Cek email untuk kode verifikasi

3. **Test Verification:**
   - Buka `http://localhost:3000/auth/verify-email?email=your-email@example.com`
   - Masukkan kode 6 digit
   - Klik verifikasi

## 🔧 Fitur yang Tersedia

### ✅ Authentication Features
- **User Registration** dengan email dan password
- **Email Verification** dengan kode 6 digit
- **Auto-generated verification codes** dengan expiry 5 menit
- **Resend verification code** functionality
- **Email confirmation** via Supabase
- **User profile** dengan metadata (nama, telepon)

### ✅ UI/UX Features
- **Responsive Design** untuk semua perangkat
- **Auto-focus** pada input kode verifikasi
- **Paste support** untuk kode verifikasi
- **Timer countdown** untuk expiry kode
- **Loading states** dan error handling
- **Success confirmation** page

### ✅ Security Features
- **6-digit verification codes** dengan expiry time
- **Rate limiting** untuk resend code
- **Secure code generation** di database level
- **Email validation** dan sanitization
- **Session management** dengan Supabase

## 📱 Halaman yang Dibuat

### 1. **Registration Page** (`/auth/register`)
- Form registrasi lengkap
- Validasi input
- Redirect ke verification page setelah submit

### 2. **Verification Page** (`/auth/verify-email`)
- Input kode 6 digit dengan auto-focus
- Timer countdown untuk expiry
- Resend code functionality
- Error handling dan loading states

### 3. **Success Page** (`/auth/verify-success`)
- Konfirmasi verifikasi berhasil
- Quick start guide
- Auto redirect ke dashboard
- CTA buttons untuk next steps

## 🗄️ Database Schema

### Table: `users`
```sql
- id (UUID, Primary Key, References auth.users)
- email (TEXT, Unique, Not Null)
- first_name (TEXT)
- last_name (TEXT)
- phone (TEXT)
- avatar_url (TEXT)
- email_verified (BOOLEAN, Default: FALSE)
- verification_code (TEXT)
- verification_expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Functions:
- `handle_new_user()` - Auto create user profile
- `generate_verification_code()` - Generate 6-digit code
- `verify_email_with_code()` - Verify email with code
- `resend_verification_code()` - Resend verification code

## 📧 Email Templates

### 1. **Verification Code Email**
- Template: `email-templates/verification-code.html`
- Menampilkan kode 6 digit
- Expiry notice (5 menit)
- Security notice
- Responsive design

### 2. **Confirmation Success Email**
- Template: `email-templates/confirmation-success.html`
- Success confirmation
- Quick start guide
- CTA buttons
- Welcome message

## 🔄 Flow Diagram

```
User Registration
       ↓
Fill Registration Form
       ↓
Submit Form → Supabase Auth
       ↓
Email Verification Required?
       ↓
Redirect to /auth/verify-email
       ↓
User receives email with code
       ↓
User enters 6-digit code
       ↓
Code Valid & Not Expired?
       ↓
Update user.email_verified = TRUE
       ↓
Redirect to /auth/verify-success
       ↓
Auto redirect to /dashboard
```

## 🚨 Troubleshooting

### Error: "User not found"
- Pastikan user sudah terdaftar di Supabase
- Cek table `users` di database

### Error: "Invalid verification code"
- Pastikan kode 6 digit benar
- Cek apakah kode sudah expired (5 menit)
- Coba resend code

### Error: "Email already verified"
- User sudah pernah verifikasi
- Redirect langsung ke dashboard

### Email tidak terkirim
- Cek konfigurasi email di Supabase
- Pastikan email confirmation enabled
- Cek spam folder

## 📞 Support

Jika mengalami masalah:
1. Cek Supabase Dashboard > Logs
2. Cek browser console untuk error
3. Pastikan environment variables benar
4. Restart development server

---

**Happy Coding! 🎉**
