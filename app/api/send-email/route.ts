// app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email sender configuration
const sender = {
  email: process.env.MAILTRAP_SENDER_EMAIL || "no-reply@tripgo.com",
  name: process.env.MAILTRAP_SENDER_NAME || "TripGo Notification",
};

// Available email templates
type EmailTemplate = 'payment_success' | 'booking_confirmation' | 'payment_failed' | 'password_reset' | 'welcome' | 'custom';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, template = 'custom', data, bcc, cc } = await request.json();

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email (to) is required' },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: 'Email subject is required' },
        { status: 400 }
      );
    }

    // Prepare recipients
    const recipients = Array.isArray(to) 
      ? to.map(email => ({ email }))
      : [{ email: to }];

    // Prepare BCC and CC recipients
    const bccRecipients = bcc 
      ? (Array.isArray(bcc) ? bcc.map(email => ({ email })) : [{ email: bcc }])
      : undefined;

    const ccRecipients = cc
      ? (Array.isArray(cc) ? cc.map(email => ({ email })) : [{ email: cc }])
      : undefined;

    // Get email content based on template
    const { html, text } = getEmailTemplate(template, data);

    const host = process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io';
    const port = Number(process.env.MAILTRAP_PORT || 2525);
    const user = process.env.MAILTRAP_USER;
    const pass = process.env.MAILTRAP_PASS;

    if (!user || !pass) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Mailtrap SMTP credentials (MAILTRAP_USER/MAILTRAP_PASS)',
        },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });

    const response = await transporter.sendMail({
      from: `${sender.name} <${sender.email}>`,
      to: recipients.map((r) => r.email).join(','),
      subject,
      html,
      text,
      ...(bccRecipients && { bcc: bccRecipients.map((r) => r.email).join(',') }),
      ...(ccRecipients && { cc: ccRecipients.map((r) => r.email).join(',') }),
      headers: {
        'X-Template-Name': template,
        'X-Sent-Via': 'tripgo-api',
      },
    });

    // Log success
    console.log(`Email sent successfully to ${to}. Message ID: ${response.messageId}`);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      mailtrapResponse: { messageId: response.messageId, accepted: response.accepted, rejected: response.rejected },
      recipientCount: recipients.length
    }, { status: 200 });

  } catch (error: any) {
    console.error('Email sending error:', error);
    
    // More detailed error handling
    let errorMessage = 'Failed to send email';
    let statusCode = 500;

    if (error.message?.includes('invalid token') || error.message?.includes('unauthorized')) {
      errorMessage = 'Mailtrap authentication failed';
      statusCode = 401;
    } else if (error.message?.includes('validation')) {
      errorMessage = 'Invalid email parameters';
      statusCode = 400;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error.message 
      },
      { status: statusCode }
    );
  }
}

