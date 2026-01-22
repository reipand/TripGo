// app/api/auth/user-role/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Buat Supabase client untuk route handler
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Cookies mungkin sudah diatur
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Cookies mungkin sudah dihapus
            }
          },
        },
      }
    )
    
    // Dapatkan session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Gunakan service role key jika tersedia untuk bypass RLS
    let userData = null
    let userError = null
    
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      // Buat admin client dengan service role key
      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set() {}, // No-op untuk admin client
            remove() {}, // No-op untuk admin client
          },
        }
      )
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('role, name, email')
        .eq('id', session.user.id)
        .single()
      
      userData = data
      userError = error
    } else {
      // Fallback: gunakan client biasa dengan hati-hati
      // Mungkin akan terkena RLS, jadi kita gunakan try-catch
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role, name, email')
          .eq('id', session.user.id)
          .single()
        
        userData = data
        userError = error
      } catch (error) {
        console.error('Error querying users table:', error)
        userError = error as any
      }
    }
    
    if (userError) {
      console.error('Error fetching user role:', userError)
      
      // Fallback ke metadata jika query gagal
      return NextResponse.json({
        role: session.user.user_metadata?.role || 'user',
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || ''
      })
    }
    
    return NextResponse.json({
      role: userData?.role || 'user',
      name: userData?.name || session.user.user_metadata?.name || 'User',
      email: userData?.email || session.user.email || ''
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}