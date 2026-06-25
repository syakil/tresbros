"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, ReceiptText, Search, ChevronLeft, ChevronRight, Edit, ImageIcon, X, TrendingUp } from 'lucide-react';

export default function IncomesPage() {
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

  const { data: incomes, isLoading } = useQuery({
    queryKey: ['incomes'],
    queryFn: async () => {
      const res = await axios.get('/api/incomes');
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

  const createIncome = useMutation({
    mutationFn: async (newIncome: { description: string; amount: number; date: string; imageUrl?: string }) => {
      await axios.post('/api/incomes', newIncome);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      resetForm();
      showToast('Pemasukan berhasil dicatat!', 'success');
    },
    onError: () => {
      showToast('Gagal menyimpan pemasukan', 'error');
    }
  });

  const updateIncome = useMutation({
    mutationFn: async (updatedIncome: { id: number; description: string; amount: number; date: string; imageUrl?: string }) => {
      const { id, ...data } = updatedIncome;
      await axios.put(`/api/incomes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      resetForm();
      showToast('Pemasukan berhasil diperbarui!', 'success');
    },
    onError: () => {
      showToast('Gagal memperbarui pemasukan', 'error');
    }
  });

  const deleteIncome = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/incomes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      showToast('Pemasukan berhasil dihapus!', 'success');
    },
    onError: () => {
      showToast('Gagal menghapus pemasukan', 'error');
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
        showToast('Gagal mengunggah gambar', 'error');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (editingId) {
      updateIncome.mutate({
        id: editingId,
        description,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        imageUrl: uploadedUrl
      });
    } else {
      createIncome.mutate({
        description,
        amount: parseFloat(amount),
        date: new Date(date).toISOString(),
        imageUrl: uploadedUrl
      });
    }
  };

  const handleEditClick = (inc: any) => {
    setEditingId(inc.id);
    setDescription(inc.description);
    setAmount(inc.amount.toString());
    
    const incDate = new Date(inc.date);
    incDate.setMinutes(incDate.getMinutes() - incDate.getTimezoneOffset());
    setDate(incDate.toISOString().slice(0, 16));
    
    setImageUrl(inc.imageUrl || '');
    setSelectedFile(null);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  const totalIncome = incomes?.reduce((sum: number, inc: any) => sum + inc.amount, 0) || 0;

  // Filter & Pagination Logic
  const filteredIncomes = incomes?.filter((inc: any) => 
    inc.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredIncomes.length / itemsPerPage);
  const paginatedIncomes = filteredIncomes.slice(
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
          <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          Pemasukan (Incomes)
        </h1>
        <p className="text-zinc-500">Catat semua pemasukan manual tambahan di luar penjualan kasir (POS).</p>
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
            <h3 className="text-2xl font-bold text-zinc-900 mb-2">Hapus Pemasukan?</h3>
            <p className="text-zinc-500 mb-8">Apakah Anda yakin ingin menghapus data ini? Aksi ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 py-3">Batal</Button>
              <Button 
                variant="primary" 
                className="bg-red-500 text-white hover:bg-red-600 flex-1 py-3 border-transparent" 
                onClick={() => {
                  deleteIncome.mutate(deleteId);
                  setDeleteId(null);
                }}
              >
                Ya, Hapus
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit p-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
            <h2 className="font-bold text-xl text-zinc-900">
              {editingId ? 'Edit Pemasukan' : 'Tambah Pemasukan'}
            </h2>
            {editingId && (
              <button 
                onClick={resetForm}
                className="text-xs text-red-500 font-medium hover:text-red-700 bg-red-50 px-2 py-1 rounded-md transition"
                type="button"
              >
                Batal Edit
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Waktu</label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Keterangan (Contoh: Dana Tambahan)</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Deskripsi pemasukan..."
                className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                required
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
                className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-zinc-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Bukti (Opsional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2 text-zinc-700 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
              />
              {imageUrl && !selectedFile && (
                <div className="mt-4 relative inline-block group">
                  <img src={imageUrl} alt="Bukti" className="w-24 h-24 object-cover rounded-xl border border-zinc-200 shadow-sm" />
                  <button type="button" onClick={() => setImageUrl('')} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 transition text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            <Button 
              type="submit" 
              variant="primary" 
              className="mt-4 w-full" 
              disabled={createIncome.isPending || updateIncome.isPending || uploading}
            >
              <Plus className="w-5 h-5 mr-1" />
              {uploading ? 'Mengunggah...' : 
               editingId ? (updateIncome.isPending ? 'Menyimpan...' : 'Simpan Perubahan') :
               (createIncome.isPending ? 'Menyimpan...' : 'Simpan Pemasukan')}
            </Button>
          </form>
        </Card>

        <Card className="md:col-span-2 flex flex-col p-0 overflow-hidden shadow-sm border border-zinc-200 bg-white">
          <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-100 bg-white gap-4">
            <h2 className="font-bold text-xl text-zinc-900">Riwayat Pemasukan Manual</h2>
            <div className="bg-blue-50 px-4 py-2 rounded-xl text-right">
              <span className="text-xs text-blue-600 block uppercase tracking-wider font-bold mb-0.5">Total Pemasukan</span>
              <span className="text-xl font-bold text-blue-700">{formatRupiah(totalIncome)}</span>
            </div>
          </div>
          
          <div className="px-6 py-4 border-b border-zinc-100 flex gap-3 items-center bg-zinc-50/50">
            <Search className="w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Cari keterangan..." 
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent border-none text-sm text-zinc-900 focus:outline-none w-full placeholder:text-zinc-400"
            />
          </div>
          
          <div className="flex-1 overflow-auto max-h-[600px] custom-scrollbar">
            {isLoading ? (
              <div className="p-12 text-center text-zinc-400 animate-pulse">Memuat data...</div>
            ) : filteredIncomes.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                  <ReceiptText className="w-8 h-8 text-zinc-300" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">Tidak Ada Data</h3>
                <p className="text-zinc-500">
                  {searchQuery ? 'Tidak ada data yang cocok dengan pencarian Anda.' : 'Belum ada catatan pemasukan manual.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-zinc-600">
                <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 sticky top-0 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Keterangan</th>
                    <th className="px-6 py-4 text-right">Nominal</th>
                    <th className="px-6 py-4 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginatedIncomes.map((inc: any) => (
                    <tr key={inc.id} className="hover:bg-zinc-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-zinc-900">{new Date(inc.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div className="text-xs text-zinc-400 mt-0.5">{new Date(inc.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-900">{inc.description}</span>
                          {inc.imageUrl && (
                            <a href={inc.imageUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-xs mt-1 flex items-center gap-1 hover:text-blue-700 w-fit font-medium">
                              <ImageIcon className="w-3.5 h-3.5" /> Lihat Bukti
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-blue-600 text-right text-base">{formatRupiah(inc.amount)}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditClick(inc)}
                            className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setDeleteId(inc.id)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Hapus"
                            disabled={deleteIncome.isPending}
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
            <div className="p-5 border-t border-zinc-100 bg-zinc-50 flex justify-between items-center">
              <span className="text-sm text-zinc-500 font-medium">
                Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredIncomes.length)} dari {filteredIncomes.length} data
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 h-auto bg-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="text-sm font-bold text-zinc-700 px-3">{currentPage} / {totalPages}</span>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 h-auto bg-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
