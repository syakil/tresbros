"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Coffee, CheckCircle, Clock } from 'lucide-react';

interface Order {
  id: number;
  customerName: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'TAKEN';
  createdAt: string;
  queueNumber?: string | null;
  orderNumber?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
}

const ITEMS_PER_PAGE = 8; // Menyesuaikan agar tidak overflow ke bawah (2 kolom x 4 baris)
const CYCLE_INTERVAL_MS = 6000; // Pindah halaman setiap 6 detik

export default function QueuePage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Pagination states
  const [prepPage, setPrepPage] = useState(0);
  const [readyPage, setReadyPage] = useState(0);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await axios.get('/api/orders');
      return res.data;
    },
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const preparingOrders = orders.filter(o => (o.status === 'TODO' || o.status === 'IN_PROGRESS') && o.paymentStatus === 'success');
  const readyOrders = orders.filter(o => o.status === 'DONE' && o.paymentStatus === 'success');

  // Logic for Auto-Pagination (Sedang Disiapkan)
  useEffect(() => {
    if (preparingOrders.length <= ITEMS_PER_PAGE) {
      setPrepPage(0);
      return;
    }
    const maxPage = Math.ceil(preparingOrders.length / ITEMS_PER_PAGE) - 1;
    // Reset page if data shrinks
    if (prepPage > maxPage) setPrepPage(0);

    const interval = setInterval(() => {
      setPrepPage(prev => (prev >= maxPage ? 0 : prev + 1));
    }, CYCLE_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, [preparingOrders.length, prepPage]);

  // Logic for Auto-Pagination (Silakan Ambil)
  useEffect(() => {
    if (readyOrders.length <= ITEMS_PER_PAGE) {
      setReadyPage(0);
      return;
    }
    const maxPage = Math.ceil(readyOrders.length / ITEMS_PER_PAGE) - 1;
    // Reset page if data shrinks
    if (readyPage > maxPage) setReadyPage(0);

    const interval = setInterval(() => {
      setReadyPage(prev => (prev >= maxPage ? 0 : prev + 1));
    }, CYCLE_INTERVAL_MS);
    
    return () => clearInterval(interval);
  }, [readyOrders.length, readyPage]);

  const visiblePreparing = preparingOrders.slice(prepPage * ITEMS_PER_PAGE, (prepPage + 1) * ITEMS_PER_PAGE);
  const visibleReady = readyOrders.slice(readyPage * ITEMS_PER_PAGE, (readyPage + 1) * ITEMS_PER_PAGE);

  const formattedTime = currentTime ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';

  // Helper for pagination dots
  const renderDots = (totalItems: number, currentPage: number) => {
    if (totalItems <= ITEMS_PER_PAGE) return null;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    return (
      <div className="flex gap-2 justify-center mt-6">
        {Array.from({ length: totalPages }).map((_, i) => (
          <div 
            key={i} 
            className={`w-3 h-3 rounded-full transition-all duration-500 ${i === currentPage ? 'bg-brand-warm scale-125' : 'bg-white/20'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen bg-brand-dark flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-[#1C1F1D] border-b border-white/10 px-8 py-5 flex justify-between items-center shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-warm rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,200,87,0.2)]">
            <Coffee className="w-8 h-8 text-brand-dark" />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold text-brand-cream tracking-wide">Order Queue</h1>
            <p className="text-brand-sage text-base mt-1">Please wait for your order number to be called</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-brand-warm flex items-center gap-3 bg-brand-warm/10 px-6 py-3 rounded-2xl border border-brand-warm/20">
            <Clock className="w-6 h-6" />
            <span className="text-3xl font-bold font-display tracking-widest">{formattedTime}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Sedang Disiapkan */}
        <div className="w-1/2 flex flex-col border-r border-white/5 bg-black/10 overflow-hidden">
          <div className="bg-black/30 py-5 px-8 text-center border-b border-white/10 shadow-sm z-10 shrink-0">
            <h2 className="text-4xl font-display font-bold text-brand-cream/90 flex items-center justify-center gap-4">
              <Coffee className="w-10 h-10 text-brand-sage" />
              Preparing
              {preparingOrders.length > ITEMS_PER_PAGE && (
                <span className="text-lg bg-white/10 px-3 py-1 rounded-full text-brand-sage ml-2">
                  {preparingOrders.length} Orders
                </span>
              )}
            </h2>
          </div>
          
          <div className="flex-1 overflow-hidden relative p-8 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-8 h-full content-start">
              {visiblePreparing.map(order => (
                <div key={`${order.id}-${prepPage}`} className="bg-brand-olive/40 border border-brand-sage/20 rounded-3xl p-8 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl backdrop-blur-sm h-40">
                  <span className="text-7xl font-display font-black text-brand-sage tracking-tighter">
                    {order.queueNumber}
                  </span>
                </div>
              ))}
              {preparingOrders.length === 0 && (
                <div className="col-span-2 h-full flex flex-col items-center justify-center text-brand-sage/30 mt-20">
                  <Coffee className="w-32 h-32 mb-6 opacity-30" />
                  <p className="text-3xl font-display font-semibold">No queue</p>
                </div>
              )}
            </div>
            {renderDots(preparingOrders.length, prepPage)}
          </div>
        </div>

        {/* Right Column: Silakan Ambil */}
        <div className="w-1/2 flex flex-col bg-brand-olive/5 relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-warm/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="bg-brand-warm/10 py-5 px-8 text-center border-b border-brand-warm/20 backdrop-blur-sm z-10 shadow-sm shrink-0">
            <h2 className="text-4xl font-display font-bold text-brand-warm flex items-center justify-center gap-4 drop-shadow-md">
              <CheckCircle className="w-10 h-10" />
              Please Collect
              {readyOrders.length > ITEMS_PER_PAGE && (
                <span className="text-lg bg-brand-warm/20 px-3 py-1 rounded-full text-brand-warm ml-2">
                  {readyOrders.length} Orders
                </span>
              )}
            </h2>
          </div>
          
          <div className="flex-1 overflow-hidden relative p-8 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-8 h-full content-start">
              {visibleReady.map(order => (
                <div key={`${order.id}-${readyPage}`} className="bg-gradient-to-br from-brand-warm/20 to-brand-warm/5 border-2 border-brand-warm/40 rounded-3xl p-8 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(255,200,87,0.15)] animate-in fade-in zoom-in-95 duration-500 h-40">
                  <span className="text-8xl font-display font-black text-brand-warm drop-shadow-[0_4px_12px_rgba(255,200,87,0.3)] tracking-tighter">
                    {order.queueNumber}
                  </span>
                  {order.customerName && (
                    <span className="text-3xl text-brand-cream font-bold mt-2 max-w-full truncate px-4">
                      {order.customerName}
                    </span>
                  )}
                </div>
              ))}
              {readyOrders.length === 0 && (
                <div className="col-span-2 h-full flex flex-col items-center justify-center text-brand-warm/20 mt-20">
                  <CheckCircle className="w-32 h-32 mb-6 opacity-30" />
                  <p className="text-3xl font-display font-semibold">No finished orders yet</p>
                </div>
              )}
            </div>
            {renderDots(readyOrders.length, readyPage)}
          </div>
        </div>

      </main>
      
      {/* Footer */}
      <footer className="bg-black/60 border-t border-brand-warm/10 py-4 px-8 text-center z-10 shrink-0">
        <p className="text-brand-sage/80 text-lg font-medium">Thank you for visiting Tresbros. Orders that have been collected will automatically disappear from the screen.</p>
      </footer>
    </div>
  );
}
