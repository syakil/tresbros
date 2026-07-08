"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Plus, Trash2, ReceiptText, Search, ChevronLeft, ChevronRight, Edit, ImageIcon, X } from 'lucide-react';

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const getLocalDatetimeStr = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [date, setDate] = useState(getLocalDatetimeStr());
  
  // File upload and edit states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // COA mapping states
  const [accountId, setAccountId] = useState<string>('');
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Custom Alert & Confirm States
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const res = await axios.get('/api/expenses');
      return res.data;
    }
  });

  const { data: coas = [] } = useQuery<any[]>({
    queryKey: ['coas'],
    queryFn: async () => {
      const res = await axios.get('/api/accounting/coa');
      return res.data;
    }
  });

  const expenseAccounts = coas.filter((c: any) => (c.type === 'EXPENSE' || c.type === 'EQUITY') && c.isActive);
  const assetAccounts = coas.filter((c: any) => c.type === 'ASSET' && c.code !== '1140' && c.isActive);

  const expenseOptions = expenseAccounts.map((c: any) => ({ value: c.id.toString(), label: `${c.code} - ${c.name} (${c.type})` }));
  const assetOptions = assetAccounts.map((c: any) => ({ value: c.id.toString(), label: `${c.code} - ${c.name}` }));

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDate(getLocalDatetimeStr());
    setSelectedFile(null);
    setImageUrl('');
    setEditingId(null);
    setAccountId('');
    setPaymentAccountId('');
  };

  const createExpense = useMutation({
    mutationFn: async (newExpense: { description: string; amount: number; date: string; imageUrl?: string; accountId?: number | null; paymentAccountId?: number | null }) => {
      await axios.post('/api/expenses', newExpense);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      resetForm();
      showToast('Expense recorded successfully!', 'success');
    },
    onError: () => {
      showToast('Failed to save expense', 'error');
    }
  });

  const updateExpense = useMutation({
    mutationFn: async (updatedExpense: { id: number; description: string; amount: number; date: string; imageUrl?: string; accountId?: number | null; paymentAccountId?: number | null }) => {
      const { id, ...data } = updatedExpense;
      await axios.put(`/api/expenses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      resetForm();
      showToast('Expense updated successfully!', 'success');
    },
    onError: () => {
      showToast('Failed to update expense', 'error');
    }
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showToast('Expense deleted successfully!', 'success');
    },
    onError: () => {
      showToast('Failed to delete expense', 'error');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;
    
    let uploadedUrl = imageUrl;

    if (selectedFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        const res = await axios.post('/api/upload', formData);
        uploadedUrl = res.data.url;
        setImageUrl(uploadedUrl);
      } catch (error) {
        showToast('Failed to upload image', 'error');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (editingId) {
      updateExpense.mutate({
        id: editingId,
        description,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        imageUrl: uploadedUrl,
        accountId: accountId ? parseInt(accountId) : null,
        paymentAccountId: paymentAccountId ? parseInt(paymentAccountId) : null
      });
    } else {
      createExpense.mutate({
        description,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        imageUrl: uploadedUrl,
        accountId: accountId ? parseInt(accountId) : null,
        paymentAccountId: paymentAccountId ? parseInt(paymentAccountId) : null
      });
    }
  };

  const handleEditClick = (exp: any) => {
    setEditingId(exp.id);
    setDescription(exp.description);
    setAmount(exp.amount.toString());
    
    const expDate = new Date(exp.date);
    expDate.setMinutes(expDate.getMinutes() - expDate.getTimezoneOffset());
    setDate(expDate.toISOString().slice(0, 16));
    
    setImageUrl(exp.imageUrl || '');
    setSelectedFile(null);
    setAccountId(exp.accountId ? exp.accountId.toString() : '');
    setPaymentAccountId(exp.paymentAccountId ? exp.paymentAccountId.toString() : '');
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  const totalExpense = expenses?.reduce((sum: number, exp: any) => sum + exp.amount, 0) || 0;

  // Filter & Pagination Logic
  const filteredExpenses = expenses?.filter((exp: any) => 
    exp.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page to 1 when searching
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-zinc-900 flex items-center gap-3">
          <div className="p-3 bg-red-100 rounded-xl text-red-600">
            <ReceiptText className="w-6 h-6" />
          </div>
          Expenses
        </h1>
        <p className="text-zinc-500">Record all operational store expenses here (excluding automatic stock).</p>
      </div>

      {/* Custom Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl font-medium shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-5 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-500 text-white' : 
          toast.type === 'warning' ? 'bg-amber-500 text-white' : 
          'bg-red-500 text-white'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="max-w-md w-full p-8 text-center shadow-2xl">
            <h3 className="text-2xl font-bold text-zinc-900 mb-2">Delete Expense?</h3>
            <p className="text-zinc-500 mb-8">Are you sure you want to delete this data? This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 py-3">Cancel</Button>
              <Button 
                variant="primary" 
                className="bg-red-500 text-white hover:bg-red-600 flex-1 py-3 border-transparent" 
                onClick={() => {
                  deleteExpense.mutate(deleteId);
                  setDeleteId(null);
                }}
              >
                Yes, Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit p-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
            <h2 className="font-bold text-xl text-zinc-900">
              {editingId ? 'Edit Expense' : 'Add Expense'}
            </h2>
            {editingId && (
              <button 
                onClick={resetForm}
                className="text-xs text-red-500 font-medium hover:text-red-700 bg-red-50 px-2 py-1 rounded-md transition"
                type="button"
              >
                Cancel Edit
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Time</label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Description (e.g., Buy Ice Cubes)</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Expense description..."
                className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder:text-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Amount (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">Rp</span>
                <input
                  type="number"
                  required
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder:text-zinc-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Expense Category (COA)</label>
              <CustomSelect
                value={accountId}
                onChange={setAccountId}
                options={expenseOptions}
                placeholder="-- Select Expense Account --"
                className="bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Paid From (COA)</label>
              <CustomSelect
                value={paymentAccountId}
                onChange={setPaymentAccountId}
                options={assetOptions}
                placeholder="-- Select Payment/Cash Account --"
                className="bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Payment Proof / Receipt (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-zinc-700 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-500 file:text-white hover:file:bg-red-600 transition cursor-pointer"
              />
              {imageUrl && !selectedFile && (
                <div className="mt-3 relative inline-block">
                  <img src={imageUrl} alt="Proof" className="w-24 h-24 object-cover rounded-xl border border-zinc-200 shadow-sm" />
                  <button type="button" onClick={() => setImageUrl('')} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 transition text-white p-1.5 rounded-full shadow-lg">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              variant="primary" 
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-xl border-transparent" 
              disabled={createExpense.isPending || updateExpense.isPending || uploading}
            >
              <Plus className="w-5 h-5 mr-2" />
              {uploading ? 'Uploading...' : 
               editingId ? (updateExpense.isPending ? 'Saving...' : 'Save Changes') :
               (createExpense.isPending ? 'Saving...' : 'Save Expense')}
            </Button>
          </form>
        </Card>

        <Card className="md:col-span-2 flex flex-col p-0 overflow-hidden shadow-sm border border-zinc-200">
          <div className="p-6 flex justify-between items-center border-b border-zinc-100 bg-white">
            <h2 className="font-bold text-xl text-zinc-900">Expense History</h2>
            <div className="text-right">
              <span className="text-xs text-zinc-500 block uppercase tracking-wider font-bold mb-1">Total Expenses</span>
              <span className="text-2xl font-bold text-red-500">{formatRupiah(totalExpense)}</span>
            </div>
          </div>
          
          <div className="px-6 py-4 border-b border-zinc-100 flex gap-3 items-center bg-zinc-50/50">
            <Search className="w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search description..." 
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent border-none text-sm text-zinc-900 focus:outline-none w-full placeholder:text-zinc-400"
            />
          </div>
          
          <div className="flex-1 overflow-auto max-h-[600px] bg-white">
            {isLoading ? (
              <div className="p-12 text-center text-zinc-400 font-medium animate-pulse">Loading data...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                  <ReceiptText className="w-8 h-8 text-zinc-300" />
                </div>
                <p className="text-zinc-500 font-medium">
                  {searchQuery ? 'No data matches your search.' : 'No expense records yet.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-zinc-600">
                <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Description</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Amount</th>
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedExpenses.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-zinc-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-zinc-900">{new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{new Date(exp.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-900">{exp.description}</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {exp.account && (
                              <span className="inline-flex items-center bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-zinc-200">
                                Category: {exp.account.code} - {exp.account.name}
                              </span>
                            )}
                            {exp.paymentAccount && (
                              <span className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-100">
                                Paid via: {exp.paymentAccount.code} - {exp.paymentAccount.name}
                              </span>
                            )}
                          </div>
                          {exp.imageUrl && (
                            <a href={exp.imageUrl} target="_blank" rel="noreferrer" className="text-blue-500 text-xs mt-1.5 flex items-center gap-1.5 hover:text-blue-700 hover:underline w-fit font-medium">
                              <ImageIcon className="w-3.5 h-3.5" /> View Proof
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-red-500 text-right">{formatRupiah(exp.amount)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditClick(exp)}
                            className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteId(exp.id)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                            disabled={deleteExpense.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="p-4 border-t border-zinc-100 bg-white flex justify-between items-center">
              <span className="text-xs text-zinc-500 font-medium">
                Showing <strong className="text-zinc-900">{((currentPage - 1) * itemsPerPage) + 1}</strong> - <strong className="text-zinc-900">{Math.min(currentPage * itemsPerPage, filteredExpenses.length)}</strong> of <strong className="text-zinc-900">{filteredExpenses.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1.5 h-auto text-xs bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-3 text-zinc-700">{currentPage} / {totalPages}</span>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1.5 h-auto text-xs bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
