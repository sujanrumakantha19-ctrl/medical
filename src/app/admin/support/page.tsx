'use client';

import { useState } from 'react';
import { useToast } from '@/components/shared/toast';

function ContactSupportModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', message: 'Hello! Welcome to IT Support. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setChatMessages([...chatMessages, { type: 'user', message: input }]);
    const userInput = input;
    setInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { type: 'bot', message: `Thank you for contacting us about "${userInput}". A support ticket has been created. Our team will respond within 24 hours.` }]);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col">
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-4 text-white rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <h3 className="font-bold">IT Support Chat</h3>
              <p className="text-xs text-blue-200">Typically replies in minutes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <p className="text-sm">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="p-4 border-t border-gray-100 flex gap-2">
          <input
            type="text"
            className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors">
            <span className="material-symbols-outlined">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const { showToast } = useToast();
  const [showContactModal, setShowContactModal] = useState(false);

  const faqs = [
    { question: 'How do I add a new staff member?', answer: 'Navigate to Staff Management and click "Add New Staff". Fill in the required details including name, employee ID, role, and department.' },
    { question: 'How can I view patient records?', answer: 'Go to Patient Registry from the sidebar. You can search for patients by name or patient ID, and filter by department or status.' },
    { question: 'How do I schedule an appointment?', answer: 'Navigate to Appointments and click "New Appointment". Select the patient, doctor, department, date, and time slot.' },
    { question: 'How do I export reports?', answer: 'Go to Analytics and click "Export Report". You can select the date range and type of data you want to export.' },
  ];

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Support ticket submitted successfully! We will respond within 24 hours.', 'success');
  };

  return (
    <>
      {showContactModal && <ContactSupportModal onClose={() => setShowContactModal(false)} />}

      <section className="p-8 max-w-4xl mx-auto w-full space-y-8">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Support Center</h2>
          <p className="text-gray-600 max-w-md">Get help with your hospital management system. Contact IT support for urgent issues.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setShowContactModal(true)}
            className="bg-gradient-to-br from-blue-800 to-blue-600 p-8 rounded-2xl text-white text-left hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-4xl mb-4">contact_support</span>
            <h3 className="text-xl font-bold mb-2">IT Support</h3>
            <p className="text-white/80 mb-4">Available 24/7 for urgent system issues</p>
            <span className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold text-sm">
              <span className="material-symbols-outlined text-sm">chat</span>
              Start Chat
            </span>
          </button>

          <div className="bg-white p-8 rounded-2xl border border-gray-100">
            <span className="material-symbols-outlined text-4xl text-blue-600 mb-4">email</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Email Support</h3>
            <p className="text-gray-500 mb-4">For non-urgent inquiries</p>
            <p className="font-medium text-blue-600">support@clinicalsanctuary.org</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <span className="material-symbols-outlined text-gray-400 group-open:rotate-180 transition-transform">expand_more</span>
                </summary>
                <p className="p-4 text-gray-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Submit a Ticket</h3>
          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Subject</label>
              <input className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-900" placeholder="Brief description of your issue" type="text" required />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Description</label>
              <textarea className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-900 min-h-[120px]" placeholder="Detailed description of your issue..." required></textarea>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Priority</label>
              <select className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-900">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>
            </div>
            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:bg-blue-700 transition-all">
              Submit Ticket
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
