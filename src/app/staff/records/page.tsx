'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared';

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
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [patientsRes, appointmentsRes] = await Promise.all([
        fetch('/api/patients?limit=100'),
        fetch('/api/appointments'),
      ]);

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setAllPatients(patientsData.patients || []);
        setPatients(patientsData.patients || []);
      }

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setAppointments(appointmentsData.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const filteredPatients = allPatients.filter(patient => {
    const fullName = getFullName(patient).toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
                         patient.mrn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                       (activeTab === 'recent' && patient.lastVisit === new Date().toISOString().split('T')[0]) ||
                       (activeTab === 'chronic' && patient.status === 'Chronic');
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const selectedPatientData = patients.find(p => p._id === selectedPatient);

  const patientAppointments = appointments.filter(apt => {
    if (!selectedPatient) return false;
    return apt.patientId === selectedPatient || apt.patientName === getFullName(selectedPatientData!);
  }).map(apt => ({
    id: apt._id,
    date: apt.date,
    time: apt.time,
    type: apt.type,
    status: apt.status,
    doctor: apt.doctorName || 'Assigned Doctor',
  }));

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
            ) : filteredPatients.length === 0 ? (
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
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length}
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
                    <p className="text-sm text-gray-500">{selectedPatientData.mrn} - DOB: {new Date(selectedPatientData.dateOfBirth).toLocaleDateString()}</p>
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
                      onClick={() => showToast('Adding new medical record...', 'info')}
                      className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add Record
                    </button>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                    <p className="text-sm text-gray-500 text-center">No medical history records available</p>
                    <p className="text-xs text-gray-400 text-center mt-1">Records will appear here after appointments</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Appointments</h3>
                    <button 
                      onClick={() => showToast('Scheduling new appointment...', 'info')}
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
                            <p className="text-xs text-gray-500">{new Date(apt.date).toLocaleDateString()} at {apt.time}</p>
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
                    onClick={() => showToast('Creating new appointment...', 'info')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined">calendar_add_on</span>
                    New Appointment
                  </button>
                  <button 
                    onClick={() => showToast('Sending message to patient...', 'info')}
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
    </div>
  );
}
