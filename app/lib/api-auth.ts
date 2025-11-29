import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminAccess, isAdmin } from './rbac';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Get authenticated user from request
export async function getAuthUser(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

// Check if user is admin
export async function requireAdmin(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return { user: null, error: 'Unauthorized' };
  }

  const isUserAdmin = await checkAdminAccess(user.id);
  if (!isUserAdmin) {
    return { user, error: 'Forbidden' };
  }

  return { user, error: null };
}

