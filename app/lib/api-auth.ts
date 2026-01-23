// app/lib/api-auth.ts
import { NextRequest } from 'next/server';
import { createClient } from '@/app/lib/supabaseServer';
import { createClient as createClientDirect } from '@supabase/supabase-js';

// Get authenticated user from request
export async function getAuthUser(request: NextRequest) {
  try {
    console.log('=== getAuthUser called ===');
    
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No Bearer token found in header');
      return null;
    }

    const token = authHeader.substring(7);
    console.log('Token length:', token.length);
    
    // Gunakan createClientDirect untuk mendapatkan user dari auth
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return null;
    }

    const supabase = createClientDirect(supabaseUrl, supabaseKey);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    console.log('Auth getUser result:', { 
      hasUser: !!user, 
      error: error?.message,
      userId: user?.id,
      userEmail: user?.email 
    });
    
    if (error || !user) {
      console.error('Error getting auth user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error in getAuthUser:', error);
    return null;
  }
}

// Check if user is admin
export async function requireAdmin(request: NextRequest) {
  console.log('=== requireAdmin called ===');
  
  try {
    const user = await getAuthUser(request);
    if (!user) {
      console.log('No authenticated user found');
      return { user: null, error: 'Unauthorized' };
    }

    console.log('Authenticated user found:', { 
      id: user.id, 
      email: user.email 
    });

    // Gunakan createClient untuk query database
    const supabase = createClient();
    
    // Check if user exists in users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('User profile query result:', { 
      hasProfile: !!userProfile, 
      profileError: profileError?.message,
      profileRole: userProfile?.role 
    });

    if (profileError) {
      if (profileError.code === 'PGRST116') { // PGRST116 = "not found"
        console.log('User not found in users table, attempting to create profile...');
        
        // Create user profile
        const newUserProfile = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          phone: user.phone || null,
          role: 'user', // Default role
          is_active: true,
          email_verified: !!user.email_confirmed_at,
          phone_verified: !!user.phone_confirmed_at,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert(newUserProfile)
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          return { user: null, error: 'Unauthorized' };
        }

        console.log('Created new user profile:', createdUser);
        
        // Check if this user should be admin
        // Untuk development, Anda bisa otomatis set admin untuk user tertentu
        const shouldBeAdmin = process.env.NODE_ENV === 'development' || 
                             user.email?.endsWith('@example.com') || // contoh
                             user.id === process.env.DEFAULT_ADMIN_USER_ID;
        
        if (shouldBeAdmin) {
          console.log('Auto-promoting user to admin for development');
          const { data: promotedUser } = await supabase
            .from('users')
            .update({ role: 'super_admin' })
            .eq('id', user.id)
            .select()
            .single();
            
          if (promotedUser) {
            return { user: promotedUser, error: null };
          }
        }
        
        return { user: createdUser, error: 'Forbidden' }; // Default user tidak admin
      }
      
      console.error('Profile query error:', profileError);
      return { user: null, error: 'Unauthorized' };
    }

    if (!userProfile) {
      console.log('No user profile found');
      return { user: null, error: 'Unauthorized' };
    }

    // Check if user has admin role
    const isUserAdmin = ['super_admin', 'admin'].includes(userProfile.role);
    
    console.log('Admin check result:', { 
      role: userProfile.role, 
      isAdmin: isUserAdmin,
      email: userProfile.email 
    });

    if (!isUserAdmin) {
      console.log('User is not admin, role:', userProfile.role);
      return { user: userProfile, error: 'Forbidden' };
    }

    console.log('User is admin, access granted');
    return { user: userProfile, error: null };

  } catch (error) {
    console.error('Error in requireAdmin:', error);
    return { user: null, error: 'Unauthorized' };
  }
}

// Helper function untuk development: auto-set admin
export async function setupAdminUser(userId: string) {
  try {
    const supabase = createClient();
    
    const { data: userProfile, error } = await supabase
      .from('users')
      .update({ role: 'super_admin' })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error setting up admin user:', error);
      return null;
    }

    return userProfile;
  } catch (error) {
    console.error('Error in setupAdminUser:', error);
    return null;
  }
}

// Quick check untuk development
export async function quickAdminCheck(request: NextRequest) {
  // Development bypass
  if (process.env.NODE_ENV === 'development') {
    const bypassHeader = request.headers.get('X-Development-Bypass');
    if (bypassHeader === 'true') {
      console.log('Development bypass enabled');
      return { 
        user: { 
          id: 'dev-bypass-user', 
          email: 'dev@example.com', 
          role: 'super_admin',
          is_active: true 
        }, 
        error: null 
      };
    }
  }

  return await requireAdmin(request);
}