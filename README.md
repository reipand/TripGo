## TripGo Setup

### 1) Install dependencies
```bash
npm install
```

### 2) Create `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail_address@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=TripGo <your_gmail_address@gmail.com>

# Midtrans (Sandbox)
MIDTRANS_SERVER_KEY=SB-Mid-server-yourSandboxServerKey
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-yourSandboxClientKey
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
MIDTRANS_BASE_URL=https://api.sandbox.midtrans.com/v2
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Gmail SMTP notes:
- Enable 2-Step Verification in Google Account
- Create an App Password (Security > App passwords)
- Use the app password as `SMTP_PASS`

### 3) Database
- Run `supabase-minimal-schema.sql` in Supabase SQL editor.

### 4) Start dev server
```bash
npm run dev
```
