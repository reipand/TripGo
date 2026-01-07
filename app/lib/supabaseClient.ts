// app/lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Debug info
const isDevelopment = process.env.NODE_ENV === 'development';

// Validasi environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
;

// Log untuk debugging
if (typeof window !== 'undefined' && isDevelopment) {
  console.log('🔧 Supabase Configuration Check:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `✅ ${supabaseUrl.substring(0, 30)}...` : '❌ Missing');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `✅ Set (${supabaseAnonKey.length} chars)` : '❌ Missing');
}

// Check for minimum requirements
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables are missing!');
  
  if (isDevelopment) {
    // Provide helpful guidance for development
    console.warn('📝 Development Tip: Create a .env.local file with:');
    console.warn('NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
    console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here');
  }
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('❌ Supabase URL must start with https://');
}

// Validate key format (typical Supabase anon key starts with eyJ)
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.warn('⚠️ Supabase anon key may be invalid. Should start with "eyJ"');
}

// Create client dengan configuration yang benar
let supabase: SupabaseClient<any, "public", "public", any, any>;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token',
        debug: isDevelopment
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey
        }
      },
      db: {
        schema: 'public'
      }
    });
    
    if (isDevelopment) {
      console.log('✅ Supabase client initialized successfully');
      
      // Test connection
      setTimeout(async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('⚠️ Supabase auth test failed:', error.message);
          } else {
            console.log('✅ Supabase auth connection test successful');
          }
        } catch (testError) {
          console.warn('⚠️ Supabase auth test error:', testError);
        }
      }, 1000);
    }
  } else {
    console.error('❌ Cannot create Supabase client: Missing required environment variables');
    
    // Create a mock client untuk development tanpa crash
    if (isDevelopment) {
      console.warn('⚠️ Creating mock Supabase client for development');
      supabase = {
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
          signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
          signOut: async () => {},
          resetPasswordForEmail: async () => ({ error: null }),
          updateUser: async () => ({ error: null }),
          verifyOtp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
          resend: async () => ({ error: null }),
          refreshSession: async () => ({ data: null, error: null }),
          signInWithOAuth: async () => ({ error: null })
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({ data: null, error: { code: 'PGRST116', message: 'Mock client' } }),
              maybeSingle: async () => ({ data: null, error: { code: 'PGRST116', message: 'Mock client' } })
            })
          }),
          insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Mock client' } }) }) }),
          update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Mock client' } }) }) }) }),
          delete: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Mock client' } }) }) }) })
        })
      } as any;
    } else {
      // Untuk production, throw error
      throw new Error('Supabase environment variables are not configured');
    }
  }
} catch (error) {
  console.error('❌ Failed to create Supabase client:', error);
  
  // Create a fallback mock client
  supabase = {
    auth: null,
    from: () => null
  } as any;
}

export { supabase, createClient };

// Admin client (optional - hanya untuk server-side operations)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);