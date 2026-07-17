"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2, Users, Search, AlertCircle, Percent } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  customerType: string;
  defaultDiscountPercent: number;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    phone: '',
    customerType: 'REGULAR',
    defaultDiscountPercent: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/customers');
      setCustomers(res.data);
    } catch (err: any) {
      setError('Gagal memuat data pelanggan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setFormData({ ...customer });
    } else {
      setFormData({
        id: 0,
        name: '',
        phone: '',
        customerType: 'REGULAR',
        defaultDiscountPercent: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`/api/customers/${formData.id}`, formData);
      } else {
        await axios.post('/api/customers', { ...formData, id: undefined });
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert('Gagal menyimpan data pelanggan');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Yakin ingin menghapus pelanggan ini?')) {
      try {
        await axios.delete(`/api/customers/${id}`);
        fetchCustomers();
      } catch (err: any) {
        alert('Gagal menghapus data. Mungkin data ini sudah digunakan di transaksi.');
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Data Pelanggan & Reseller
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Kelola database pelanggan dan atur diskon khusus (reseller)</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Tambah Pelanggan
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text"
            placeholder="Cari nama atau nomor telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition"
          />
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-6 py-4 font-medium">Nama Pelanggan</th>
                <th className="px-6 py-4 font-medium">No. HP</th>
                <th className="px-6 py-4 font-medium">Tipe / Role</th>
                <th className="px-6 py-4 font-medium">Diskon Reseller</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-zinc-300 mb-2" />
                    Belum ada data pelanggan
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-zinc-50/50 transition">
                    <td className="px-6 py-4 font-medium text-zinc-900">{c.name}</td>
                    <td className="px-6 py-4 text-zinc-600">{c.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        c.customerType === 'RESELLER' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                      }`}>
                        {c.customerType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.customerType === 'RESELLER' && c.defaultDiscountPercent > 0 ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Percent className="w-3.5 h-3.5" />
                          {c.defaultDiscountPercent}%
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-zinc-900 mb-6">
              {formData.id ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">No. WhatsApp / Telepon</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition" 
                  placeholder="0812..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Tipe Pelanggan</label>
                <select 
                  value={formData.customerType}
                  onChange={e => setFormData({...formData, customerType: e.target.value})}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition"
                >
                  <option value="REGULAR">Biasa (Regular)</option>
                  <option value="RESELLER">Reseller / Wholesale</option>
                </select>
              </div>

              {formData.customerType === 'RESELLER' && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-2">
                  <label className="block text-sm font-medium text-purple-900">
                    Diskon Otomatis Reseller (%)
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      step="1"
                      required
                      value={formData.defaultDiscountPercent}
                      onChange={e => setFormData({...formData, defaultDiscountPercent: parseFloat(e.target.value) || 0})}
                      className="w-full pl-4 pr-10 py-2 bg-white border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/50 transition" 
                    />
                    <Percent className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-purple-400" />
                  </div>
                  <p className="text-xs text-purple-700/70">
                    Semua transaksi kasir (POS) atas nama pelanggan ini akan otomatis dipotong sebesar persentase ini.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-100 text-zinc-700 font-medium rounded-xl hover:bg-zinc-200 transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
