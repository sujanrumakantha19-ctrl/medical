'use client';

import { useState, useEffect } from 'react';
import { FormattedDate } from '@/components/ui/formatted-date';

interface Prescription {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    mrn: string;
    phone: string;
  };
  doctorId: {
    name: string;
    department: string;
  };
  diagnosis: string;
  prescription: string;
  date: Date;
  type: string;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/medical/prescriptions');
      const data = await response.json();
      
      if (data.success) {
        setPrescriptions(data.prescriptions);
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p =>
    p.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.patientId?.mrn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.prescription?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Prescriptions</h2>
          <p className="text-gray-600">View all patient prescriptions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
            <input
              className="bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Search prescriptions..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-teal-600 text-2xl">medication</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{prescriptions.length}</p>
              <p className="text-sm text-gray-500">Total Prescriptions</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 text-2xl">people</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(prescriptions.map(p => p.patientId?._id)).size}
              </p>
              <p className="text-sm text-gray-500">Unique Patients</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600 text-2xl">calendar_today</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {prescriptions.filter(p => {
                  const today = new Date();
                  const date = new Date(p.date);
                  return date.toDateString() === today.toDateString();
                }).length}
              </p>
              <p className="text-sm text-gray-500">Today&apos;s Prescriptions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin">progress_activity</span>
              <p className="text-gray-500 mt-2">Loading prescriptions...</p>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300">medication</span>
              <p className="text-gray-500 mt-2">No prescriptions found</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Patient</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">MRN</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Doctor</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Diagnosis</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Prescription</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Date</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPrescriptions.map((prescription) => (
                  <tr key={prescription._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                          {getInitials(prescription.patientId?.name || '')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{prescription.patientId?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{prescription.patientId?.phone || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {prescription.patientId?.mrn || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{prescription.doctorId?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{prescription.doctorId?.department || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{prescription.diagnosis || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 truncate">{prescription.prescription || 'No prescription'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        <FormattedDate date={prescription.date} />
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedPrescription(prescription)}
                        className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Prescription Details</h3>
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</label>
                <p className="text-gray-900 font-semibold">{selectedPrescription.patientId?.name}</p>
                <p className="text-sm text-gray-500">MRN: {selectedPrescription.patientId?.mrn}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Doctor</label>
                <p className="text-gray-900">{selectedPrescription.doctorId?.name}</p>
                <p className="text-sm text-gray-500">{selectedPrescription.doctorId?.department}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diagnosis</label>
                <p className="text-gray-900">{selectedPrescription.diagnosis || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prescription</label>
                <div className="mt-2 p-4 bg-teal-50 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedPrescription.prescription || 'No prescription provided'}</p>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</label>
                <p className="text-gray-900"><FormattedDate date={selectedPrescription.date} /></p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedPrescription(null)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
