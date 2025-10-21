# TripGo Authentication Setup Guide

## Overview
Panduan lengkap untuk setup sistem autentikasi Supabase yang mencakup register, login, verify email, reset password, dan forgot password.

## Features yang Tersedia

### 1. User Registration
- ✅ Validasi email format
- ✅ Validasi password strength (min 8 karakter, huruf besar/kecil, angka)
- ✅ Auto-create user profile di tabel `users`
- ✅ Email verification required
- ✅ Redirect ke halaman verifikasi

### 2. Email Verification
- ✅ 6-digit verification code
- ✅ Code expires dalam 10 menit
- ✅ Resend verification code
- ✅ Token-based verification
- ✅ Auto-redirect setelah verifikasi berhasil

### 3. User Login
- ✅ Email/password authentication
- ✅ Validasi email format
- ✅ Error handling untuk berbagai kondisi
- ✅ Auto-fetch user profile
- ✅ Session management

### 4. Password Reset
- ✅ Forgot password dengan email
- ✅ Reset password dengan token
- ✅ Validasi password strength
- ✅ Auto-redirect setelah reset berhasil

### 5. Session Management
- ✅ Auto-refresh token
- ✅ Persistent session
- ✅ Session detection in URL
- ✅ Logout functionality

## Database Setup

### 1. Jalankan SQL Setup
```sql
-- Jalankan file supabase-setup.sql di Supabase SQL Editor
-- File ini akan membuat:
-- - Tabel users
-- - RLS policies
-- - Triggers
-- - Functions untuk verifikasi email
```

### 2. Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Dashboard Configuration

### 1. Authentication Settings
- **Email Confirmation**: Enable
- **Email Template**: Customize sesuai kebutuhan
- **Password Requirements**: 
  - Minimum length: 8
  - Require uppercase: Yes
  - Require lowercase: Yes
  - Require numbers: Yes

### 2. Email Templates
- **Confirm signup**: Customize dengan link verifikasi
- **Reset password**: Customize dengan link reset
- **Magic link**: Optional

### 3. Security Settings
- **CAPTCHA**: Disable untuk development
- **Rate limiting**: Configure sesuai kebutuhan
- **Session timeout**: 24 hours (default)

## API Endpoints

### AuthContext Functions

#### signUp(email, password, userData)
```typescript
const { error, needsVerification } = await signUp(email, password, {
  first_name: 'John',
  last_name: 'Doe',
  phone: '+6281234567890'
});
```

#### signIn(email, password)
```typescript
const { error } = await signIn(email, password);
```

#### resetPassword(email)
```typescript
const { error, success } = await resetPassword(email);
```

#### updatePassword(newPassword)
```typescript
const { error, success } = await updatePassword(newPassword);
```

#### verifyEmail(email, code)
```typescript
const { error, success } = await verifyEmail(email, '123456');
```

#### resendVerificationCode(email)
```typescript
const { error, success } = await resendVerificationCode(email);
```

#### verifyEmailWithToken(token)
```typescript
const { error, success } = await verifyEmailWithToken(token);
```

## Error Handling

### Common Error Messages
- `Format email tidak valid`
- `Password minimal 8 karakter`
- `Password harus mengandung minimal 1 huruf kecil, 1 huruf besar, dan 1 angka`
- `Email sudah terdaftar. Silakan gunakan email lain atau login`
- `Email atau password salah`
- `Email belum diverifikasi. Silakan cek email Anda dan klik link verifikasi`
- `Kode verifikasi tidak valid atau sudah expired`
- `Terlalu banyak percobaan login. Silakan coba lagi nanti`

## Security Features

### 1. Password Validation
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

### 2. Email Validation
- RFC 5322 compliant email format
- Domain validation
- Duplicate email prevention

### 3. Rate Limiting
- Login attempts: 5 per minute
- Password reset: 3 per hour
- Verification code: 3 per 10 minutes

### 4. Session Security
- JWT tokens with expiration
- Auto-refresh tokens
- Secure cookie storage
- CSRF protection

## Testing

### 1. Registration Flow
1. Go to `/auth/register`
2. Fill form with valid data
3. Submit form
4. Check email for verification code
5. Go to `/auth/verify-email`
6. Enter verification code
7. Should redirect to `/auth/verify-success`

### 2. Login Flow
1. Go to `/auth/login`
2. Enter valid credentials
3. Should redirect to `/dashboard`

### 3. Password Reset Flow
1. Go to `/auth/forgot-password`
2. Enter email address
3. Check email for reset link
4. Click reset link
5. Go to `/auth/reset-password`
6. Enter new password
7. Should redirect to `/auth/login`

## Troubleshooting

### Common Issues

#### 1. "Invalid API key" Error
- Check environment variables
- Verify Supabase URL and anon key
- Ensure keys are correctly set in `.env.local`

#### 2. "CAPTCHA verification failed" Error
- Disable CAPTCHA in Supabase Dashboard
- Go to Authentication > Settings > Security
- Turn off CAPTCHA protection

#### 3. "Email not confirmed" Error
- Check email verification settings
- Verify email template configuration
- Check spam folder for verification emails

#### 4. "User already registered" Error
- User already exists in database
- Try logging in instead of registering
- Check if email is already verified

### Debug Mode
Enable debug logging by adding to your environment:
```env
NEXT_PUBLIC_DEBUG=true
```

## Production Considerations

### 1. Email Service
- Replace placeholder email functions with real service
- Use SendGrid, AWS SES, or similar
- Configure proper email templates

### 2. Security
- Enable CAPTCHA in production
- Configure proper rate limiting
- Use HTTPS for all requests
- Regular security audits

### 3. Monitoring
- Set up error tracking (Sentry, etc.)
- Monitor authentication metrics
- Log security events
- Regular backup of user data

### 4. Performance
- Optimize database queries
- Use connection pooling
- Cache frequently accessed data
- Monitor response times

## Support

For issues or questions:
1. Check this documentation
2. Review Supabase documentation
3. Check error logs in browser console
4. Verify environment variables
5. Test with different email addresses

## Changelog

### v1.0.0
- Initial authentication system
- Email verification with 6-digit codes
- Password reset functionality
- Session management
- Error handling and validation
