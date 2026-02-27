'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/app/lib/supabaseClient';

const ADMIN_EMAILS = [
  'reipgrow@gmail.com',
  'admin@tripo.com',
  'superadmin@tripo.com',
  'administrator@tripo.com'
];

const sanitizeRedirect = (value: string | null): string | null => {
  if (!value) return null;

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith('/') && !decoded.startsWith('//')) {
      return decoded;
    }
  } catch {
    return null;
  }

  return null;
};

async function ensureUserProfile(authUser: User): Promise<string> {
  const email = authUser.email || '';
  const userIsAdminEmail = ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email.toLowerCase());
  const defaultRole = userIsAdminEmail ? 'admin' : 'user';

  try {
    const { data: existingProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .maybeSingle();

    const existingRole = existingProfile?.role as string | undefined;
    const resolvedRole = userIsAdminEmail && !['admin', 'super_admin'].includes((existingRole || '').toLowerCase())
      ? 'admin'
      : (existingRole || defaultRole);

    await supabase
      .from('users')
      .upsert(
        {
          id: authUser.id,
          email,
          name:
            authUser.user_metadata?.name ||
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.display_name ||
            (email ? email.split('@')[0] : 'User'),
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
          role: resolvedRole,
          is_active: true,
          email_verified: !!authUser.email_confirmed_at,
          metadata: {
            ...authUser.user_metadata,
            registration_method: 'oauth_google'
          },
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    return resolvedRole;
  } catch (error) {
    console.warn('[OAuth Callback] Failed to sync user profile:', error);
    return defaultRole;
  }
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useAuth(); // keeps AuthContext alive for onAuthStateChange to handle profile loading
  const [statusMessage, setStatusMessage] = useState('Memproses autentikasi Google...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      try {
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          throw new Error(errorDescription || `OAuth Error: ${errorParam}`);
        }

        const code = searchParams.get('code');
        if (!code) throw new Error('Kode autentikasi tidak ditemukan.');

        setStatusMessage('Menyelesaikan sesi login...');

        // Single network call — user is returned directly, no need for getUser()
        const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;

        const authUser = sessionData?.user;
        if (!authUser) throw new Error('Sesi login tidak ditemukan. Silakan coba lagi.');

        // Sync profile to DB in background — don't block the redirect
        ensureUserProfile(authUser).catch(() => {});

        const requestedPath = sanitizeRedirect(searchParams.get('redirect'));
        const targetPath = requestedPath || '/dashboard';

        router.replace(targetPath);
      } catch (error: any) {
        console.error('[OAuth Callback] Error:', error);
        setErrorMessage(error?.message || 'Autentikasi gagal.');
        setTimeout(() => router.replace('/auth/login?error=oauth_failed'), 1500);
      }
    };

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-3">Autentikasi Gagal</h1>
          <p className="text-gray-600">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white font-medium">{statusMessage}</p>
      </div>
    </div>
  );
}

function CallbackLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A58CA] to-[#0548AD] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Memuat halaman...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackContent />
    </Suspense>
  );
}
