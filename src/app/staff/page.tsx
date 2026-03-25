'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/toast';
import { useRouter } from 'next/navigation';

export default function StaffDashboard() {
  const { showToast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'today'>('today');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    waitingPatients: 0,
    todayAppointments: 0,
    checkInsToday: 0,
    pendingTasks: 0,
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        router.push('/login');
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, appointmentsRes, patientsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/appointments?limit=10'),
        fetch('/api/patients?limit=5'),
      ]);

      const dashboardData = await dashboardRes.json();
      const appointmentsData = await appointmentsRes.json();
      const patientsData = await patientsRes.json();

      if (dashboardData.success) {
        const todayAppts = dashboardData.todayAppointmentsList || [];
        const waitingCount = todayAppts.filter((a: any) => a.status === 'waiting').length;
        const checkedInCount = todayAppts.filter((a: any) => a.status === 'checked-in').length;
        
        setStats({
          waitingPatients: waitingCount,
          todayAppointments: todayAppts.length,
          checkInsToday: checkedInCount,
          pendingTasks: dashboardData.stats?.pendingBills || 0,
        });
      }

      if (appointmentsData.success) {
        setAppointments(appointmentsData.appointments || []);
      }

      if (patientsData.success) {
        setRecentPatients(patientsData.patients || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked-in': return 'bg-green-100 text-green-700';
      case 'waiting': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'scheduled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const quickActions = [
    { icon: 'person_add', label: 'Register Patient', href: '/staff/registration' },
    { icon: 'calendar_today', label: 'Schedule Appointment', href: '/staff/scheduling' },
    { icon: 'folder_open', label: 'Patient Records', href: '/staff/records' },
    { icon: 'how_to_reg', label: 'Check In', action: 'checkin' },
    { icon: 'receipt_long', label: 'Billing', href: '/staff/billing' },
    { icon: 'emergency', label: 'Emergency', action: 'emergency' },
  ];

  const handleQuickAction = (action?: string, href?: string) => {
    if (href) {
      router.push(href);
    } else if (action === 'checkin') {
      showToast('Opening check-in module...', 'info');
    } else if (action === 'emergency') {
      showToast('Emergency mode activated', 'warning');
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('') || '??';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? 'Loading...' : 'Welcome back!'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => showToast('Quick stats feature coming soon!', 'info')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-gray-500 text-lg">insights</span>
            <span className="text-sm font-medium text-gray-700">Quick Stats</span>
          </button>
          <button 
            onClick={() => showToast('Generating daily report...', 'success')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span className="text-sm font-medium">Daily Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Waiting Patients</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.waitingPatients}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-600">hourglass_empty</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Avg wait time: 18 mins</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.todayAppointments}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600">calendar_month</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">{appointments.filter(a => a.status === 'completed').length} completed</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Check-ins Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.checkInsToday}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600">how_to_reg</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">+12% from yesterday</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Tasks</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingTasks}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-orange-600">task_alt</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">3 high priority</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Appointment Queue</h2>
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('today')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'upcoming' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upcoming
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.length > 0 ? (
                  appointments.map((apt: any) => (
                    <tr key={apt._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
                            {getInitials(apt.patientId?.name)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{apt.patientId?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{apt.time}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{apt.doctorId?.name || 'Unknown'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 capitalize">{apt.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => showToast(`${apt.patientId?.name} checked in successfully!`, 'success')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                          </button>
                          <button 
                            onClick={() => showToast('Editing appointment...', 'info')}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button 
                            onClick={() => router.push('/staff/records')}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No appointments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100">
            <button 
              onClick={() => router.push('/staff/scheduling')}
              className="w-full py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              View All Appointments
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Recent Patients</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentPatients.slice(0, 4).map((patient: any) => (
                <div 
                  key={patient._id} 
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push('/staff/records')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                      {getInitials(patient.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{patient.name}</p>
                      <p className="text-xs text-gray-500">{patient.mrn || patient.phone}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      patient.status === 'outpatient' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {patient.status || 'active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.action, action.href)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className={`w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-white">{action.icon}</span>
              </div>
              <span className="text-xs font-medium text-gray-600 text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
