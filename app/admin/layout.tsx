// app/admin/layout.tsx
'use client';

import { ReactNode } from 'react';
import AdminSidebar from '@/app/components/layout/AdminSidebar';
import AdminHeader from '@/app/components/layout/AdminHeader';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}