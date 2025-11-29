import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';
import { requireAdmin } from '@/app/lib/api-auth';
import { sendMail } from '@/app/lib/mailer';

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json({ error: authError }, { status: authError === 'Unauthorized' ? 401 : 403 });
  }

  try {
    const body = await request.json();
    const { user_id, type, title, message, data, priority = 'medium', send_email = false } = body;

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create notification
    const notificationData: any = {
      user_id: user_id || null,
      type,
      title,
      message,
      data: data || null,
      priority,
      is_read: false,
    };

    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();

    if (notifError) throw notifError;

    // Send email notification if requested
    if (send_email && user_id) {
      try {
        // Get user email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, first_name')
          .eq('id', user_id)
          .single();

        if (!userError && userData?.email) {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">TripGo Notification</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                  <h2 style="color: #1f2937; margin-top: 0;">${title}</h2>
                  <p style="font-size: 16px; color: #4b5563;">${message}</p>
                  ${data ? `
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">${JSON.stringify(data, null, 2)}</p>
                    </div>
                  ` : ''}
                  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                    Login ke TripGo untuk melihat detail lengkap: <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard" style="color: #3b82f6;">Dashboard</a>
                  </p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                  <p>© ${new Date().getFullYear()} TripGo. All rights reserved.</p>
                </div>
              </body>
            </html>
          `;

          await sendMail({
            to: userData.email,
            subject: `TripGo: ${title}`,
            html: emailHtml,
            text: `${title}\n\n${message}`,
          });

          // Update notification with sent_at
          await supabase
            .from('notifications')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', notification.id);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the notification creation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      notification,
      email_sent: send_email && notification.user_id ? true : false,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: error.message || 'Failed to create notification' }, { status: 500 });
  }
}

