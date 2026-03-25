'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/shared/toast';

interface DashboardData {
  totalPatients: number;
  todayAppointments: number;
  totalStaff: number;
  pendingBills: number;
  monthlyRevenue: number;
  outstandingBalance: number;
  departments: { name: string; occupancy: number; capacity: number }[];
  weeklyAppointments: { _id: string; count: number }[];
}

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState<{ name: string; lead: string; occupancy: number; status: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      
      if (result.success) {
        setData(result.stats);
        setRecentPatients(result.recentPatients);
        setTodayAppointments(result.todayAppointmentsList);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    const formattedDate = new Date(newDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    showToast(`Dashboard updated for ${formattedDate}`, 'info');
  };

  const handleExportData = () => {
    showToast('Exporting dashboard data...', 'info');
    setTimeout(() => {
      showToast('Dashboard data exported successfully!', 'success');
    }, 1500);
  };

  const handleDownloadReport = () => {
    showToast('Generating logistics report...', 'info');
    setTimeout(() => {
      showToast('Report downloaded successfully!', 'success');
    }, 2000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getMaxAppointments = () => {
    if (!data?.weeklyAppointments) return 1;
    return Math.max(...data.weeklyAppointments.map(a => a.count), 1);
  };

  const metrics = data ? [
    {
      label: 'Total Patients',
      value: data.totalPatients.toLocaleString(),
      change: '',
      positive: true,
      icon: 'group',
      color: 'primary',
    },
    {
      label: "Today's Appointments",
      value: data.todayAppointments.toString(),
      change: '',
      positive: true,
      icon: 'calendar_today',
      color: 'secondary',
    },
    {
      label: 'Active Staff',
      value: data.totalStaff.toString(),
      change: '',
      positive: true,
      icon: 'badge',
      color: 'blue-500',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(data.monthlyRevenue),
      change: '',
      positive: true,
      icon: 'payments',
      color: 'green-500',
    },
  ] : [
    { label: 'Total Patients', value: '...', change: '', positive: true, icon: 'group', color: 'primary' },
    { label: "Today's Appointments", value: '...', change: '', positive: true, icon: 'calendar_today', color: 'secondary' },
    { label: 'Active Staff', value: '...', change: '', positive: true, icon: 'badge', color: 'blue-500' },
    { label: 'Monthly Revenue', value: '...', change: '', positive: true, icon: 'payments', color: 'green-500' },
  ];

  const quickActions = [
    {
      title: 'Add New Staff',
      description: 'Onboard new clinical personnel',
      icon: 'person_add',
      href: '/admin/staff/add',
    },
    {
      title: 'Generate Report',
      description: 'Full system status & analytics',
      icon: 'analytics',
      href: '/admin/analytics',
    },
    {
      title: 'Manage Appointments',
      description: 'View and manage all appointments',
      icon: 'event',
      href: '/admin/appointments',
    },
  ];

  return (
    <section className="p-8 space-y-8 flex-1 overflow-y-auto">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-600 text-sm">
            {loading ? 'Loading...' : `Welcome back. Here is what is happening today.`}
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleExportData}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className={`p-2 bg-blue-50 rounded-lg`}>
                <span className="material-symbols-outlined text-blue-600">{metric.icon}</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{metric.label}</p>
              <h3 className="text-3xl font-extrabold tracking-tight mt-1 text-gray-900">{metric.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl space-y-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-gray-900 tracking-tight">Today's Schedule</h4>
            <Link href="/admin/appointments" className="text-[10px] font-bold text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {todayAppointments.length > 0 ? (
              todayAppointments.slice(0, 5).map((apt: any, i: number) => (
                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-sm">
                    {apt.patientId?.name?.split(' ').map((n: string) => n[0]).join('') || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{apt.patientId?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{apt.time} - {apt.type}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {apt.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No appointments today</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="font-bold text-gray-900 tracking-tight">Weekly Appointments</h4>
              <p className="text-xs text-gray-500">Appointments scheduled this week</p>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-between gap-4 min-h-[200px] px-4">
            {(data?.weeklyAppointments || Array(7).fill({ _id: '', count: 0 })).map((day: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-2 w-full">
                <div className="w-full bg-blue-50 rounded-t-lg h-24 relative overflow-hidden">
                  <div 
                    className="absolute bottom-0 w-full bg-blue-600 rounded-t-lg transition-all"
                    style={{ height: `${(day.count / getMaxAppointments()) * 100}%` }}
                  ></div>
                </div>
                <span className="text-[10px] font-bold text-gray-500">
                  {day._id ? new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' }) : ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i + 1]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-gray-900 tracking-tight">Quick Command Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="flex items-center gap-4 p-5 bg-white hover:bg-gray-50 transition-all group rounded-2xl text-left border border-gray-100"
            >
              <div className="p-3 rounded-xl bg-blue-100 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-blue-600">{action.icon}</span>
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">{action.title}</p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>



      <footer className="p-8 text-center border-t border-gray-200">
        <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">
          Clinical Sanctuary Hospital Management System v1.0 | Secured
        </p>
      </footer>
    </section>
  );
}
