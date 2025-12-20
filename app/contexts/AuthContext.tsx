'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/app/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  loading: boolean;
  networkError: boolean;
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: AuthError | null; needsVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  verifyEmail: (email: string, code: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  resendVerificationCode: (email: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  verifyEmailWithToken: (token: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  fetchUserProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
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
  const router = useRouter();

  // Function to fetch user profile from users table
  const fetchUserProfile = async () => {
    if (user) {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          // Check if it's a network error
          if (error.message?.includes('NetworkError') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
            setNetworkError(true);
            console.warn('Network error detected, will retry user profile fetch');
            // Retry after a delay
            setTimeout(() => {
              fetchUserProfile();
            }, 3000);
          }
        } else {
          setUserProfile(userData);
          setNetworkError(false);
          console.log('User profile loaded:', userData);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Handle network errors in catch block
        if (error instanceof TypeError && error.message?.includes('fetch')) {
          setNetworkError(true);
          console.warn('Network error detected in fetchUserProfile, will retry');
          setTimeout(() => {
            fetchUserProfile();
          }, 3000);
        }
      }
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          // Check if it's a network error
          if (error.message?.includes('NetworkError') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
            setNetworkError(true);
            console.warn('Network error detected, will retry session fetch in 5 seconds');
            // Retry after a delay for network errors
            setTimeout(() => {
              getInitialSession();
            }, 5000);
          } else {
            setLoading(false);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          setNetworkError(false);
          // Fetch user profile if user exists
          if (session?.user) {
            setTimeout(() => {
              fetchUserProfile();
            }, 100);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Network error getting session:', error);
        // Handle network errors in catch block
        if (error instanceof TypeError && (error.message?.includes('fetch') || error.message?.includes('NetworkError'))) {
          setNetworkError(true);
          console.warn('Network error detected in getInitialSession, will retry in 5 seconds');
          setTimeout(() => {
            getInitialSession();
          }, 5000);
        } else {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // Redirect based on auth state
          if (event === 'SIGNED_IN' && session?.user) {
            // Fetch user profile after sign in
            setTimeout(() => {
              fetchUserProfile();
            }, 100);
            
            // Check if there's a redirect URL in localStorage
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
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Format email tidak valid' } as AuthError };
      }

      // Validate password strength
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
        // Handle network errors
        if (error.message?.includes('NetworkError') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
          return { error: { message: 'Network error. Please check your internet connection and try again.' } as AuthError };
        }
        // Handle specific errors
        if (error.message.includes('captcha')) {
          return { error: { message: 'Please disable CAPTCHA in Supabase Dashboard > Authentication > Settings > Security' } as AuthError };
        }
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

      // If email confirmation is required, redirect to verification page
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
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Format email tidak valid' } as AuthError };
      }

      if (!password || password.length === 0) {
        return { error: { message: 'Password tidak boleh kosong' } as AuthError };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('SignIn Error:', error);
        // Handle network errors
        if (error.message?.includes('NetworkError') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
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

      // If login successful, fetch user data from users table
      if (data.user) {
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (userError) {
            console.error('Error fetching user data:', userError);
          } else {
            console.log('User data loaded:', userData);
          }
        } catch (fetchError) {
          console.error('Error fetching user profile:', fetchError);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('SignIn Exception:', error);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Format email tidak valid' } as AuthError, success: false };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('Reset Password Error:', error);
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
    try {
      // Validate password strength
      if (newPassword.length < 8) {
        return { error: { message: 'Password minimal 8 karakter' } as AuthError, success: false };
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Update Password Error:', error);
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

  const verifyEmail = async (email: string, code: string) => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Format email tidak valid' } as AuthError, success: false };
      }

      // Validate code format (6 digits)
      if (!/^\d{6}$/.test(code)) {
        return { error: { message: 'Kode verifikasi harus 6 digit angka' } as AuthError, success: false };
      }

      const { data, error } = await supabase.rpc('verify_email_with_code', {
        user_email: email,
        input_code: code
      });

      if (error) {
        console.error('Verify Email Error:', error);
        return { error, success: false };
      }

      if (data && data.success) {
        return { error: null, success: true };
      } else {
        return { error: { message: data?.message || 'Kode verifikasi tidak valid atau sudah expired' } as AuthError, success: false };
      }
    } catch (error) {
      console.error('Verify Email Exception:', error);
      return { error: error as AuthError, success: false };
    }
  };

  const resendVerificationCode = async (email: string) => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { error: { message: 'Format email tidak valid' } as AuthError, success: false };
      }

      const { data, error } = await supabase.rpc('resend_verification_code', {
        user_email: email
      });

      if (error) {
        console.error('Resend Verification Code Error:', error);
        return { error, success: false };
      }

      if (data && data.success) {
        return { error: null, success: true };
      } else {
        return { error: { message: data?.message || 'Gagal mengirim ulang kode verifikasi' } as AuthError, success: false };
      }
    } catch (error) {
      console.error('Resend Verification Code Exception:', error);
      return { error: error as AuthError, success: false };
    }
  };

  const verifyEmailWithToken = async (token: string) => {
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
        if (error.message.includes('Token has expired')) {
          return { error: { message: 'Token verifikasi sudah expired. Silakan minta kode baru' } as AuthError, success: false };
        }
        if (error.message.includes('Invalid token')) {
          return { error: { message: 'Token verifikasi tidak valid' } as AuthError, success: false };
        }
        return { error, success: false };
      }

      if (data.user) {
        return { error: null, success: true };
      } else {
        return { error: { message: 'Verifikasi gagal' } as AuthError, success: false };
      }
    } catch (error) {
      console.error('Verify Email Token Exception:', error);
      return { error: error as AuthError, success: false };
    }
  };

  const refreshSession = async () => {
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
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    fetchUserProfile,
    refreshSession,
    verifyEmail: async (email: string, code: string) => {
      const result = await verifyEmail(email, code);
      return { error: result.error as AuthError | null, success: result.success };
    },
    resendVerificationCode: async (email: string) => {
      const result = await resendVerificationCode(email);
      return { error: result.error as AuthError | null, success: result.success };
    },
    verifyEmailWithToken: async (token: string) => {
      const result = await verifyEmailWithToken(token);
      return { error: result.error, success: result.success };
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
