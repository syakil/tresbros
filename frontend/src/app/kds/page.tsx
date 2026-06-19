"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Clock, CheckCircle2, ChefHat, User, X } from 'lucide-react';

interface OrderItem {
  id: number;
  quantity: number;
  notes: string | null;
  product: {
    name: string;
    recipeItems?: {
      id: number;
      quantity: number;
      material: {
        name: string;
        unit: string;
      };
    }[];
  };
}

interface Order {
  id: number;
  customerName: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'TAKEN';
  createdAt: string;
  items: OrderItem[];
}

const Timer = ({ createdAt }: { createdAt: string }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const start = new Date(createdAt).getTime();
    const update = () => {
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setElapsed(`${m}m ${s}s`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [createdAt]);

  return <span>{elapsed}</span>;
};

export default function KdsPage() {
  const queryClient = useQueryClient();
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<OrderItem | null>(null);

  // Fetch orders with polling every 3 seconds
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await axios.get('/api/orders');
      return res.data;
    },
    refetchInterval: 3000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      await axios.patch(`/api/orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const todoOrders = orders.filter(o => o.status === 'TODO');
  const inProgressOrders = orders.filter(o => o.status === 'IN_PROGRESS');
  const doneOrders = orders.filter(o => o.status === 'DONE');

  const OrderCardItem = ({ item }: { item: OrderItem }) => {
    const [showRecipe, setShowRecipe] = useState(false);
    return (
      <div className="flex flex-col gap-1 text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
        <div className="flex justify-between items-start">
          <span 
            className="text-brand-cream select-none font-medium leading-tight mt-1 cursor-pointer hover:text-brand-warm transition-colors"
            onClick={() => setShowRecipe(!showRecipe)}
          >
            <span className="font-bold text-brand-warm mr-2">{item.quantity}x</span> 
            {item.product.name}
          </span>
          <button 
            className="text-[10px] uppercase font-bold tracking-wider bg-black/30 border border-white/5 hover:bg-brand-warm hover:text-brand-dark text-brand-sage px-2 py-1 rounded transition-colors whitespace-nowrap ml-2"
            onClick={() => setSelectedRecipeItem(item)}
          >
            Lihat Resep
          </button>
        </div>
        {item.notes && <p className="text-xs text-brand-warm/80 bg-brand-warm/10 p-1 rounded mt-1">Catatan: {item.notes}</p>}
        {showRecipe && item.product.recipeItems && item.product.recipeItems.length > 0 && (
          <div className="bg-black/30 p-2 rounded-md mt-1 text-xs text-brand-sage animate-in slide-in-from-top-1 fade-in">
            <p className="font-semibold mb-1 text-brand-cream/80 border-b border-white/10 pb-1">Bahan (Total {item.quantity} Porsi):</p>
            <ul className="flex flex-col gap-1">
              {item.product.recipeItems.map(ri => (
                <li key={ri.id} className="flex justify-between">
                  <span>{ri.material.name}</span>
                  <span className="font-medium text-brand-cream/80">{ri.quantity * item.quantity} {ri.material.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {showRecipe && (!item.product.recipeItems || item.product.recipeItems.length === 0) && (
          <div className="text-xs text-brand-sage/50 italic px-2 mt-1">Tidak ada resep</div>
        )}
      </div>
    );
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card variant="olive" className="mb-4 flex flex-col gap-3">
      <div className="flex justify-between items-center border-b border-white/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-brand-warm text-lg">Antrian: {order.queueNumber}</span>
          {order.customerName && (
            <span className="flex items-center gap-1 text-xs bg-black/30 px-2 py-1 rounded text-brand-cream">
              <User className="w-3 h-3" /> {order.customerName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm text-brand-sage bg-black/20 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          <Timer createdAt={order.createdAt} />
        </div>
      </div>
      
      <div className="flex flex-col gap-2 flex-1 mt-2">
        {order.items.map(item => (
          <OrderCardItem key={item.id} item={item} />
        ))}
      </div>

      <div className="pt-3 border-t border-white/10 mt-2">
        {order.status === 'TODO' && (
          <Button 
            variant="primary" 
            fullWidth 
            className="text-sm shadow-md"
            onClick={() => updateStatus.mutate({ id: order.id, status: 'IN_PROGRESS' })}
          >
            <ChefHat className="w-4 h-4 mr-2" /> Mulai Masak
          </Button>
        )}
        {order.status === 'IN_PROGRESS' && (
          <Button 
            variant="secondary" 
            fullWidth 
            className="text-sm shadow-md bg-brand-warm hover:bg-brand-warm/80 text-brand-dark"
            onClick={() => updateStatus.mutate({ id: order.id, status: 'DONE' })}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Selesai Masak
          </Button>
        )}
        {order.status === 'DONE' && (
          <Button 
            variant="outline" 
            fullWidth 
            className="text-sm shadow-md border-brand-sage text-brand-sage hover:bg-brand-sage/20 hover:text-brand-cream"
            onClick={() => updateStatus.mutate({ id: order.id, status: 'TAKEN' })}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Sudah Diambil
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-brand-cream">Kitchen Display System</h1>
          <p className="text-brand-sage">Manajemen Pesanan Dapur secara Real-time</p>
        </div>
        <div className="text-brand-warm text-sm animate-pulse flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-warm"></div> Live Sync
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Kolom 1: Antrean (TODO) */}
        <div className="flex flex-col bg-black/20 rounded-2xl p-4 border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="font-semibold text-brand-cream flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400"></span>
              Antrean
            </h2>
            <span className="bg-black/40 text-brand-sage text-xs px-2 py-1 rounded">{todoOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar">
            {todoOrders.map(order => <OrderCard key={order.id} order={order} />)}
            {todoOrders.length === 0 && <p className="text-center text-brand-sage/40 text-sm mt-10">Tidak ada antrean</p>}
          </div>
        </div>

        {/* Kolom 2: Diproses (IN_PROGRESS) */}
        <div className="flex flex-col bg-black/20 rounded-2xl p-4 border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="font-semibold text-brand-cream flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              Diproses
            </h2>
            <span className="bg-black/40 text-brand-sage text-xs px-2 py-1 rounded">{inProgressOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar">
            {inProgressOrders.map(order => <OrderCard key={order.id} order={order} />)}
            {inProgressOrders.length === 0 && <p className="text-center text-brand-sage/40 text-sm mt-10">Tidak ada pesanan diproses</p>}
          </div>
        </div>

        {/* Kolom 3: Selesai (DONE) */}
        <div className="flex flex-col bg-black/20 rounded-2xl p-4 border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="font-semibold text-brand-cream flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-400"></span>
              Selesai (Hari ini)
            </h2>
            <span className="bg-black/40 text-brand-sage text-xs px-2 py-1 rounded">{doneOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar">
            {doneOrders.map(order => <OrderCard key={order.id} order={order} />)}
            {doneOrders.length === 0 && <p className="text-center text-brand-sage/40 text-sm mt-10">Belum ada pesanan selesai</p>}
          </div>
        </div>

      </div>

      {/* Recipe Modal Popup */}
      {selectedRecipeItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#2A2A2A] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-white/5 bg-black/20">
              <h3 className="font-display font-bold text-lg text-brand-cream">Resep Masakan</h3>
              <button 
                onClick={() => setSelectedRecipeItem(null)}
                className="text-brand-sage hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm text-brand-sage mb-1">Menu:</p>
                <p className="font-bold text-brand-warm text-xl">{selectedRecipeItem.product.name}</p>
                <p className="text-xs bg-black/30 inline-block px-2 py-1 rounded text-brand-cream mt-2 font-medium">
                  Total Pesanan: <span className="text-brand-warm font-bold">{selectedRecipeItem.quantity}</span> Porsi
                </p>
              </div>
              
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <p className="text-xs font-bold text-brand-sage/60 uppercase tracking-wider mb-2 border-b border-white/5 pb-2">Resep Per Sajian (1 Porsi)</p>
                
                {selectedRecipeItem.product.recipeItems && selectedRecipeItem.product.recipeItems.length > 0 ? (
                  <ul className="space-y-2 mt-3">
                    {selectedRecipeItem.product.recipeItems.map((ri: any) => (
                      <li key={ri.id} className="flex justify-between items-center text-sm">
                        <span className="text-brand-cream">{ri.material.name}</span>
                        <span className="font-mono text-brand-warm bg-brand-warm/10 px-2 py-0.5 rounded font-bold">
                          {ri.quantity} {ri.material.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-brand-sage italic py-2 text-center">Tidak ada data resep / bahan baku.</p>
                )}
              </div>
            </div>
            <div className="p-4 bg-black/20 border-t border-white/5">
              <Button fullWidth onClick={() => setSelectedRecipeItem(null)} variant="secondary" className="border-white/10 hover:bg-white/5 text-brand-cream">Tutup</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
