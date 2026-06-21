"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await axios.get('/api/users');
      return data;
    }
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await axios.get('/api/roles');
      return data;
    }
  });

  const createUser = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.post('/api/users', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || "Gagal membuat pengguna");
    }
  });

  const updateUser = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await axios.put(`/api/users/${payload.id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || "Gagal mengubah pengguna");
    }
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const resetForm = () => {
    setShowForm(false);
    setEditData(null);
    setUsername('');
    setFullName('');
    setPassword('');
    setRoleId(roles.length > 0 ? roles[0].id : '');
    setIsActive(true);
  };

  const handleEditClick = (user: any) => {
    setEditData(user);
    setUsername(user.username);
    setFullName(user.fullName);
    setPassword('');
    setRoleId(user.roleId);
    setIsActive(user.isActive);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !fullName) return alert("Username dan Nama Lengkap wajib diisi!");
    if (!roleId) return alert("Silakan pilih Hak Akses (Role) terlebih dahulu!");
    
    if (editData) {
      updateUser.mutate({
        id: editData.id,
        username,
        fullName,
        password,
        roleId: Number(roleId),
        isActive
      });
    } else {
      if (!password) return alert("Password wajib diisi untuk pengguna baru!");
      createUser.mutate({
        username,
        fullName,
        password,
        roleId: Number(roleId),
        isActive
      });
    }
  };

  const handleDelete = (id: number, uname: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun ${uname}?`)) {
      deleteUser.mutate(id);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-brand-cream">Manajemen Pengguna</h1>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-brand-sage text-sm md:text-base">Kelola akun akses kasir dan administrator</p>
          <Button variant="primary" className="shadow-md w-full md:w-auto justify-center" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Tambah Pengguna
          </Button>
        </div>
      </div>

      {showForm && (
        <Card variant="olive" className="relative z-20 bg-black/40 border-brand-warm/30 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-brand-cream mb-4 border-b border-white/10 pb-2">
            {editData ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-brand-sage mb-1 block">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Misal: kasir1" 
                  className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm transition" 
                />
              </div>
              <div>
                <label className="text-xs text-brand-sage mb-1 block">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Misal: Budi Santoso" 
                  className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm transition" 
                />
              </div>
              <div>
                <label className="text-xs text-brand-sage mb-1 block">Password</label>
                <input 
                  type="text" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editData ? "Kosongkan jika tidak ingin mengubah" : "Password untuk login"} 
                  className="w-full bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3 focus:outline-none focus:border-brand-warm transition" 
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-brand-sage mb-1 block">Hak Akses (Role)</label>
                  <CustomSelect
                    value={roleId.toString()}
                    onChange={(v) => setRoleId(Number(v))}
                    className="bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3"
                    options={roles.map((r: any) => ({ value: r.id.toString(), label: r.name }))}
                    placeholder="Pilih Role"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs text-brand-sage mb-1 block">Status Aktif</label>
                  <CustomSelect
                    value={isActive ? "true" : "false"}
                    onChange={(v) => setIsActive(v === "true")}
                    className="bg-black/20 border border-white/10 text-brand-cream rounded-xl px-4 py-3"
                    options={[
                      { value: "true", label: 'Aktif' },
                      { value: "false", label: 'Non-aktif' }
                    ]}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-2">
              <Button type="button" variant="outline" onClick={resetForm}>Batal</Button>
              <Button type="submit" variant="primary" disabled={createUser.isPending || updateUser.isPending}>
                {createUser.isPending || updateUser.isPending ? 'Menyimpan...' : 'Simpan Data'}
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
                <th className="px-6 py-5 font-semibold">Username</th>
                <th className="px-6 py-5 font-semibold">Nama Lengkap</th>
                <th className="px-6 py-5 font-semibold">Role / Akses</th>
                <th className="px-6 py-5 font-semibold">Status</th>
                <th className="px-6 py-5 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-brand-sage">Memuat data pengguna...</td>
                </tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-brand-sage">
                    Belum ada data pengguna yang terdaftar.
                  </td>
                </tr>
              )}
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-brand-warm">
                    {user.username}
                  </td>
                  <td className="px-6 py-4 text-brand-cream font-medium">
                    {user.fullName}
                  </td>
                  <td className="px-6 py-4">
                    {user.role ? (
                      <span className="inline-flex items-center gap-1.5 bg-brand-warm/20 text-brand-warm px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                        <ShieldAlert className="w-3.5 h-3.5" /> {user.role.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-white/10 text-brand-sage px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                        <Users className="w-3.5 h-3.5" /> Tidak ada
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {user.isActive ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-brand-sage hover:text-brand-cream bg-black/20 hover:bg-black/40 border border-white/5 p-2 rounded-lg transition mr-2"
                      title="Ubah"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.username)}
                      className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 p-2 rounded-lg transition"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
