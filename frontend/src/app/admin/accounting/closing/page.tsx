"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Calendar, CheckCircle2, Lock, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function ClosingPage() {
  const [closings, setClosings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [activeModal, setActiveModal] = useState<'eod' | 'eom' | 'eoy' | null>(null);
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchClosings();
  }, []);

  const fetchClosings = async () => {
    try {
      const res = await axios.get('/api/closing');
      setClosings(res.data);
    } catch (error) {
      console.error("Failed to fetch Closings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setErrorMsg('');
    if (!activeModal) return;

    // Validation
    if (activeModal === 'eod' && !date) return setErrorMsg('Date is required');
    if (activeModal === 'eom' && (!month || !year)) return setErrorMsg('Month and Year are required');
    if (activeModal === 'eoy' && !year) return setErrorMsg('Year is required');

    setSubmitting(true);
    try {
      let payload = {};
      if (activeModal === 'eod') payload = { date };
      else if (activeModal === 'eom') payload = { month: parseInt(month), year: parseInt(year) };
      else if (activeModal === 'eoy') payload = { year: parseInt(year) };

      await axios.post(`/api/closing/${activeModal}`, payload);
      await fetchClosings();
      setActiveModal(null);
      // Reset form
      setDate(''); setMonth(''); setYear('');
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || error.response?.data || error.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setErrorMsg('');
    setDate(''); setMonth(''); setYear('');
  };

  if (loading) return <div className="p-6 text-zinc-500">Loading Closing Data...</div>;

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-zinc-900">Period Closing</h1>
        <p className="text-zinc-500">Manage End of Day (EOD), End of Month (EOM), and End of Year (EOY) closings to lock financial periods.</p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col items-start gap-4 border border-zinc-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-br from-white to-zinc-50 rounded-2xl">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-900">End of Day (EOD)</h3>
            <p className="text-sm text-zinc-500 mt-1">Locks transactions for a specific date.</p>
          </div>
          <Button onClick={() => setActiveModal('eod')} className="mt-auto w-full shadow-sm">
            Run EOD Closing
          </Button>
        </Card>

        <Card className="p-6 flex flex-col items-start gap-4 border border-zinc-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-br from-white to-zinc-50 rounded-2xl">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-900">End of Month (EOM)</h3>
            <p className="text-sm text-zinc-500 mt-1">Locks all transactions for the month and posts depreciation entries.</p>
          </div>
          <Button onClick={() => setActiveModal('eom')} className="mt-auto w-full shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white">
            Run EOM Closing
          </Button>
        </Card>

        <Card className="p-6 flex flex-col items-start gap-4 border border-zinc-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden bg-gradient-to-br from-white to-zinc-50 rounded-2xl">
          <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-900">End of Year (EOY)</h3>
            <p className="text-sm text-zinc-500 mt-1">Closes out income/expense accounts to Retained Earnings.</p>
          </div>
          <Button onClick={() => setActiveModal('eoy')} className="mt-auto w-full shadow-sm bg-purple-600 hover:bg-purple-700 text-white">
            Run EOY Closing
          </Button>
        </Card>
      </div>

      {/* History Table */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-display font-bold text-zinc-900">Closing History</h2>
        <Card className="p-0 overflow-hidden shadow-sm border border-zinc-200 bg-white rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 min-w-[600px]">
              <thead className="bg-zinc-50 text-zinc-500 text-xs font-semibold uppercase tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Period Date</th>
                  <th className="px-6 py-4">Closed At</th>
                  <th className="px-6 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {closings.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      No closing records found.
                    </td>
                  </tr>
                )}
                {closings.map((c: any) => (
                  <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold border ${
                        c.periodType === 'DAY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        c.periodType === 'MONTH' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {c.periodType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-900">
                      {c.periodType === 'DAY' ? new Date(c.periodDate).toLocaleDateString('id-ID', { dateStyle: 'medium' }) :
                       c.periodType === 'MONTH' ? new Date(c.periodDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) :
                       new Date(c.periodDate).getFullYear()}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {new Date(c.closedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-zinc-700">{c.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-white border border-zinc-200 p-0 flex flex-col shadow-2xl overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 bg-zinc-50">
              <h2 className="text-xl font-display font-bold text-zinc-900">
                {activeModal === 'eod' ? 'End of Day Closing' :
                 activeModal === 'eom' ? 'End of Month Closing' : 'End of Year Closing'}
              </h2>
              <button 
                onClick={closeModal}
                className="text-zinc-400 hover:text-zinc-650 transition bg-zinc-100 hover:bg-zinc-200 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 bg-white space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 flex gap-2 items-start text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              {activeModal === 'eod' && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1.5 block">Closing Date</label>
                  <Input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                  />
                  <p className="text-xs text-zinc-500 mt-2">Transactions for this date will be locked and cannot be modified or deleted.</p>
                </div>
              )}

              {activeModal === 'eom' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1.5 block">Month</label>
                    <select 
                      value={month} 
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    >
                      <option value="">Select Month</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1.5 block">Year</label>
                    <Input 
                      type="number" 
                      placeholder="e.g. 2024"
                      value={year} 
                      onChange={(e) => setYear(e.target.value)} 
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-zinc-500 mt-1">This will lock the entire month and run monthly processes (like depreciation if configured).</p>
                  </div>
                </div>
              )}

              {activeModal === 'eoy' && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1.5 block">Year</label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 2024"
                    value={year} 
                    onChange={(e) => setYear(e.target.value)} 
                  />
                  <p className="text-xs text-zinc-500 mt-2">This will close out all temporary accounts (Income/Expense) to Retained Earnings.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} disabled={submitting}>Cancel</Button>
              <Button 
                onClick={handleClose} 
                disabled={submitting}
                className={
                  activeModal === 'eom' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  activeModal === 'eoy' ? 'bg-purple-600 hover:bg-purple-700' : ''
                }
              >
                {submitting ? 'Processing...' : 'Confirm Closing'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
