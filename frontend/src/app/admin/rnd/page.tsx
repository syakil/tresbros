"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Edit, Trash2, Beaker } from 'lucide-react';
import Link from 'next/link';

export default function RnDPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: recipes, refetch, isLoading } = useQuery({
    queryKey: ['rnd-recipes'],
    queryFn: async () => {
      const res = await axios.get('/api/rnd');
      return res.data;
    }
  });

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this trial recipe?')) {
      await axios.delete(`/api/rnd/${id}`);
      refetch();
    }
  };

  const createNew = async () => {
    try {
      const res = await axios.post('/api/rnd', {
        name: 'New Trial Recipe',
        description: '',
        status: 'Draft'
      });
      window.location.href = `/admin/rnd/${res.data.id}`;
    } catch(e) {
      alert("Failed to create new recipe");
    }
  };

  const filtered = recipes?.filter((r: any) => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-zinc-900 flex items-center gap-2">
            <Beaker className="w-6 h-6 text-brand-sage" />
            R&D Recipe Experiments
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Test new recipes and calculate simulated COGS</p>
        </div>
        <Button onClick={createNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Recipe
        </Button>
      </div>

      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search trial recipe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-sage/50"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 font-medium">Recipe Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Target COGS</th>
                <th className="px-4 py-3 font-medium text-right">Actual COGS</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Loading data...
                  </td>
                </tr>
              ) : filtered?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    No trial recipes yet
                  </td>
                </tr>
              ) : (
                filtered?.map((recipe: any) => (
                  <tr key={recipe.id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {recipe.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        recipe.status === 'Approved' ? 'bg-green-100 text-green-700' :
                        recipe.status === 'Tested' ? 'bg-blue-100 text-blue-700' :
                        recipe.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-zinc-100 text-zinc-700'
                      }`}>
                        {recipe.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      Rp {recipe.targetCost?.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      Rp {recipe.actualCost?.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/rnd/${recipe.id}`}>
                          <Button variant="secondary" className="p-2 h-auto">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="secondary" className="p-2 h-auto text-red-500 hover:text-red-600" onClick={() => handleDelete(recipe.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
