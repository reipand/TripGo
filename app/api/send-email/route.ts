// app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, template, data } = await request.json();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FD7E14; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Pembayaran Tiket Berhasil!</h1>
          </div>
          <div class="content">
            <p>Halo ${data.customerName},</p>
            <p>Pembayaran tiket kereta Anda telah berhasil diproses.</p>
            
            <div class="ticket-info">
              <h3>Detail Pemesanan:</h3>
              <p><strong>Order ID:</strong> ${data.orderId}</p>
              <p><strong>Kode Booking:</strong> ${data.bookingCode}</p>
              <p><strong>Kode Tiket:</strong> ${data.ticketNumber}</p>
              <p><strong>Kereta:</strong> ${data.trainName}</p>
              <p><strong>Tanggal:</strong> ${data.departureDate}</p>
              <p><strong>Rute:</strong> ${data.origin} → ${data.destination}</p>
              <p><strong>Total:</strong> Rp ${data.totalAmount}</p>
            </div>
            
            <p>Terima kasih telah memesan tiket kereta dengan kami.</p>
          </div>
          <div class="footer">
            <p>© 2024 TripGo. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data: emailData, error } = await resend.emails.send({
      from: 'TripGo <noreply@tripgo.com>',
      to: [to],
      subject: subject,
      html: emailHtml
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: emailData?.id });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}