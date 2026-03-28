'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: 'Dashboard',
    href: '/medical',
    icon: 'dashboard',
  },
  {
    label: 'Patients',
    href: '/medical/patients',
    icon: 'person_search',
  },
  {
    label: 'Prescriptions',
    href: '/medical/prescriptions',
    icon: 'medication',
  },
];

export function MedicalSidebar() {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data.user);
      })
      .catch(err => console.error('Session fetch error:', err));
  }, []);

  const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-white border-r border-gray-200 z-50">
      <div className="h-[60px] flex items-center px-6 border-b border-gray-200">
        <Link href="/medical" className="block">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">medication</span>
            </div>
            <div>
              <h1 className="font-bold text-teal-800 text-sm tracking-tight leading-none">
                Medical Portal
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">{user?.department || 'Medical Services'}</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-1 overflow-y-auto">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = normalizedPath === item.href || (item.href !== '/medical' && normalizedPath.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out',
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
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
          href="#"
          className="flex items-center gap-3 text-gray-600 px-3 py-2 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
        >
          <span className="material-symbols-outlined text-lg">help_outline</span>
          <span className="text-sm font-medium">Support</span>
        </Link>
        <button
          onClick={async () => {
             await fetch('/api/auth/logout', { method: 'POST' });
             window.location.href = '/login';
          }}
          className="w-full flex items-center gap-3 text-gray-600 px-3 py-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-left"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
