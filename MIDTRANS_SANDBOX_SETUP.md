# Midtrans Sandbox Integration Guide

## Overview
Panduan lengkap untuk setup dan integrasi Midtrans Sandbox di TripGo.

## Setup Midtrans Sandbox

### 1. Daftar Akun Midtrans
1. Kunjungi [Midtrans Dashboard](https://dashboard.midtrans.com/)
2. Buat akun baru atau login
3. Pilih **Sandbox** untuk testing

### 2. Dapatkan API Keys

Setelah login ke Sandbox Dashboard:
1. Buka **Settings** > **Access Keys**
2. Copy **Server Key** dan **Client Key**

**Format Keys (Sandbox)**:
- **Server Key**: `SB-Mid-server-xxxxxxxxxxxxxxxx`
- **Client Key**: `SB-Mid-client-xxxxxxxxxxxxxxxx`

### 3. Konfigurasi Environment Variables

Tambahkan ke file `.env.local`:

```env
# Midtrans Sandbox Configuration
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.sandbox.midtrans.com/snap/snap.js
MIDTRANS_BASE_URL=https://api.sandbox.midtrans.com/v2

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 4. Setup Database

Pastikan table `transactions` sudah ada (dari `supabase-minimal-schema.sql`):

```sql
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  midtrans_transaction_id TEXT,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  fraud_status TEXT,
  payment_type TEXT,
  customer_email TEXT,
  customer_name TEXT,
  settlement_time TIMESTAMP WITH TIME ZONE,
  status_code TEXT,
  status_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Cara Kerja Integrasi

### 1. Payment Flow

```
User → PaymentGateway Component
  ↓
Generate Payment Token (POST /api/payment/create-transaction)
  ↓
Midtrans Snap.js (window.snap.pay())
  ↓
User Payment di Midtrans
  ↓
Webhook (POST /api/payment/webhook)
  ↓
Update Transaction Status
  ↓
Create Booking (jika payment success)
```

### 2. API Endpoints

#### Create Transaction
**POST** `/api/payment/create-transaction`

**Request Body**:
```json
{
  "transaction_details": {
    "order_id": "TRP1234567890",
    "gross_amount": 2067430
  },
  "item_details": [
    {
      "id": "flight-1",
      "price": 1250000,
      "quantity": 1,
      "name": "Flight CGK-DPS"
    },
    {
      "id": "seat-1",
      "price": 584028,
      "quantity": 1,
      "name": "Seat 12A"
    }
  ],
  "customer_details": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+6281234567890",
    "billing_address": {
      "first_name": "John",
      "last_name": "Doe",
      "address": "Jl. Example",
      "city": "Jakarta",
      "postal_code": "12345",
      "phone": "+6281234567890"
    }
  },
  "enabled_payments": ["credit_card", "bank_transfer"]
}
```

**Response**:
```json
{
  "token": "midtrans-transaction-token",
  "order_id": "TRP1234567890",
  "transaction_id": "midtrans-transaction-token",
  "status": "success"
}
```

#### Payment Webhook
**POST** `/api/payment/webhook`

Midtrans akan mengirim notification ke endpoint ini setelah payment selesai.

### 3. PaymentGateway Component

Component ini menggunakan:
- **Midtrans Snap.js** untuk payment popup
- **Real-time status** via Supabase subscriptions
- **Auto-redirect** setelah payment success

## Test Payment Methods

### Sandbox Test Cards

#### Credit Card
- **Visa**: `4811 1111 1111 1114`
- **Mastercard**: `5211 1111 1111 1117`
- **JCB**: `3528 0000 0000 0007`

**Test Data**:
- **CVV**: `123`
- **Expiry**: `12/25` (masa depan)
- **OTP**: `112233` (untuk 3D Secure)

#### Bank Transfer
- **BCA Virtual Account**: Automatic
- **Mandiri Virtual Account**: Automatic
- **BNI Virtual Account**: Automatic

#### E-Wallet
- **GoPay**: Scan QR code atau input GoPay ID
- **ShopeePay**: Scan QR code
- **OVO**: Input OVO phone number

### Test Scenarios

#### Success Payment
1. Pilih Credit Card
2. Input test card number: `4811 1111 1111 1114`
3. CVV: `123`, Expiry: `12/25`
4. OTP: `112233`
5. Payment success → Redirect ke `/payment/success`

#### Pending Payment (Bank Transfer)
1. Pilih Bank Transfer (BCA)
2. Payment pending → Virtual Account akan di-generate
3. Webhook akan trigger saat payment settle

#### Failed Payment
1. Pilih Credit Card
2. Input invalid card atau cancel payment
3. Error message ditampilkan

## Webhook Configuration

### Setup Webhook di Midtrans Dashboard

1. Login ke [Midtrans Dashboard](https://dashboard.midtrans.com/)
2. Buka **Settings** > **Configuration**
3. Tambahkan webhook URL:
   - **Development**: `https://your-domain.com/api/payment/webhook`
   - **Production**: `https://your-production-domain.com/api/payment/webhook`

4. Pilih events yang ingin di-subscribe:
   - ✅ `payment`
   - ✅ `capture`
   - ✅ `settlement`
   - ✅ `cancel`
   - ✅ `expire`

### Webhook Security

Webhook menggunakan signature verification:
```typescript
signature_key = sha512(order_id + status_code + gross_amount + server_key)
```

## Troubleshooting

### Error: "Failed to create transaction token"
- **Cause**: Server Key salah atau tidak valid
- **Solution**: 
  - Check `MIDTRANS_SERVER_KEY` di `.env.local`
  - Pastikan menggunakan Sandbox Server Key
  - Verify key format: `SB-Mid-server-xxxxxxxx`

### Error: "Cannot coerce the result to a single JSON object"
- **Cause**: Query Supabase menggunakan `.single()` tapi mengembalikan null atau multiple rows
- **Solution**: 
  - Menggunakan `.maybeSingle()` untuk optional queries
  - Check query filters apakah terlalu strict atau terlalu loose

### Error: "Snap.js not loaded"
- **Cause**: Midtrans Snap.js script belum di-load
- **Solution**: 
  - Check `NEXT_PUBLIC_MIDTRANS_SNAP_URL` di `.env.local`
  - Pastikan script tag sudah di-inject di component
  - Check browser console untuk CORS errors

### Payment tidak redirect
- **Cause**: Callback URL tidak valid
- **Solution**: 
  - Check `NEXT_PUBLIC_BASE_URL` di `.env.local`
  - Pastikan callback URLs accessible
  - Test dengan `http://localhost:3000` untuk development

### Webhook tidak ter-trigger
- **Cause**: Webhook URL tidak accessible dari internet
- **Solution**: 
  - Untuk development, gunakan ngrok atau tunneling service
  - Pastikan webhook URL di Midtrans Dashboard benar
  - Check webhook logs di Midtrans Dashboard

## Production Deployment

### 1. Switch ke Production Keys
Ganti environment variables dengan Production keys:
```env
MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxxxxxx
NEXT_PUBLIC_MIDTRANS_SNAP_URL=https://app.midtrans.com/snap/snap.js
MIDTRANS_BASE_URL=https://api.midtrans.com/v2
```

### 2. Update Webhook URL
Update webhook URL di Midtrans Dashboard ke production domain.

### 3. Test dengan Real Cards
Setelah switch ke production, test dengan kartu kredit asli (dengan amount kecil).

### 4. Monitor Transactions
Monitor semua transactions di Midtrans Dashboard untuk:
- Success rate
- Failed transactions
- Fraud detection alerts

## Best Practices

1. **Error Handling**: 
   - Always handle payment errors gracefully
   - Show user-friendly error messages
   - Log errors untuk debugging

2. **Transaction Tracking**:
   - Save semua transactions ke database
   - Track transaction status changes
   - Send notifications saat status berubah

3. **Security**:
   - Never expose Server Key di client-side
   - Always verify webhook signatures
   - Use HTTPS untuk semua callbacks

4. **User Experience**:
   - Show loading states saat payment processing
   - Provide clear payment instructions
   - Send confirmation emails setelah payment success

## Support

- [Midtrans Documentation](https://docs.midtrans.com/)
- [Midtrans Sandbox Testing](https://docs.midtrans.com/docs/testing-payment-gateway)
- [Midtrans Support](https://support.midtrans.com/)

