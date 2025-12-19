// app/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://huwcvhngslkmfljfnxrv.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1d2N2aG5nc2xrbWZsamZueHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODA0NjQsImV4cCI6MjA3MjQ1NjQ2NH0.EFKYTaaftNNV0W_4buhjPA5hFS35CHYCqr5nWw54TWg';

// Create and export Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'tripgo-web-app'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});