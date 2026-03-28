'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/toast';
import { Pagination } from '@/components/ui/pagination';
import { FormattedDate } from '@/components/ui/formatted-date';

interface Patient {
  _id: string;
  name: string;
  mrn: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  bloodType: string;
  allergies: string[];
  condition: string;
  status: string;
  medicalHistory: Array<{
    diagnosis: string;
    treatment: string;
    notes: string;
    prescriptions: string;
    visitType: string;
    followUpDate: string;
    date: Date;
  }>;
}

export default function DoctorPatientsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    diagnosis: '',
    treatment: '',
    prescriptions: '',
    notes: '',
    followUpDate: '',
    condition: '',
  });
  const [saving, setSaving] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setDoctorId(data.user.id);
            fetchData(data.user.id);
          }
        } else {
          window.location.href = '/login';
        }
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    };
    fetchSession();
  }, []);

  const fetchData = async (docId: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/patients?limit=100');
      const data = await response.json();
      // Only show patients assigned to this doctor
      const myPatients = (data.patients || []).filter((p: any) => p.assignedDoctor === docId);
      setPatients(myPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleUpdatePatient = () => {
    setUpdateForm({
      diagnosis: '',
      treatment: '',
      prescriptions: '',
      notes: '',
      followUpDate: '',
      condition: selectedPatient?.condition || '',
    });
    setShowUpdateModal(true);
  };

  const handleSaveUpdate = async () => {
    if (!selectedPatient) return;
    
    if (!updateForm.diagnosis && !updateForm.prescriptions) {
      showToast('Please add diagnosis or prescriptions', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/patients/${selectedPatient._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicalHistory: [{
            diagnosis: updateForm.diagnosis || 'General Checkup',
            treatment: updateForm.treatment,
            prescriptions: updateForm.prescriptions,
            notes: updateForm.notes,
            followUpDate: updateForm.followUpDate || null,
            visitType: 'consultation',
            date: new Date(),
          }],
          condition: updateForm.condition,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast('Patient record updated successfully', 'success');
        setShowUpdateModal(false);
        if (doctorId) fetchData(doctorId);
        const updated = patients.find(p => p._id === selectedPatient._id);
        if (updated) setSelectedPatient(updated);
      } else {
        showToast(data.error || 'Failed to update', 'error');
      }
    } catch (error) {
      showToast('Failed to update patient', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.mrn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage your assigned patients</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-1/3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : paginatedPatients.length > 0 ? (
              paginatedPatients.map((patient) => (
                <div
                  key={patient._id}
                  onClick={() => handleViewPatient(patient)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPatient?._id === patient._id
                      ? 'bg-green-50 border border-green-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      {getInitials(patient.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{patient.name}</p>
                      <p className="text-xs text-gray-500">{patient.mrn}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No patients found</div>
            )}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {selectedPatient ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-xl">
                  {getInitials(selectedPatient.name)}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{selectedPatient.name}</h2>
                  <p className="text-sm text-gray-500">MRN: {selectedPatient.mrn}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">{selectedPatient.gender}</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{selectedPatient.condition || 'General'}</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">{selectedPatient.status}</span>
                  </div>
                </div>
                <button
                  onClick={handleUpdatePatient}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">edit</span>
                  Update Record
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                  <p className="text-sm font-semibold mt-1">{selectedPatient.phone}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                  <p className="text-sm font-semibold mt-1">{selectedPatient.email || 'N/A'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase">Date of Birth</p>
                  <p className="text-sm font-semibold mt-1"><FormattedDate date={selectedPatient.dateOfBirth} /></p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase">Blood Type</p>
                  <p className="text-sm font-semibold mt-1">{selectedPatient.bloodType || 'Unknown'}</p>
                </div>
              </div>

              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-medium text-red-600 uppercase">Allergies</p>
                  <p className="text-sm text-red-700 mt-1">{selectedPatient.allergies.join(', ')}</p>
                </div>
              )}

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Medical History</h3>
                {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {selectedPatient.medicalHistory.map((record, index) => (
                      <div key={index} className="p-4 border border-gray-100 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{record.diagnosis}</p>
                            {record.treatment && <p className="text-xs text-gray-600 mt-1">Treatment: {record.treatment}</p>}
                            {record.prescriptions && (
                              <div className="mt-2 p-2 bg-blue-50 rounded">
                                <p className="text-xs font-medium text-blue-700">Prescriptions:</p>
                                <p className="text-xs text-blue-600">{record.prescriptions}</p>
                              </div>
                            )}
                            {record.notes && <p className="text-xs text-gray-500 mt-1">Notes: {record.notes}</p>}
                          </div>
                          <span className="text-xs text-gray-400"><FormattedDate date={record.date} /></span>
                        </div>
                        {record.followUpDate && (
                          <p className="text-xs text-green-600 mt-2">Follow-up: <FormattedDate date={record.followUpDate} /></p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                    No medical history records
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-gray-400 text-3xl">person_search</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Select a Patient</h3>
              <p className="text-sm text-gray-500 mt-1">Choose a patient from the list to view their details</p>
            </div>
          )}
        </div>
      </div>

      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Update Patient Record</h2>
              <button onClick={() => setShowUpdateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Condition</label>
                <input
                  type="text"
                  value={updateForm.condition}
                  onChange={(e) => setUpdateForm({ ...updateForm, condition: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                  placeholder="e.g., Stable, Improving, Critical"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis *</label>
                <input
                  type="text"
                  value={updateForm.diagnosis}
                  onChange={(e) => setUpdateForm({ ...updateForm, diagnosis: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                  placeholder="Enter diagnosis"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Given</label>
                <input
                  type="text"
                  value={updateForm.treatment}
                  onChange={(e) => setUpdateForm({ ...updateForm, treatment: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                  placeholder="Enter treatment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prescriptions *</label>
                <textarea
                  rows={3}
                  value={updateForm.prescriptions}
                  onChange={(e) => setUpdateForm({ ...updateForm, prescriptions: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg resize-none"
                  placeholder="List all prescribed medications"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={updateForm.followUpDate}
                  onChange={(e) => setUpdateForm({ ...updateForm, followUpDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg resize-none"
                  placeholder="Additional notes"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUpdate}
                disabled={saving}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
