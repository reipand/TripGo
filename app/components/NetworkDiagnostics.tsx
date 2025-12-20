'use client';

import { useState, useEffect } from 'react';

export const NetworkDiagnostics = () => {
  const [diagnostics, setDiagnostics] = useState<{
    online: boolean;
    supabaseReachable: boolean | null;
    lastChecked: string;
  }>({
    online: navigator.onLine,
    supabaseReachable: null,
    lastChecked: new Date().toLocaleTimeString(),
  });

  const checkConnectivity = async () => {
    try {
      // Check basic internet connectivity
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
      });
      const basicOnline = true;

      // Check Supabase connectivity
      let supabaseReachable = false;
      try {
        const supabaseResponse = await fetch('https://huwcvhngslkmfljfnxrv.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1d2N2aG5nc2xrbWZsamZueHJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4ODA0NjQsImV4cCI6MjA3MjQ1NjQ2NH0.EFKYTaaftNNV0W_4buhjPA5hFS35CHYCqr5nWw54TWg',
          },
        });
        supabaseReachable = supabaseResponse.ok;
      } catch (error) {
        console.warn('Supabase connectivity check failed:', error);
        supabaseReachable = false;
      }

      setDiagnostics({
        online: basicOnline,
        supabaseReachable,
        lastChecked: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      setDiagnostics({
        online: false,
        supabaseReachable: false,
        lastChecked: new Date().toLocaleTimeString(),
      });
    }
  };

  useEffect(() => {
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">Network Diagnostics</div>
      <div>Online: {diagnostics.online ? '✅' : '❌'}</div>
      <div>Supabase: {diagnostics.supabaseReachable === null ? '⏳' : diagnostics.supabaseReachable ? '✅' : '❌'}</div>
      <div>Last checked: {diagnostics.lastChecked}</div>
      <button
        onClick={checkConnectivity}
        className="mt-2 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
      >
        Refresh
      </button>
    </div>
  );
};