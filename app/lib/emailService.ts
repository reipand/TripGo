import { getTransporter } from './mailer';

interface TicketData {
  passenger_name: string;
  passenger_email: string;
  ticket_number: string;
  departure_location: string;
  destination_location: string;
  departure_date: string | Date;
  arrival_date?: string | Date;
  flight_number: string;
  seat_number: string;
  gate?: string;
  booking_reference?: string;
  id: string;
  status?: string;
}

export const sendTicketEmail = async (
  to: string,
  subject: string,
  ticketData: TicketData,
  pdfBuffer: Buffer
) => {
  try {
    const transporter = getTransporter();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@tripgo.com';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; 
            line-height: 1.6; 
            color: #374151; 
            margin: 0;
            padding: 0;
            background-color: #f9fafb;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 32px 24px; 
            text-align: center; 
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: bold;
          }
          .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content { 
            padding: 32px 24px; 
          }
          .greeting {
            font-size: 18px;
            color: #1f2937;
            margin-bottom: 24px;
          }
          .ticket-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border: 1px solid #e5e7eb;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-top: 20px;
          }
          .info-item {
            margin-bottom: 12px;
          }
          .info-label {
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 16px;
            color: #111827;
            font-weight: 600;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
          }
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3);
          }
          .tips {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            border-radius: 8px;
            margin: 24px 0;
          }
          .tips h3 {
            color: #92400e;
            margin-top: 0;
            font-size: 16px;
          }
          .tips ul {
            margin: 8px 0 0 0;
            padding-left: 20px;
          }
          .tips li {
            margin-bottom: 6px;
            color: #78350f;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .footer p {
            margin: 8px 0;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #4f46e5;
            margin-bottom: 8px;
          }
          @media (max-width: 600px) {
            .container {
              border-radius: 0;
            }
            .content {
              padding: 24px 16px;
            }
            .info-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✈️ Your TripGo E-Ticket</h1>
            <p>Booking Confirmation #${ticketData.ticket_number}</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              <h2>Hello ${ticketData.passenger_name}!</h2>
              <p>Your booking has been confirmed. Here are your travel details:</p>
            </div>
            
            <div class="ticket-card">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Ticket Number</div>
                  <div class="info-value">${ticketData.ticket_number}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Booking Reference</div>
                  <div class="info-value">${ticketData.booking_reference || 'N/A'}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Flight</div>
                  <div class="info-value">${ticketData.flight_number}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Departure</div>
                  <div class="info-value">${ticketData.departure_location}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Destination</div>
                  <div class="info-value">${ticketData.destination_location}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Departure Date</div>
                  <div class="info-value">${new Date(ticketData.departure_date).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Seat</div>
                  <div class="info-value">${ticketData.seat_number}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Gate</div>
                  <div class="info-value">${ticketData.gate || 'Will be assigned'}</div>
                </div>
                
                <div class="info-item">
                  <div class="info-label">Status</div>
                  <div class="info-value">
                    <span style="color: ${ticketData.status === 'confirmed' ? '#059669' : ticketData.status === 'cancelled' ? '#dc2626' : '#d97706'};">
                      ${ticketData.status?.toUpperCase() || 'CONFIRMED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="button-container">
              <a href="${appUrl}/tickets/${ticketData.id}" class="button">
                View & Manage Your Ticket Online
              </a>
            </div>
            
            <div class="tips">
              <h3>📋 Important Travel Tips:</h3>
              <ul>
                <li>Arrive at the airport at least 2 hours before departure</li>
                <li>Have your valid ID/passport ready for verification</li>
                <li>Check-in online 24-48 hours before departure</li>
                <li>Keep this e-ticket handy (printed or on your mobile device)</li>
                <li>Proceed to security check with boarding pass and ID</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Note:</strong> Your e-ticket PDF is attached to this email. 
              You can also access it anytime through the link above.
            </p>
          </div>
          
          <div class="footer">
            <div class="logo">TripGo</div>
            <p>Safe travels and enjoy your journey! ✈️</p>
            <p>Need assistance? Contact our support team at support@tripgo.com</p>
            <p>© ${new Date().getFullYear()} TripGo. All rights reserved.</p>
            <p style="font-size: 12px; color: #9ca3af;">
              This is an automated email. Please do not reply to this address.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      TripGo E-Ticket Confirmation
      =============================
      
      Hello ${ticketData.passenger_name}!
      
      Your booking has been confirmed. Here are your travel details:
      
      Ticket Number: ${ticketData.ticket_number}
      Booking Reference: ${ticketData.booking_reference || 'N/A'}
      Flight: ${ticketData.flight_number}
      Departure: ${ticketData.departure_location}
      Destination: ${ticketData.destination_location}
      Departure Date: ${new Date(ticketData.departure_date).toLocaleString()}
      Seat: ${ticketData.seat_number}
      Gate: ${ticketData.gate || 'Will be assigned'}
      Status: ${ticketData.status?.toUpperCase() || 'CONFIRMED'}
      
      View your ticket online: ${appUrl}/tickets/${ticketData.id}
      
      Important Travel Tips:
      - Arrive at the airport at least 2 hours before departure
      - Have your valid ID/passport ready
      - Check-in online 24-48 hours before departure
      - Keep this e-ticket handy
      
      Your e-ticket PDF is attached to this email.
      
      Need assistance? Contact support@tripgo.com
      
      Safe travels with TripGo!
      
      © ${new Date().getFullYear()} TripGo. All rights reserved.
    `;

    const mailOptions = {
      from: `"TripGo" <${fromEmail}>`,
      to,
      subject,
      text: textContent,
      html: htmlContent,
      attachments: [
        {
          filename: `TripGo-Ticket-${ticketData.ticket_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'TripGo Mailer',
      },
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    
    return { 
      success: true, 
      messageId: info.messageId,
      message: 'Email sent successfully'
    };
  } catch (error: any) {
    console.error('❌ Email sending error:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      to,
      subject,
    });
    
    return { 
      success: false, 
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
};