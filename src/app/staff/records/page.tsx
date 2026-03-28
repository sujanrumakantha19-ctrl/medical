'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared';
import { FormattedDate } from '@/components/ui/formatted-date';

interface Patient {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  mrn: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  lastVisit?: string;
  status: string;
  condition?: string;
  assignedDoctor?: string;
  medicalHistory?: any[];
}

const getInitials = (patient: Patient) => {
  const first = patient.firstName?.[0] || patient.name?.split(' ')[0]?.[0] || '';
  const last = patient.lastName?.[0] || patient.name?.split(' ')[1]?.[0] || '';
  return `${first}${last}`.toUpperCase() || 'P';
};

const getFullName = (patient: Patient) => {
  if (patient.firstName && patient.lastName) {
    return `${patient.firstName} ${patient.lastName}`;
  }
  return patient.name || 'Unknown Patient';
};

export default function PatientRecords() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'chronic'>('all');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [medicalRecordForm, setMedicalRecordForm] = useState({ 
    diagnosis: '', 
    treatment: '', 
    notes: '',
    doctorName: '',
    visitType: 'consultation',
    prescriptions: '',
    followUpDate: '',
  });
  const [appointmentForm, setAppointmentForm] = useState({ doctorId: '', date: '', time: '', type: 'consultation', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      if (searchQuery) queryParams.append('search', searchQuery);
      if (activeTab === 'chronic') queryParams.append('status', 'Chronic');
      
      const [patientsRes, staffRes] = await Promise.all([
        fetch(`/api/patients?${queryParams.toString()}`),
        fetch('/api/staff?role=doctor'),
      ]);

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData.patients || []);
        if (patientsData.pagination) setTotalPages(patientsData.pagination.pages || 1);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setDoctors(staffData.staff || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, activeTab]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      fetchData();
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleAddMedicalRecord = async () => {
    if (!selectedPatient) return;
    if (!medicalRecordForm.diagnosis) {
      showToast('Please enter diagnosis', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/patients/' + selectedPatient, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicalHistory: [{
            diagnosis: medicalRecordForm.diagnosis,
            treatment: medicalRecordForm.treatment,
            notes: medicalRecordForm.notes,
            visitType: medicalRecordForm.visitType,
            prescriptions: medicalRecordForm.prescriptions,
            followUpDate: medicalRecordForm.followUpDate || null,
            date: new Date(),
          }]
        }),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Medical record added successfully', 'success');
        setShowMedicalRecordModal(false);
        setMedicalRecordForm({ diagnosis: '', treatment: '', notes: '', doctorName: '', visitType: 'consultation', prescriptions: '', followUpDate: '' });
        fetchData();
      } else {
        showToast(data.error || 'Failed to add record', 'error');
      }
    } catch (error) {
      showToast('Failed to add medical record', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleAppointment = async () => {
    if (!selectedPatient) return;
    if (!appointmentForm.doctorId || !appointmentForm.date || !appointmentForm.time) {
      showToast('Please fill in doctor, date and time', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient,
          doctorId: appointmentForm.doctorId,
          date: appointmentForm.date,
          time: appointmentForm.time,
          type: appointmentForm.type,
          notes: appointmentForm.notes,
          status: 'scheduled',
        }),
      });
      const data = await response.json();
      if (data.success) {
        showToast('Appointment scheduled successfully', 'success');
        setShowAppointmentModal(false);
        setAppointmentForm({ doctorId: '', date: '', time: '', type: 'consultation', notes: '' });
        fetchData();
      } else {
        showToast(data.error || 'Failed to schedule', 'error');
      }
    } catch (error) {
      showToast('Failed to schedule appointment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const paginatedPatients = patients;

  const selectedPatientData = patients.find(p => p._id === selectedPatient);

  useEffect(() => {
    if (selectedPatient) {
      fetch(`/api/appointments?patientId=${selectedPatient}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.appointments) {
            setPatientAppointments(data.appointments.map((apt: any) => ({
              id: apt._id,
              date: apt.date,
              time: apt.time,
              type: apt.type,
              status: apt.status,
              doctor: apt.doctorName || 'Assigned Doctor',
            })));
          }
        })
        .catch(err => console.error('Error fetching appointments', err));
    } else {
      setPatientAppointments([]);
    }
  }, [selectedPatient]);

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'chronic':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getAppointmentStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Records</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage patient medical records</p>
        </div>
        <button
          onClick={() => showToast('Exporting patient records...', 'info')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="material-symbols-outlined">download</span>
          Export Records
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              aria-label="Search patients by name or MRN"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Search by name or MRN..."
            />
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'all', label: 'All Patients' },
              { key: 'recent', label: 'Recent' },
              { key: 'chronic', label: 'Chronic' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="border-r border-gray-100 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading patients...</div>
            ) : patients.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No patients found</div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {paginatedPatients.map((patient) => (
                  <div
                    key={patient._id}
                    onClick={() => setSelectedPatient(patient._id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedPatient === patient._id ? 'bg-primary/5' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                        {getInitials(patient)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">{getFullName(patient)}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(patient.status)}`}>
                            {patient.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{patient.mrn}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                            {patient.lastVisit || 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">medical_information</span>
                            {patient.condition || 'General'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
                {totalPages > 1 && (
                  <div className="p-4 flex items-center justify-between border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, patients.length)} of patients
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium ${
                              currentPage === pageNum ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-6 max-h-[600px] overflow-y-auto">
            {selectedPatientData ? (
              <div className="space-y-6">
                <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                    {getInitials(selectedPatientData)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">{getFullName(selectedPatientData)}</h2>
                    <p className="text-sm text-gray-500">{selectedPatientData.mrn} - DOB: <FormattedDate date={selectedPatientData.dateOfBirth} /></p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{selectedPatientData.gender}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">{selectedPatientData.condition || 'General'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => showToast('Opening edit form...', 'info')}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button 
                      onClick={() => showToast('Printing patient record...', 'info')}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">print</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatientData.phone}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Primary Doctor</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedPatientData.assignedDoctor || 'Not Assigned'}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Medical History</h3>
                    <button 
                      onClick={() => setShowMedicalRecordModal(true)}
                      className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add Record
                    </button>
                  </div>
                  {selectedPatientData.medicalHistory && selectedPatientData.medicalHistory.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPatientData.medicalHistory.map((record: any, index: number) => (
                        <div key={index} className="p-4 border border-gray-100 rounded-lg bg-white">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{record.diagnosis}</p>
                              {record.treatment && <p className="text-xs text-gray-600 mt-1">Treatment: {record.treatment}</p>}
                              {record.notes && <p className="text-xs text-gray-500 mt-1">Notes: {record.notes}</p>}
                            </div>
                            <span className="text-xs text-gray-400"><FormattedDate date={record.date} /></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-500 text-center">No medical history records available</p>
                      <p className="text-xs text-gray-400 text-center mt-1">Records will appear here after appointments</p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Appointments</h3>
                    <button 
                      onClick={() => setShowAppointmentModal(true)}
                      className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Schedule
                    </button>
                  </div>
                  {patientAppointments.length > 0 ? (
                    <div className="space-y-2">
                      {patientAppointments.map((apt) => (
                        <div key={apt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-600 text-sm">calendar_today</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{apt.type}</p>
                            <p className="text-xs text-gray-500"><FormattedDate date={apt.date} /> at {apt.time}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAppointmentStatusClass(apt.status)}`}>
                            {apt.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-500 text-center">No appointments scheduled</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => setShowAppointmentModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined">calendar_add_on</span>
                    New Appointment
                  </button>
                  <button 
                    onClick={() => showToast('Messaging feature coming soon', 'info')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="material-symbols-outlined">mail</span>
                    Send Message
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-gray-400 text-3xl">folder_open</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No Patient Selected</h3>
                <p className="text-sm text-gray-500 mt-1">Select a patient from the list to view their records</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showMedicalRecordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add Medical Record</h2>
              <button onClick={() => setShowMedicalRecordModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis *</label>
                <input
                  type="text"
                  value={medicalRecordForm.diagnosis}
                  onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, diagnosis: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter diagnosis"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
                <select
                  value={medicalRecordForm.visitType}
                  onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, visitType: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="consultation">Consultation</option>
                  <option value="checkup">General Checkup</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="emergency">Emergency</option>
                  <option value="procedure">Procedure</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment</label>
                <input
                  type="text"
                  value={medicalRecordForm.treatment}
                  onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, treatment: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter treatment given"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prescriptions</label>
                <textarea
                  rows={2}
                  value={medicalRecordForm.prescriptions}
                  onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, prescriptions: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="List prescribed medications"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                <input
                  type="date"
                  value={medicalRecordForm.followUpDate}
                  onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, followUpDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={medicalRecordForm.notes}
                  onChange={(e) => setMedicalRecordForm({ ...medicalRecordForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Additional notes"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowMedicalRecordModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMedicalRecord}
                disabled={saving}
                className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Schedule Appointment</h2>
              <button onClick={() => setShowAppointmentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                <select
                  value={appointmentForm.doctorId}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, doctorId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select doctor</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>{d.name} - {d.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={appointmentForm.date}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <select
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, time: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select time</option>
                  {['08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={appointmentForm.type}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="consultation">Consultation</option>
                  <option value="checkup">General Checkup</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="procedure">Procedure</option>
                  <option value="lab">Lab Work</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Additional notes"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleAppointment}
                disabled={saving}
                className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Scheduling...' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
