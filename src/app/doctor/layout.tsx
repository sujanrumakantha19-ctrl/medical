'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: 'Dashboard',
    href: '/doctor',
    icon: 'dashboard',
  },
  {
    label: 'My Patients',
    href: '/doctor/patients',
    icon: 'people',
  },
  {
    label: 'Appointments',
    href: '/doctor/appointments',
    icon: 'calendar_today',
  },
  {
    label: 'Schedule',
    href: '/doctor/schedule',
    icon: 'schedule',
  },
];

function DoctorSidebar({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-white border-r border-gray-200 z-50">
      <div className="h-[60px] flex items-center px-6 border-b border-gray-200">
        <Link href="/doctor" className="block">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">local_hospital</span>
            </div>
            <div>
              <h1 className="font-bold text-green-700 text-sm tracking-tight leading-none">
                Doctor Portal
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">{user?.department || 'Medical Dashboard'}</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-1 overflow-y-auto">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/doctor' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out',
                  isActive
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-green-700 hover:bg-green-50'
                )}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 space-y-0.5">
        <Link
          href="/login"
          className="flex items-center gap-3 text-gray-600 px-3 py-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span className="text-sm font-medium">Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}

function DoctorTopBar({ user }: { user: any }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/login/logout', { method: 'POST' }).catch(() => {}); // Attempt logout
      // Since I don't see a dedicated logout API for doctors in the file, I'll use the common /api/auth/logout if it exists, or just redirect.
      // Wait, let's use the established /api/auth/logout.
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      router.push('/login');
    }
  };

  return (
    <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">Welcome, Dr. {user?.name?.split(' ').pop() || 'Doctor'}</h2>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors text-sm font-medium"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Sign Out
        </button>
        <div className="h-8 w-px bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
            {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'D'}
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.name || 'Doctor'}</span>
        </div>
      </div>
    </header>
  );
}

import { useRouter } from 'next/navigation';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data.user);
      })
      .catch(err => console.error('Session fetch error:', err));
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DoctorSidebar user={user} />
      <div className="flex-1 ml-64">
        <DoctorTopBar user={user} />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
