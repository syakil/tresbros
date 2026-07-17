"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Coffee, MonitorPlay, Home, ShoppingBag, LogOut, Package, ClipboardList, BarChart3, Boxes, ShoppingCart, Menu, X, Tag, ReceiptText, TrendingUp, Users, Lock } from 'lucide-react';
import axios from 'axios';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };
    try {
      const userCookie = getCookie('tresbros_user');
      if (userCookie) {
        setUser(JSON.parse(decodeURIComponent(userCookie)));
      }
    } catch(e) {}
  }, []);

  const hasPermission = (module: string) => {
    if (!user || !user.role || !user.role.permissions) return false;
    try {
      const perms = JSON.parse(user.role.permissions);
      return perms.includes(module);
    } catch(e) { return false; }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      window.location.href = '/login';
    } catch(e) {}
  };

  const getActiveStyle = (path: string) => {
    return pathname === path 
      ? "bg-blue-600 text-white font-semibold" 
      : "text-zinc-400 hover:text-white hover:bg-zinc-800";
  };

  const getPageTitle = (path: string) => {
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/pos')) return 'Point of Sale';
    if (path.startsWith('/kds')) return 'Kitchen Display';
    if (path.includes('/rnd')) return 'Research & Development';
    if (path.includes('/recipes')) return 'Recipes & BOM';
    if (path.includes('/items')) return 'Product Data';
    if (path.includes('/coupons')) return 'Discount Coupons';
    if (path.includes('/incomes')) return 'Incomes';
    if (path.includes('/expenses')) return 'Expenses';
    if (path.includes('/accounting/coa')) return 'Chart of Accounts';
    if (path.includes('/accounting/journals')) return 'Financial Journals';
    if (path.includes('/accounting/ledger')) return 'General Ledger';
    if (path.includes('/accounting/profit-loss')) return 'Profit & Loss';
    if (path.includes('/accounting/closing')) return 'Period Closing';
    if (path.includes('/settings')) return 'System Settings';
    if (path.includes('/users')) return 'User Management';
    if (path.includes('/roles')) return 'Role Management';
    if (path.includes('/stock-opname')) return 'Stock Opname';
    if (path.includes('/inventory')) return 'Stock Management';
    if (path.includes('/purchases')) return 'Material Purchases';
    
    // Fallback
    const segments = path.replace('/admin/', '').replace(/^\//, '').split('/');
    return segments[0].replace('-', ' ');
  };

  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden font-sans text-zinc-900 relative print:h-auto print:block print:bg-white print:text-black">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-zinc-400 border-r border-zinc-800 flex flex-col justify-between shrink-0 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} print:hidden`}>
        <div className="p-4 flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="flex items-center justify-between gap-3 mb-10 mt-2 px-2">
            <div className="flex items-center gap-3">
              <Coffee className="text-blue-500 w-8 h-8" />
              <h1 className="font-display font-bold text-2xl tracking-tight text-white">Tres<span className="text-blue-500">bros</span></h1>
            </div>
            <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="space-y-1">
            <Link href="/" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/')}`}>
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>
            {hasPermission('pos') && (
              <Link href="/pos" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/pos')}`}>
                <ShoppingBag className="w-5 h-5" />
                <span>Point of Sale (POS)</span>
              </Link>
            )}
            {hasPermission('kds') && (
              <Link href="/kds" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/kds')}`}>
                <MonitorPlay className="w-5 h-5" />
                <span>Kitchen Display (KDS)</span>
              </Link>
            )}
            
            {hasPermission('dashboard') && (
              <>
                <div className="pt-4 pb-2 px-4">
                  <p className="text-xs font-bold text-brand-sage/60 uppercase tracking-wider">Backoffice</p>
                </div>
                <Link href="/admin/dashboard" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/dashboard')}`}>
                  <BarChart3 className="w-5 h-5" />
                  <span>Home Dashboard</span>
                </Link>
                <Link href="/admin/sales" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/sales')}`}>
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  <span>Sales Report</span>
                </Link>
              </>
            )}

            {hasPermission('accounting') && (
              <>
                <Link href="/admin/incomes" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/incomes')}`}>
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span>Incomes</span>
                </Link>
                <Link href="/admin/expenses" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/expenses')}`}>
                  <ReceiptText className="w-5 h-5 text-red-400" />
                  <span>Expenses</span>
                </Link>
              </>
            )}

            {hasPermission('inventory') && (
              <>
                <Link href="/admin/coupons" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/coupons')}`}>
                  <Tag className="w-5 h-5" />
                  <span>Discount Coupons</span>
                </Link>
                <Link href="/admin/items" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/items')}`}>
                  <Package className="w-5 h-5" />
                  <span>Product Data</span>
                </Link>
                <Link href="/admin/recipes" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/recipes')}`}>
                  <ClipboardList className="w-5 h-5" />
                  <span>Recipes / BOM</span>
                </Link>
                <Link href="/admin/rnd" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/rnd')}`}>
                  <MonitorPlay className="w-5 h-5" />
                  <span>R&D / Experiments</span>
                </Link>
                <Link href="/admin/calibration" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/calibration')}`}>
                  <Coffee className="w-5 h-5" />
                  <span>Espresso Calibration</span>
                </Link>
              </>
            )}

            {hasPermission('purchases') && (
              <Link href="/admin/purchases" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/purchases')}`}>
                <ShoppingCart className="w-5 h-5" />
                <span>Material Purchases</span>
              </Link>
            )}

            {hasPermission('inventory') && (
              <>
                <Link href="/admin/inventory" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/inventory')}`}>
                  <Boxes className="w-5 h-5" />
                  <span>Stock Management</span>
                </Link>
                <Link href="/admin/stock-opname" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/stock-opname')}`}>
                  <ClipboardList className="w-5 h-5" />
                  <span>Stock Opname</span>
                </Link>
              </>
            )}
            
            {hasPermission('accounting') && (
              <>
                <div className="pt-4 pb-2 px-4">
                  <p className="text-xs font-bold text-brand-sage/60 uppercase tracking-wider">Accounting & Config</p>
                </div>
                <Link href="/admin/accounting/coa" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/accounting/coa')}`}>
                  <ClipboardList className="w-5 h-5" />
                  <span>Chart of Accounts</span>
                </Link>
                <Link href="/admin/accounting/journals" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/accounting/journals')}`}>
                  <ReceiptText className="w-5 h-5" />
                  <span>Financial Journals</span>
                </Link>
                <Link href="/admin/accounting/ledger" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/accounting/ledger')}`}>
                  <ClipboardList className="w-5 h-5" />
                  <span>General Ledger</span>
                </Link>
                <Link href="/admin/accounting/assets" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/accounting/assets')}`}>
                  <MonitorPlay className="w-5 h-5" />
                  <span>Fixed Assets</span>
                </Link>
                <Link href="/admin/accounting/profit-loss" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/accounting/profit-loss')}`}>
                  <BarChart3 className="w-5 h-5" />
                  <span>Profit & Loss</span>
                </Link>
                <Link href="/admin/accounting/closing" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/accounting/closing')}`}>
                  <Lock className="w-5 h-5" />
                  <span>Period Closing</span>
                </Link>
              </>
            )}

            {hasPermission('settings') && (
              <>
                <Link href="/admin/settings" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/settings')}`}>
                  <MonitorPlay className="w-5 h-5" />
                  <span>System Settings</span>
                </Link>
                <Link href="/admin/users" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/users')}`}>
                  <Users className="w-5 h-5" />
                  <span>User Management</span>
                </Link>
                <Link href="/admin/roles" onClick={() => setIsSidebarOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-r-xl transition ${getActiveStyle('/admin/roles')}`}>
                  <ClipboardList className="w-5 h-5" />
                  <span>Role Management</span>
                </Link>
              </>
            )}
          </nav>
        </div>
        
        <div className="p-6 border-t border-zinc-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-500/10 rounded-xl transition font-medium">
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        {/* Topbar */}
        <header className="h-20 shrink-0 border-b border-zinc-200 bg-white flex items-center justify-between px-4 md:px-8 print:hidden">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 text-zinc-500 hover:text-zinc-900 bg-zinc-100 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-display text-xl font-semibold capitalize text-zinc-900">
              {getPageTitle(pathname)}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-zinc-900">{user ? user.fullName : 'Loading...'}</p>
              <p className="text-xs text-zinc-500">{user && user.role ? user.role.name : ''}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-sm uppercase">
              {user ? user.username.substring(0, 1) : 'U'}
            </div>
          </div>
        </header>
        
        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible custom-scrollbar-light">
          {children}
        </div>
      </main>
    </div>
  );
}
