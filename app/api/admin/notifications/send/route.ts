// app/api/admin/notifications/send/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/api-auth';
import { sendMail } from '@/app/lib/mailer';

// POST /api/admin/notifications/send - Send notification to users
export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json(
      { error: authError }, 
      { status: authError === 'Unauthorized' ? 401 : 403 }
    );
  }

  try {
    const supabase = createClient();
    const body = await request.json();
    
    const {
      user_ids,           // Array of specific user IDs
      user_emails,        // Array of specific user emails
      user_role,          // Send to all users with specific role
      send_to_all = false,// Send to all users
      type = 'system',    // system, booking, payment, promotion, etc.
      title,
      message,
      data = null,        // Additional data
      priority = 'medium',// low, medium, high
      send_email = false, // Send email notification
      send_push = false,  // Send push notification (future feature)
      schedule_at = null, // Schedule for future delivery
      email_template = 'default' // default, booking, payment, promotion
    } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Title and message are required' 
        },
        { status: 400 }
      );
    }

    // Validate recipient selection
    const recipientOptions = [user_ids, user_emails, user_role, send_to_all].filter(Boolean);
    if (recipientOptions.length !== 1) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Select exactly one recipient option: user_ids, user_emails, user_role, or send_to_all' 
        },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['system', 'booking', 'payment', 'promotion', 'announcement', 'alert'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid notification type' 
        },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid priority level' 
        },
        { status: 400 }
      );
    }

    // Get target users based on selection
    let targetUsers: Array<{ id: string; email: string; name: string }> = [];

    if (send_to_all) {
      // Get all active users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, is_active')
        .eq('is_active', true);

      if (usersError) {
        console.error('Error fetching all users:', usersError);
        throw usersError;
      }
      targetUsers = users || [];
    } 
    else if (user_role) {
      // Get users by role
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, is_active')
        .eq('role', user_role)
        .eq('is_active', true);

      if (usersError) {
        console.error(`Error fetching users with role ${user_role}:`, usersError);
        throw usersError;
      }
      targetUsers = users || [];
    }
    else if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
      // Get specific users by IDs
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, is_active')
        .in('id', user_ids)
        .eq('is_active', true);

      if (usersError) {
        console.error('Error fetching users by IDs:', usersError);
        throw usersError;
      }
      targetUsers = users || [];
    }
    else if (user_emails && Array.isArray(user_emails) && user_emails.length > 0) {
      // Get users by emails
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, name, is_active')
        .in('email', user_emails)
        .eq('is_active', true);

      if (usersError) {
        console.error('Error fetching users by emails:', usersError);
        throw usersError;
      }
      targetUsers = users || [];
    }

    // Check if we have target users
    if (targetUsers.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No target users found' 
        },
        { status: 400 }
      );
    }

    // Limit batch size for performance
    const MAX_BATCH_SIZE = 100;
    if (targetUsers.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { 
          success: false,
          error: `Too many recipients. Maximum allowed is ${MAX_BATCH_SIZE}` 
        },
        { status: 400 }
      );
    }

    // Prepare notification data for batch insert
    const notificationsData = targetUsers.map(user => ({
      user_id: user.id,
      type,
      title,
      message,
      data,
      priority,
      is_read: false,
      sent_at: schedule_at ? null : new Date().toISOString(),
      scheduled_for: schedule_at || null,
      created_by: user?.id || 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert notifications in batch
    const { data: insertedNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notificationsData)
      .select('*');

    if (insertError) {
      console.error('Error inserting notifications:', insertError);
      throw insertError;
    }

    // Send email notifications if requested
    let emailResults: Array<{ user_id: string; email: string; success: boolean; error?: string }> = [];
    
    if (send_email) {
      const emailPromises = targetUsers.map(async (user) => {
        try {
          if (!user.email) {
            return {
              user_id: user.id,
              email: user.email,
              success: false,
              error: 'No email address'
            };
          }

          // Prepare email content based on template
          const emailContent = getEmailTemplate(email_template, {
            title,
            message,
            data,
            user_name: user.name || 'Customer',
            base_url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
          });

          // Send email
          await sendMail({
            to: user.email,
            subject: `TripGo: ${title}`,
            html: emailContent.html,
            text: emailContent.text
          });

          // Update notification sent_at for successful email
          if (!schedule_at) {
            const notification = insertedNotifications?.find(n => n.user_id === user.id);
            if (notification) {
              await supabase
                .from('notifications')
                .update({ sent_at: new Date().toISOString() })
                .eq('id', notification.id);
            }
          }

          return {
            user_id: user.id,
            email: user.email,
            success: true
          };
        } catch (emailError: any) {
          console.error(`Error sending email to ${user.email}:`, emailError);
          return {
            user_id: user.id,
            email: user.email,
            success: false,
            error: emailError.message
          };
        }
      });

      emailResults = await Promise.all(emailPromises);
    }

    // Statistics
    const successEmails = emailResults.filter(r => r.success).length;
    const failedEmails = emailResults.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      data: {
        notifications: {
          total_sent: insertedNotifications?.length || 0,
          scheduled: schedule_at ? insertedNotifications?.length || 0 : 0,
          immediate: schedule_at ? 0 : insertedNotifications?.length || 0
        },
        emails: {
          total_sent: emailResults.length,
          successful: successEmails,
          failed: failedEmails,
          details: emailResults
        },
        recipients: {
          total: targetUsers.length,
          details: targetUsers.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name
          }))
        }
      },
      message: schedule_at 
        ? `Notification scheduled for ${targetUsers.length} users` 
        : `Notification sent to ${targetUsers.length} users`
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send notification'
    }, { status: 500 });
  }
}

