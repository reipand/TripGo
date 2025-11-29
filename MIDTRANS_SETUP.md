# Midtrans Payment Gateway Setup

## 1. Daftar Akun Midtrans

1. Kunjungi [Midtrans Dashboard](https://dashboard.midtrans.com/)
2. Daftar akun baru atau login
3. Pilih "Sandbox" untuk testing atau "Production" untuk live

## 2. Dapatkan API Keys

### Sandbox Keys (untuk testing):
- **Server Key**: `SB-Mid-server-xxxxxxxxxxxxxxxx`
- **Client Key**: `SB-Mid-client-xxxxxxxxxxxxxxxx`

### Production Keys (untuk live):
- **Server Key**: `Mid-server-xxxxxxxxxxxxxxxx`
- **Client Key**: `Mid-client-xxxxxxxxxxxxxxxx`

## 3. Konfigurasi Environment Variables

Tambahkan ke file `.env.local` (Sandbox):

```env
# Midtrans Configuration (Sandbox)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
MIDTRANS_BASE_URL=https://api.sandbox.midtrans.com/v2

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 4. Setup Database Tables

Jalankan SQL berikut di Supabase:

```sql
-- Create transactions table
CREATE TABLE public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id text UNIQUE NOT NULL,
  midtrans_transaction_id text,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  payment_type text,
  customer_email text,
  customer_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid REFERENCES public.transactions(id),
  order_id text UNIQUE NOT NULL,
  customer_email text,
  customer_name text,
  total_amount numeric NOT NULL,
  status text DEFAULT 'pending',
  booking_date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (customer_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (customer_email = auth.jwt() ->> 'email');
```

## 5. Test Payment Methods

### Sandbox Test Cards:
- **Visa**: 4811 1111 1111 1114
- **Mastercard**: 5211 1111 1111 1117
- **JCB**: 3528 0000 0000 0007

### Test Data:
- **CVV**: 123
- **Expiry**: 12/25
- **OTP**: 112233

## 6. Webhook Configuration

1. Di Midtrans Dashboard, buat webhook endpoint:
   - **URL**: `https://yourdomain.com/api/payment/webhook`
   - **Events**: `payment`, `capture`, `settlement`, `cancel`, `expire`

2. Implementasi webhook handler di `/api/payment/webhook/route.ts`

## 7. Testing

1. Jalankan aplikasi: `npm run dev`
2. Pilih penerbangan dan kursi
3. Pilih metode pembayaran
4. Gunakan test card untuk pembayaran
5. Verifikasi e-ticket ter-generate

## 8. Production Deployment

1. Ganti ke Production keys
2. Update webhook URL ke domain production
3. Test dengan kartu kredit asli
4. Monitor transaksi di Midtrans Dashboard

## Troubleshooting

### Error: "Invalid API key"
- Pastikan server key dan client key benar
- Periksa environment variables

### Error: "Transaction not found"
- Periksa order_id unik
- Pastikan database connection

### Error: "Webhook failed"
- Periksa webhook URL accessible
- Pastikan webhook handler mengembalikan status 200

## Support

- [Midtrans Documentation](https://docs.midtrans.com/)
- [Midtrans Support](https://support.midtrans.com/)
