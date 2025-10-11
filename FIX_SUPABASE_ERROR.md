
🔧 CARA MENGATASI ERROR 'Invalid API key':

1. BUKA SUPABASE DASHBOARD:
   https://supabase.com/dashboard/project/huwcvhngslkmfljfnxrv

2. PERGI KE SETTINGS > API:
   - Klik menu 'Settings' di sidebar kiri
   - Pilih 'API' dari submenu

3. COPY ANON KEY:
   - Scroll ke bagian 'Project API keys'
   - Copy 'anon public' key (BUKAN service_role!)
   - Key biasanya dimulai dengan 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

4. UPDATE FILE .env.local:
   - Buka file .env.local di project TripGO
   - Ganti 'your_supabase_anon_key_here' dengan key yang Anda copy
   - Simpan file

5. RESTART SERVER:
   npm run dev

✅ SETELAH ITU, REGISTER AKAN BERFUNGSI NORMAL!

📖 Panduan lengkap: GET_SUPABASE_KEY.md