// Helper function for email templates
function getEmailTemplate(template: string, data: any) {
  const { title, message, data: extraData, user_name, base_url } = data;

  const templates: Record<string, { html: string; text: string }> = {
    default: {
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; }
              .content h2 { color: #1f2937; margin-top: 0; }
              .data-box { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #3b82f6; }
              .footer { text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px; }
              .btn { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>TripGo Notification</h1>
            </div>
            <div class="content">
              <h2>Hello ${user_name},</h2>
              <p style="font-size: 16px; color: #4b5563;">${message}</p>
              ${extraData ? `
                <div class="data-box">
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">${JSON.stringify(extraData, null, 2)}</p>
                </div>
              ` : ''}
              <a href="${base_url}/dashboard/notifications" class="btn">View Details</a>
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                Login to TripGo for more details: <a href="${base_url}/dashboard" style="color: #3b82f6;">Dashboard</a>
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} TripGo. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: `Hello ${user_name},\n\n${title}\n\n${message}\n\nView details: ${base_url}/dashboard/notifications`
    },
    booking: {
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking Update: ${title}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; }
              .booking-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #d1d5db; }
              .btn { display: inline-block; background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Booking Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${user_name},</h2>
              <p style="font-size: 16px; color: #4b5563;">${message}</p>
              ${extraData ? `
                <div class="booking-info">
                  <h3 style="margin-top: 0; color: #374151;">Booking Details</h3>
                  <pre style="margin: 0; color: #6b7280; font-size: 14px;">${JSON.stringify(extraData, null, 2)}</pre>
                </div>
              ` : ''}
              <a href="${base_url}/dashboard/bookings" class="btn">View My Bookings</a>
            </div>
          </body>
        </html>
      `,
      text: `Booking Update\n\nHello ${user_name},\n\n${title}\n\n${message}\n\nView your bookings: ${base_url}/dashboard/bookings`
    },
    payment: {
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Notification: ${title}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { color: white; margin: 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; }
              .payment-info { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #d1d5db; }
              .btn { display: inline-block; background: #8b5cf6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Payment Notification</h1>
            </div>
            <div class="content">
              <h2>Hello ${user_name},</h2>
              <p style="font-size: 16px; color: #4b5563;">${message}</p>
              ${extraData ? `
                <div class="payment-info">
                  <h3 style="margin-top: 0; color: #374151;">Payment Details</h3>
                  <pre style="margin: 0; color: #6b7280; font-size: 14px;">${JSON.stringify(extraData, null, 2)}</pre>
                </div>
              ` : ''}
              <a href="${base_url}/dashboard/transactions" class="btn">View Transactions</a>
            </div>
          </body>
        </html>
      `,
      text: `Payment Notification\n\nHello ${user_name},\n\n${title}\n\n${message}\n\nView transactions: ${base_url}/dashboard/transactions`
    }
  };

  return templates[template] || templates.default;
}

// GET /api/admin/notifications/send - Get send statistics
export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireAdmin(request);
  
  if (authError) {
    return NextResponse.json(
      { error: authError }, 
      { status: authError === 'Unauthorized' ? 401 : 403 }
    );
  }

  try {
    const supabase = createClient();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query for notification statistics
    let query = supabase
      .from('notifications')
      .select('type, priority, sent_at, created_at', { count: 'exact' });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: notifications, count, error } = await query;

    if (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }

    // Calculate statistics
    const stats = {
      total_sent: count || 0,
      by_type: notifications?.reduce((acc: any, notif) => {
        acc[notif.type] = (acc[notif.type] || 0) + 1;
        return acc;
      }, {}),
      by_priority: notifications?.reduce((acc: any, notif) => {
        acc[notif.priority] = (acc[notif.priority] || 0) + 1;
        return acc;
      }, {}),
      scheduled: notifications?.filter(n => n.sent_at === null).length || 0,
      sent_today: notifications?.filter(n => {
        const today = new Date().toISOString().split('T')[0];
        return n.created_at && n.created_at.startsWith(today);
      }).length || 0
    };

    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Notification statistics retrieved successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error fetching notification statistics:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch notification statistics'
    }, { status: 500 });
  }
}