'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
            AU
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate">Admin User</p>
            <p className="text-blue-100 text-xs truncate">admin@clinicalsanctuary.org</p>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">Administrator</span>
          <span className="px-2 py-1 bg-gray-100 rounded-full">ID: SH-001</span>
        </div>
      </div>

      <div className="p-2">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <span className="material-symbols-outlined text-gray-400">person</span>
          <div>
            <p className="text-sm font-medium text-gray-700">View Profile</p>
            <p className="text-xs text-gray-400">Manage your account</p>
          </div>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <span className="material-symbols-outlined text-gray-400">settings</span>
          <div>
            <p className="text-sm font-medium text-gray-700">Settings</p>
            <p className="text-xs text-gray-400">Preferences & config</p>
          </div>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
          <span className="material-symbols-outlined text-gray-400">help</span>
          <div>
            <p className="text-sm font-medium text-gray-700">Help & Support</p>
            <p className="text-xs text-gray-400">Get assistance</p>
          </div>
        </button>
      </div>

      <div className="p-2 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left"
        >
          <span className="material-symbols-outlined text-red-500">logout</span>
          <div>
            <p className="text-sm font-medium text-red-600">Logout</p>
            <p className="text-xs text-red-400">Sign out of account</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export function TopBar() {
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[60px] bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex justify-between items-center h-full px-6">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="material-symbols-outlined text-blue-600 text-2xl">health_and_safety</span>
          <span className="text-xl font-bold tracking-tighter text-blue-900">
            Clinical Sanctuary
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
          <div className="h-8 w-px bg-gray-200 mx-1"></div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                AU
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-tight">Admin User</p>
                <p className="text-[11px] text-gray-500 leading-tight">System Chief</p>
              </div>
              <span className="material-symbols-outlined text-gray-400 text-lg">expand_more</span>
            </button>
            {showProfile && <ProfileDropdown onClose={() => setShowProfile(false)} />}
          </div>
        </div>
      </div>
    </header>
  );
}
