// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client for server-side operations
const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Helper untuk menentukan redirect berdasarkan role
const getDefaultRedirectByRole = (userRole: string | undefined): string => {
  const role = (userRole || 'user').toLowerCase();
  
  switch (role) {
    case 'admin':
    case 'super_admin':
      return '/admin/dashboard';
    case 'staff':
      return '/staff/dashboard';
    case 'user':
    default:
      return '/dashboard';
  }
};

// Helper untuk cek akses
const hasAccess = (userRole: string | undefined, path: string): boolean => {
  if (!userRole) return false;
  
  const role = userRole.toLowerCase();
  
  if (path.startsWith('/admin')) {
    return ['admin', 'super_admin'].includes(role);
  }
  
  if (path.startsWith('/staff')) {
    return ['staff', 'super_admin'].includes(role);
  }
  
  if (path.startsWith('/super-admin')) {
    return role === 'super_admin';
  }
  
  // Untuk dashboard umum (/dashboard), semua role yang login boleh akses
  if (path.startsWith('/dashboard') && !path.startsWith('/admin/dashboard') && !path.startsWith('/staff/dashboard')) {
    return true;
  }
  
  return true;
};

export async function GET(request: NextRequest) {
  try {
    console.log('OAuth callback handler triggered');
    
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    // Jika ada error dari provider OAuth
    if (error) {
      console.error('OAuth provider error:', error, errorDescription);
      
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('error', 'oauth_failed');
      loginUrl.searchParams.set('message', errorDescription || error);
      
      return NextResponse.redirect(loginUrl);
    }
    
    if (!code) {
      console.error('No code parameter found');
      return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
    }
    
    // Create admin client untuk exchange code
    const supabaseAdmin = createAdminClient();
    
    // Exchange code untuk session
    const { data, error: exchangeError } = await supabaseAdmin.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('error', 'exchange_failed');
      loginUrl.searchParams.set('message', exchangeError.message);
      
      return NextResponse.redirect(loginUrl);
    }
    
    if (!data.session) {
      console.error('No session returned from exchange');
      return NextResponse.redirect(new URL('/auth/login?error=no_session', request.url));
    }
    
    const { user } = data.session;
    console.log('User authenticated via OAuth:', user.id, user.email);
    
    // Update last login dan get user role
    const supabase = createAdminClient();
    
    // Update last_login
    await supabase
      .from('users')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    // Tentukan redirect path
    const redirectParam = searchParams.get('redirect');
    let finalRedirect = getDefaultRedirectByRole(userData?.role);
    
    if (redirectParam) {
      try {
        const decodedPath = decodeURIComponent(redirectParam);
        
        // Validasi akses
        if (userData?.role && hasAccess(userData.role, decodedPath)) {
          finalRedirect = decodedPath;
        } else {
          // User tidak punya akses, gunakan default
          console.warn(`User role ${userData?.role} tidak memiliki akses ke ${decodedPath}`);
        }
      } catch (error) {
        console.error('Error decoding redirect path:', error);
      }
    }
    
    console.log('OAuth successful, redirecting to:', finalRedirect);
    
    // Redirect ke halaman tujuan dengan session yang sudah di-set
    return NextResponse.redirect(new URL(finalRedirect, request.url));
    
  } catch (error: any) {
    console.error('Unexpected error in OAuth callback:', error);
    
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('error', 'server_error');
    loginUrl.searchParams.set('message', 'Terjadi kesalahan pada server');
    
    return NextResponse.redirect(loginUrl);
  }
}