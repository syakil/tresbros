"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Pencil, Trash2, ClipboardList } from 'lucide-react';

const MODULES = [
  { id: 'dashboard', label: 'Dashboard & Sales Reports' },
  { id: 'pos', label: 'Cashier (POS)' },
  { id: 'kds', label: 'Kitchen (KDS)' },
  { id: 'inventory', label: 'Stock & Product Management' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'accounting', label: 'Accounting (Journals, Ledger, Profit & Loss)' },
  { id: 'settings', label: 'System & User Settings' }
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
      alert(error.response?.data?.error || "Failed to create role");
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
      alert(error.response?.data?.error || "Failed to update role");
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
      alert(error.response?.data?.error || "Failed to delete role. It might still be used by users.");
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
    if (!name) return alert("Role Name is required!");
    
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
    if (window.confirm(`Are you sure you want to delete the role ${roleName}?`)) {
      deleteRole.mutate(id);
    }
  };
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-zinc-900">Role Management</h1>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-zinc-500 text-sm md:text-base">Manage access rights and system roles</p>
          <Button variant="primary" className="shadow-md w-full md:w-auto justify-center" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Role
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="relative z-20 bg-white border border-zinc-200 shadow-md p-6 rounded-2xl animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-bold text-zinc-900 mb-4 border-b border-zinc-100 pb-2">
            {editData ? 'Edit Role Data' : 'Add New Role'}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Role Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Branch Manager" 
                  className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-600 mb-1 block uppercase tracking-wider">Short Description</label>
                <input 
                  type="text" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional" 
                  className="w-full bg-white border border-zinc-200 text-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-3 block uppercase tracking-wider">Select Menu Access Rights</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {MODULES.map(mod => (
                  <label key={mod.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${permissions.includes(mod.id) ? 'bg-blue-50 border-blue-500 text-blue-900' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded accent-blue-600"
                      checked={permissions.includes(mod.id)}
                      onChange={() => togglePermission(mod.id)}
                    />
                    <span className="text-sm font-medium">{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-2 border-t border-zinc-100 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={createRole.isPending || updateRole.isPending}>
                {createRole.isPending || updateRole.isPending ? 'Saving...' : 'Save Role'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-0 overflow-hidden shadow-sm border border-zinc-200 bg-white rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 min-w-[800px]">
            <thead className="bg-zinc-50 text-zinc-500 text-xs font-semibold uppercase tracking-wider border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/4">Role Name</th>
                <th className="px-6 py-4 font-semibold w-1/3">Description</th>
                <th className="px-6 py-4 font-semibold text-center w-1/4">Number of Menu Accesses</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Loading role data...</td>
                </tr>
              )}
              {!isLoading && roles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    No registered roles yet.
                  </td>
                </tr>
              )}
              {roles.map((role: any) => {
                let perms = [];
                try { perms = JSON.parse(role.permissions || '[]'); } catch {}
                
                return (
                  <tr key={role.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 text-blue-600 font-bold uppercase tracking-wider text-sm">
                        <ClipboardList className="w-4.5 h-4.5 text-blue-500" /> {role.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-700">
                      {role.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-zinc-100 border border-zinc-200 text-zinc-700 px-3 py-1 rounded-full text-xs font-medium">
                        {perms.length} Allowed Menus
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleEditClick(role)}
                        className="p-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-950 rounded-lg transition-colors border border-zinc-200 mr-2"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(role.id, role.name)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition border border-red-200"
                        title="Delete"
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
