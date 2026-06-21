"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react';

const MODULES = [
  { id: 'dashboard', label: 'Dashboard & Laporan Penjualan' },
  { id: 'pos', label: 'Kasir (POS)' },
  { id: 'kds', label: 'Dapur (KDS)' },
  { id: 'inventory', label: 'Manajemen Stok & Produk' },
  { id: 'purchases', label: 'Pembelian' },
  { id: 'accounting', label: 'Akuntansi (Jurnal, Buku Besar, Laba Rugi)' },
  { id: 'settings', label: 'Pengaturan Sistem & User' }
];

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await axios.get('/api/roles');
      return data;
    }
  });

  const createRole = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.post('/api/roles', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      resetForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || "Gagal membuat role");
    }
  });

  const updateRole = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.put(`/api/roles/${payload.id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      resetForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || "Gagal mengubah role");
    }
  });

  const deleteRole = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || "Gagal menghapus role. Mungkin role ini masih digunakan oleh pengguna.");
    }
  });

  const resetForm = () => {
    setShowForm(false);
    setEditData(null);
    setName('');
    setDescription('');
    setPermissions([]);
  };

  const handleEditClick = (role: any) => {
    setEditData(role);
    setName(role.name);
    setDescription(role.description || '');
    try {
      setPermissions(JSON.parse(role.permissions || '[]'));
    } catch {
      setPermissions([]);
    }
    setShowForm(true);
  };

  const togglePermission = (moduleId: string) => {
    setPermissions(prev => 
      prev.includes(moduleId) 
        ? prev.filter(p => p !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Nama Role wajib diisi!");
    
    const payload = {
      name,
      description,
      permissions: JSON.stringify(permissions)
    };

    if (editData) {
      updateRole.mutate({ id: editData.id, ...payload });
    } else {
      createRole.mutate(payload);
    }
  };

  const handleDelete = (id: number, roleName: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus role ${roleName}?`)) {
      deleteRole.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-brand-cream">Manajemen Role</h1>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-brand-sage text-sm md:text-base">Kelola daftar hak akses dan peran sistem</p>
          <Button variant="primary" className="shadow-md w-full md:w-auto justify-center" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Role
          </Button>
        </div>
      </div>

      {showForm && (
        <Card variant="olive" className="bg-black/40 border-brand-warm/30 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-brand-cream mb-4 border-b border-white/10 pb-2">
            {editData ? 'Ubah Data Role' : 'Tambah Role Baru'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-brand-sage mb-1 block">Nama Role</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Misal: Manager Cabang" 
                  className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm transition" 
                />
              </div>
              <div>
                <label className="text-xs text-brand-sage mb-1 block">Keterangan Singkat</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opsional" 
                  className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm transition" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-brand-sage mb-3 block">Pilih Hak Akses Menu</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {MODULES.map(mod => (
                  <label key={mod.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${permissions.includes(mod.id) ? 'bg-brand-warm/10 border-brand-warm text-brand-cream' : 'bg-black/20 border-white/10 text-brand-sage hover:bg-white/5'}`}>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded accent-brand-warm"
                      checked={permissions.includes(mod.id)}
                      onChange={() => togglePermission(mod.id)}
                    />
                    <span className="text-sm font-medium">{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-2 border-t border-white/10 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>Batal</Button>
              <Button type="submit" variant="primary" disabled={createRole.isPending || updateRole.isPending}>
                {createRole.isPending || updateRole.isPending ? 'Menyimpan...' : 'Simpan Role'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card variant="olive" className="p-0 overflow-hidden shadow-xl border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-brand-sage min-w-[800px]">
            <thead className="bg-black/40 text-brand-cream border-b border-white/10">
              <tr>
                <th className="px-6 py-5 font-semibold w-1/4">Nama Role</th>
                <th className="px-6 py-5 font-semibold w-1/3">Keterangan</th>
                <th className="px-6 py-5 font-semibold text-center w-1/4">Jumlah Akses Menu</th>
                <th className="px-6 py-5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-brand-sage">Memuat data role...</td>
                </tr>
              )}
              {!isLoading && roles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-brand-sage">
                    Belum ada role yang terdaftar.
                  </td>
                </tr>
              )}
              {roles.map((role: any) => {
                let perms = [];
                try { perms = JSON.parse(role.permissions || '[]'); } catch {}
                
                return (
                  <tr key={role.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 text-brand-warm font-bold uppercase tracking-wider text-sm">
                        <ClipboardList className="w-4 h-4" /> {role.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-brand-cream/80">
                      {role.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-black/40 border border-white/10 px-3 py-1 rounded-full text-xs font-medium">
                        {perms.length} Menu Diizinkan
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEditClick(role)}
                        className="text-brand-sage hover:text-brand-cream bg-black/20 hover:bg-black/40 border border-white/5 p-2 rounded-lg transition mr-2"
                        title="Ubah"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(role.id, role.name)}
                        className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 p-2 rounded-lg transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
