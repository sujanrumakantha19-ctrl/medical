'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormattedDate } from '@/components/ui/formatted-date';

interface Patient {
  _id: string;
  name: string;
  mrn: string;
  phone: string;
  email: string;
  dateOfBirth: Date;
  gender: string;
  address: string;
  bloodType: string;
  allergies: string[];
  emergencyContact: string;
  status: string;
  department: string;
  assignedDoctor: {
    _id: string;
    name: string;
    department: string;
  };
  medicalHistory: Array<{
    _id: string;
    diagnosis: string;
    treatment: string;
    prescription: string;
    notes: string;
    visitType: string;
    followUpDate: Date;
    date: Date;
  }>;
}

function PatientDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('id');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      fetchPatient();
    }
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/medical/patients?patientId=${patientId}`);
      if (!response.ok) throw new Error('Failed to fetch patient');
      const data = await response.json();
      
      if (data.success && data.patients.length > 0) {
        setPatient(data.patients[0]);
      }
    } catch (error) {
      console.error('Failed to fetch patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admitted': return 'bg-blue-100 text-blue-700';
      case 'discharged': return 'bg-gray-100 text-gray-700';
      case 'outpatient': return 'bg-green-100 text-green-700';
      case 'emergency': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const calculateAge = (dateOfBirth: Date | string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-6xl text-gray-300">person_off</span>
        <p className="text-gray-500 mt-4">Patient not found</p>
        <Link href="/medical" className="text-teal-600 hover:text-teal-700 font-medium mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const prescriptions = patient.medicalHistory?.filter(r => r.prescription) || [];

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
        <Link href="/medical" className="hover:text-primary">
          Dashboard
        </Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="text-primary">Patient Details</span>
      </nav>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{patient.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-gray-500">MRN: {patient.mrn || 'N/A'}</span>
            <span className="text-gray-300">|</span>
            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold capitalize ${getStatusColor(patient.status)}`}>
              {patient.status}
            </span>
          </div>
        </div>
        <Link
          href="/medical"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Patient Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                <p className="text-gray-900">{patient.name}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Age / Gender</label>
                <p className="text-gray-900">{calculateAge(patient.dateOfBirth)} years / {patient.gender}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</label>
                <p className="text-gray-900">{patient.phone}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                <p className="text-gray-900">{patient.email || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Address</label>
                <p className="text-gray-900">{patient.address || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Emergency Contact</label>
                <p className="text-gray-900">{patient.emergencyContact || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Medical Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Blood Type</label>
                <p className="text-gray-900">{patient.bloodType || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Allergies</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {patient.allergies && patient.allergies.length > 0 ? (
                    patient.allergies.map((allergy, index) => (
                      <span key={index} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        {allergy}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500">No known allergies</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Doctor</label>
                <p className="text-gray-900">{patient.assignedDoctor?.name || 'Not Assigned'}</p>
                <p className="text-sm text-gray-500">{patient.assignedDoctor?.department || ''}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Department</label>
                <p className="text-gray-900">{patient.department}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Prescriptions ({prescriptions.length})</h3>
            </div>
            {prescriptions.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-gray-300">medication</span>
                <p className="text-gray-500 mt-2">No prescriptions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((record, index) => (
                  <div key={index} className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{record.diagnosis || 'General Consultation'}</p>
                        <p className="text-xs text-gray-500">
                          <FormattedDate date={record.date} /> • {record.visitType || 'Consultation'}
                        </p>
                      </div>
                      {record.followUpDate && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          Follow-up: <FormattedDate date={record.followUpDate} />
                        </span>
                      )}
                    </div>
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <label className="text-xs font-bold text-teal-600 uppercase tracking-wider">Prescription</label>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{record.prescription}</p>
                    </div>
                    {record.treatment && (
                      <div className="mt-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Treatment</label>
                        <p className="text-gray-700 text-sm mt-1">{record.treatment}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Medical History ({patient.medicalHistory?.length || 0})</h3>
            {(!patient.medicalHistory || patient.medicalHistory.length === 0) ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-gray-300">history</span>
                <p className="text-gray-500 mt-2">No medical history found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {patient.medicalHistory.slice().reverse().map((record, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{record.diagnosis || 'General Consultation'}</p>
                        <p className="text-xs text-gray-500">
                          <FormattedDate date={record.date} /> • {record.visitType || 'Consultation'}
                        </p>
                      </div>
                    </div>
                    {record.treatment && (
                      <div className="mt-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Treatment</label>
                        <p className="text-gray-700 text-sm mt-1">{record.treatment}</p>
                      </div>
                    )}
                    {record.notes && (
                      <div className="mt-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notes</label>
                        <p className="text-gray-700 text-sm mt-1">{record.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PatientDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin">progress_activity</span>
      </div>
    }>
      <PatientDetailContent />
    </Suspense>
  );
}
