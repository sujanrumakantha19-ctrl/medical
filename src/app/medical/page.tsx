'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FormattedDate } from '@/components/ui/formatted-date';

interface Patient {
  _id: string;
  name: string;
  mrn: string;
  phone: string;
  dateOfBirth: Date;
  gender: string;
  assignedDoctor: {
    name: string;
    department: string;
  };
  medicalHistory: Array<{
    diagnosis: string;
    prescription: string;
    date: Date;
  }>;
  status: string;
}

export default function MedicalDashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/medical/patients');
      const data = await response.json();
      
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.mrn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Medical Dashboard</h2>
          <p className="text-gray-600">View patients and prescriptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-teal-600 text-2xl">people</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              <p className="text-sm text-gray-500">Total Patients</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 text-2xl">medication</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {patients.reduce((acc, p) => acc + (p.medicalHistory?.length || 0), 0)}
              </p>
              <p className="text-sm text-gray-500">Total Prescriptions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {patients.filter(p => p.status === 'outpatient').length}
              </p>
              <p className="text-sm text-gray-500">Outpatients</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600 text-2xl">emergency</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {patients.filter(p => p.status === 'emergency').length}
              </p>
              <p className="text-sm text-gray-500">Emergency</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
            <input
              className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Search by name, MRN, or phone..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin">progress_activity</span>
              <p className="text-gray-500 mt-2">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
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
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Assigned Doctor</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Latest Prescription</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPatients.map((patient) => {
                  const latestRecord = patient.medicalHistory?.[patient.medicalHistory.length - 1];
                  return (
                    <tr key={patient._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                            {getInitials(patient.name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{patient.name}</p>
                            <p className="text-xs text-gray-500">{patient.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {patient.mrn || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900">{patient.assignedDoctor?.name || 'Not Assigned'}</p>
                        <p className="text-xs text-gray-500">{patient.assignedDoctor?.department || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        {latestRecord?.prescription ? (
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-900 truncate">{latestRecord.prescription}</p>
                            <p className="text-xs text-gray-500">
                              <FormattedDate date={latestRecord.date} />
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No prescriptions</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-bold capitalize ${getStatusColor(patient.status)}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/medical/patients?id=${patient._id}`}
                          className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
