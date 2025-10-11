# 🔧 Fix CAPTCHA Verification Error

## 🚨 Error yang Terjadi
```
XHRPOST https://huwcvhngslkmfljfnxrv.supabase.co/auth/v1/signup
[HTTP/3 500 676ms]
captcha verification process failed
```

## 🎯 Solusi

### Solusi 1: Disable CAPTCHA untuk Development (Recommended)

1. **Buka Supabase Dashboard:**
   - Pergi ke: https://supabase.com/dashboard/project/huwcvhngslkmfljfnxrv
   - Klik **Authentication** > **Settings**

2. **Disable CAPTCHA:**
   - Scroll ke bagian **Security**
   - Cari **Enable CAPTCHA protection**
   - ❌ **Uncheck** (disable) untuk development
   - Klik **Save**

3. **Alternative: Whitelist Localhost:**
   - Jika ingin tetap enable CAPTCHA
   - Tambahkan `localhost:3000` ke **Site URL**
   - Tambahkan `http://localhost:3000/**` ke **Redirect URLs**

### Solusi 2: Update Supabase Client Configuration

Update file `app/lib/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huwcvhngslkmfljfnxrv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Disable CAPTCHA for development
    captcha: {
      provider: 'none'
    }
  }
});
```

### Solusi 3: Update AuthContext untuk Handle CAPTCHA

Update `app/contexts/AuthContext.tsx`:

```typescript
const signUp = async (email: string, password: string, userData?: any) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: `${window.location.origin}/auth/verify-email`,
        // Disable CAPTCHA for development
        captchaToken: null
      }
    });

    if (error) {
      return { error };
    }

    if (data.user && !data.session) {
      return { error: null, needsVerification: true };
    }

    return { error: null };
  } catch (error) {
    return { error: error as AuthError };
  }
};
```

## 🚀 Langkah-langkah Implementasi

### Step 1: Disable CAPTCHA di Supabase Dashboard
1. Buka Supabase Dashboard
2. Authentication > Settings
3. Security > Disable CAPTCHA protection
4. Save changes

### Step 2: Restart Development Server
```bash
npm run dev
```

### Step 3: Test Registration
1. Buka `http://localhost:3000/auth/register`
2. Isi form registrasi
3. Submit form
4. Cek apakah error CAPTCHA sudah hilang

## 🔍 Troubleshooting

### Jika masih error:
1. **Cek Supabase Logs:**
   - Dashboard > Logs
   - Filter by "auth" events
   - Cek error details

2. **Cek Environment Variables:**
   ```bash
   # Pastikan .env.local ada dan benar
   cat .env.local
   ```

3. **Clear Browser Cache:**
   - Hard refresh (Ctrl+Shift+R)
   - Clear localStorage
   - Test di incognito mode

4. **Cek Network Tab:**
   - Buka Developer Tools
   - Network tab
   - Cek request ke Supabase
   - Lihat response error details

## 📝 Notes

- **Development**: Disable CAPTCHA untuk kemudahan testing
- **Production**: Enable CAPTCHA untuk keamanan
- **Alternative**: Gunakan reCAPTCHA v3 untuk production

## 🎯 Expected Result

Setelah fix, signup flow akan berjalan normal:
1. User submit form → No CAPTCHA error
2. Supabase create user → Success
3. Redirect to verification page → Success
4. User receive email → Success
5. User verify code → Success
6. Redirect to dashboard → Success

---

**Happy Coding! 🎉**
