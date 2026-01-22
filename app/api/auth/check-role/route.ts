// app/api/auth/check-role/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Missing env variables' }, { status: 500 });
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const email = searchParams.get('email');
    
    if (!userId && !email) {
      return NextResponse.json({ error: 'User ID or Email required' }, { status: 400 });
    }
    
    let userData;
    
    if (userId) {
      // Get by user ID
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, role, created_at')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user by ID:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      userData = user;
    } else if (email) {
      // Get by email
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, role, created_at')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error('Error fetching user by email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      userData = user;
    }
    
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      role: userData.role || 'user',
      isAdmin: userData.role === 'admin' || userData.role === 'super_admin',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Error in check-role API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}