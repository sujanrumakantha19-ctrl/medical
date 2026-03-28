'use client';

import { useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/pagination';
import { FormattedDate } from '@/components/ui/formatted-date';

interface Appointment {
  _id: string;
  patientId: any;
  date: string;
  time: string;
  type: string;
  status: string;
  notes: string;
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('today');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      const data = await response.json();
      
      const sessionRes = await fetch('/api/auth/session');
      let doctorId = null;
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        if (sessionData.success && sessionData.user) {
          doctorId = sessionData.user.id;
        } else {
          window.location.href = '/login';
          return;
        }
      }
      
      const myAppointments = (data.appointments || []).filter((a: any) => a.doctorId === doctorId);
      setAppointments(myAppointments);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'today') {
      return new Date(apt.date).toDateString() === new Date().toDateString();
    }
    if (filter === 'upcoming') {
      return new Date(apt.date) > new Date();
    }
    return true;
  });

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your appointments</p>
      </div>

      <div className="flex gap-2">
        {(['today', 'upcoming', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === f
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : paginatedAppointments.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedAppointments.map((apt) => (
                <tr key={apt._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xs">
                        {apt.patientId?.name?.split(' ').map((n: string) => n[0]).join('') || '??'}
                      </div>
                      <span className="text-sm font-medium">{apt.patientId?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <FormattedDate date={apt.date} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{apt.time}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{apt.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      apt.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                      apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={apt.status}
                      onChange={(e) => handleStatusChange(apt._id, e.target.value)}
                      className="text-sm border border-gray-200 rounded px-2 py-1"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="no-show">No Show</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">No appointments found</div>
        )}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
}
