# Setup Supabase Authentication untuk TripGO

## 🚀 Langkah-langkah Setup

### 1. Dapatkan Supabase Anon Key

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda (huwcvhngslkmfljfnxrv)
3. Pergi ke **Settings** > **API**
4. Copy **anon public** key

### 2. Update Environment Variables

Edit file `.env.local` dan ganti `your_supabase_anon_key_here` dengan anon key yang Anda copy:

```env
NEXT_PUBLIC_SUPABASE_URL=https://huwcvhngslkmfljfnxrv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Konfigurasi Authentication di Supabase

1. Di Supabase Dashboard, pergi ke **Authentication** > **Settings**
2. Pastikan **Enable email confirmations** diaktifkan (opsional)
3. Atur **Site URL** ke `http://localhost:3000` untuk development
4. Tambahkan redirect URLs jika diperlukan

### 4. Test Authentication

1. Jalankan aplikasi: `npm run dev`
2. Buka `http://localhost:3000`
3. Klik **Daftar** untuk membuat akun baru
4. Cek email untuk konfirmasi (jika email confirmation diaktifkan)
5. Login dengan akun yang sudah dibuat

## 🔧 Fitur yang Tersedia

### ✅ Authentication Features
- **User Registration** dengan email dan password
- **User Login** dengan validasi
- **Password Reset** via email
- **Session Management** otomatis
- **Route Protection** untuk halaman yang memerlukan login
- **User Profile** dengan metadata (nama, telepon)

### ✅ UI/UX Features
- **Responsive Design** untuk semua perangkat
- **Loading States** saat proses authentication
- **Error Handling** dengan pesan yang jelas
- **User Dropdown** di navbar dengan logout
- **Mobile-friendly** navigation

## 📱 Halaman yang Terlindungi

- `/dashboard` - Dashboard user (memerlukan login)
- Halaman lain bisa ditambahkan dengan wrapping `<ProtectedRoute>`

## 🛠️ Komponen yang Dibuat

1. **AuthContext** (`/app/contexts/AuthContext.tsx`)
   - Context untuk mengelola state authentication
   - Functions: signUp, signIn, signOut, resetPassword

2. **ProtectedRoute** (`/app/components/ProtectedRoute.tsx`)
   - Component untuk melindungi route yang memerlukan login
   - Redirect otomatis ke login jika belum authenticated

3. **Updated Navbar** (`/app/components/Navbar.tsx`)
   - Menampilkan user info jika sudah login
   - Dropdown menu dengan logout functionality
   - Responsive untuk mobile dan desktop

4. **Login Page** (`/app/auth/login/page.tsx`)
   - Form login dengan Supabase integration
   - Error handling dan loading states

5. **Register Page** (`/app/auth/register/page.tsx`)
   - Form registrasi dengan validasi
   - User metadata (nama, telepon) disimpan

## 🔐 Security Features

- **JWT Tokens** dikelola otomatis oleh Supabase
- **Session Persistence** di browser
- **Automatic Token Refresh**
- **Secure Password Hashing** (dikelola Supabase)
- **Email Verification** (opsional)

## 📝 User Data Structure

Data user disimpan di Supabase dengan struktur:

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "user_metadata": {
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+6281234567890"
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

## 🚨 Troubleshooting

### Error: "Invalid API key"
- Pastikan anon key sudah benar di `.env.local`
- Restart development server setelah update env

### Error: "Email not confirmed"
- Cek email untuk link konfirmasi
- Atau disable email confirmation di Supabase settings

### Error: "User not found"
- Pastikan user sudah terdaftar
- Cek di Supabase Dashboard > Authentication > Users

## 📞 Support

Jika mengalami masalah, cek:
1. Supabase Dashboard untuk melihat error logs
2. Browser console untuk error messages
3. Network tab untuk melihat API calls

---

**Happy Coding! 🎉**
