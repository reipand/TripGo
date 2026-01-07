import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (code) {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/auth/login?error=auth_failed', request.url));
      }
      
      if (data.session) {
        // Redirect to dashboard on success
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    return NextResponse.redirect(new URL('/auth/login', request.url));
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(new URL('/auth/login?error=callback_error', request.url));
  }
}