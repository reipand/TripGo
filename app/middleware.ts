// app/middleware.ts - Simplified version
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          response.cookies.delete({
            name,
            ...options,
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  // Public paths
  const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/callback', '/api'];
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(`${path}/`)
  );
  
  // Admin paths
  const isAdminPath = request.nextUrl.pathname.startsWith('/admin');

  // Jika tidak ada session dan bukan public path
  if (!session && !isPublicPath) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika ada session dan mengakses admin route
  if (session && isAdminPath) {
    try {
      // Coba ambil role dari database menggunakan service role untuk menghindari RLS
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceRoleKey) {
        const supabaseAdmin = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          {
            cookies: {
              get(name: string) {
                return request.cookies.get(name)?.value;
              },
              set() {}, // No-op
              remove() {}, // No-op
            },
          }
        );
        
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        const userRole = user?.role?.toLowerCase() || 'user';
        
        // Jika bukan admin, redirect ke dashboard
        if (!['admin', 'super_admin'].includes(userRole)) {
          console.log(`[Middleware] ${session.user.email} (${userRole}) denied access to admin`);
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        
        console.log(`[Middleware] ${session.user.email} (${userRole}) granted admin access`);
        
        // Tambahkan header untuk digunakan di client
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-role', userRole);
        requestHeaders.set('x-user-email', session.user.email || '');
        
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
    } catch (error) {
      console.warn('[Middleware] Error checking admin role:', error);
      // Jika error, biarkan pass dulu, client side akan handle
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|api/auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)',
  ],
};