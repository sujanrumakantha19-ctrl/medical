'use client';

import { StaffSidebar, StaffTopBar } from '@/components/staff';
import { ToastProvider } from '@/components/shared';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-gray-50">
        <StaffSidebar />
        <div className="flex-1 ml-64">
          <StaffTopBar />
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
