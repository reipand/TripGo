// app/api/auth/reset/route.ts - Untuk testing saja
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string) {
          cookieStore.set({ name, value, path: '/' })
        },
        remove(name: string) {
          cookieStore.set({ name, value: '', path: '/' })
        },
      },
    }
  )
  
  // Clear all auth cookies
  cookieStore.getAll().forEach(cookie => {
    if (cookie.name.includes('sb-') || cookie.name.includes('supabase-')) {
      cookieStore.delete(cookie.name)
    }
  })
  
  // Sign out
  await supabase.auth.signOut()
  
  return NextResponse.json({ 
    success: true, 
    message: 'Auth state reset' 
  })
}