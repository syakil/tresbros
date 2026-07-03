"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Eye, X, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';
import axios from 'axios';

export default function JournalsPage() {
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState<any | null>(null);

  // Filters & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      const res = await axios.get('/api/accounting/journals');
      setJournals(res.data);
    } catch (error) {
      console.error("Failed to fetch Journals", error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  // Filter Logic
  const filteredJournals = journals.filter(j => {
    // 1. Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!j.description?.toLowerCase().includes(query) && !j.reference?.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // 2. Date filter
    if (startDate && new Date(j.date) < new Date(startDate)) return false;
    if (endDate && new Date(j.date) > new Date(endDate + 'T23:59:59')) return false;

    // 3. Category filter
    if (category !== 'ALL') {
      const desc = j.description?.toLowerCase() || '';
      if (category === 'SALES' && !desc.includes('penjualan')) return false;
      if (category === 'PURCHASE' && !desc.includes('pembelian')) return false;
      if (category === 'ADJUSTMENT' && !desc.includes('penyesuaian')) return false;
    }

    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredJournals.length / itemsPerPage) || 1;
  // Pastikan current page tidak melebih total pages jika data berubah
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedJournals = filteredJournals.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  // Reset ke page 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate, category]);

  if (loading) return <div className="p-6 text-zinc-500">Loading Journals...</div>;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-zinc-900">Financial Journals</h1>
        <p className="text-zinc-500">General journal transaction history list</p>
      </div>

      {/* Toolbar Filter & Search */}
      <Card className="p-4 border border-zinc-200 bg-white flex flex-col md:flex-row gap-4 justify-between items-end relative z-20 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-wrap">
          <div>
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5 block">Transaction Category</label>
            <CustomSelect
              value={category}
              onChange={setCategory}
              className="bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 min-w-[180px]"
              options={[
                { value: 'ALL', label: 'All Categories' },
                { value: 'SALES', label: 'Sales' },
                { value: 'PURCHASE', label: 'Stock Purchase' },
                { value: 'ADJUSTMENT', label: 'Stock Adjustment' },
              ]}
            />
          </div>
          <div className="flex gap-2">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5 block">From Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => {
                  try {
                    if ('showPicker' in HTMLInputElement.prototype) {
                      (e.target as HTMLInputElement).showPicker();
                    }
                  } catch (err) {}
                }}
                className="bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer" 
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5 block">To Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => {
                  try {
                    if ('showPicker' in HTMLInputElement.prototype) {
                      (e.target as HTMLInputElement).showPicker();
                    }
                  } catch (err) {}
                }}
                className="bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer" 
              />
            </div>
          </div>
        </div>
        
        <div className="relative w-full md:w-72 mt-2 md:mt-0">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search description / ref no..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>
      </Card>

      {/* Main Table */}
      <Card className="p-0 overflow-hidden shadow-sm border border-zinc-200 bg-white rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 min-w-[800px]">
            <thead className="bg-zinc-50 text-zinc-500 text-xs font-semibold uppercase tracking-wider border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Reference No.</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedJournals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-zinc-500 mb-2">No journals match the search filters.</p>
                    <Button variant="outline" onClick={() => {
                      setSearchQuery(''); setStartDate(''); setEndDate(''); setCategory('ALL');
                    }}>Reset Filters</Button>
                  </td>
                </tr>
              )}
              {paginatedJournals.map((journal: any) => (
                <tr key={journal.id} className="hover:bg-zinc-50 transition-colors text-zinc-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(journal.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-mono text-xs font-bold border border-blue-100">
                      {journal.reference}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900">{journal.description}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedJournal(journal)}
                      className="inline-flex items-center text-zinc-600 hover:text-zinc-950 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 px-3 py-1.5 rounded-lg transition text-xs font-medium"
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Showing <span className="font-bold text-zinc-900">{((safeCurrentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-bold text-zinc-900">{Math.min(safeCurrentPage * itemsPerPage, filteredJournals.length)}</span> of <span className="font-bold text-zinc-900">{filteredJournals.length}</span> entries
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="px-3 py-1.5 h-auto text-xs" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center px-4 font-medium text-sm text-zinc-700">
                Page {safeCurrentPage} of {totalPages}
              </div>
              <Button 
                variant="outline" 
                className="px-3 py-1.5 h-auto text-xs" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Popup Detail Jurnal */}
      {selectedJournal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl bg-white border border-zinc-200 p-0 flex flex-col shadow-2xl overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 bg-zinc-50">
              <div>
                <h2 className="text-xl font-display font-bold text-zinc-900">General Journal Details</h2>
                <p className="text-sm text-blue-600 font-mono font-bold mt-1">Ref: {selectedJournal.reference}</p>
              </div>
              <button 
                onClick={() => setSelectedJournal(null)}
                className="text-zinc-400 hover:text-zinc-650 transition bg-zinc-100 hover:bg-zinc-200 p-2 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 bg-white">
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-bold">Transaction Date</p>
                  <p className="text-sm text-zinc-900 font-medium">{new Date(selectedJournal.date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                </div>
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider font-bold">Description</p>
                  <p className="text-sm text-zinc-900 font-medium">{selectedJournal.description}</p>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                    <tr>
                      <th className="py-3 px-4 font-medium text-xs uppercase tracking-wider">Account Code</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase tracking-wider">Account Name</th>
                      <th className="py-3 px-4 font-medium text-right w-32 text-xs uppercase tracking-wider">Debit</th>
                      <th className="py-3 px-4 font-medium text-right w-32 text-xs uppercase tracking-wider">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-700 divide-y divide-zinc-100 bg-white">
                    {selectedJournal.lines.map((line: any) => (
                      <tr key={line.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{line.account?.code}</td>
                        <td className="py-3 px-4 text-zinc-900">{line.account?.name}</td>
                        <td className="py-3 px-4 text-right font-medium">{line.debit > 0 ? formatRupiah(line.debit) : '-'}</td>
                        <td className="py-3 px-4 text-right font-medium text-zinc-500">{line.credit > 0 ? formatRupiah(line.credit) : '-'}</td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-50 font-bold border-t-2 border-zinc-200">
                      <td colSpan={2} className="py-4 px-4 text-right text-zinc-500 uppercase tracking-wider text-xs">Total Balance:</td>
                      <td className="py-4 px-4 text-right text-blue-600">{formatRupiah(selectedJournal.lines.reduce((sum: number, l: any) => sum + l.debit, 0))}</td>
                      <td className="py-4 px-4 text-right text-blue-600">{formatRupiah(selectedJournal.lines.reduce((sum: number, l: any) => sum + l.credit, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedJournal(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
