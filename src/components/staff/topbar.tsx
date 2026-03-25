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
            SJ
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate">Sarah Jenkins</p>
            <p className="text-blue-100 text-xs truncate">sarah.jenkins@clinicalsanctuary.org</p>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-semibold">Receptionist</span>
          <span className="px-2 py-1 bg-gray-100 rounded-full">ID: SH-123</span>
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

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const notifications = [
    { id: 1, title: 'New Appointment', message: 'Alexander Hamilton checked in for 09:30 AM', time: '5 mins ago', type: 'info' },
    { id: 2, title: 'Lab Results Ready', message: '8 new lab results available for filing', time: '15 mins ago', type: 'success' },
    { id: 3, title: 'Patient Alert', message: 'Running late notification from Marcus Sterling', time: '30 mins ago', type: 'warning' },
  ];

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h4 className="font-bold text-gray-900">Notifications</h4>
        <button className="text-xs text-blue-600 font-semibold hover:underline">Mark all read</button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((notif) => (
          <div key={notif.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                notif.type === 'info' ? 'bg-blue-500' : 
                notif.type === 'success' ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">{notif.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-gray-100">
        <button className="w-full text-center text-xs font-semibold text-blue-600 hover:underline">View All Notifications</button>
      </div>
    </div>
  );
}

export function StaffTopBar() {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40 flex justify-end items-center px-8 gap-4">
      <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative"
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
        </div>

        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>

        <div className="h-8 w-px bg-gray-200"></div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 px-2 py-1.5 rounded-lg transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              SJ
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-tight">Sarah Jenkins</p>
              <p className="text-[10px] text-gray-500 leading-tight uppercase tracking-wider">Lead Receptionist</p>
            </div>
            <span className="material-symbols-outlined text-gray-400 text-lg">expand_more</span>
          </button>
          {showProfile && <ProfileDropdown onClose={() => setShowProfile(false)} />}
        </div>
    </header>
  );
}
