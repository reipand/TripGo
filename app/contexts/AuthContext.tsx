'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  signOut: () => Promise<void>;
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

  // Check Supabase client initialization
  useEffect(() => {
    const checkSupabaseClient = () => {
      if (!supabase) {
        const errorMsg = 'Supabase client is not initialized. Check environment variables.';
        console.error(errorMsg);
        setSupabaseError(errorMsg);
        setLoading(false);
        return false;
      }
      
      // Check if auth module exists
      if (!supabase.auth) {
        const errorMsg = 'Supabase auth module is not available.';
        console.error(errorMsg);
        setSupabaseError(errorMsg);
        setLoading(false);
        return false;
      }
      
      return true;
    };
    
    checkSupabaseClient();
  }, []);

  // Clear errors function
  const clearErrors = () => {
    setSupabaseError(null);
    setNetworkError(false);
  };

  // Function to fetch user profile from users table
  const fetchUserProfile = async () => {
    if (!supabase) {
      console.error('Cannot fetch user profile: Supabase client not available');
      return;
    }

    if (!user) {
      console.log('No user, skipping profile fetch');
      return;
    }

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (typeof error === 'object' && error !== null) {
          if (error.code === 'PGRST116') {
            // User profile doesn't exist yet - this is normal for new users
            if (isDevelopment) {
              console.log('User profile not found in database (new user)');
            }
          } else {
            console.error('Error fetching user profile:', {
              message: error.message,
              code: error.code,
              details: error.details
            });
            
            if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
              setNetworkError(true);
              console.warn('Network error fetching user profile, will retry...');
              setTimeout(() => fetchUserProfile(), 3000);
            }
          }
        } else {
          console.error('Unexpected error format:', error);
        }
      } else {
        setUserProfile(userData);
        setNetworkError(false);
        if (isDevelopment) {
          console.log('User profile loaded:', userData);
        }
      }
    } catch (error) {
      console.error('Exception fetching user profile:', {
        error: error,
        message: error instanceof Error ? error.message : String(error)
      });
      if (error instanceof TypeError && error.message?.includes('fetch')) {
        setNetworkError(true);
        setTimeout(() => fetchUserProfile(), 3000);
      }
    }
  };

  // Initialize auth
  useEffect(() => {
    if (supabaseError) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let authSubscription: any;

    const initializeAuth = async () => {
      if (!supabase || !supabase.auth) {
        setSupabaseError('Authentication service is not available');
        setLoading(false);
        return;
      }

      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          
          // Check for "Invalid API key" error
          if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
            const errorMsg = 'Invalid Supabase API key configuration. Please check your environment variables.';
            console.error(errorMsg);
            setSupabaseError(errorMsg);
          } else if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
            setNetworkError(true);
            console.warn('Network error detected, will retry...');
            setTimeout(() => {
              if (mounted) initializeAuth();
            }, 5000);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setNetworkError(false);
          setSupabaseError(null);
          
          // Fetch user profile if user exists
          if (session?.user) {
            setTimeout(() => {
              if (mounted) fetchUserProfile();
            }, 100);
          }
        }
      } catch (error: any) {
        console.error('Exception getting session:', error);
        if (error instanceof TypeError && error.message?.includes('fetch')) {
          setNetworkError(true);
          setTimeout(() => {
            if (mounted) initializeAuth();
          }, 5000);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }

      // Set up auth state change listener
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: string, session: Session | null) => {
            if (!mounted) return;
            
            try {
              setSession(session);
              setUser(session?.user ?? null);
              setNetworkError(false);
              setSupabaseError(null);

              // Handle auth events
              if (event === 'SIGNED_IN' && session?.user) {
                // Fetch user profile
                setTimeout(() => {
                  if (mounted) fetchUserProfile();
                }, 100);
                
                // Redirect based on stored URL or default
                const redirectUrl = localStorage.getItem('tripgo_redirect_url');
                if (redirectUrl) {
                  localStorage.removeItem('tripgo_redirect_url');
                  router.push(redirectUrl);
                } else {
                  router.push('/dashboard');
                }
              } else if (event === 'SIGNED_OUT') {
                setUserProfile(null);
                router.push('/');
              } else if (event === 'USER_UPDATED') {
                fetchUserProfile();
              } else if (event === 'TOKEN_REFRESHED') {
                if (isDevelopment) {
                  console.log('Session token refreshed');
                }
              }
            } catch (eventError) {
              console.error('Error in auth state change:', eventError);
            }
          }
        );

        authSubscription = subscription;
      } catch (error) {
        console.error('Error setting up auth listener:', error);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [router, supabaseError]);

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
          emailRedirectTo: `${window.location.origin}/auth/verify-email?email=${encodeURIComponent(email)}`
        }
      });

      if (error) {
        console.error('SignUp Error:', error);
        
        // Check for API key error
        if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          const errorMsg = 'Invalid Supabase configuration. Please contact support.';
          setSupabaseError(errorMsg);
          return { error: { message: errorMsg } as AuthError };
        }
        
        if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
          setNetworkError(true);
          return { error: { message: 'Network error. Please check your internet connection and try again.' } as AuthError };
        }
        
        // Handle specific errors
        if (error.message.includes('Password should contain')) {
          return { error: { message: 'Password harus mengandung minimal 1 huruf kecil, 1 huruf besar, dan 1 angka' } as AuthError };
        }
        
        if (error.message.includes('User already registered')) {
          return { error: { message: 'Email sudah terdaftar. Silakan gunakan email lain atau login' } as AuthError };
        }
        
        if (error.message.includes('Invalid email')) {
          return { error: { message: 'Email tidak valid' } as AuthError };
        }
        
        return { error };
      }

      // If email confirmation is required
      if (data.user && !data.session) {
        return { error: null, needsVerification: true };
      }

      return { error: null };
    } catch (error) {
      console.error('SignUp Exception:', error);
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
        console.error('SignIn Error:', error);
        
        // Check for API key error
        if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          const errorMsg = 'Invalid Supabase configuration. Please contact support.';
          setSupabaseError(errorMsg);
          return { error: { message: errorMsg } as AuthError };
        }
        
        if (error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
          setNetworkError(true);
          return { error: { message: 'Network error. Please check your internet connection and try again.' } as AuthError };
        }
        
        // Handle specific login errors
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'Email atau password salah' } as AuthError };
        }
        
        if (error.message.includes('Email not confirmed')) {
          return { error: { message: 'Email belum diverifikasi. Silakan cek email Anda dan klik link verifikasi' } as AuthError };
        }
        
        if (error.message.includes('Too many requests')) {
          return { error: { message: 'Terlalu banyak percobaan login. Silakan coba lagi nanti' } as AuthError };
        }
        
        if (error.message.includes('User not found')) {
          return { error: { message: 'Email tidak terdaftar. Silakan daftar terlebih dahulu' } as AuthError };
        }
        
        return { error };
      }

      console.log('✅ Login successful for:', data.user?.email);

      return { error: null };
    } catch (error: any) {
      console.error('SignIn Exception:', error);
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
      let redirectTo = `${window.location.origin}/auth/callback`;
      
      if (redirectUrl) {
        redirectTo = redirectUrl;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('Google Sign In Error:', error);
        
        // Check for API key error
        if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          const errorMsg = 'Invalid Supabase configuration. Please contact support.';
          setSupabaseError(errorMsg);
          return { error: { message: errorMsg } as AuthError };
        }
        
        if (error.message.includes('popup_blocked')) {
          return { error: { message: 'Popup diblokir oleh browser. Silakan izinkan popup untuk situs ini.' } as AuthError };
        }
        
        if (error.message.includes('access_denied')) {
          return { error: { message: 'Anda membatalkan proses login dengan Google.' } as AuthError };
        }
        
        if (error.message.includes('provider_disabled')) {
          return { error: { message: 'Login dengan Google belum diaktifkan di sistem.' } as AuthError };
        }
        
        if (error.message.includes('network_error')) {
          setNetworkError(true);
          return { error: { message: 'Network error. Please check your internet connection and try again.' } as AuthError };
        }
        
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Google Sign In Exception:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    clearErrors();
    
    if (!supabase || !supabase.auth) {
      console.error('Cannot sign out: Authentication service not available');
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
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
        console.error('OAuth callback error:', error);
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
        console.error('Reset Password Error:', error);
        
        // Check for API key error
        if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          const errorMsg = 'Invalid Supabase configuration. Please contact support.';
          setSupabaseError(errorMsg);
          return { error: { message: errorMsg } as AuthError, success: false };
        }
        
        if (error.message.includes('User not found')) {
          return { error: { message: 'Email tidak terdaftar' } as AuthError, success: false };
        }
        
        if (error.message.includes('Too many requests')) {
          return { error: { message: 'Terlalu banyak permintaan. Silakan coba lagi nanti' } as AuthError, success: false };
        }
        
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
        console.error('Update Password Error:', error);
        
        // Check for API key error
        if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          const errorMsg = 'Invalid Supabase configuration. Please contact support.';
          setSupabaseError(errorMsg);
          return { error: { message: errorMsg } as AuthError, success: false };
        }
        
        if (error.message.includes('Password should contain')) {
          return { error: { message: 'Password harus mengandung minimal 1 huruf kecil, 1 huruf besar, dan 1 angka' } as AuthError, success: false };
        }
        
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
        console.error('Verify Email Error:', error);
        
        // Check for API key error
        if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          const errorMsg = 'Invalid Supabase configuration. Please contact support.';
          setSupabaseError(errorMsg);
          return { error: { message: errorMsg } as AuthError, success: false };
        }
        
        if (error.message.includes('Token has expired') || error.message.includes('otp expired')) {
          return { error: { message: 'Kode verifikasi sudah kadaluarsa. Silakan minta kode baru.' } as AuthError, success: false };
        }
        
        if (error.message.includes('Invalid token') || error.message.includes('Token is invalid')) {
          return { error: { message: 'Kode verifikasi tidak valid' } as AuthError, success: false };
        }
        
        if (error.message.includes('Email not found')) {
          return { error: { message: 'Email tidak ditemukan' } as AuthError, success: false };
        }
        
        if (error.message.includes('too many requests')) {
          return { error: { message: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' } as AuthError, success: false };
        }
        
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
      console.error('Verify Email Exception:', error);
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
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      });

      if (error) {
        console.error('Resend Verification Code Error:', error);
        
        // Check for API key error
        if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          const errorMsg = 'Invalid Supabase configuration. Please contact support.';
          setSupabaseError(errorMsg);
          return { error: { message: errorMsg } as AuthError, success: false };
        }
        
        if (error.message.includes('Email not found')) {
          return { error: { message: 'Email tidak ditemukan' } as AuthError, success: false };
        }
        
        if (error.message.includes('Too many requests')) {
          return { error: { message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' } as AuthError, success: false };
        }
        
        if (error.message.includes('already confirmed')) {
          return { error: { message: 'Email sudah diverifikasi. Silakan login.' } as AuthError, success: false };
        }
        
        return { error, success: false };
      }

      return { error: null, success: true };
    } catch (error: any) {
      console.error('Resend Verification Code Exception:', error);
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
        console.error('Verify Email Token Error:', error);
        
        // Check for API key error
        if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
          const errorMsg = 'Invalid Supabase configuration. Please contact support.';
          setSupabaseError(errorMsg);
          return { error: { message: errorMsg } as AuthError, success: false };
        }
        
        if (error.message.includes('Token has expired') || error.message.includes('otp expired')) {
          return { error: { message: 'Token verifikasi sudah kadaluarsa. Silakan minta kode baru' } as AuthError, success: false };
        }
        
        if (error.message.includes('Invalid token')) {
          return { error: { message: 'Token verifikasi tidak valid' } as AuthError, success: false };
        }
        
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
      console.error('Verify Email Token Exception:', error);
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
        console.error('Refresh Session Error:', error);
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