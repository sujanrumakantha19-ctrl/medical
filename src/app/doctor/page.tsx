'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared/toast';

interface Patient {
  _id: string;
  name: string;
  mrn: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  condition?: string;
  status: string;
  medicalHistory?: any[];
}

interface Appointment {
  _id: string;
  patientId: Patient;
  date: string;
  time: string;
  type: string;
  status: string;
}

export default function DoctorDashboard() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<any>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setDoctor(data.user);
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

  const fetchData = async (doctorId: string) => {
    try {
      setLoading(true);
      
      const [patientsRes, appointmentsRes] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/appointments'),
      ]);

      const patientsData = await patientsRes.json();
      const appointmentsData = await appointmentsRes.json();

      const allPatients = patientsData.patients || [];
      const allAppointments = appointmentsData.appointments || [];

      // Only show patients assigned to this doctor
      const myPatients = allPatients.filter((p: any) => 
        p.assignedDoctor === doctorId
      );

      const myAppointments = allAppointments.filter((a: any) => 
        a.doctorId === doctorId
      );

      const today = new Date().toDateString();
      const todayAppointments = myAppointments.filter((a: any) => 
        new Date(a.date).toDateString() === today
      );

      setPatients(myPatients);
      setAppointments(todayAppointments);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date).toDateString();
    return aptDate === new Date().toDateString();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {loading ? 'Loading...' : `Welcome, Dr. ${doctor?.name || 'Doctor'}`}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{patients.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600">people</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Appointments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{todayAppointments.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600">calendar_month</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Consultations</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {todayAppointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-yellow-600">hourglass_empty</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {todayAppointments.filter(a => a.status === 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600">check_circle</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Today's Schedule</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {todayAppointments.length > 0 ? (
              todayAppointments.map((apt: any) => (
                <div key={apt._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                        {apt.patientId?.name?.split(' ').map((n: string) => n[0]).join('') || '??'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{apt.patientId?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{apt.time} - {apt.type}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      apt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      apt.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No appointments scheduled for today
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Recent Patients</h2>
          </div>
          <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
            {patients.slice(0, 10).map((patient: any) => (
              <div key={patient._id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      {patient.name?.split(' ').map((n: string) => n[0]).join('') || '??'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                      <p className="text-xs text-gray-500">MRN: {patient.mrn}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    patient.status === 'outpatient' ? 'bg-green-100 text-green-700' :
                    patient.status === 'admitted' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {patient.status}
                  </span>
                </div>
              </div>
            ))}
            {patients.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No patients assigned yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