// Helper function to generate email templates
function getEmailTemplate(template: EmailTemplate, data?: any): { html: string; text: string } {
  const defaultData = {
    customerName: data?.customerName || 'Customer',
    orderId: data?.orderId || 'N/A',
    bookingCode: data?.bookingCode || 'N/A',
    ticketNumber: data?.ticketNumber || 'N/A',
    trainName: data?.trainName || 'N/A',
    departureDate: data?.departureDate || 'N/A',
    origin: data?.origin || 'N/A',
    destination: data?.destination || 'N/A',
    totalAmount: data?.totalAmount ? formatCurrency(data.totalAmount) : 'Rp 0',
    paymentMethod: data?.paymentMethod || 'N/A',
    resetLink: data?.resetLink || '#',
    supportEmail: data?.supportEmail || 'support@tripgo.com',
    websiteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://tripgo.com'
  };

  const templates: Record<EmailTemplate, { html: string; text: string }> = {
    payment_success: {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #FD7E14 0%, #e56e0c 100%); color: white; padding: 40px 20px; text-align: center; }
            .content { padding: 30px; }
            .ticket-info { background: #f9f9f9; border-left: 4px solid #FD7E14; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 12px; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; color: #666; }
            .info-value { color: #333; }
            .success-icon { font-size: 48px; margin-bottom: 20px; }
            .btn { display: inline-block; background: #FD7E14; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="success-icon">✅</div>
              <h1 style="margin: 0; font-size: 28px;">Pembayaran Tiket Berhasil!</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Terima kasih atas pembayaran Anda</p>
            </div>
            <div class="content">
              <p>Halo <strong>${defaultData.customerName}</strong>,</p>
              <p>Pembayaran tiket kereta Anda telah berhasil diproses dan dikonfirmasi.</p>
              
              <div class="ticket-info">
                <h3 style="margin-top: 0; color: #FD7E14;">Detail Pemesanan:</h3>
                
                <div class="info-row">
                  <span class="info-label">Order ID:</span>
                  <span class="info-value">${defaultData.orderId}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Kode Booking:</span>
                  <span class="info-value"><strong>${defaultData.bookingCode}</strong></span>
                </div>
                <div class="info-row">
                  <span class="info-label">Kode Tiket:</span>
                  <span class="info-value">${defaultData.ticketNumber}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Kereta:</span>
                  <span class="info-value">${defaultData.trainName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Tanggal Keberangkatan:</span>
                  <span class="info-value">${defaultData.departureDate}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Rute:</span>
                  <span class="info-value">${defaultData.origin} → ${defaultData.destination}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Metode Pembayaran:</span>
                  <span class="info-value">${defaultData.paymentMethod}</span>
                </div>
                <div class="info-row" style="border-bottom: none; padding-bottom: 0;">
                  <span class="info-label">Total Pembayaran:</span>
                  <span class="info-value" style="font-size: 18px; color: #FD7E14; font-weight: bold;">${defaultData.totalAmount}</span>
                </div>
              </div>
              
              <p>Silahkan simpan email ini sebagai bukti pembayaran yang sah.</p>
              <p>Tiket elektronik akan tersedia di akun TripGo Anda.</p>
              
              <a href="${defaultData.websiteUrl}/dashboard/bookings" class="btn">Lihat Detail Booking</a>
              
              <p style="margin-top: 30px; color: #666;">
                Jika Anda memiliki pertanyaan, silakan hubungi kami di <a href="mailto:${defaultData.supportEmail}" style="color: #FD7E14;">${defaultData.supportEmail}</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} TripGo. All rights reserved.</p>
              <p>Jalan Kereta No. 123, Jakarta, Indonesia</p>
              <p style="margin-top: 10px;">
                <a href="${defaultData.websiteUrl}" style="color: #FD7E14; margin: 0 10px;">Website</a> | 
                <a href="${defaultData.websiteUrl}/privacy" style="color: #FD7E14; margin: 0 10px;">Privacy Policy</a> | 
                <a href="${defaultData.websiteUrl}/terms" style="color: #FD7E14; margin: 0 10px;">Terms of Service</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `PEMBAYARAN TIKET BERHASIL\n\nHalo ${defaultData.customerName},\n\nPembayaran tiket kereta Anda telah berhasil diproses.\n\nDETAIL PEMESANAN:\nOrder ID: ${defaultData.orderId}\nKode Booking: ${defaultData.bookingCode}\nKode Tiket: ${defaultData.ticketNumber}\nKereta: ${defaultData.trainName}\nTanggal: ${defaultData.departureDate}\nRute: ${defaultData.origin} → ${defaultData.destination}\nMetode Pembayaran: ${defaultData.paymentMethod}\nTotal: ${defaultData.totalAmount}\n\nLihat detail booking: ${defaultData.websiteUrl}/dashboard/bookings\n\nTerima kasih telah memesan dengan TripGo.\n\n© ${new Date().getFullYear()} TripGo`
    },

    booking_confirmation: {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; }
            .content { padding: 30px; }
            .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 12px; }
            .btn { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Booking Dikonfirmasi!</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Pemesanan tiket kereta Anda telah berhasil</p>
            </div>
            <div class="content">
              <p>Halo <strong>${defaultData.customerName}</strong>,</p>
              <p>Pemesanan tiket kereta Anda telah berhasil dikonfirmasi.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #059669;">Detail Booking:</h3>
                <p><strong>Kode Booking:</strong> ${defaultData.bookingCode}</p>
                <p><strong>Kereta:</strong> ${defaultData.trainName}</p>
                <p><strong>Tanggal:</strong> ${defaultData.departureDate}</p>
                <p><strong>Rute:</strong> ${defaultData.origin} → ${defaultData.destination}</p>
              </div>
              
              <p>Silakan lakukan pembayaran dalam waktu 1x24 jam untuk mengamankan tempat duduk Anda.</p>
              
              <a href="${defaultData.websiteUrl}/payment/${defaultData.orderId}" class="btn">Bayar Sekarang</a>
              
              <p style="margin-top: 30px; color: #666;">
                Batas waktu pembayaran: 24 jam dari pemesanan
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} TripGo. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `BOOKING DIKONFIRMASI\n\nHalo ${defaultData.customerName},\n\nPemesanan tiket kereta Anda telah berhasil dikonfirmasi.\n\nDETAIL BOOKING:\nKode Booking: ${defaultData.bookingCode}\nKereta: ${defaultData.trainName}\nTanggal: ${defaultData.departureDate}\nRute: ${defaultData.origin} → ${defaultData.destination}\n\nBayar sekarang: ${defaultData.websiteUrl}/payment/${defaultData.orderId}\n\nBatas waktu: 24 jam\n\n© ${new Date().getFullYear()} TripGo`
    },

    payment_failed: {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 20px; text-align: center; }
            .content { padding: 30px; }
            .info-box { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 12px; }
            .btn { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Pembayaran Gagal</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Mohon coba lagi atau gunakan metode pembayaran lain</p>
            </div>
            <div class="content">
              <p>Halo <strong>${defaultData.customerName}</strong>,</p>
              <p>Pembayaran untuk booking Anda mengalami kendala.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #dc2626;">Detail:</h3>
                <p><strong>Kode Booking:</strong> ${defaultData.bookingCode}</p>
                <p><strong>Jumlah:</strong> ${defaultData.totalAmount}</p>
              </div>
              
              <p>Silakan coba lagi dengan metode pembayaran lain.</p>
              
              <a href="${defaultData.websiteUrl}/payment/retry/${defaultData.orderId}" class="btn">Coba Bayar Lagi</a>
              
              <p style="margin-top: 30px; color: #666;">
                Booking akan otomatis dibatalkan jika tidak dibayar dalam 24 jam.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} TripGo. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `PEMBAYARAN GAGAL\n\nHalo ${defaultData.customerName},\n\nPembayaran untuk booking Anda mengalami kendala.\n\nDETAIL:\nKode Booking: ${defaultData.bookingCode}\nJumlah: ${defaultData.totalAmount}\n\nCoba bayar lagi: ${defaultData.websiteUrl}/payment/retry/${defaultData.orderId}\n\nBooking akan otomatis dibatalkan jika tidak dibayar dalam 24 jam.\n\n© ${new Date().getFullYear()} TripGo`
    },

    password_reset: {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 20px; text-align: center; }
            .content { padding: 30px; }
            .info-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 12px; }
            .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Reset Password</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Permintaan reset password akun TripGo Anda</p>
            </div>
            <div class="content">
              <p>Halo <strong>${defaultData.customerName}</strong>,</p>
              <p>Kami menerima permintaan untuk mereset password akun TripGo Anda.</p>
              
              <div class="info-box">
                <p>Klik tombol di bawah ini untuk membuat password baru:</p>
                <a href="${defaultData.resetLink}" class="btn">Reset Password</a>
              </div>
              
              <p>Link reset password akan kadaluarsa dalam 1 jam.</p>
              
              <p style="color: #666; font-size: 14px;">
                Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} TripGo. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `RESET PASSWORD\n\nHalo ${defaultData.customerName},\n\nKami menerima permintaan untuk mereset password akun TripGo Anda.\n\nKlik link berikut untuk membuat password baru:\n${defaultData.resetLink}\n\nLink akan kadaluarsa dalam 1 jam.\n\nJika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini.\n\n© ${new Date().getFullYear()} TripGo`
    },

    welcome: {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 40px 20px; text-align: center; }
            .content { padding: 30px; }
            .info-box { background: #f5f3ff; border: 1px solid #ddd6fe; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 12px; }
            .btn { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Selamat Datang di TripGo!</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Akun Anda telah berhasil dibuat</p>
            </div>
            <div class="content">
              <p>Halo <strong>${defaultData.customerName}</strong>,</p>
              <p>Selamat! Akun TripGo Anda telah berhasil dibuat.</p>
              
              <div class="info-box">
                <p>Mulai pesan tiket kereta dengan mudah dan cepat:</p>
                <a href="${defaultData.websiteUrl}/dashboard" class="btn">Mulai Jelajahi</a>
              </div>
              
              <p>Dengan TripGo, Anda dapat:</p>
              <ul>
                <li>Pesan tiket kereta kapan saja</li>
                <li>Pilih tempat duduk favorit</li>
                <li>Bayar dengan berbagai metode</li>
                <li>Kelola booking dengan mudah</li>
              </ul>
              
              <p style="color: #666;">
                Jika Anda memiliki pertanyaan, hubungi kami di <a href="mailto:${defaultData.supportEmail}">${defaultData.supportEmail}</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} TripGo. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `SELAMAT DATANG DI TRIPGO!\n\nHalo ${defaultData.customerName},\n\nSelamat! Akun TripGo Anda telah berhasil dibuat.\n\nMulai pesan tiket kereta dengan mudah dan cepat:\n${defaultData.websiteUrl}/dashboard\n\nDengan TripGo, Anda dapat:\n- Pesan tiket kereta kapan saja\n- Pilih tempat duduk favorit\n- Bayar dengan berbagai metode\n- Kelola booking dengan mudah\n\nJika ada pertanyaan, hubungi: ${defaultData.supportEmail}\n\n© ${new Date().getFullYear()} TripGo`
    },

    custom: {
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #FD7E14 0%, #e56e0c 100%); color: white; padding: 40px 20px; text-align: center; }
            .content { padding: 30px; }
            .footer { background: #2d3748; color: white; padding: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Notification</h1>
            </div>
            <div class="content">
              ${data?.html || `<p>${data?.message || 'Custom message content here'}</p>`}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} TripGo. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: data?.text || 'Custom email content'
    }
  };

  return templates[template] || templates.custom;
}

// Helper function to format currency
function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
}

// GET method for testing email (optional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const template = searchParams.get('template') as EmailTemplate || 'payment_success';
    
    // Return template preview
    const { html, text } = getEmailTemplate(template, {
      customerName: "John Doe",
      orderId: "ORD-123456",
      bookingCode: "BK-789012",
      ticketNumber: "TKT-345678",
      trainName: "Argo Bromo",
      departureDate: "15 Desember 2024",
      origin: "Gambir",
      destination: "Surabaya",
      totalAmount: 350000,
      paymentMethod: "Bank Transfer",
      resetLink: "https://tripgo.com/reset-password?token=abc123"
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error: any) {
    console.error('Error generating template preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate template preview' },
      { status: 500 }
    );
  }
}
