'use client';

import { MedicalSidebar } from '@/components/medical/sidebar';
import { MedicalTopBar } from '@/components/medical/topbar';
import { ToastProvider } from '@/components/shared';

export default function MedicalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-gray-50">
        <MedicalSidebar />
        <div className="flex-1 ml-64">
          <MedicalTopBar />
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
