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
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: AuthError | null; needsVerification?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  verifyEmail: (email: string, code: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  resendVerificationCode: (email: string) => Promise<{ error: AuthError | null; success?: boolean }>;
  fetchUserProfile: () => Promise<void>;
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
        } else {
          setUserProfile(userData);
          console.log('User profile loaded:', userData);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        // Fetch user profile if user exists
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile();
          }, 100);
        }
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Redirect based on auth state
        if (event === 'SIGNED_IN' && session?.user) {
          // Fetch user profile after sign in
          setTimeout(() => {
            fetchUserProfile();
          }, 100);
          router.push('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          setUserProfile(null);
          router.push('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const signUp = async (email: string, password: string, userData?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/auth/verify-email`
        }
      });

      if (error) {
        console.error('SignUp Error:', error);
        // Handle specific errors
        if (error.message.includes('captcha')) {
          return { error: { message: 'Please disable CAPTCHA in Supabase Dashboard > Authentication > Settings > Security' } as AuthError };
        }
        if (error.message.includes('Password should contain')) {
          return { error: { message: 'Password harus mengandung minimal 1 huruf kecil, 1 huruf besar, dan 1 angka' } as AuthError };
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('SignIn Error:', error);
        // Handle specific login errors
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'Email atau password salah' } as AuthError };
        }
        if (error.message.includes('Email not confirmed')) {
          return { error: { message: 'Email belum diverifikasi. Silakan cek email Anda' } as AuthError };
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error };
      }

      alert('Link reset password telah dikirim ke email Anda!');
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const verifyEmail = async (email: string, code: string) => {
    try {
      const { data, error } = await supabase.rpc('verify_email_with_code', {
        user_email: email,
        input_code: code
      });

      if (error) {
        return { error };
      }

      if (data && data.success) {
        return { error: null, success: true };
      } else {
        return { error: { message: data?.message || 'Verification failed' } as AuthError };
      }
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const resendVerificationCode = async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('resend_verification_code', {
        user_email: email
      });

      if (error) {
        return { error };
      }

      if (data && data.success) {
        return { error: null, success: true };
      } else {
        return { error: { message: data?.message || 'Failed to resend code' } as AuthError };
      }
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    fetchUserProfile,
    verifyEmail: async (email: string, code: string) => {
      const result = await verifyEmail(email, code);
      if (result.error && result.error !== null) {
        // Always provide AuthError or null
        return { error: result.error as AuthError, success: result.success };
      }
      return { error: null, success: result.success };
    },
    resendVerificationCode: async (email: string) => {
      const result = await resendVerificationCode(email);
      if (result.error && result.error !== null) {
        // Always provide AuthError or null
        return { error: result.error as AuthError, success: result.success };
      }
      return { error: null, success: result.success };
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
