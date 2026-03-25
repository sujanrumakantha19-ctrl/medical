'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared';

interface Doctor {
  _id: string;
  name: string;
  department: string;
  role: string;
}

interface Appointment {
  _id: string;
  patientName: string;
  doctorId: string;
  doctorName?: string;
  date: string;
  time: string;
  status: string;
  type: string;
}

interface Patient {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  mrn: string;
}

const getPatientDisplayName = (patient: Patient) => {
  if (patient.firstName && patient.lastName) {
    return `${patient.firstName} ${patient.lastName}`;
  }
  return patient.name || 'Unknown Patient';
};

export default function AppointmentScheduling() {
  const { showToast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [bookingForm, setBookingForm] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    type: 'consultation',
    notes: '',
  });

  const timeSlots = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM',
  ];

  const doctorColors: Record<string, string> = {
    'Cardiology': 'bg-blue-500',
    'Pediatrics': 'bg-purple-500',
    'General Medicine': 'bg-green-500',
    'Orthopedics': 'bg-orange-500',
    'Neurology': 'bg-red-500',
    'default': 'bg-gray-500',
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [appointmentsRes, staffRes, patientsRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/staff'),
        fetch('/api/patients'),
      ]);

      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setAppointments(appointmentsData.appointments || []);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setDoctors(staffData.staff || []);
      }

      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData.patients || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDoctorById = (id: string) => doctors.find(d => d._id === id);

  const getPatientById = (id: string) => patients.find(p => p._id === id);

  const handleTimeSlotClick = (time: string) => {
    setSelectedTime(time);
    setBookingForm(prev => ({
      ...prev,
      time,
      date: selectedDate.toISOString().split('T')[0],
    }));
    setShowBookingModal(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleBookAppointment = async () => {
    if (!bookingForm.patientId || !bookingForm.doctorId || !bookingForm.date || !bookingForm.time) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingForm),
      });

      if (response.ok) {
        showToast('Appointment booked successfully!', 'success');
        setShowBookingModal(false);
        setBookingForm({
          patientId: '',
          doctorId: '',
          date: '',
          time: '',
          type: 'consultation',
          notes: '',
        });
        fetchData();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to book appointment', 'error');
      }
    } catch (error) {
      showToast('Error booking appointment', 'error');
    }
  };

  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date).toDateString();
    return aptDate === selectedDate.toDateString();
  });

  const completedCount = todayAppointments.filter(apt => apt.status === 'completed').length;
  const pendingCount = todayAppointments.filter(apt => apt.status === 'pending' || apt.status === 'confirmed').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointment Scheduling</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule and manage patient appointments</p>
        </div>
        <button
          onClick={() => { setSelectedTime(null); setBookingForm(prev => ({ ...prev, time: '', date: selectedDate.toISOString().split('T')[0] })); setShowBookingModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined">add</span>
          New Appointment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <h2 className="text-lg font-bold text-gray-900">{formatDate(selectedDate)}</h2>
              <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Week
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-gray-100">
            {[...Array(7)].map((_, i) => {
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              const dayDate = new Date(selectedDate);
              dayDate.setDate(selectedDate.getDate() - selectedDate.getDay() + i);
              return (
                <div key={i} className="p-3 text-center border-r border-gray-100 last:border-r-0">
                  <p className="text-xs font-medium text-gray-500">{dayNames[i]}</p>
                  <p className={`text-sm font-bold mt-1 ${dayDate.toDateString() === new Date().toDateString() ? 'text-primary' : 'text-gray-900'}`}>
                    {dayDate.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-4 max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading appointments...</div>
            ) : (
              <div className="space-y-3">
                {timeSlots.map((slot) => {
                  const appointment = todayAppointments.find(a => a.time === slot);
                  const doctor = appointment ? getDoctorById(appointment.doctorId) : null;
                  
                  return (
                    <div
                      key={slot}
                      className="flex items-start gap-4 p-3 rounded-lg border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer group"
                      onClick={() => appointment ? showToast(`Viewing appointment for ${appointment.patientName}`, 'info') : handleTimeSlotClick(slot)}
                    >
                      <div className="w-20 shrink-0">
                        <p className="text-sm font-semibold text-gray-900">{slot}</p>
                      </div>
                      {appointment ? (
                        <div className="flex-1 flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${doctorColors[doctor?.department || 'default'] || doctorColors.default}`}></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{appointment.patientName}</p>
                            <p className="text-xs text-gray-500">{doctor?.name || 'Unknown Doctor'} - {appointment.type}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            appointment.status === 'confirmed' || appointment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {appointment.status}
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); showToast('Opening appointment details...', 'info'); }}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-all"
                          >
                            <span className="material-symbols-outlined text-gray-400">more_vert</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center gap-3 text-gray-400">
                          <span className="material-symbols-outlined text-lg opacity-0 group-hover:opacity-100 transition-opacity">add</span>
                          <span className="text-sm">Available</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Doctors</h3>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">Loading...</div>
              ) : (
                doctors.slice(0, 6).map((doctor) => (
                  <div key={doctor._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 ${doctorColors[doctor.department || 'default'] || doctorColors.default} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                      {doctor.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doctor.name}</p>
                      <p className="text-xs text-gray-500">{doctor.department}</p>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].slice(0, 3).map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      ))}
                      {[1, 2].slice(0, 2).map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200"></div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Today's Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Appointments</span>
                <span className="text-lg font-bold text-gray-900">{todayAppointments.length}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (completedCount / Math.max(1, todayAppointments.length)) * 100)}%` }}></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                  <p className="text-xs text-gray-500">Completed</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                  <p className="text-xs text-gray-500">Remaining</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md p-5 text-white">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined">tips_and_updates</span>
              <h3 className="font-bold">Quick Tip</h3>
            </div>
            <p className="text-sm text-blue-100">
              Drag and drop appointments between time slots to quickly reschedule. Use the calendar view for a broader overview.
            </p>
          </div>
        </div>
      </div>

      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedTime ? `Book: ${selectedTime}` : 'New Appointment'}
              </h2>
              <button onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <select
                  value={bookingForm.patientId}
                  onChange={(e) => setBookingForm({ ...bookingForm, patientId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select patient</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {getPatientDisplayName(patient)} - {patient.mrn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                <select
                  value={bookingForm.doctorId}
                  onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
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
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                <select
                  value={bookingForm.time}
                  onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Select time</option>
                  {timeSlots.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
                <select
                  value={bookingForm.type}
                  onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
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
                  rows={3}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Additional notes or instructions..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowBookingModal(false)}
                className="px-5 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBookAppointment}
                className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
