import { supabase } from './supabaseClient';
import { sendMail } from './mailer';

export interface NotificationData {
  user_id?: string | null;
  type: 'booking' | 'flight' | 'payment' | 'reminder' | 'system';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Send notification with optional email
 */
export async function sendNotification(
  notification: NotificationData,
  options?: { send_email?: boolean; send_push?: boolean }
): Promise<{ notification: any; email_sent: boolean }> {
  try {
    // Create notification in database
    const { data: notificationData, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.user_id || null,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || null,
        priority: notification.priority || 'medium',
        is_read: false,
      })
      .select()
      .single();

    if (notifError) throw notifError;

    let emailSent = false;

    // Send email if requested and user_id is provided
    if (options?.send_email && notification.user_id) {
      try {
        // Get user email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, first_name')
          .eq('id', notification.user_id)
          .single();

        if (!userError && userData?.email) {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${notification.title}</title>
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">TripGo Notification</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                  <h2 style="color: #1f2937; margin-top: 0;">Halo ${userData.first_name || 'User'},</h2>
                  <h3 style="color: #1f2937;">${notification.title}</h3>
                  <p style="font-size: 16px; color: #4b5563;">${notification.message}</p>
                  ${notification.data ? `
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                      <p style="margin: 0; color: #6b7280; font-size: 14px; white-space: pre-wrap;">${JSON.stringify(notification.data, null, 2)}</p>
                    </div>
                  ` : ''}
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Lihat Detail</a>
                  </div>
                  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                    Login ke TripGo untuk melihat detail lengkap: <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard" style="color: #3b82f6;">Dashboard</a>
                  </p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                  <p>© ${new Date().getFullYear()} TripGo. All rights reserved.</p>
                  <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
                </div>
              </body>
            </html>
          `;

          await sendMail({
            to: userData.email,
            subject: `TripGo: ${notification.title}`,
            html: emailHtml,
            text: `${notification.title}\n\n${notification.message}`,
          });

          // Update notification with sent_at
          await supabase
            .from('notifications')
            .update({ sent_at: new Date().toISOString() })
            .eq('id', notificationData.id);

          emailSent = true;
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the notification creation if email fails
      }
    }

    // Push notification is handled by Supabase real-time subscriptions
    // The RealtimeNotifications component will automatically receive updates

    return { notification: notificationData, email_sent: emailSent };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Send notification to multiple users (broadcast)
 */
export async function broadcastNotification(
  notification: Omit<NotificationData, 'user_id'>,
  user_ids: string[],
  options?: { send_email?: boolean }
): Promise<{ notifications: any[]; email_count: number }> {
  const results = await Promise.allSettled(
    user_ids.map(user_id =>
      sendNotification({ ...notification, user_id }, options)
    )
  );

  const notifications = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .map(r => r.value.notification);

  const email_count = results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
    .filter(r => r.value.email_sent).length;

  return { notifications, email_count };
}

