'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: 'dashboard',
  },
  {
    label: 'Doctors',
    href: '/admin/doctors',
    icon: 'local_hospital',
  },
  {
    label: 'Staff Management',
    href: '/admin/staff',
    icon: 'badge',
  },
  {
    label: 'Patient Registry',
    href: '/admin/patients',
    icon: 'person_search',
  },
  {
    label: 'Appointments',
    href: '/admin/appointments',
    icon: 'calendar_today',
  },
  // {
  //   label: 'Analytics',
  //   href: '/admin/analytics',
  //   icon: 'monitoring',
  // },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: 'settings',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-white border-r border-gray-200 z-50">
      <div className="h-[60px] flex items-center px-6 border-b border-gray-200">
        <Link href="/admin" className="block">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-sm">clinical_notes</span>
            </div>
            <div>
              <h1 className="font-bold text-blue-900 text-sm tracking-tight leading-none">
                Admin Portal
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">Central Command</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-1 overflow-y-auto">
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out',
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
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
          href="/admin/support"
          className="flex items-center gap-3 text-gray-600 px-3 py-2 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
        >
          <span className="material-symbols-outlined text-lg">contact_support</span>
          <span className="text-sm font-medium">Support</span>
        </Link>
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className="w-full text-left flex items-center gap-3 text-gray-600 px-3 py-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
