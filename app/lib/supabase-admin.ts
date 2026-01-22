// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

// Validasi environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase admin client
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

// Helper untuk mendapatkan user dengan service role
export const getSupabaseAdmin = () => supabaseAdmin;

// Test connection
export const testAdminConnection = async () => {
  try {
    const { data, error } = await supabaseAdmin.from('users').select('count');
    if (error) throw error;
    console.log('Admin connection test successful');
    return true;
  } catch (error) {
    console.error('Admin connection test failed:', error);
    return false;
  }
};