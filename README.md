<<<<<<< HEAD
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
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> 93a879e (fix fitur)
