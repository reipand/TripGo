// app/contexts/AuthContext.tsx (updated)
'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/app/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';

const isDevelopment = process.env.NODE_ENV === 'development';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar_url?: string;
  role: 'super_admin' | 'admin' | 'staff' | 'user';
  is_active?: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  email_verified?: boolean;
  phone_verified?: boolean;
  last_login?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  networkError: boolean;
  supabaseError: string | null;
  isInitialized: boolean;
  
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: AuthError | null; needsVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: (callbackUrl?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ success: boolean; error?: AuthError }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<{ error: any | null; success: boolean }>;
  
  hasRole: (roles: string | string[]) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isUser: boolean;
  
  refreshSession: () => Promise<void>;
  clearErrors: () => void;
  checkSession: () => Promise<boolean>;
  forceUpdateRole: (role: 'admin' | 'super_admin' | 'staff' | 'user') => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/auth/verify',
  '/auth/redirect',
  '/privacy',
  '/terms',
  '/about',
  '/contact',
  '/help',
  '/faq'
];

// List of admin emails (can be extended)
const ADMIN_EMAILS = [
  'reipgrow@gmail.com',
  'admin@tripo.com',
  'superadmin@tripo.com',
  'administrator@tripo.com'
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const isMounted = useRef(true);
  const hasFetchedProfile = useRef(false);
  const isHandlingRedirect = useRef(false);
  const lastRedirectTime = useRef<number>(0);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Get token function
  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        console.log('[getToken] Token from supabase.auth.getSession:', data.session.access_token?.substring(0, 20) + '...');
        return data.session.access_token;
      }
      
      // Try localStorage
      const possibleKeys = ['sb-auth-token', 'supabase.auth.token', 'access_token'];
      for (const key of possibleKeys) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            console.log(`[getToken] Found key: ${key}`);
            
            try {
              const parsed = JSON.parse(stored);
              const token = parsed?.currentSession?.access_token || 
                           parsed?.access_token || 
                           parsed?.token || 
                           parsed;
              
              if (token && typeof token === 'string') {
                console.log(`[getToken] Token from ${key}: ${token.substring(0, 20)}...`);
                return token;
              }
            } catch (parseError) {
              if (typeof stored === 'string' && stored.length > 100) {
                console.log(`[getToken] Plain token from ${key}: ${stored.substring(0, 20)}...`);
                return stored;
              }
            }
          }
        } catch (e) {
          console.warn(`[getToken] Error reading key ${key}:`, e);
          continue;
        }
      }
      
      console.log('[getToken] No token found');
      return null;
    } catch (error) {
      console.error('[getToken] Error getting token:', error);
      return null;
    }
  }, []);

  // Helper functions
  const getRedirectPathByRole = useCallback((role: string | undefined): string => {
    const normalizedRole = role?.toLowerCase();
    
    if (normalizedRole === 'admin' || normalizedRole === 'super_admin') {
      return '/admin/dashboard';
    }
    
    if (normalizedRole === 'staff') {
      return '/staff/dashboard';
    }
    
    return '/dashboard';
  }, []);

  const hasAccess = useCallback((userRole: string | undefined, path: string): boolean => {
    const normalizedRole = (userRole || 'user').toLowerCase();
    
    // Super admin bisa akses semua
    if (normalizedRole === 'super_admin') return true;
    
    // Admin bisa akses admin dan staff routes
    if (normalizedRole === 'admin') {
      if (path.startsWith('/super-admin')) return false;
      return true;
    }
    
    // Staff hanya bisa akses staff routes
    if (normalizedRole === 'staff') {
      if (path.startsWith('/admin') || path.startsWith('/super-admin')) return false;
      return true;
    }
    
    // User biasa hanya bisa akses non-admin routes
    if (normalizedRole === 'user') {
      if (path.startsWith('/admin') || path.startsWith('/staff') || path.startsWith('/super-admin')) return false;
      return true;
    }
    
    return false;
  }, []);

  const hasRole = useCallback((roles: string | string[]): boolean => {
    if (!userProfile) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const normalizedUserRole = userProfile.role?.toLowerCase() || 'user';
    return roleArray.some(role => role.toLowerCase() === normalizedUserRole);
  }, [userProfile]);

  const isSuperAdmin = hasRole('super_admin');
  const isAdmin = hasRole(['super_admin', 'admin']);
  const isStaff = hasRole(['super_admin', 'admin', 'staff']);
  const isUser = hasRole(['super_admin', 'admin', 'staff', 'user']);

  const clearErrors = useCallback(() => {
    setSupabaseError(null);
    setNetworkError(false);
  }, []);

  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      return !error && !!currentSession;
    } catch (error) {
      return false;
    }
  }, []);

  // Check if email is admin
  const isAdminEmail = useCallback((email: string): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.some(adminEmail => 
      email.toLowerCase() === adminEmail.toLowerCase()
    );
  }, []);

  // FIXED: fetchUserProfile dengan handling recursion error
  const fetchUserProfile = useCallback(async (currentUser: User): Promise<UserProfile | null> => {
    if (!currentUser || !currentUser.id) {
      console.log('[AuthContext] No user to fetch profile for');
      return null;
    }

    try {
      console.log(`[AuthContext] Fetching profile for user: ${currentUser.id}`);
      
      // Cek apakah email adalah admin
      const userIsAdmin = isAdminEmail(currentUser.email || '');
      console.log(`[AuthContext] Email ${currentUser.email} is admin: ${userIsAdmin}`);
      
      // Try 1: Fetch dengan select minimal untuk hindari recursion
      const { data: profileData, error } = await supabase
        .from('users')
        .select('id, email, name, role, is_active, created_at')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (error) {
        console.warn(`[AuthContext] Error fetching profile:`, error.message);
        
        // Jika error karena recursion, coba metode alternatif
        if (error.message.includes('infinite recursion') || error.message.includes('recursion')) {
          console.log('[AuthContext] Recursion detected, using fallback method');
          
          // Fallback: Buat profile langsung tanpa query complex
          const fallbackProfile: UserProfile = {
            id: currentUser.id,
            email: currentUser.email || '',
            name: currentUser.user_metadata?.name || 
                  currentUser.user_metadata?.full_name || 
                  (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
            phone: currentUser.user_metadata?.phone || '',
            role: userIsAdmin ? 'admin' : 'user', // Set sebagai admin jika email cocok
            is_active: true,
            metadata: currentUser.user_metadata || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_verified: !!currentUser.email_confirmed_at,
            last_login: null
          };
          
          // Coba simpan profile dengan query sederhana
          try {
            await supabase
              .from('users')
              .upsert({
                id: fallbackProfile.id,
                email: fallbackProfile.email,
                name: fallbackProfile.name,
                role: fallbackProfile.role
              }, {
                onConflict: 'id',
                ignoreDuplicates: false
              });
          } catch (saveError) {
            console.warn('[AuthContext] Error saving fallback profile:', saveError);
          }
          
          return fallbackProfile;
        }
        
        // Untuk error lain, tetap return null
        return null;
      }

      if (profileData) {
        console.log(`[AuthContext] Profile found for user: ${profileData.email}, role: ${profileData.role}`);
        
        // Jika email admin tapi role bukan admin, update
        let finalRole = profileData.role || 'user';
        if (userIsAdmin && !['admin', 'super_admin'].includes(finalRole)) {
          console.log(`[AuthContext] Updating role to admin for ${profileData.email}`);
          finalRole = 'admin';
          
          // Update role di background
          setTimeout(async () => {
            try {
              await supabase
                .from('users')
                .update({ role: 'admin', updated_at: new Date().toISOString() })
                .eq('id', currentUser.id);
            } catch (updateError) {
              console.warn('[AuthContext] Failed to update role:', updateError);
            }
          }, 1000);
        }
        
        const userProfile: UserProfile = {
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          phone: '', // Will be filled later if needed
          avatar_url: '',
          role: finalRole as any,
          is_active: profileData.is_active,
          metadata: {},
          created_at: profileData.created_at,
          updated_at: new Date().toISOString(),
          email_verified: !!currentUser.email_confirmed_at,
          last_login: null
        };
        
        return userProfile;
      }

      console.log(`[AuthContext] No profile found for user ${currentUser.id}, creating one...`);
      
      // Create default profile - cek jika admin
      const defaultProfile: UserProfile = {
        id: currentUser.id,
        email: currentUser.email || '',
        name: currentUser.user_metadata?.name || 
              currentUser.user_metadata?.full_name || 
              (currentUser.email ? currentUser.email.split('@')[0] : 'User'),
        phone: currentUser.user_metadata?.phone || '',
        role: userIsAdmin ? 'admin' : 'user',
        is_active: true,
        metadata: currentUser.user_metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_verified: !!currentUser.email_confirmed_at,
        last_login: null
      };
      
      // Coba simpan profile dengan query sederhana
      try {
        await supabase
          .from('users')
          .upsert({
            id: defaultProfile.id,
            email: defaultProfile.email,
            name: defaultProfile.name,
            role: defaultProfile.role,
            is_active: true,
            created_at: defaultProfile.created_at,
            updated_at: defaultProfile.updated_at
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          });
      } catch (saveError) {
        console.warn('[AuthContext] Error saving new profile:', saveError);
      }
      
      return defaultProfile;
      
    } catch (error: any) {
      console.error(`[AuthContext] Exception in fetchUserProfile:`, error.message);
      
      // Return minimal profile as fallback
      return {
        id: currentUser.id,
        email: currentUser.email || '',
        name: currentUser.user_metadata?.name || 'User',
        role: isAdminEmail(currentUser.email || '') ? 'admin' : 'user',
        is_active: true,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_verified: !!currentUser.email_confirmed_at,
        last_login: null
      };
    }
  }, [isAdminEmail]);

  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) {
      return { error: 'No user found', success: false };
    }

    try {
      const updates = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      // Gunakan upsert dengan select minimal untuk hindari recursion
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: updates.name,
          role: updates.role,
          updated_at: updates.updated_at
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.warn('Error updating user profile:', error);
        return { error, success: false };
      }

      // Refresh user profile
      if (user) {
        const profile = await fetchUserProfile(user);
        if (profile && isMounted.current) {
          setUserProfile(profile);
        }
      }

      return { error: null, success: true };
    } catch (error: any) {
      console.warn('Exception updating user profile:', error);
      return { error, success: false };
    }
  }, [user, fetchUserProfile]);

  // Function to force update role
  const forceUpdateRole = useCallback(async (role: 'admin' | 'super_admin' | 'staff' | 'user') => {
    if (!user) {
      console.warn('[AuthContext] No user to update role');
      return;
    }

    try {
      console.log(`[AuthContext] Force updating role to ${role} for ${user.email}`);
      
      // Update role di database
      const { error } = await supabase
        .from('users')
        .update({ 
          role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.warn('[AuthContext] Error force updating role:', error);
      } else {
        console.log('[AuthContext] Role updated successfully');
        
        // Update local state
        if (userProfile && isMounted.current) {
          setUserProfile({
            ...userProfile,
            role,
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.warn('[AuthContext] Exception force updating role:', error);
    }
  }, [user, userProfile]);

  // SIMPLE redirect handler - hanya untuk auth pages
  const handleAuthPageRedirect = useCallback(() => {
    // Jika sedang loading atau bukan auth page, skip
    if (loading || !pathname?.startsWith('/auth/')) return;
    
    // Jika user sudah login dan membuka auth page, redirect ke dashboard sesuai role
    if (userProfile && !isHandlingRedirect.current) {
      isHandlingRedirect.current = true;
      
      // Cegah terlalu sering redirect (min 2 detik antar redirect)
      const now = Date.now();
      if (now - lastRedirectTime.current < 2000) {
        isHandlingRedirect.current = false;
        return;
      }
      
      lastRedirectTime.current = now;
      
      const redirectPath = getRedirectPathByRole(userProfile.role);
      console.log(`[AuthContext] User already logged in, redirecting from ${pathname} to ${redirectPath}`);
      
      router.push(redirectPath);
      
      // Reset flag setelah 1 detik
      setTimeout(() => {
        isHandlingRedirect.current = false;
      }, 1000);
    }
  }, [loading, pathname, userProfile, router, getRedirectPathByRole]);

  // Initialize auth
  useEffect(() => {
    isMounted.current = true;
    hasFetchedProfile.current = false;

    const initializeAuth = async () => {
      if (!isMounted.current) return;
      
      setLoading(true);
      
      try {
        console.log('[AuthContext] Initializing auth...');
        
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('Error getting session:', sessionError);
        } else if (currentSession && currentSession.user) {
          console.log('[AuthContext] User found:', currentSession.user.id, currentSession.user.email);
          
          if (isMounted.current) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
          
          // Fetch user profile hanya jika belum pernah
          if (!hasFetchedProfile.current) {
            const profile = await fetchUserProfile(currentSession.user);
            if (profile && isMounted.current) {
              console.log('[AuthContext] Profile loaded:', {
                email: profile.email,
                role: profile.role,
                isAdmin: ['admin', 'super_admin'].includes(profile.role)
              });
              setUserProfile(profile);
            }
            hasFetchedProfile.current = true;
          }
        } else {
          console.log('[AuthContext] No user session found');
        }
        
      } catch (error) {
        console.warn('Exception initializing auth:', error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
          setIsInitialized(true);
          console.log('[AuthContext] Auth initialized', {
            user: user?.email,
            role: userProfile?.role,
            isAdmin: userProfile ? ['admin', 'super_admin'].includes(userProfile.role) : false
          });
        }
      }
    };

    initializeAuth();
    
    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, currentSession: Session | null) => {
        if (!isMounted.current) return;
        
        console.log('[AuthContext] Auth state changed:', event);
        
        // Reset flag untuk user baru
        hasFetchedProfile.current = false;
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          
          // Fetch profile untuk user baru
          const profile = await fetchUserProfile(currentSession.user);
          if (profile && isMounted.current) {
            console.log('[AuthContext] New profile loaded:', {
              email: profile.email,
              role: profile.role,
              isAdmin: ['admin', 'super_admin'].includes(profile.role)
            });
            setUserProfile(profile);
            hasFetchedProfile.current = true;
            
            // AUTO-REDIRECT: Jika admin dan di halaman auth, redirect ke admin dashboard
            if (['admin', 'super_admin'].includes(profile.role) && 
                pathname?.startsWith('/auth/')) {
              console.log('[AuthContext] Auto-redirecting admin to /admin/dashboard');
              router.push('/admin/dashboard');
            }
          }
        } else {
          // Clear state saat logout
          setSession(null);
          setUser(null);
          setUserProfile(null);
          hasFetchedProfile.current = false;
          
          // Clear storage
          try {
            localStorage.removeItem('myBookings');
            localStorage.removeItem('userProfile');
            sessionStorage.clear();
          } catch (error) {
            console.warn('Error clearing storage:', error);
          }
        }
      }
    );

    return () => {
      console.log('[AuthContext] Cleaning up auth provider');
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, pathname, router]);

  // Handle auth page redirects
  useEffect(() => {
    if (isInitialized && !loading && pathname) {
      handleAuthPageRedirect();
    }
  }, [isInitialized, loading, pathname, handleAuthPageRedirect]);

  // Debug: Log role changes
  useEffect(() => {
    if (userProfile) {
      console.log('[AuthContext] User Profile Updated:', {
        email: userProfile.email,
        role: userProfile.role,
        isAdmin: ['admin', 'super_admin'].includes(userProfile.role),
        hasAdminAccess: isAdmin
      });
    }
  }, [userProfile, isAdmin]);

  // Auth methods
  const signUp = useCallback(async (email: string, password: string, userData?: any) => {
    clearErrors();
    
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { 
          error: { 
            name: 'ValidationError', 
            message: 'Format email tidak valid',
            status: 400 
          } as AuthError, 
          needsVerification: false 
        };
      }

      if (password.length < 8) {
        return { 
          error: { 
            name: 'ValidationError', 
            message: 'Password minimal 8 karakter',
            status: 400 
          } as AuthError, 
          needsVerification: false 
        };
      }

      const isAdminUser = isAdminEmail(email);
      console.log(`[AuthContext] Signing up ${email}, isAdmin: ${isAdminUser}`);

      const { data: authResponse, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || userData?.name || '',
            phone: userData?.phone || '',
            date_of_birth: userData?.date_of_birth || null,
            gender: userData?.gender || null,
            address: userData?.address || null,
            registration_date: new Date().toISOString(),
            registration_method: 'email_password',
            agreed_to_marketing: userData?.metadata?.agreed_to_marketing || false
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authError) {
        console.warn('SignUp Auth Error:', authError);
        
        const errorMsg = authError.message?.toLowerCase() || '';
        
        if (errorMsg.includes('already registered') || 
            errorMsg.includes('already exists')) {
          return { 
            error: { 
              name: 'AuthApiError', 
              message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.',
              status: 409 
            } as AuthError, 
            needsVerification: false 
          };
        }
        
        return { 
          error: authError as AuthError, 
          needsVerification: false 
        };
      }

      // Jika berhasil, buat profile dengan role yang sesuai
      if (authResponse.user) {
        const profileData = {
          id: authResponse.user.id,
          email: authResponse.user.email,
          name: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || userData?.name || '',
          phone: userData?.phone || '',
          role: isAdminUser ? 'admin' : 'user',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Simpan profile di background
        setTimeout(async () => {
          try {
            await supabase
              .from('users')
              .upsert(profileData, {
                onConflict: 'id'
              });
            console.log(`[AuthContext] Profile created for ${email} with role ${profileData.role}`);
          } catch (profileError) {
            console.warn('[AuthContext] Error creating profile:', profileError);
          }
        }, 500);
      }

      // Jika butuh verifikasi email
      if (authResponse.user && !authResponse.session) {
        console.log('User created, needs email verification:', authResponse.user.id);
        return { 
          error: null, 
          needsVerification: true,
          user: authResponse.user 
        };
      }

      // Jika langsung dapat session
      if (authResponse.user && authResponse.session) {
        console.log('User created with immediate session:', authResponse.user.id);
        return { 
          error: null, 
          needsVerification: false,
          user: authResponse.user,
          session: authResponse.session 
        };
      }

      return { 
        error: { 
          name: 'AuthApiError', 
          message: 'Registrasi gagal. Silakan coba lagi.',
          status: 500 
        } as AuthError, 
        needsVerification: false 
      };
    } catch (error: any) {
      console.warn('SignUp Exception:', error);
      
      const authError: AuthError = {
        name: error.name || 'AuthError',
        message: error.message || 'Terjadi kesalahan sistem saat mendaftar. Silakan coba lagi.',
        status: error.status || 500
      };
      
      return { 
        error: authError, 
        needsVerification: false 
      };
    }
  }, [clearErrors, isAdminEmail]);

  const signIn = useCallback(async (email: string, password: string) => {
    clearErrors();
    
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Format email tidak valid' } as AuthError };
      }

      if (!password || password.length === 0) {
        return { error: { message: 'Password tidak boleh kosong' } as AuthError };
      }

      console.log(`[AuthContext] Signing in ${email}, isAdminEmail: ${isAdminEmail(email)}`);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.warn('SignIn Error:', error);
        
        if (error.message?.includes('Invalid login credentials')) {
          return { error: { message: 'Email atau password salah' } as AuthError };
        }
        
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.warn('SignIn Exception:', error);
      return { error: error as AuthError };
    }
  }, [clearErrors, isAdminEmail]);

  const signInWithGoogle = useCallback(async (redirectTo?: string) => {
    clearErrors();

    try {
      const safeRedirect = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/dashboard';
      const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(safeRedirect)}`;

      console.log('[AuthContext] Starting Google OAuth');
      console.log('[AuthContext] Callback URL:', callbackUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile',
        },
      });

      if (error) {
        console.error('[AuthContext] Google sign in error:', error);
        setSupabaseError(error.message);
        throw error;
      }

      if (!data?.url) {
        const error = new Error('No OAuth URL returned');
        console.error('[AuthContext] No OAuth URL returned');
        setSupabaseError('Tidak dapat memulai proses login Google');
        throw error;
      }

      console.log('[AuthContext] OAuth URL generated, redirecting...');
      
      // Redirect ke Google OAuth
      window.location.href = data.url;
      
      return { error: null };
      
    } catch (error: any) {
      console.error('[AuthContext] Google sign in exception:', error);
      const authError: AuthError = {
        name: error.name || 'AuthApiError',
        message: error.message || 'Terjadi kesalahan saat login dengan Google',
        status: error.status || 500
      };
      setSupabaseError(authError.message);
      return { error: authError };
    }
  }, [clearErrors]);

  const signOut = useCallback(async () => {
    console.log('[AuthContext] Starting signOut...');
    clearErrors();
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.warn('Supabase sign out error:', error);
        return { success: false, error };
      }
      
      console.log('[AuthContext] Supabase sign out successful');
      
      // Clear state
      if (isMounted.current) {
        setSession(null);
        setUser(null);
        setUserProfile(null);
        hasFetchedProfile.current = false;
      }
      
      // Clear storage
      try {
        localStorage.removeItem('myBookings');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('tripCoins');
        localStorage.removeItem('sb-auth-code-verifier'); // Clear PKCE verifier
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('Error clearing storage:', storageError);
      }
      
      // Clear cookies
      document.cookie = 'sb-auth-code-verifier=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      
      // Redirect ke login
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 100);
      
      return { success: true };
      
    } catch (error: any) {
      console.error('Error in signOut:', error);
      
      try {
        window.location.href = '/auth/login';
      } catch (fallbackError) {
        console.error('Fallback redirect also failed:', fallbackError);
      }
      
      return { 
        success: false, 
        error: error as AuthError 
      };
    }
  }, [clearErrors]);

  const resetPassword = useCallback(async (email: string) => {
    clearErrors();
    
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Format email tidak valid' } as AuthError };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.warn('Reset password error:', error);
        return { error };
      }

      return { error: null, success: true };
    } catch (error: any) {
      console.warn('Reset password exception:', error);
      return { error: error as AuthError };
    }
  }, [clearErrors]);

  const updatePassword = useCallback(async (newPassword: string) => {
    clearErrors();
    
    try {
      if (newPassword.length < 8) {
        return { error: { message: 'Password minimal 8 karakter' } as AuthError };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.warn('Update password error:', error);
        return { error };
      }

      return { error: null, success: true };
    } catch (error: any) {
      console.warn('Update password exception:', error);
      return { error: error as AuthError };
    }
  }, [clearErrors]);

  const refreshSession = useCallback(async () => {
    clearErrors();
    
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.warn('Session refresh error:', error);
        return;
      }
      
      setSession(refreshedSession);
      setUser(refreshedSession?.user ?? null);
    } catch (error) {
      console.warn('Session refresh exception:', error);
    }
  }, [clearErrors]);

  // Create the context value
  const contextValue: AuthContextType = React.useMemo(() => ({
    user,
    session,
    userProfile,
    loading,
    networkError,
    supabaseError,
    isInitialized,
    getToken,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    fetchUserProfile: async () => {
      if (user) {
        const profile = await fetchUserProfile(user);
        if (profile && isMounted.current) {
          setUserProfile(profile);
        }
      }
    },
    updateUserProfile,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isStaff,
    isUser,
    refreshSession,
    clearErrors,
    checkSession,
    forceUpdateRole
  }), [
    user,
    session,
    userProfile,
    loading,
    networkError,
    supabaseError,
    isInitialized,
    getToken,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateUserProfile,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isStaff,
    isUser,
    refreshSession,
    clearErrors,
    checkSession,
    forceUpdateRole,
    fetchUserProfile,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook untuk require auth
export const useRequireAuth = (redirectTo = '/auth/login') => {
  const { user, loading, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isInitialized && !user) {
      const loginUrl = new URL(redirectTo, window.location.origin);
      loginUrl.searchParams.set('redirect', window.location.pathname);
      router.push(loginUrl.toString());
    }
  }, [user, loading, isInitialized, router, redirectTo]);

  return { user, loading };
};

export const useRequireGuest = () => {
  const { user, loading, isInitialized, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isInitialized && !loading && user && userProfile) {
      const role = userProfile.role;
      let targetPath = '/dashboard';
      
      if (role === 'admin' || role === 'super_admin') {
        targetPath = '/admin/dashboard';
      } else if (role === 'staff') {
        targetPath = '/staff/dashboard';
      }

      // Hanya redirect jika masih berada di halaman auth
      if (pathname?.startsWith('/auth/')) {
        router.push(targetPath);
      }
    }
  }, [user, loading, isInitialized, userProfile, router, pathname]);

  return { user, loading };
};

// Hook untuk admin route protection di client side
export const useAdminRoute = () => {
  const { userProfile, loading, isAdmin, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isInitialized && !loading) {
      const isAdminPath = pathname?.startsWith('/admin');
      
      if (isAdminPath && !isAdmin) {
        console.warn('[useAdminRoute] Unauthorized access to admin route', {
          path: pathname,
          role: userProfile?.role,
          isAdmin
        });
        router.push('/dashboard');
      }
    }
  }, [isAdmin, loading, isInitialized, pathname, router, userProfile]);

  return { userProfile, loading };
};

// Hook untuk debug admin access
export const useDebugAdmin = () => {
  const { user, userProfile, isAdmin, isSuperAdmin } = useAuth();
  
  useEffect(() => {
    if (userProfile) {
      console.log('[DebugAdmin] User Info:', {
        email: user?.email,
        profileEmail: userProfile.email,
        role: userProfile.role,
        isAdmin,
        isSuperAdmin,
        hasAdminAccess: isAdmin || isSuperAdmin
      });
    }
  }, [user, userProfile, isAdmin, isSuperAdmin]);
  
  return { user, userProfile, isAdmin, isSuperAdmin };
};
