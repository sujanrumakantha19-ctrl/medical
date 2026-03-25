import { Sidebar } from '@/components/shared/sidebar';
import { TopBar } from '@/components/shared/topbar';
import { ToastProvider } from '@/components/shared/toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="bg-gray-50 text-slate-900 antialiased flex min-h-screen">
        <Sidebar />
        <main className="ml-64 flex-1 flex flex-col min-h-screen">
          <TopBar />
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
