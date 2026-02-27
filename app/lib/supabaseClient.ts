// app/lib/supabaseClient.ts - QUICK FIX
import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Always return a real client, never a proxy
export const createClient = () => {
  if (typeof window === 'undefined') {
    // Server: create fresh instance
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });
  }
  
  // Browser: create fresh instance
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    }
  });
};

// Export a singleton instance (works for browser, creates new for server)
let browserInstance: ReturnType<typeof createBrowserClient> | null = null;

export const supabase = (() => {
  if (typeof window === 'undefined') {
    return createClient(); // Fresh instance for each server request
  }
  
  // Reuse browser instance
  if (!browserInstance) {
    browserInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false, // Callback page handles PKCE exchange manually
      }
    });
  }
  
  return browserInstance;
})();