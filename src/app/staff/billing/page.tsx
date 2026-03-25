'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/shared';

interface BillingRecord {
  _id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  items: string[];
  date: string;
  dueDate: string;
  paidAmount?: number;
  paymentMethod?: string;
  paymentDate?: string;
}

interface Patient {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  mrn: string;
  phone?: string;
  email?: string;
}

interface Payment {
  _id: string;
  billingId: string;
  patientName: string;
  amount: number;
  method: string;
  date: string;
  receiptNumber: string;
}

const serviceOptions = [
  { code: 'consultation', name: 'Consultation', price: 150 },
  { code: 'followup', name: 'Follow-up Visit', price: 100 },
  { code: 'labwork', name: 'Lab Work', price: 200 },
  { code: 'vaccination', name: 'Vaccination', price: 85 },
  { code: 'procedure', name: 'Medical Procedure', price: 500 },
  { code: 'xray', name: 'X-Ray', price: 250 },
  { code: 'ecg', name: 'ECG/EKG', price: 175 },
  { code: 'therapy', name: 'Physical Therapy', price: 120 },
  { code: 'dental', name: 'Dental Service', price: 300 },
  { code: 'optometry', name: 'Eye Exam', price: 95 },
];

export default function BillingPayments() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillingRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [invoiceForm, setInvoiceForm] = useState({
    patientId: '',
    services: [] as string[],
    customAmount: '',
    notes: '',
    discountPercent: '0',
    taxPercent: '0',
  });

  const [paymentAmount, setPaymentAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [billingRes, patientsRes] = await Promise.all([
        fetch('/api/billing'),
        fetch('/api/patients'),
      ]);

      if (billingRes.ok) {
        const billingData = await billingRes.json();
        setBillingRecords(billingData.billings || []);
        setPayments(billingData.recentPayments || []);
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

  const billingStats = {
    outstanding: billingRecords.filter(b => b.status === 'pending' || b.status === 'overdue').reduce((sum, b) => sum + (b.amount - (b.paidAmount || 0)), 0),
    collectedToday: payments.filter(p => new Date(p.date).toDateString() === new Date().toDateString()).reduce((sum, p) => sum + p.amount, 0),
    pendingCount: billingRecords.filter(b => b.status === 'pending').length,
    overdueAmount: billingRecords.filter(b => b.status === 'overdue').reduce((sum, b) => sum + b.amount, 0),
  };

  const filteredBills = billingRecords.filter(bill => {
    const matchesSearch = bill.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         bill.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bill._id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || bill.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
  const paginatedBills = filteredBills.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const recentPayments = payments.slice(0, 5).map(p => ({
    id: p._id,
    patient: p.patientName,
    amount: p.amount,
    method: p.method,
    time: new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    receipt: p.receiptNumber,
  }));

  const handleProcessPayment = (bill: BillingRecord) => {
    setSelectedBill(bill);
    setPaymentAmount((bill.amount - (bill.paidAmount || 0)).toFixed(2));
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async () => {
    if (!selectedBill || !paymentAmount) {
      showToast('Please enter payment amount', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/billing/${selectedBill._id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
        }),
      });

      if (response.ok) {
        showToast(`Payment of $${parseFloat(paymentAmount).toFixed(2)} processed successfully!`, 'success');
        setShowPaymentModal(false);
        setSelectedBill(null);
        setPaymentAmount('');
        fetchData();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to process payment', 'error');
      }
    } catch (error) {
      showToast('Error processing payment', 'error');
    }
  };

  const handleCreateInvoice = async () => {
    if (!invoiceForm.patientId) {
      showToast('Please select a patient', 'error');
      return;
    }
    if (invoiceForm.services.length === 0 && !invoiceForm.customAmount) {
      showToast('Please select services or enter custom amount', 'error');
      return;
    }

    const selectedPatient = patients.find(p => p._id === invoiceForm.patientId);
    const subtotal = invoiceForm.customAmount ? parseFloat(invoiceForm.customAmount) : 
      invoiceForm.services.reduce((sum, code) => {
        const service = serviceOptions.find(s => s.code === code);
        return sum + (service?.price || 0);
      }, 0);

    try {
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: invoiceForm.patientId,
          patientName: `${selectedPatient?.firstName} ${selectedPatient?.lastName}`,
          mrn: selectedPatient?.mrn,
          amount: subtotal,
          items: invoiceForm.services.map(code => {
            const service = serviceOptions.find(s => s.code === code);
            return service?.name || code;
          }),
          discountPercent: parseFloat(invoiceForm.discountPercent || '0'),
          taxPercent: parseFloat(invoiceForm.taxPercent || '0'),
          notes: invoiceForm.notes,
        }),
      });

      if (response.ok) {
        showToast('Invoice created successfully!', 'success');
        setShowPaymentModal(false);
        setInvoiceForm({
          patientId: '',
          services: [],
          customAmount: '',
          notes: '',
          discountPercent: '0',
          taxPercent: '0',
        });
        fetchData();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to create invoice', 'error');
      }
    } catch (error) {
      showToast('Error creating invoice', 'error');
    }
  };

  const toggleService = (code: string) => {
    setInvoiceForm(prev => ({
      ...prev,
      services: prev.services.includes(code)
        ? prev.services.filter(s => s !== code)
        : [...prev.services, code]
    }));
  };

  const calculateSubtotal = () => {
    if (invoiceForm.customAmount) return parseFloat(invoiceForm.customAmount);
    return invoiceForm.services.reduce((sum, code) => {
      const service = serviceOptions.find(s => s.code === code);
      return sum + (service?.price || 0);
    }, 0);
  };

  const calculateDiscount = () => {
    return (calculateSubtotal() * parseFloat(invoiceForm.discountPercent || '0')) / 100;
  };

  const calculateTax = () => {
    const afterDiscount = calculateSubtotal() - calculateDiscount();
    return (afterDiscount * parseFloat(invoiceForm.taxPercent || '0')) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'partial': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const generateDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage patient billing and process payments</p>
        </div>
        <button
          onClick={() => { setSelectedBill(null); setInvoiceForm({ patientId: '', services: [], customAmount: '', notes: '', discountPercent: '0', taxPercent: '0' }); setShowPaymentModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined">add</span>
          New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding Balance</p>
            <span className="material-symbols-outlined text-sm text-red-500">trending_up</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(billingStats.outstanding)}</p>
          <p className="text-xs mt-1 text-red-500">+{billingRecords.filter(b => b.status === 'overdue').length} overdue</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Collected Today</p>
            <span className="material-symbols-outlined text-sm text-green-500">trending_up</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(billingStats.collectedToday)}</p>
          <p className="text-xs mt-1 text-green-500">{payments.filter(p => new Date(p.date).toDateString() === new Date().toDateString()).length} transactions</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Invoices</p>
            <span className="material-symbols-outlined text-sm text-yellow-500">trending_flat</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{billingStats.pendingCount}</p>
          <p className="text-xs mt-1 text-gray-500">Awaiting payment</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue (30+)</p>
            <span className="material-symbols-outlined text-sm text-red-500">trending_up</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(billingStats.overdueAmount)}</p>
          <p className="text-xs mt-1 text-red-500">Requires attention</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Search patient, MRN, or invoice..."
              />
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {['all', 'pending', 'paid', 'overdue'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                    activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading billing records...</td>
                  </tr>
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No bills found</td>
                  </tr>
                ) : (
                  paginatedBills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-blue-600 cursor-pointer hover:underline">
                          {bill._id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs">
                            {bill.patientName.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{bill.patientName}</p>
                            <p className="text-xs text-gray-500">{bill.mrn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(bill.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(bill.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{formatCurrency(bill.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleProcessPayment(bill)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Process Payment"
                          >
                            <span className="material-symbols-outlined text-lg">payments</span>
                          </button>
                          <button
                            onClick={() => { setSelectedBill(bill); setShowReceiptModal(true); }}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-lg">receipt_long</span>
                          </button>
                          <button
                            onClick={() => showToast('Printing invoice...', 'info')}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Print"
                          >
                            <span className="material-symbols-outlined text-lg">print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="p-4 flex items-center justify-between border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBills.length)} of {filteredBills.length}
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
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Recent Payments</h2>
              <button
                onClick={() => showToast('Viewing all payments...', 'info')}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                View All
              </button>
            </div>
            {recentPayments.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{payment.patient}</p>
                          <p className="text-xs text-gray-500">{payment.time} - {payment.method}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                        <button
                          onClick={() => showToast(`Receipt ${payment.receipt} sent to printer`, 'info')}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {payment.receipt}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">No recent payments</div>
            )}
          </div>

          <div className="bg-gradient-to-br from-primary to-blue-700 rounded-xl shadow-md p-5 text-white">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined">tips_and_updates</span>
              <h3 className="font-bold">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => showToast('Opening payment plans...', 'info')}
                className="w-full flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-left"
              >
                <span className="material-symbols-outlined">schedule</span>
                <span className="text-sm">Set Up Payment Plan</span>
              </button>
              <button
                onClick={() => showToast('Generating financial report...', 'info')}
                className="w-full flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-left"
              >
                <span className="material-symbols-outlined">assessment</span>
                <span className="text-sm">Generate Report</span>
              </button>
              <button
                onClick={() => showToast('Sending reminders...', 'info')}
                className="w-full flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-left"
              >
                <span className="material-symbols-outlined">send</span>
                <span className="text-sm">Send Payment Reminders</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4">Top Outstanding</h3>
            {billingRecords.filter(b => b.status === 'overdue' || b.status === 'pending').slice(0, 3).length > 0 ? (
              <div className="space-y-3">
                {billingRecords.filter(b => b.status === 'overdue' || b.status === 'pending').slice(0, 3).map((bill, i) => {
                  const daysOverdue = Math.floor((new Date().getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={bill._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{bill.patientName}</p>
                        <p className="text-xs text-gray-500">{daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Due soon'}</p>
                      </div>
                      <span className="text-sm font-semibold text-red-600">{formatCurrency(bill.amount)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center">No outstanding bills</p>
            )}
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedBill ? `Process Payment - ${selectedBill._id.slice(-8).toUpperCase()}` : 'Create New Invoice'}
              </h2>
              <button onClick={() => { setShowPaymentModal(false); setSelectedBill(null); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {selectedBill ? (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {selectedBill.patientName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{selectedBill.patientName}</p>
                        <p className="text-sm text-gray-500">{selectedBill.mrn}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Services</p>
                        <p className="font-medium">{selectedBill.items.join(', ') || 'General'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount Due</p>
                        <p className="font-bold text-primary text-lg">{formatCurrency(selectedBill.amount - (selectedBill.paidAmount || 0))}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setPaymentAmount((selectedBill.amount - (selectedBill.paidAmount || 0)).toFixed(2))} className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20">
                        Pay Full
                      </button>
                      <button onClick={() => setPaymentAmount(((selectedBill.amount - (selectedBill.paidAmount || 0)) / 2).toFixed(2))} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
                        Pay Half
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'card', icon: 'credit_card', label: 'Card' },
                        { id: 'cash', icon: 'payments', label: 'Cash' },
                        { id: 'plan', icon: 'schedule', label: 'Plan' },
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            paymentMethod === method.id
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="material-symbols-outlined text-xl">{method.icon}</span>
                          <p className="text-xs font-medium mt-1">{method.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                          <input
                            type="text"
                            placeholder="123"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <input type="checkbox" id="sendReceipt" className="w-4 h-4 rounded border-gray-300" />
                    <label htmlFor="sendReceipt" className="text-sm text-gray-700">
                      Send receipt via email to patient
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                    <span className="material-symbols-outlined text-blue-600">person</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Patient Information</h3>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                    <select
                      value={invoiceForm.patientId}
                      onChange={(e) => setInvoiceForm({...invoiceForm, patientId: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Select patient</option>
                      {patients.map(patient => (
                        <option key={patient._id} value={patient._id}>
                          {patient.firstName} {patient.lastName} - {patient.mrn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <div className="bg-green-50 p-4 rounded-lg flex items-start gap-3 mb-4">
                      <span className="material-symbols-outlined text-green-600">medical_services</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Services Rendered *</h3>
                        <p className="text-xs text-gray-500 mt-1">Select one or more services</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {serviceOptions.map((service) => (
                        <button
                          key={service.code}
                          onClick={() => toggleService(service.code)}
                          className={`p-3 rounded-lg border-2 text-left transition-colors ${
                            invoiceForm.services.includes(service.code)
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{service.name}</span>
                            {invoiceForm.services.includes(service.code) && (
                              <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(service.price)}</p>
                        </button>
                      ))}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Or Enter Custom Amount</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={invoiceForm.customAmount}
                          onChange={(e) => setInvoiceForm({...invoiceForm, customAmount: e.target.value})}
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Leave blank if selecting services above</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <div className="bg-yellow-50 p-4 rounded-lg flex items-start gap-3 mb-4">
                      <span className="material-symbols-outlined text-yellow-600">discount</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Adjustments</h3>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                        <input
                          type="number"
                          value={invoiceForm.discountPercent}
                          onChange={(e) => setInvoiceForm({...invoiceForm, discountPercent: e.target.value})}
                          placeholder="0"
                          min="0"
                          max="100"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax %</label>
                        <input
                          type="number"
                          value={invoiceForm.taxPercent}
                          onChange={(e) => setInvoiceForm({...invoiceForm, taxPercent: e.target.value})}
                          placeholder="0"
                          min="0"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      {parseFloat(invoiceForm.discountPercent) > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount ({invoiceForm.discountPercent}%)</span>
                          <span>-{formatCurrency(calculateDiscount())}</span>
                        </div>
                      )}
                      {parseFloat(invoiceForm.taxPercent) > 0 && (
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Tax ({invoiceForm.taxPercent}%)</span>
                          <span>{formatCurrency(calculateTax())}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                      rows={3}
                      placeholder="Additional notes or special instructions..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => { setShowPaymentModal(false); setSelectedBill(null); }}
                className="px-5 py-2.5 border border-gray-200 rounded-lg font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={selectedBill ? handlePaymentComplete : handleCreateInvoice}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span className="material-symbols-outlined">check</span>
                {selectedBill ? 'Process Payment' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Invoice Details</h2>
              <button onClick={() => setShowReceiptModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-white text-2xl">clinical_notes</span>
                </div>
                <h3 className="font-bold text-gray-900">Clinical Sanctuary</h3>
                <p className="text-xs text-gray-500">123 Medical Center Drive, Suite 100</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Invoice Number</span>
                  <span className="font-medium">{selectedBill._id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date Issued</span>
                  <span className="font-medium">{new Date(selectedBill.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Due Date</span>
                  <span className="font-medium">{new Date(selectedBill.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Patient</span>
                  <span className="font-medium">{selectedBill.patientName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">MRN</span>
                  <span className="font-medium">{selectedBill.mrn}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Services</span>
                  <span className="font-medium">{selectedBill.items.join(', ') || 'General'}</span>
                </div>
              </div>

              <div className="border-t border-b border-gray-200 py-4 mb-6">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="font-bold text-primary text-xl">{formatCurrency(selectedBill.amount)}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedBill.status)}`}>
                    {selectedBill.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => showToast('Receipt sent to printer', 'info')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="material-symbols-outlined">print</span>
                  Print
                </button>
                <button
                  onClick={() => showToast('Receipt sent via email', 'info')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="material-symbols-outlined">mail</span>
                  Email
                </button>
                <button
                  onClick={() => { setShowReceiptModal(false); handleProcessPayment(selectedBill); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <span className="material-symbols-outlined">payments</span>
                  Pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
