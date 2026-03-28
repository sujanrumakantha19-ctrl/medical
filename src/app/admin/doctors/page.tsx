'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/shared/toast';
import { useClickOutside } from '@/hooks/useClickOutside';

export default function DoctorsPage() {
  const { showToast } = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [pagination.page, departmentFilter, searchTerm]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: '10',
        role: 'doctor',
      });
      if (searchTerm) params.append('search', searchTerm);
      if (departmentFilter) params.append('department', departmentFilter);

      const response = await fetch(`/api/staff?${params}`);
      const data = await response.json();

      if (data.success) {
        setStaff(data.staff);
        setPagination({
          page: data.pagination.page,
          pages: data.pagination.pages,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      showToast('Failed to load doctors data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const response = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        showToast(data.message || 'Doctor deleted', 'success');
        fetchStaff();
      } else {
        showToast(data.error || 'Failed to delete', 'error');
      }
    } catch (error) {
      showToast('Failed to delete doctor', 'error');
    }
    setOpenDropdown(null);
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  const departments = ['General Medicine', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Neurology', 'Emergency', 'Radiology', 'Laboratory'];

  return (
    <section className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Doctors</h2>
          <p className="text-gray-600 max-w-md">Manage doctors and medical staff.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/doctors/add"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Doctor
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
              <input
                className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by name, email..."
                type="text"
                aria-label="Search doctors by name or email"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              />
            </div>
            <select
              className="bg-white border border-gray-200 rounded-lg text-sm px-4 py-2"
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <p className="text-xs font-medium text-gray-500">Showing {staff.length} of {pagination.total} doctors</p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin">progress_activity</span>
              <p className="text-gray-500 mt-2">Loading doctors...</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-gray-300">person_off</span>
              <p className="text-gray-500 mt-2">No doctors found</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Doctor</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Department</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Dr. {member.name}</p>
                          <p className="text-xs text-gray-500">ID: #{member.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {member.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500">{member.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                        member.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === member._id ? null : member._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                      >
                        <span className="material-symbols-outlined text-xl">more_vert</span>
                      </button>
                      {openDropdown === member._id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[180px] z-10">
                          <button 
                            onClick={() => handleDelete(member._id)}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-base text-red-400">delete</span>
                            Delete
                          </button>
                        </div>
                      )}
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
              className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="text-sm text-gray-600">Page {pagination.page} of {pagination.pages}</span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
