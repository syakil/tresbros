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
      alert(err.response?.data?.error || "Terjadi kesalahan");
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
          <h1 className="font-display font-bold text-3xl mb-2">Kupon Diskon</h1>
          <p className="text-brand-sage text-sm">Kelola kode promo dan kupon untuk pelanggan.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex gap-2">
          {showForm ? 'Batal' : <><Plus className="w-4 h-4" /> Tambah Kupon</>}
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-brand-sage mb-1">Kode Kupon</label>
                <input required type="text" className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-warm" 
                  value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="PROMO30" />
              </div>
              <div>
                <label className="block text-sm text-brand-sage mb-1">Tipe Diskon</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-warm [&>option]:bg-brand-dark" 
                  value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="NOMINAL">Nominal (Rp)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-brand-sage mb-1">Nilai Diskon</label>
                <input required type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-warm" 
                  value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder={formData.type === 'PERCENTAGE' ? "30" : "15000"} />
              </div>
              <div>
                <label className="block text-sm text-brand-sage mb-1">Batas Maksimal Potongan (Rp) <span className="text-xs opacity-50">(Opsional)</span></label>
                <input type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-warm" 
                  value={formData.maxDiscount} onChange={e => setFormData({...formData, maxDiscount: e.target.value})} placeholder="Contoh: 10000" disabled={formData.type === 'NOMINAL'} />
              </div>
              <div>
                <label className="block text-sm text-brand-sage mb-1">Minimal Belanja (Rp)</label>
                <input required type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-warm" 
                  value={formData.minPurchase} onChange={e => setFormData({...formData, minPurchase: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-brand-sage mb-1">Kuota Kupon</label>
                <input required type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-warm" 
                  value={formData.maxUsage} onChange={e => setFormData({...formData, maxUsage: e.target.value})} />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-white/10">
              <Button type="submit" variant="primary" disabled={createMutation.isPending}>Simpan Kupon</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <p>Loading...</p> : coupons.map((coupon: any) => (
          <Card key={coupon.id} className={`p-5 flex flex-col justify-between transition-opacity ${coupon.isActive ? '' : 'opacity-50'}`}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 bg-brand-warm/20 px-3 py-1 rounded-md text-brand-warm font-bold font-mono tracking-widest border border-brand-warm/30">
                  <Tag className="w-4 h-4" />
                  {coupon.code}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title={coupon.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
                    <Power className={`w-4 h-4 ${coupon.isActive ? 'text-brand-sage' : 'text-red-400'}`} />
                  </button>
                  <button onClick={() => { if(confirm('Hapus kupon ini?')) deleteMutation.mutate(coupon.id) }} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 mb-6">
                <p className="text-2xl font-display font-bold text-brand-cream">
                  {coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : formatRupiah(coupon.value)}
                </p>
                {coupon.type === 'PERCENTAGE' && coupon.maxDiscount && (
                  <p className="text-xs text-brand-sage">Maks. potongan: {formatRupiah(coupon.maxDiscount)}</p>
                )}
                <p className="text-xs text-brand-sage">Min. belanja: {formatRupiah(coupon.minPurchase)}</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-3 flex justify-between items-center text-xs">
              <span className="text-brand-sage/70">Terpakai</span>
              <span className="font-bold text-brand-cream">
                {coupon.currentUsage} <span className="text-brand-sage font-normal">/ {coupon.maxUsage}</span>
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-black/40 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full ${coupon.currentUsage >= coupon.maxUsage ? 'bg-red-400' : 'bg-brand-sage'}`} 
                style={{ width: `${Math.min(100, (coupon.currentUsage / coupon.maxUsage) * 100)}%` }}
              ></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
