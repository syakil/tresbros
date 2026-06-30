"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag, Plus, Trash2, Power } from 'lucide-react';

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    type: 'PERCENTAGE', // or NOMINAL
    value: '',
    minPurchase: '0',
    maxDiscount: '',
    maxUsage: '100',
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const res = await axios.get('/api/coupons');
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (newCoupon: any) => axios.post('/api/coupons', newCoupon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setShowForm(false);
      setFormData({ code: '', type: 'PERCENTAGE', value: '', minPurchase: '0', maxDiscount: '', maxUsage: '100' });
    },
    onError: (err: any) => {
      alert(err.response?.data?.error || "An error occurred");
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number, isActive: boolean }) => axios.put(`/api/coupons/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/coupons/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] })
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-display font-bold text-3xl mb-2 text-zinc-900">Discount Coupons</h1>
          <p className="text-zinc-500 text-sm">Manage promo codes and coupons for customers.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex gap-2">
          {showForm ? 'Cancel' : <><Plus className="w-4 h-4" /> Add Coupon</>}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-zinc-700 font-medium mb-1.5">Coupon Code</label>
                <input required type="text" className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-zinc-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-zinc-400" 
                  value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="PROMO30" />
              </div>
              <div>
                <label className="block text-sm text-zinc-700 font-medium mb-1.5">Discount Type</label>
                <select className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-zinc-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition [&>option]:bg-white" 
                  value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="NOMINAL">Nominal (Rp)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-700 font-medium mb-1.5">Discount Value</label>
                <input required type="number" className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-zinc-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-zinc-400" 
                  value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder={formData.type === 'PERCENTAGE' ? "30" : "15000"} />
              </div>
              <div>
                <label className="block text-sm text-zinc-700 font-medium mb-1.5">Maximum Discount (Rp) <span className="text-xs opacity-60 font-normal">(Optional)</span></label>
                <input type="number" className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-zinc-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400" 
                  value={formData.maxDiscount} onChange={e => setFormData({...formData, maxDiscount: e.target.value})} placeholder="e.g., 10000" disabled={formData.type === 'NOMINAL'} />
              </div>
              <div>
                <label className="block text-sm text-zinc-700 font-medium mb-1.5">Minimum Purchase (Rp)</label>
                <input required type="number" className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-zinc-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-zinc-400" 
                  value={formData.minPurchase} onChange={e => setFormData({...formData, minPurchase: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-zinc-700 font-medium mb-1.5">Coupon Quota</label>
                <input required type="number" className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-zinc-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition placeholder:text-zinc-400" 
                  value={formData.maxUsage} onChange={e => setFormData({...formData, maxUsage: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end pt-5 border-t border-zinc-100 mt-4">
              <Button type="submit" variant="primary" className="py-2.5 px-6 rounded-xl font-medium" disabled={createMutation.isPending}>Save Coupon</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <p>Loading...</p> : coupons.map((coupon: any) => (
          <Card key={coupon.id} className={`p-5 flex flex-col justify-between transition-opacity ${coupon.isActive ? '' : 'opacity-50'}`}>
            <div>
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg text-blue-700 font-bold font-mono tracking-widest border border-blue-200">
                  <Tag className="w-4 h-4" />
                  {coupon.code}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })} className="p-2 hover:bg-zinc-100 text-zinc-400 rounded-lg transition-colors" title={coupon.isActive ? 'Deactivate' : 'Activate'}>
                    <Power className={`w-4 h-4 ${coupon.isActive ? 'text-zinc-400' : 'text-red-500'}`} />
                  </button>
                  <button onClick={() => { if(confirm('Delete this coupon?')) deleteMutation.mutate(coupon.id) }} className="p-2 hover:bg-red-50 text-zinc-400 hover:text-red-500 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1.5 mb-6">
                <p className="text-3xl font-display font-bold text-zinc-900">
                  {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : formatRupiah(coupon.value)}
                </p>
                {coupon.type === 'PERCENTAGE' && coupon.maxDiscount && (
                  <p className="text-sm text-zinc-500">Max discount: {formatRupiah(coupon.maxDiscount)}</p>
                )}
                <p className="text-sm text-zinc-500">Min. purchase: {formatRupiah(coupon.minPurchase)}</p>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4 flex justify-between items-center text-sm">
              <span className="text-zinc-500 font-medium">Used</span>
              <span className="font-bold text-zinc-900">
                {coupon.currentUsage} <span className="text-zinc-400 font-medium">/ {coupon.maxUsage}</span>
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-zinc-100 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${coupon.currentUsage >= coupon.maxUsage ? 'bg-red-500' : 'bg-blue-500'}`} 
                style={{ width: `${Math.min(100, (coupon.currentUsage / coupon.maxUsage) * 100)}%` }}
              ></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
