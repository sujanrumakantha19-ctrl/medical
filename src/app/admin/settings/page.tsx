'use client';

import { useState } from 'react';
import { useToast } from '@/components/shared/toast';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [toggles, setToggles] = useState({ darkMode: false, autoLogout: true, notifications: [true, true, true, true] });

  const tabs = [
    { id: 'general', label: 'General', icon: 'settings' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'security', label: 'Security', icon: 'security' },
    { id: 'integrations', label: 'Integrations', icon: 'extension' },
  ];

  const toggleItem = (index: number) => {
    const newToggles = [...toggles.notifications];
    newToggles[index] = !newToggles[index];
    setToggles({ ...toggles, notifications: newToggles });
    showToast('Notification preference updated', 'success');
  };

  const notificationItems = ['New patient admission', 'Staff schedule changes', 'System alerts', 'Weekly reports'];

  return (
    <section className="p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div>
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-gray-900 mb-1">Settings</h2>
        <p className="text-gray-500 text-sm">Configure your hospital management system preferences.</p>
      </div>

      <div className="flex gap-4 lg:gap-6">
        <div className="w-48 lg:w-56 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all text-left ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <span className="material-symbols-outlined text-base lg:text-lg">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Hospital Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Hospital Name</label>
                    <input className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-gray-900" defaultValue="Clinical Sanctuary" type="text" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Address</label>
                    <input className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-gray-900" defaultValue="123 Healthcare Avenue, Medical District" type="text" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Phone</label>
                      <input className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-gray-900" defaultValue="+1 (555) 123-4567" type="text" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email</label>
                      <input className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-gray-900" defaultValue="admin@clinicalsanctuary.org" type="email" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">System Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Dark Mode</p>
                      <p className="text-xs text-gray-500">Enable dark theme</p>
                    </div>
                    <button
                      onClick={() => { setToggles({ ...toggles, darkMode: !toggles.darkMode }); showToast(toggles.darkMode ? 'Dark mode disabled' : 'Dark mode enabled', 'info'); }}
                      className={`w-11 h-6 rounded-full relative transition-colors ${toggles.darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${toggles.darkMode ? 'right-1' : 'left-1'}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Auto-logout</p>
                      <p className="text-xs text-gray-500">Logout after 30 minutes</p>
                    </div>
                    <button
                      onClick={() => { setToggles({ ...toggles, autoLogout: !toggles.autoLogout }); showToast(toggles.autoLogout ? 'Auto-logout disabled' : 'Auto-logout enabled', 'info'); }}
                      className={`w-11 h-6 rounded-full relative transition-colors ${toggles.autoLogout ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${toggles.autoLogout ? 'right-1' : 'left-1'}`}></span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => showToast('Settings saved successfully!', 'success')}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-all text-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Email Notifications</h3>
                <div className="space-y-3">
                  {notificationItems.map((item, i) => (
                    <div key={item} className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 text-sm">{item}</p>
                      <button
                        onClick={() => toggleItem(i)}
                        className={`w-11 h-6 rounded-full relative transition-colors ${toggles.notifications[i] ? 'bg-blue-600' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${toggles.notifications[i] ? 'right-1' : 'left-1'}`}></span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Password</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Current Password</label>
                    <input className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-gray-900" type="password" placeholder="Enter current password" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">New Password</label>
                    <input className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-gray-900" type="password" placeholder="Enter new password" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Confirm New Password</label>
                    <input className="w-full bg-gray-100 border-none rounded-lg px-4 py-2.5 text-gray-900" type="password" placeholder="Confirm new password" />
                  </div>
                </div>
                <button
                  onClick={() => showToast('Password updated successfully!', 'success')}
                  className="mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-all text-sm"
                >
                  Update Password
                </button>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Connected Services</h3>
                <div className="space-y-3">
                  {[
                    { name: 'MongoDB', status: 'Connected', icon: 'database', action: 'Disconnect' },
                    { name: 'Email Service', status: 'Connected', icon: 'mail', action: 'Disconnect' },
                    { name: 'SMS Gateway', status: 'Not Connected', icon: 'sms', action: 'Connect' },
                  ].map((service) => (
                    <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-blue-600">{service.icon}</span>
                        <span className="font-medium text-gray-900 text-sm">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${service.status === 'Connected' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {service.status}
                        </span>
                        <button
                          onClick={() => showToast(service.status === 'Connected' ? `${service.name} disconnected` : `Connecting to ${service.name}...`, service.status === 'Connected' ? 'warning' : 'info')}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          {service.action}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
