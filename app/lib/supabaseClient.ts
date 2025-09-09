// app/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// Ambil URL dan Key dari environment variables yang sudah kita buat
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Buat dan ekspor client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);