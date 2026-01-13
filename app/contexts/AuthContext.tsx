'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/app/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// Debug helper
const isDevelopment = process.env.NODE_ENV === 'development';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  loading: boolean;
  networkError: boolean;
  supabaseError: string | null;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: AuthError | null; needsVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: (redirectUrl?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null; success: boolean }>;
  handleOAuthCallback: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  verifyEmail: (email: string, code: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  resendVerificationCode: (email: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  verifyEmailWithToken: (token: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  fetchUserProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
  clearErrors: () => void;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const router = useRouter();
  // Hapus retryCount dari state atau gunakan ref
  const retryCountRef = React.useRef(0);

  // Clear errors function
  const clearErrors = useCallback(() => {
    setSupabaseError(null);
    setNetworkError(false);
  }, []);

  // **VERSI SIMPLIFIED: Tidak perlu table users**
  const fetchUserProfile = useCallback(async () => {
    if (!user) {
      if (isDevelopment) {
        console.log('No user, skipping profile fetch');
      }
      return;
    }

    try {
      // Create profile directly from auth user data
      const profileData = {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || 
              user.user_metadata?.full_name || 
              user.user_metadata?.user_name ||
              '',
        phone: user.user_metadata?.phone || '',
        avatar_url: user.user_metadata?.avatar_url || 
                   user.user_metadata?.picture || 
                   user.user_metadata?.avatar || 
                   '',
        created_at: user.created_at,
        updated_at: new Date().toISOString(),
        // Include any other metadata
        ...user.user_metadata
      };
      
      setUserProfile(profileData);
      
      if (isDevelopment) {
        console.log('User profile created from auth data:', profileData);
      }
      
    } catch (error) {
      console.error('Error creating user profile:', error);
      
      // Minimal fallback
      const fallbackProfile = {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      };
      setUserProfile(fallbackProfile);
    }
  }, [user]);

  // Function untuk retry dengan delay
  const retryWithDelay = useCallback((callback: () => void, delay: number, maxRetries: number) => {
    if (retryCountRef.current >= maxRetries) {
      console.warn(`Max retries (${maxRetries}) reached`);
      return;
    }
    
    retryCountRef.current += 1;
    console.warn(`Retry ${retryCountRef.current}/${maxRetries} after ${delay}ms`);
    
    setTimeout(() => {
      callback();
    }, delay);
  }, []);

  // Initialize auth - FIXED: Pisahkan retry logic
  useEffect(() => {
    let mounted = true;
    let authSubscription: any;

    const initializeAuth = async () => {
      if (!supabase || !supabase.auth) {
        const errorMsg = 'Authentication service is not available';
        console.error(errorMsg);
        setSupabaseError(errorMsg);
        if (mounted) setLoading(false);
        return;
      }

      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', {
            error,
            message: error.message,
            name: error.name
          });
          
          if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
            const errorMsg = 'Invalid Supabase API key configuration.';
            setSupabaseError(errorMsg);
          } else if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
            setNetworkError(true);
            
            // Gunakan ref-based retry tanpa memicu re-render
            if (retryCountRef.current < 3) {
              console.warn(`Network error detected, retrying... (${retryCountRef.current + 1}/3)`);
              
              // Gunakan setTimeout langsung tanpa setState
              setTimeout(() => {
                if (mounted) {
                  initializeAuth();
                }
              }, 3000);
            }
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setNetworkError(false);
          setSupabaseError(null);
          
          // Fetch user profile if user exists
          if (session?.user && mounted) {
            fetchUserProfile();
          }
        }
      } catch (error: any) {
        console.error('Exception getting session:', {
          error,
          message: error?.message || 'Unknown error',
          stack: error?.stack
        });
        if (error instanceof TypeError && error.message?.includes('fetch')) {
          setNetworkError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const setupAuthListener = () => {
      if (!supabase || !supabase.auth) return null;

      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: string, currentSession: Session | null) => {
            if (!mounted) return;
            
            console.log('Auth state changed:', event);
            
            try {
              setSession(currentSession);
              setUser(currentSession?.user ?? null);
              setNetworkError(false);
              setSupabaseError(null);

              switch (event) {
                case 'SIGNED_IN':
                  if (currentSession?.user) {
                    // Fetch user profile
                    fetchUserProfile();
                    
                    // Reset retry counter on successful auth
                    retryCountRef.current = 0;
                    
                    // Redirect based on stored URL or default
                    const redirectUrl = localStorage.getItem('tripgo_redirect_url');
                    if (redirectUrl) {
                      localStorage.removeItem('tripgo_redirect_url');
                      router.push(redirectUrl);
                    } else {
                      router.push('/dashboard');
                    }
                  }
                  break;
                  
                case 'SIGNED_OUT':
                  setUserProfile(null);
                  setUser(null);
                  setSession(null);
                  // Reset retry counter on sign out
                  retryCountRef.current = 0;
                  localStorage.removeItem('tripgo_redirect_url');
                  localStorage.removeItem('notificationCount');
                  router.push('/');
                  break;
                  
                case 'USER_UPDATED':
                  fetchUserProfile();
                  break;
                  
                case 'TOKEN_REFRESHED':
                  if (isDevelopment) {
                    console.log('Session token refreshed');
                  }
                  break;
                  
                default:
                  break;
              }
            } catch (eventError) {
              console.error('Error in auth state change:', eventError);
            }
          }
        );

        return subscription;
      } catch (error) {
        console.error('Error setting up auth listener:', error);
        return null;
      }
    };

    authSubscription = setupAuthListener();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
      // Reset retry counter on unmount
      retryCountRef.current = 0;
    };
  }, [router, fetchUserProfile]); // Hapus retryCount dari dependencies

  const signUp = async (email: string, password: string, userData?: any) => {
    clearErrors();
    
    if (!supabase || !supabase.auth) {
      return { error: { message: 'Authentication service is not available' } as AuthError };
    }

    try {
      // Validate inputs
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Format email tidak valid' } as AuthError };
      }

      if (password.length < 8) {
        return { error: { message: 'Password minimal 8 karakter' } as AuthError };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('SignUp Error:', {
          error,
          message: error.message,
          name: error.name
        });
        
        if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          const errorMsg = 'Invalid Supabase configuration.';
          setSupabaseError(errorMsg);
          return { error: { message: errorMsg } as AuthError };
        }
        
        if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
          setNetworkError(true);
          return { error: { message: 'Network error. Silakan coba lagi.' } as AuthError };
        }
        
        // Handle specific errors
        if (error.message.includes('Password should contain')) {
          return { error: { message: 'Password harus mengandung minimal 1 huruf kecil, 1 huruf besar, dan 1 angka' } as AuthError };
        }
        
        if (error.message.includes('User already registered')) {
          return { error: { message: 'Email sudah terdaftar.' } as AuthError };
        }
        
        return { error };
      }

      // If email confirmation is required
      if (data.user && !data.session) {
        return { error: null, needsVerification: true };
      }

      return { error: null };
    } catch (error: any) {
      console.error('SignUp Exception:', {
        error,
        message: error?.message || 'Unknown error'
      });
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    clearErrors();
    
    if (!supabase || !supabase.auth) {
      return { error: { message: 'Authentication service is not available' } as AuthError };
    }

    try {
      // Validate inputs
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Format email tidak valid' } as AuthError };
      }

      if (!password || password.length === 0) {
        return { error: { message: 'Password tidak boleh kosong' } as AuthError };
      }

      console.log('🔐 Attempting login for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('SignIn Error:', {
          error,
          message: error.message,
          name: error.name
        });
        
        if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          const errorMsg = 'Invalid Supabase configuration.';
          setSupabaseError(errorMsg);
          return { error: { message: errorMsg } as AuthError };
        }
        
        if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
          setNetworkError(true);
          return { error: { message: 'Network error.' } as AuthError };
        }
        
        // Handle specific login errors
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'Email atau password salah' } as AuthError };
        }
        
        if (error.message.includes('Email not confirmed')) {
          return { error: { message: 'Email belum diverifikasi.' } as AuthError };
        }
        
        return { error };
      }

      console.log('✅ Login successful for:', data.user?.email);

      return { error: null };
    } catch (error: any) {
      console.error('SignIn Exception:', {
        error,
        message: error?.message || 'Unknown error'
      });
      return { error: error as AuthError };
    }
  };

  // Google Sign In
  const signInWithGoogle = async (redirectUrl?: string) => {
    clearErrors();
    
    if (!supabase || !supabase.auth) {
      return { error: { message: 'Authentication service is not available' } as AuthError };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl || `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        console.error('Google Sign In Error:', {
          error,
          message: error.message,
          name: error.name
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Google Sign In Exception:', error);
      return { error: error as AuthError };
    }
  };

  // Sign Out Function
  const signOut = async () => {
    clearErrors();
    
    if (!supabase || !supabase.auth) {
      console.error('Cannot sign out: Authentication service not available');
      return { error: { message: 'Authentication service is not available' } as AuthError, success: false };
    }

    try {
      // Clear local state first
      setUserProfile(null);
      setUser(null);
      setSession(null);
      
      // Reset retry counter
      retryCountRef.current = 0;
      
      // Clear local storage
      localStorage.removeItem('notificationCount');
      localStorage.removeItem('tripgo_redirect_url');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', {
          error,
          message: error.message,
          name: error.name
        });
        
        // Even if there's an error, clear local state
        setUser(null);
        setSession(null);
        setUserProfile(null);
        
        return { error, success: false };
      }
      
      // Dispatch events to notify other components
      window.dispatchEvent(new CustomEvent('authChange', { detail: { user: null } }));
      window.dispatchEvent(new CustomEvent('notificationUpdate', { detail: { count: 0 } }));
      
      return { error: null, success: true };
      
    } catch (error: any) {
      console.error('Error signing out:', {
        error,
        message: error?.message || 'Unknown error'
      });
      
      // Clear state even if there's an error
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      return { 
        error: error as AuthError, 
        success: false 
      };
    }
  };

  // Handle OAuth Callback
  const handleOAuthCallback = async () => {
    clearErrors();
    
    if (!supabase || !supabase.auth) {
      return { error: { message: 'Authentication service is not available' } as AuthError };
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('OAuth callback error:', {
          error,
          message: error.message,
          name: error.name
        });
        return { error };
      }
      
      if (session) {
        setSession(session);
        setUser(session.user);
        
        // Fetch user profile
        await fetchUserProfile();
        
        return { error: null };
      }
      
      return { error: { message: 'No session found' } as AuthError };
    } catch (error) {
      console.error('OAuth callback exception:', error);
      return { error: error as AuthError };
    }
  };

  const resetPassword = async (email: string) => {
    clearErrors();
    
    if (!supabase || !supabase.auth) {
      return { error: { message: 'Authentication service is not available' } as AuthError, success: false };
    }

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Format email tidak valid' } as AuthError, success: false };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        console.error('Reset Password Error:', {
          error,
          message: error.message,
          name: error.name
        });
        return { error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      console.error('Reset Password Exception:', error);
      return { error: error as AuthError, success: false };
    }
  };

  const updatePassword = async (newPassword: string) => {
    clearErrors();
    
    if (!supabase || !supabase.auth) {
      return { error: { message: 'Authentication service is not available' } as AuthError, success: false };
    }

    try {
      if (newPassword.length < 8) {
        return { error: { message: 'Password minimal 8 karakter' } as AuthError, success: false };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Update Password Error:', {
          error,
          message: error.message,
          name: error.name
        });
        return { error, success: false };
      }

      return { error: null, success: true };
    } catch (error) {
      console.error('Update Password Exception:', error);
      return { error: error as AuthError, success: false };
    }
  };

  // Email verification functions
  const verifyEmail = async (email: string, code: string) => {
    clearErrors();
    
    if (!supabase || !supabase.auth) {
      return { error: { message: 'Authentication service is not available' } as AuthError, success: false };
    }

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Format email tidak valid' } as AuthError, success: false };
      }

      if (!/^\d{6}$/.test(code)) {
        return { error: { message: 'Kode verifikasi harus 6 digit angka' } as AuthError, success: false };
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email'
      });

      if (error) {
        console.error('Verify Email Error:', {
          error,
          message: error.message,
          name: error.name
        });
        return { error, success: false };
      }

      if (data.user) {
        setUser(data.user);
        await fetchUserProfile();
        return { error: null, success: true };
      } else {
        return { error: { message: 'Verifikasi gagal' } as AuthError, success: false };
      }
    } catch (error: any) {
      console.error('Verify Email Exception:', {
        error,
        message: error?.message || 'Unknown error'
      });
      return { error: error as AuthError, success: false };
    }
  };

  const resendVerificationCode = async (email: string) => {
    clearErrors();
    
    if (!supabase || !supabase.auth) {
      return { error: { message: 'Authentication service is not available' } as AuthError, success: false };
    }

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Format email tidak valid' } as AuthError, success: false };
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Resend Verification Code Error:', {
          error,
          message: error.message,
          name: error.name
        });
        return { error, success: false };
      }

      return { error: null, success: true };
    } catch (error: any) {
      console.error('Resend Verification Code Exception:', {
        error,
        message: error?.message || 'Unknown error'
      });
      return { error: error as AuthError, success: false };
    }
  };

  const verifyEmailWithToken = async (token: string) => {
    clearErrors();
    
    if (!supabase || !supabase.auth) {
      return { error: { message: 'Authentication service is not available' } as AuthError, success: false };
    }

    try {
      if (!token) {
        return { error: { message: 'Token verifikasi tidak valid' } as AuthError, success: false };
      }

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) {
        console.error('Verify Email Token Error:', {
          error,
          message: error.message,
          name: error.name
        });
        return { error, success: false };
      }

      if (data.user) {
        setUser(data.user);
        await fetchUserProfile();
        return { error: null, success: true };
      } else {
        return { error: { message: 'Verifikasi gagal' } as AuthError, success: false };
      }
    } catch (error: any) {
      console.error('Verify Email Token Exception:', {
        error,
        message: error?.message || 'Unknown error'
      });
      return { error: error as AuthError, success: false };
    }
  };

  const refreshSession = async () => {
    clearErrors();
    
    if (!supabase || !supabase.auth) {
      console.error('Cannot refresh session: Authentication service not available');
      return;
    }

    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Refresh Session Error:', {
          error,
          message: error.message,
          name: error.name
        });
        return;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        await fetchUserProfile();
      }
    } catch (error) {
      console.error('Refresh Session Exception:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    loading,
    networkError,
    supabaseError,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    handleOAuthCallback,
    resetPassword,
    updatePassword,
    verifyEmail,
    resendVerificationCode,
    verifyEmailWithToken,
    fetchUserProfile,
    refreshSession,
    clearErrors,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};