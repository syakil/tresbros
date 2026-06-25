"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDate(getLocalDatetimeStr());
    setSelectedFile(null);
    setImageUrl('');
    setEditingId(null);
  };

  const createExpense = useMutation({
    mutationFn: async (newExpense: { description: string; amount: number; date: string; imageUrl?: string }) => {
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
    mutationFn: async (updatedExpense: { id: number; description: string; amount: number; date: string; imageUrl?: string }) => {
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
        imageUrl: uploadedUrl
      });
    } else {
      createExpense.mutate({
        description,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        imageUrl: uploadedUrl
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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-brand-cream flex items-center gap-3">
          <ReceiptText className="w-8 h-8 text-brand-warm" />
          Expenses
        </h1>
        <p className="text-brand-sage">Record all operational store expenses here (excluding automatic stock).</p>
      </div>

      {/* Custom Toast Notification */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-medium shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-5 duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 
          toast.type === 'warning' ? 'bg-orange-500 text-white' : 
          'bg-red-500 text-white'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card variant="olive" className="max-w-md w-full p-6 text-center border-red-500/30 border shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Delete Expense?</h3>
            <p className="text-brand-sage mb-6">Are you sure you want to delete this data? This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setDeleteId(null)} className="flex-1">Cancel</Button>
              <Button 
                variant="primary" 
                className="bg-red-500 text-white border-red-500 hover:bg-red-600 flex-1" 
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
        <Card variant="olive" className="md:col-span-1 h-fit">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
            <h2 className="font-semibold text-lg text-brand-cream">
              {editingId ? 'Edit Expense' : 'Add Expense'}
            </h2>
            {editingId && (
              <button 
                onClick={resetForm}
                className="text-xs text-brand-sage hover:text-white"
                type="button"
              >
                Cancel Edit
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-brand-sage mb-1">Time</label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-brand-cream focus:outline-none focus:border-brand-warm"
              />
            </div>
            <div>
              <label className="block text-sm text-brand-sage mb-1">Description (e.g., Buy Ice Cubes)</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Expense description..."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-brand-cream focus:outline-none focus:border-brand-warm placeholder:text-white/20"
              />
            </div>
            <div>
              <label className="block text-sm text-brand-sage mb-1">Amount (Rp)</label>
              <input
                type="number"
                required
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-brand-cream focus:outline-none focus:border-brand-warm placeholder:text-white/20"
              />
            </div>
            <div>
              <label className="block text-sm text-brand-sage mb-1">Payment Proof / Receipt (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-brand-cream text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-warm file:text-brand-dark hover:file:bg-brand-warm/90"
              />
              {imageUrl && !selectedFile && (
                <div className="mt-3 relative inline-block">
                  <img src={imageUrl} alt="Proof" className="w-24 h-24 object-cover rounded-md border border-white/20" />
                  <button type="button" onClick={() => setImageUrl('')} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 transition text-white p-1 rounded-full shadow-lg">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              variant="primary" 
              className="mt-2 bg-brand-olive" 
              disabled={createExpense.isPending || updateExpense.isPending || uploading}
            >
              <Plus className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 
               editingId ? (updateExpense.isPending ? 'Saving...' : 'Save Changes') :
               (createExpense.isPending ? 'Saving...' : 'Save Expense')}
            </Button>
          </form>
        </Card>

        <Card variant="olive" className="md:col-span-2 flex flex-col p-0 overflow-hidden">
          <div className="p-5 flex justify-between items-center border-b border-white/10 bg-black/20">
            <h2 className="font-semibold text-lg text-brand-cream">Expense History</h2>
            <div className="text-right">
              <span className="text-xs text-brand-sage block uppercase tracking-wider font-bold">Total Expenses</span>
              <span className="text-xl font-bold text-red-400">{formatRupiah(totalExpense)}</span>
            </div>
          </div>
          
          <div className="px-5 py-3 border-b border-white/5 flex gap-2 items-center bg-black/10">
            <Search className="w-4 h-4 text-brand-sage" />
            <input 
              type="text" 
              placeholder="Search description..." 
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent border-none text-sm text-brand-cream focus:outline-none w-full placeholder:text-brand-sage"
            />
          </div>
          
          <div className="flex-1 overflow-auto max-h-[500px]">
            {isLoading ? (
              <div className="p-8 text-center text-brand-sage animate-pulse">Loading data...</div>
            ) : filteredExpenses.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <ReceiptText className="w-12 h-12 text-brand-sage/30 mb-4" />
                <p className="text-brand-sage">
                  {searchQuery ? 'No data matches your search.' : 'No expense records yet.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-brand-sage">
                <thead className="bg-black/40 text-brand-cream border-b border-white/10 sticky top-0">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Description</th>
                    <th className="px-5 py-3 font-semibold text-right">Amount</th>
                    <th className="px-5 py-3 font-semibold text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedExpenses.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        {new Date(exp.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}<br/>
                        <span className="text-xs text-brand-sage">{new Date(exp.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="text-brand-cream">{exp.description}</span>
                          {exp.imageUrl && (
                            <a href={exp.imageUrl} target="_blank" rel="noreferrer" className="text-brand-warm text-xs mt-1 flex items-center gap-1 hover:underline w-fit">
                              <ImageIcon className="w-3 h-3" /> View Proof
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 font-medium text-red-400 text-right">{formatRupiah(exp.amount)}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => handleEditClick(exp)}
                            className="p-2 text-brand-sage hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteId(exp.id)}
                            className="p-2 text-brand-sage hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"
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
            <div className="p-4 border-t border-white/10 bg-black/20 flex justify-between items-center">
              <span className="text-xs text-brand-sage">
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} entries
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 h-auto text-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-2">{currentPage} / {totalPages}</span>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 h-auto text-xs"
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
