'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function MedicalTopBar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            window.location.href = '/login';
          }
        }
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    };
    fetchSession();
  }, []);

  return (
    <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Welcome back, {user?.name || 'Medical Staff'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors relative">
          <span className="material-symbols-outlined text-2xl">notifications</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 font-bold">
            {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'MS'}
          </div>
          <div className="text-sm">
            <p className="font-semibold text-gray-800">{user?.name || 'Medical Staff'}</p>
            <p className="text-xs text-gray-500">{user?.department || 'Pharmacy'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
