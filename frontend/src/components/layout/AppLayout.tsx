"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, MonitorPlay, Home, ShoppingBag, LogOut, Package, ClipboardList, BarChart3, Boxes, ShoppingCart, Menu, X, Tag, ReceiptText, TrendingUp } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const getActiveStyle = (path: string) => {
    return pathname === path 
      ? "bg-brand-sage/30 text-brand-cream font-semibold border-l-4 border-brand-warm" 
      : "text-brand-cream/80 hover:text-brand-cream hover:bg-brand-sage/20 border-l-4 border-transparent";
  };

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden font-sans text-brand-cream relative print:h-auto print:block print:bg-white print:text-black">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-brand-dark/95 md:bg-black/20 backdrop-blur-md border-r border-white/5 flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} print:hidden`}>
        <div className="p-4">
          <div className="flex items-center justify-between gap-3 mb-10 mt-2 px-2">
            <div className="flex items-center gap-3">
              <Coffee className="text-brand-warm w-8 h-8" />
              <h1 className="font-display font-bold text-2xl tracking-tight">Tres Bros</h1>
            </div>
            <button className="md:hidden text-brand-sage hover:text-brand-cream" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="space-y-1">
            <Link href="/" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/')}`}>
              <Home className="w-5 h-5" />
              <span>Beranda</span>
            </Link>
            <Link href="/pos" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/pos')}`}>
              <ShoppingBag className="w-5 h-5" />
              <span>Kasir (POS)</span>
            </Link>
            <Link href="/kds" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/kds')}`}>
              <MonitorPlay className="w-5 h-5" />
              <span>Dapur (KDS)</span>
            </Link>
            
            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-bold text-brand-sage/60 uppercase tracking-wider">Backoffice</p>
            </div>
            <Link href="/admin/dashboard" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/dashboard')}`}>
              <BarChart3 className="w-5 h-5" />
              <span>Laporan Penjualan</span>
            </Link>
            <Link href="/admin/incomes" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/incomes')}`}>
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span>Pemasukan</span>
            </Link>
            <Link href="/admin/expenses" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/expenses')}`}>
              <ReceiptText className="w-5 h-5 text-red-400" />
              <span>Pengeluaran</span>
            </Link>
            <Link href="/admin/coupons" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/coupons')}`}>
              <Tag className="w-5 h-5" />
              <span>Kupon Diskon</span>
            </Link>
            <Link href="/admin/items" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/items')}`}>
              <Package className="w-5 h-5" />
              <span>Data Produk</span>
            </Link>
            <Link href="/admin/recipes" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/recipes')}`}>
              <ClipboardList className="w-5 h-5" />
              <span>Resep / BOM</span>
            </Link>
            <Link href="/admin/purchases" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/purchases')}`}>
              <ShoppingCart className="w-5 h-5" />
              <span>Pembelian Bahan</span>
            </Link>
            <Link href="/admin/inventory" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/inventory')}`}>
              <Boxes className="w-5 h-5" />
              <span>Manajemen Stok</span>
            </Link>
          </nav>
        </div>
        
        <div className="p-6 border-t border-white/5">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-[#EF4444] hover:bg-[#EF4444]/10 rounded-xl transition font-medium">
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        {/* Topbar */}
        <header className="h-20 shrink-0 border-b border-white/5 bg-black/10 backdrop-blur-sm flex items-center justify-between px-4 md:px-8 print:hidden">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 text-brand-sage hover:text-brand-cream bg-black/20 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-display text-xl font-semibold capitalize">
              {pathname === '/' ? 'Dashboard' : pathname.replace('/admin/', '').replace('/', '')}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">Admin / Owner</p>
              <p className="text-xs text-brand-sage">admin@tresbros.com</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-olive flex items-center justify-center font-bold shadow-md">
              A
            </div>
          </div>
        </header>
        
        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
          {children}
        </div>
      </main>
    </div>
  );
}
