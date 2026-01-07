'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from '@/app/contexts/AuthContext';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { fetchUserProfile } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session from callback:', error);
          router.push('/auth/login?error=callback_failed');
          return;
        }

        if (session) {
          // Fetch user profile after successful login
          await fetchUserProfile();
          
          // Check for redirect URL in localStorage
          const redirectUrl = localStorage.getItem('tripgo_redirect_url');
          if (redirectUrl) {
            localStorage.removeItem('tripgo_redirect_url');
            router.push(redirectUrl);
          } else {
            router.push('/dashboard');
          }
        } else {
          // If no session, redirect to login
          router.push('/auth/login');
        }
     } catch (error) {
        console.error('OAuth callback error:', error);
        router.push('/auth/login?error=oauth_failed');
      }
    };

    handleCallback();
  }, [router, fetchUserProfile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD7E14] mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Memproses Login Google</h2>
          <p className="text-gray-600">Harap tunggu sebentar...</p>
          <div className="mt-4 space-y-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#FD7E14] rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm text-gray-500">Mengarahkan ke dashboard...</p>
          </div>
        </div>
      </div>
    </div>
  );
}