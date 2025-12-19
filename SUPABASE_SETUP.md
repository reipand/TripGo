# Setup Supabase Authentication untuk TripGO

## � IMPORTANT: Current Supabase Project Issue

**The current Supabase project URL (`https://huwcvhngslkmfljfnxrv.supabase.co`) appears to be unreachable.** This is causing `AuthRetryableFetchError` when the app tries to authenticate users.

## 🔧 Solution: Create a New Supabase Project

### 1. Create New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Choose your organization
4. Fill in project details:
   - **Name**: `TripGo` (or any name you prefer)
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to your users (e.g., Singapore for Asia)
5. Click **"Create new project"**

### 2. Wait for Project Setup

Wait for Supabase to finish setting up your project (usually takes 2-3 minutes).

### 3. Get New Project Credentials

1. In your new project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep this secret!)

### 4. Update Environment Variables

Update your `.env` file with the new credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key_here
```

### 5. Configure Authentication

1. In Supabase Dashboard, go to **Authentication** > **Settings**
2. Configure:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add your production URLs later
3. Enable **"Enable email confirmations"** if desired

### 6. Set Up Database Schema

Run the SQL scripts in your Supabase SQL Editor:

1. Run `supabase-setup.sql`
2. Run `database-schema.sql`
3. Run `supabase-flights-schema.sql`

### 7. Test the Connection

1. Restart your development server: `npm run dev`
2. Check that the network error banner disappears
3. Try registering a new user

## 🚀 Alternative: Use Supabase CLI (Recommended for Development)

If you prefer using Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Push schema changes
supabase db push
```

## 🔍 Troubleshooting

### Still getting AuthRetryableFetchError?

1. **Check your internet connection**
2. **Verify environment variables are loaded**: Check browser dev tools > Console for any missing env var warnings
3. **Test Supabase URL**: Try accessing `https://your-project-ref.supabase.co` directly in browser
4. **Check Supabase project status**: Ensure project is not paused in dashboard

### Environment Variables Not Loading?

Make sure your `.env` file is in the root directory and restart your dev server after changes.

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
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
