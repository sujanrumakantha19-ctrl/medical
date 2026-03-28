'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/toast';
import { FormattedDate } from '@/components/ui/formatted-date';

export default function PatientsPage() {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [pagination.page, statusFilter, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '10',
      });
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/patients?${params}`);
      const data = await response.json();

      if (data.success) {
        setPatients(data.patients);
        setPagination({
          page: data.pagination.page,
          pages: data.pagination.pages,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      showToast('Failed to load patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const viewPatient = async (id: string) => {
    try {
      const response = await fetch(`/api/patients/${id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedPatient(data.patient);
        setShowModal(true);
      }
    } catch (error) {
      showToast('Failed to load patient details', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        showToast('Patient deleted successfully', 'success');
        fetchPatients();
      } else {
        showToast(data.error || 'Failed to delete', 'error');
      }
    } catch (error) {
      showToast('Failed to delete patient', 'error');
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'outpatient': return 'bg-green-100 text-green-700';
      case 'admitted': return 'bg-blue-100 text-blue-700';
      case 'emergency': return 'bg-red-100 text-red-700';
      case 'discharged': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <section className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Patient Registry</h2>
          <p className="text-gray-600 max-w-md">View and manage all registered patients in the hospital system.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => showToast('Exporting patient data...', 'info')}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-semibold text-sm rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-primary/90 transition-colors">
            <span className="material-symbols-outlined text-lg">add</span>
            Register Patient
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
                placeholder="Search by name, phone, or MRN..."
                type="text"
                aria-label="Search patients by name, phone, or MRN"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              />
            </div>
            <select
              className="bg-white border border-gray-200 rounded-lg text-sm px-4 py-2"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="">All Status</option>
              <option value="outpatient">Outpatient</option>
              <option value="admitted">Admitted</option>
              <option value="emergency">Emergency</option>
              <option value="discharged">Discharged</option>
            </select>
          </div>
          <p className="text-xs font-medium text-gray-500">Showing {patients.length} of {pagination.total} patients</p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin">progress_activity</span>
              <p className="text-gray-500 mt-2">Loading patients...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300">person_off</span>
              <p className="text-gray-500 mt-2">No patients found</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Patient</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">MRN</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Age/Gender</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Department</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Registered</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {patients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {patient.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??'}
                        </div>
                        <p className="text-sm font-bold text-gray-900">{patient.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{patient.mrn || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{calculateAge(patient.dateOfBirth)} yrs</p>
                      <p className="text-xs text-gray-500 capitalize">{patient.gender}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600">{patient.phone}</p>
                      <p className="text-xs text-gray-400">{patient.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {patient.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold capitalize ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500">
                        <FormattedDate date={patient.createdAt} />
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button 
                          onClick={() => viewPatient(patient._id)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(patient._id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
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
              className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {showModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Patient Details</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                  {selectedPatient.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '??'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedPatient.name}</h3>
                  <p className="text-gray-500">{selectedPatient.mrn || 'No MRN'}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold capitalize mt-1 ${getStatusColor(selectedPatient.status)}`}>
                    {selectedPatient.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Age / Gender</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {calculateAge(selectedPatient.dateOfBirth)} years / {selectedPatient.gender}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Blood Type</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{selectedPatient.bloodType || 'Not specified'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{selectedPatient.phone}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{selectedPatient.email || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Address</p>
                <p className="text-sm text-gray-900">{selectedPatient.address || 'Not provided'}</p>
              </div>

              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.allergies.map((allergy: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Emergency Contact</p>
                <p className="text-sm text-gray-900">{selectedPatient.emergencyContact || 'Not provided'}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90">
                Edit Patient
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto py-8 px-8 text-center text-xs text-gray-500 border-t border-gray-100">
        <p>© 2026 Clinical Sanctuary. Hospital Management Information System v1.0</p>
      </footer>
    </section>
  );
}
