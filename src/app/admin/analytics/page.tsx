'use client';

import { useToast } from '@/components/shared/toast';

export default function AnalyticsPage() {
  const { showToast } = useToast();

  const handleExport = () => {
    showToast('Generating report...', 'info');
    setTimeout(() => {
      showToast('Report exported successfully!', 'success');
    }, 2000);
  };

  const metrics = [
    { label: 'Patient Satisfaction', value: '94.2%', trend: '+2.4%', positive: true },
    { label: 'Bed Occupancy Rate', value: '78.5%', trend: '+5.1%', positive: true },
    { label: 'Avg. Wait Time', value: '18 min', trend: '-8 min', positive: true },
    { label: 'Staff Efficiency', value: '92.8%', trend: '+3.2%', positive: true },
  ];

  const monthlyData = [
    { month: 'Jan', patients: 420, revenue: 125000 },
    { month: 'Feb', patients: 480, revenue: 142000 },
    { month: 'Mar', patients: 510, revenue: 158000 },
    { month: 'Apr', patients: 495, revenue: 151000 },
    { month: 'May', patients: 540, revenue: 168000 },
    { month: 'Jun', patients: 580, revenue: 182000 },
  ];

  return (
    <section className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Analytics</h2>
          <p className="text-gray-600 max-w-md">Comprehensive insights and performance metrics across all hospital operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium"
            onChange={(e) => showToast(`Showing data for: ${e.target.value}`, 'info')}
          >
            <option>Last 6 Months</option>
            <option>Last Year</option>
            <option>All Time</option>
          </select>
          <button
            onClick={handleExport}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{metric.label}</p>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{metric.value}</h3>
            <div className="mt-2 flex items-center text-xs font-bold text-green-600">
              <span className="material-symbols-outlined text-xs mr-1">trending_up</span>
              {metric.trend} from last month
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-gray-900 mb-6">Patient Volume Trend</h4>
          <div className="space-y-4">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-500 w-8">{data.month}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div className="h-full bg-blue-600 rounded-lg" style={{ width: `${(data.patients / 600) * 100}%` }}></div>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-900">{data.patients}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h4 className="font-bold text-gray-900 mb-6">Revenue Overview</h4>
          <div className="space-y-4">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-500 w-8">{data.month}</span>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                  <div className="h-full bg-green-500 rounded-lg" style={{ width: `${(data.revenue / 200000) * 100}%` }}></div>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-900">${(data.revenue / 1000).toFixed(0)}K</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-900 to-blue-700 p-8 rounded-2xl text-white relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h4 className="text-2xl font-bold mb-4">Annual Performance Summary</h4>
          <div className="grid grid-cols-3 gap-8">
            <div><p className="text-[10px] uppercase font-bold tracking-widest text-blue-300 mb-1">Total Patients</p><p className="text-4xl font-black">3,025</p></div>
            <div><p className="text-[10px] uppercase font-bold tracking-widest text-blue-300 mb-1">Total Revenue</p><p className="text-4xl font-black">$926K</p></div>
            <div><p className="text-[10px] uppercase font-bold tracking-widest text-blue-300 mb-1">Avg. Rating</p><p className="text-4xl font-black">4.9/5</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
