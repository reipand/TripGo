// app/admin/login/page.tsx (sederhana)
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState('');
  const router = useRouter();

  // Check session on mount
  useEffect(() => {
    let isSubscribed = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!isSubscribed) return;

        if (session) {
          console.log('Session found, redirecting to admin dashboard');
          router.replace('/admin/dashboard');
        } else {
          setLoading(false);
        }
      } catch (e) {
        if (isSubscribed) {
          console.error('Session check error:', e);
          setLoading(false);
        }
      }
    };

    checkSession();

    return () => {
      isSubscribed = false;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login dengan Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Set localStorage bypass untuk admin
      localStorage.setItem('admin_override', 'true');
      localStorage.setItem('admin_email', email);

      console.log('Admin login successful, redirecting to admin dashboard');
      router.push('/admin/dashboard');

    } catch (err: any) {
      setError(err.message || 'Login gagal');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memeriksa sesi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Login as Admin'}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-600">
          <p>Test credentials:</p>
          <p>Email: reipgrow@gmail.com</p>
          <p>Password: [your password]</p>
        </div>
      </div>
    </div>
  );
}