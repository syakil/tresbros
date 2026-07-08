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
  queueNumber?: string | null;
  orderNumber?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
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

  const todoOrders = orders.filter(o => o.status === 'TODO' && o.paymentStatus === 'success');
  const inProgressOrders = orders.filter(o => o.status === 'IN_PROGRESS' && o.paymentStatus === 'success');
  const doneOrders = orders.filter(o => o.status === 'DONE' && o.paymentStatus === 'success');

  const OrderCardItem = ({ item }: { item: OrderItem }) => {
    const [showRecipe, setShowRecipe] = useState(false);
    return (
      <div className="flex flex-col gap-2 text-sm border-b border-zinc-100 pb-2.5 last:border-0 last:pb-0 text-left">
        <div className="flex justify-between items-center">
          <span 
            className="text-zinc-800 select-none font-semibold leading-tight cursor-pointer hover:text-blue-600 transition-colors flex items-center"
            onClick={() => setShowRecipe(!showRecipe)}
          >
            <span className="inline-flex items-center justify-center font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-xs mr-2">{item.quantity}x</span> 
            {item.product.name}
          </span>
          <button 
            className="text-[10px] uppercase font-bold tracking-wider border border-zinc-200 bg-zinc-50 hover:bg-zinc-105 text-zinc-650 hover:text-zinc-800 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ml-2 cursor-pointer"
            onClick={() => setSelectedRecipeItem(item)}
          >
            View Recipe
          </button>
        </div>
        {item.notes && (
          <p className="text-xs text-amber-850 bg-amber-50/70 border border-amber-100 px-2.5 py-1.5 rounded-lg font-medium leading-relaxed">
            <span className="font-bold text-amber-900">Notes:</span> {item.notes}
          </p>
        )}
        {showRecipe && item.product.recipeItems && item.product.recipeItems.length > 0 && (
          <div className="bg-zinc-50 border border-zinc-200/60 p-3 rounded-xl mt-1 text-xs text-zinc-650 animate-in slide-in-from-top-1 fade-in">
            <p className="font-bold mb-1.5 text-zinc-800 border-b border-zinc-200 pb-1.5">Bahan (Total {item.quantity} Porsi):</p>
            <ul className="flex flex-col gap-1.5">
              {item.product.recipeItems.map(ri => (
                <li key={ri.id} className="flex justify-between font-medium">
                  <span>{ri.material.name}</span>
                  <span className="font-bold text-zinc-800">{ri.quantity * item.quantity} {ri.material.unit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {showRecipe && (!item.product.recipeItems || item.product.recipeItems.length === 0) && (
          <div className="text-xs text-zinc-400 italic px-2 mt-1">No recipe</div>
        )}
      </div>
    );
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const statusThemes = {
      TODO: {
        borderClass: "border-zinc-200 hover:border-red-300",
        badgeBg: "bg-red-50 text-red-700 border-red-100",
        timerBg: "bg-zinc-100 text-zinc-650",
      },
      IN_PROGRESS: {
        borderClass: "border-amber-200 hover:border-amber-400 bg-amber-50/10",
        badgeBg: "bg-amber-50 text-amber-800 border-amber-200",
        timerBg: "bg-amber-100 text-amber-900",
      },
      DONE: {
        borderClass: "border-emerald-250 hover:border-emerald-400 bg-emerald-50/5",
        badgeBg: "bg-emerald-50 text-emerald-850 border-emerald-200",
        timerBg: "bg-emerald-100 text-emerald-950",
      },
      TAKEN: {
        borderClass: "border-zinc-200 opacity-60",
        badgeBg: "bg-zinc-100 text-zinc-600 border-zinc-200",
        timerBg: "bg-zinc-100 text-zinc-600",
      }
    };

    const theme = statusThemes[order.status] || statusThemes.TODO;

    return (
      <Card className={`mb-4 flex flex-col gap-3 transition-all duration-300 hover:shadow-md ${theme.borderClass} border p-5 rounded-2xl bg-white`}>
        <div className="flex justify-between items-center border-b border-zinc-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-zinc-900 text-lg">Queue: {order.queueNumber}</span>
            {order.customerName && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-zinc-100 text-zinc-650 px-2.5 py-1 rounded-md border border-zinc-200">
                <User className="w-3.5 h-3.5 text-zinc-500" /> {order.customerName}
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1.5 text-xs font-bold ${theme.timerBg} px-2.5 py-1 rounded-full border border-black/5`}>
            <Clock className="w-3.5 h-3.5" />
            <Timer createdAt={order.createdAt} />
          </div>
        </div>
        
        <div className="flex flex-col gap-3 flex-1 mt-2">
          {order.items.map(item => (
            <OrderCardItem key={item.id} item={item} />
          ))}
        </div>

        <div className="pt-3 border-t border-zinc-100 mt-2">
          {order.status === 'TODO' && (
            <Button 
              variant="primary" 
              fullWidth 
              className="text-sm shadow-md bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-2.5"
              onClick={() => updateStatus.mutate({ id: order.id, status: 'IN_PROGRESS' })}
            >
              <ChefHat className="w-4 h-4 mr-2" /> Start Cooking
            </Button>
          )}
          {order.status === 'IN_PROGRESS' && (
            <Button 
              variant="accent" 
              fullWidth 
              className="text-sm shadow-md bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl py-2.5"
              onClick={() => updateStatus.mutate({ id: order.id, status: 'DONE' })}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Finish Cooking
            </Button>
          )}
          {order.status === 'DONE' && (
            <Button 
              variant="outline" 
              fullWidth 
              className="text-sm shadow-md border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-semibold rounded-xl py-2.5"
              onClick={() => updateStatus.mutate({ id: order.id, status: 'TAKEN' })}
            >
              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-500" /> Taken
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-black text-zinc-900 tracking-tight">Kitchen Display System</h1>
          <p className="text-zinc-500 font-medium text-sm mt-0.5">Real-time Kitchen Order Management</p>
        </div>
        <div className="text-emerald-600 font-semibold text-xs bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Live Syncing
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Kolom 1: Antrean (TODO) */}
        <div className="flex flex-col bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
              Queue
            </h2>
            <span className="bg-zinc-105 text-zinc-650 text-xs px-2.5 py-1 rounded-md font-bold border border-zinc-200">{todoOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-light">
            {todoOrders.map(order => <OrderCard key={order.id} order={order} />)}
            {todoOrders.length === 0 && <p className="text-center text-zinc-400 text-sm mt-12 font-medium">No queue</p>}
          </div>
        </div>

        {/* Kolom 2: Diproses (IN_PROGRESS) */}
        <div className="flex flex-col bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
              In Progress
            </h2>
            <span className="bg-zinc-105 text-zinc-650 text-xs px-2.5 py-1 rounded-md font-bold border border-zinc-200">{inProgressOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-light">
            {inProgressOrders.map(order => <OrderCard key={order.id} order={order} />)}
            {inProgressOrders.length === 0 && <p className="text-center text-zinc-400 text-sm mt-12 font-medium">No orders in progress</p>}
          </div>
        </div>

        {/* Kolom 3: Selesai (DONE) */}
        <div className="flex flex-col bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="font-semibold text-zinc-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              Done (Today)
            </h2>
            <span className="bg-zinc-105 text-zinc-650 text-xs px-2.5 py-1 rounded-md font-bold border border-zinc-200">{doneOrders.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-light">
            {doneOrders.map(order => <OrderCard key={order.id} order={order} />)}
            {doneOrders.length === 0 && <p className="text-center text-zinc-400 text-sm mt-12 font-medium">No finished orders yet</p>}
          </div>
        </div>

      </div>

      {/* Recipe Modal Popup */}
      {selectedRecipeItem && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <Card className="w-full max-w-md bg-white border-zinc-200 shadow-2xl p-0 overflow-hidden rounded-2xl flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-display font-bold text-lg text-zinc-900">Cooking Recipe</h3>
              <button 
                onClick={() => setSelectedRecipeItem(null)}
                className="text-zinc-400 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 p-2 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 text-left">
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Menu Name</p>
                <p className="font-bold text-zinc-900 text-2xl tracking-tight">{selectedRecipeItem.product.name}</p>
                <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full font-bold mt-2">
                  Total Order: {selectedRecipeItem.quantity} Portions
                </span>
              </div>
              
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 border-b border-zinc-200 pb-2">Recipe Per Serving (1 Portion)</p>
                
                {selectedRecipeItem.product.recipeItems && selectedRecipeItem.product.recipeItems.length > 0 ? (
                  <ul className="space-y-2.5 mt-3">
                    {selectedRecipeItem.product.recipeItems.map((ri: any) => (
                      <li key={ri.id} className="flex justify-between items-center text-sm font-medium text-zinc-700">
                        <span>{ri.material.name}</span>
                        <span className="font-mono text-zinc-850 bg-zinc-200/60 px-2.5 py-0.5 rounded-lg font-bold">
                          {ri.quantity} {ri.material.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400 italic py-2 text-center">No recipe / raw material data.</p>
                )}
              </div>
            </div>
            <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 flex justify-end">
              <Button onClick={() => setSelectedRecipeItem(null)} variant="outline" className="w-full sm:w-auto px-6 py-2.5">Close</Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
