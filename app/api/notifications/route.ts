// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

// GET: Get user notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'userId or email is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      // Get user by email first
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      query = query.eq('user_id', user.id);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: notifications,
      count: notifications?.length || 0
    });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch notifications' 
      },
      { status: 500 }
    );
  }
}

// POST: Create notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, data, bookingId, bookingCode } = body;

    // Validate required fields
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        title,
        message,
        is_read: false,
        data: data || {},
        booking_id: bookingId,
        booking_code: bookingCode,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });

  } catch (error: any) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to create notification' 
      },
      { status: 500 }
    );
  }
}

// PATCH: Update notification (mark as read)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificationId, isRead } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (isRead !== undefined) updateData.is_read = isRead;

    const { data: notification, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notification updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to update notification' 
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to delete notification' 
      },
      { status: 500 }
    );
  }
}