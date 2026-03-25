'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/toast';

export default function AppointmentsPage() {
  const { showToast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    type: 'checkup',
    reason: '',
  });
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
    fetchDoctors();
  }, [pagination.page, statusFilter, dateFilter, searchTerm]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '10',
      });
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);

      const response = await fetch(`/api/appointments?${params}`);
      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments);
        setPagination({
          page: data.pagination.page,
          pages: data.pagination.pages,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients?limit=100');
      const data = await response.json();
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/staff?role=doctor&limit=100');
      const data = await response.json();
      if (data.success) {
        setDoctors(data.staff);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        showToast('Appointment scheduled successfully!', 'success');
        setShowModal(false);
        setFormData({ patientId: '', doctorId: '', date: '', time: '', type: 'checkup', reason: '' });
        fetchAppointments();
      } else {
        showToast(data.error || 'Failed to schedule appointment', 'error');
      }
    } catch (error) {
      showToast('Failed to schedule appointment', 'error');
    }
  };

  const updateStatus = async (id: string, action: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();

      if (data.success) {
        showToast(data.message || 'Status updated', 'success');
        fetchAppointments();
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'checked-in': return 'bg-teal-100 text-teal-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-gray-100 text-gray-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      case 'no-show': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const timeSlots = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM',
  ];

  return (
    <section className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Appointments</h2>
          <p className="text-gray-600 max-w-md">Manage all scheduled appointments across departments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => showToast('Exporting appointments...', 'info')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-semibold text-sm rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Export
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Appointment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
              <input
                className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search patient or doctor..."
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              />
            </div>
            <input
              type="date"
              className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            />
            <select
              className="bg-white border border-gray-200 rounded-lg text-sm px-4 py-2"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked-in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <p className="text-xs font-medium text-gray-500">Showing {appointments.length} of {pagination.total} appointments</p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin">progress_activity</span>
              <p className="text-gray-500 mt-2">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300">event_busy</span>
              <p className="text-gray-500 mt-2">No appointments found</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Patient</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Doctor</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Type</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {apt.patientId?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{apt.patientId?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{apt.patientId?.mrn || 'No MRN'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{apt.doctorId?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{apt.doctorId?.department}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(apt.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">{apt.time}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded capitalize">
                        {apt.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold capitalize ${getStatusColor(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {apt.status === 'scheduled' && (
                          <button
                            onClick={() => updateStatus(apt._id, 'confirm')}
                            className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                            title="Confirm"
                          >
                            <span className="material-symbols-outlined">check</span>
                          </button>
                        )}
                        {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                          <button
                            onClick={() => updateStatus(apt._id, 'check-in')}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                            title="Check In"
                          >
                            <span className="material-symbols-outlined">how_to_reg</span>
                          </button>
                        )}
                        {apt.status === 'checked-in' && (
                          <button
                            onClick={() => updateStatus(apt._id, 'start')}
                            className="p-2 hover:bg-yellow-50 rounded-lg text-yellow-600"
                            title="Start"
                          >
                            <span className="material-symbols-outlined">play_arrow</span>
                          </button>
                        )}
                        {apt.status === 'in-progress' && (
                          <button
                            onClick={() => updateStatus(apt._id, 'complete')}
                            className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                            title="Complete"
                          >
                            <span className="material-symbols-outlined">done</span>
                          </button>
                        )}
                        {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                          <button
                            onClick={() => updateStatus(apt._id, 'cancel')}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                            title="Cancel"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="p-4 flex items-center justify-center gap-2 border-t border-gray-100">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Schedule New Appointment</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Patient *</label>
                <select
                  className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-900"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.name} - {p.mrn}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Doctor *</label>
                <select
                  className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-900"
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>{d.name} - {d.department}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Date *</label>
                  <input
                    type="date"
                    className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-900"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Time *</label>
                  <select
                    className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-900"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  >
                    <option value="">Select Time</option>
                    {timeSlots.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Type *</label>
                <select
                  className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-900"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="checkup">Checkup</option>
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="procedure">Procedure</option>
                  <option value="lab">Lab Work</option>
                  <option value="vaccination">Vaccination</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Reason *</label>
                <textarea
                  className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-900 resize-none"
                  rows={3}
                  placeholder="Reason for visit..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90"
                >
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="mt-auto py-8 px-8 text-center text-xs text-gray-500 border-t border-gray-100">
        <p>© 2026 Clinical Sanctuary. Hospital Management Information System v1.0</p>
      </footer>
    </section>
  );
}
