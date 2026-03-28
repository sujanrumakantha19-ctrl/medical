'use client';

import { useState, useEffect } from 'react';

export default function DoctorSchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const timeSlots = [
    '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentMonth = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">View your weekly schedule</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <h2 className="text-lg font-bold">{currentMonth}</h2>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((date, index) => (
              <div
                key={index}
                className={`h-20 border rounded-lg p-2 ${
                  date ? 'border-gray-200 hover:border-green-300 cursor-pointer' : 'border-transparent'
                } ${isToday(date) ? 'bg-green-50 border-green-300' : ''}`}
              >
                {date && (
                  <>
                    <p className={`text-sm font-medium ${isToday(date) ? 'text-green-600' : 'text-gray-700'}`}>
                      {date.getDate()}
                    </p>
                    <div className="mt-1">
                      <div className="h-1 w-full bg-green-200 rounded-full"></div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Time Slots</h3>
          <div className="space-y-2">
            {timeSlots.map((time) => (
              <div
                key={time}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">{time}</span>
                <span className="text-xs text-gray-500">Available</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
