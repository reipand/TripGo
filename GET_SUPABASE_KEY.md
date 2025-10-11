# 🔑 Cara Mendapatkan Supabase Anon Key

## Langkah-langkah:

### 1. Buka Supabase Dashboard
- Pergi ke: https://supabase.com/dashboard/project/huwcvhngslkmfljfnxrv

### 2. Masuk ke Settings > API
- Klik menu **Settings** di sidebar kiri
- Pilih **API** dari submenu

### 3. Copy Anon Key
- Scroll ke bawah ke bagian **Project API keys**
- Copy **anon public** key (bukan service_role key!)
- Key biasanya dimulai dengan `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. Update File .env.local
- Buka file `.env.local` di project TripGO
- Ganti `your_supabase_anon_key_here` dengan key yang Anda copy
- Simpan file

### 5. Restart Development Server
```bash
npm run dev
```

## ⚠️ Penting:
- Gunakan **anon public** key, BUKAN service_role key
- Key harus dimulai dengan `eyJ...`
- Pastikan tidak ada spasi atau karakter tambahan
- Restart server setelah update .env.local

## 🚨 Jika Masih Error:
1. Pastikan project Supabase aktif
2. Cek apakah anon key benar
3. Pastikan URL project benar: `https://huwcvhngslkmfljfnxrv.supabase.co`
4. Restart development server

## 📞 Bantuan:
Jika masih bermasalah, cek:
- Browser console untuk error details
- Supabase dashboard > Logs untuk melihat error
- Pastikan project tidak di-pause
