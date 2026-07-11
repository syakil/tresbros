"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/Card';
import { 
  ShoppingBag, 
  Monitor, 
  ClipboardList, 
  Beaker, 
  ReceiptText, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  ChevronRight,
  Clock,
  Check
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import Link from 'next/link';

export default function HomeDashboard() {
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

  // 1. Fetch Today's General Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['todayStats'],
    queryFn: async () => {
      const { data } = await axios.get('/api/dashboard?filter=today');
      return data;
    },
    refetchInterval: 15000 // auto-refresh every 15s
  });

  // 2. Fetch Materials for Stock Warning
  const { data: materials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data } = await axios.get('/api/materials');
      return data;
    }
  });

  // 3. Fetch R&D recipes
  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ['rnd-recipes'],
    queryFn: async () => {
      const { data } = await axios.get('/api/rnd');
      return data;
    }
  });

  const lowStockMaterials = materials.filter((m: any) => m.stock <= m.minStock);
  const activeExperiments = recipes.filter((r: any) => r.status === 'Draft' || r.status === 'Tested');

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto w-full pb-12 flex flex-col gap-6">
        
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900 text-white rounded-2xl p-6 shadow-md border border-zinc-800">
          <div>
            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">{getGreeting()}</span>
            <h1 className="text-2xl md:text-3xl font-display font-bold mt-1">
              Halo, {user?.name || 'Partner Tres Bros'} 👋
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Berikut adalah ringkasan performa dan operasional kedai Anda hari ini.</p>
          </div>
          <div className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-zinc-300 text-xs font-semibold">
            <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Quick Action Grid */}
        <div>
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-3">Quick Navigation (Akses Cepat)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link href="/pos">
              <Card className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 hover:shadow-sm group transition-all h-28 bg-white border-zinc-200">
                <ShoppingBag className="w-6 h-6 text-blue-600 group-hover:scale-110 transition duration-200" />
                <span className="text-xs font-bold text-zinc-800 mt-2.5">Open POS</span>
              </Card>
            </Link>
            <Link href="/kds">
              <Card className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-500 hover:shadow-sm group transition-all h-28 bg-white border-zinc-200">
                <Monitor className="w-6 h-6 text-amber-500 group-hover:scale-110 transition duration-200" />
                <span className="text-xs font-bold text-zinc-800 mt-2.5">Open KDS</span>
              </Card>
            </Link>
            <Link href="/admin/stock-opname">
              <Card className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-teal-500 hover:shadow-sm group transition-all h-28 bg-white border-zinc-200">
                <ClipboardList className="w-6 h-6 text-teal-600 group-hover:scale-110 transition duration-200" />
                <span className="text-xs font-bold text-zinc-800 mt-2.5">Stock Opname</span>
              </Card>
            </Link>
            <Link href="/admin/rnd">
              <Card className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-500 hover:shadow-sm group transition-all h-28 bg-white border-zinc-200">
                <Beaker className="w-6 h-6 text-purple-600 group-hover:scale-110 transition duration-200" />
                <span className="text-xs font-bold text-zinc-800 mt-2.5">R&D / Experiment</span>
              </Card>
            </Link>
            <Link href="/admin/accounting/journals">
              <Card className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-500 hover:shadow-sm group transition-all h-28 bg-white border-zinc-200">
                <ReceiptText className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition duration-200" />
                <span className="text-xs font-bold text-zinc-800 mt-2.5">Jurnal Keuangan</span>
              </Card>
            </Link>
            <Link href="/admin/purchases">
              <Card className="p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-rose-500 hover:shadow-sm group transition-all h-28 bg-white border-zinc-200">
                <ShoppingCart className="w-6 h-6 text-rose-500 group-hover:scale-110 transition duration-200" />
                <span className="text-xs font-bold text-zinc-800 mt-2.5">Pembelian Bahan</span>
              </Card>
            </Link>
          </div>
        </div>

        {/* Performance Metrics Row */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Today's Summary (Ringkasan Hari Ini)</h2>
            <Link href="/admin/dashboard" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5">
              Detail Sales Report <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="flex flex-col justify-between p-5 bg-white border-zinc-200 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-[10px] text-zinc-400 font-bold bg-zinc-100 border border-zinc-200 rounded-full px-2 py-0.5 uppercase tracking-wider">Gross Income</span>
              </div>
              <div>
                <p className="text-zinc-400 text-xs font-semibold mb-0.5">Pendapatan Kotor</p>
                <h3 className="text-2xl font-display font-bold text-zinc-900 tracking-tight">
                  {statsLoading ? '...' : formatRupiah(stats?.revenue)}
                </h3>
                <div className="text-[10px] text-zinc-500 mt-1">
                  Total orders hari ini: <span className="font-bold text-zinc-700">{statsLoading ? '-' : stats?.orders}</span>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col justify-between p-5 bg-white border-zinc-200 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-[10px] text-zinc-400 font-bold bg-zinc-100 border border-zinc-200 rounded-full px-2 py-0.5 uppercase tracking-wider">Expenses</span>
              </div>
              <div>
                <p className="text-zinc-400 text-xs font-semibold mb-0.5">Pengeluaran Operasional</p>
                <h3 className="text-2xl font-display font-bold text-zinc-900 tracking-tight">
                  {statsLoading ? '...' : formatRupiah(stats?.expenses)}
                </h3>
                <div className="text-[10px] text-zinc-500 mt-1">
                  Item terjual: <span className="font-bold text-zinc-700">{statsLoading ? '-' : stats?.itemsSold} pcs</span>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col justify-between p-5 bg-white border-zinc-200 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${stats?.netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
                  <DollarSign className={`w-5 h-5 ${stats?.netProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'}`} />
                </div>
                <span className="text-[10px] text-zinc-400 font-bold bg-zinc-100 border border-zinc-200 rounded-full px-2 py-0.5 uppercase tracking-wider">Profit / Loss</span>
              </div>
              <div>
                <p className="text-zinc-400 text-xs font-semibold mb-0.5">Keuntungan Bersih (Net)</p>
                <h3 className={`text-2xl font-display font-bold tracking-tight ${stats?.netProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {statsLoading ? '...' : formatRupiah(stats?.netProfit)}
                </h3>
                <div className="text-[10px] text-zinc-500 mt-1">
                  Status: <span className={`font-bold ${stats?.netProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>{stats?.netProfit >= 0 ? 'Surplus (Untung)' : 'Defisit (Rugi)'}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Hourly Revenue Area Chart */}
          <Card className="lg:col-span-2 p-5 flex flex-col h-[350px] bg-white border-zinc-200 shadow-sm rounded-2xl">
            <div className="mb-4">
              <h2 className="text-base font-display font-bold text-zinc-900">Grafik Penjualan Hari Ini</h2>
              <p className="text-zinc-400 text-xs mt-0.5">Pendapatan kotor per jam (WIB)</p>
            </div>
            <div className="flex-1 w-full">
              {statsLoading ? (
                <div className="h-full flex items-center justify-center text-zinc-400 text-sm">Loading chart data...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.chartData || []} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickMargin={8} 
                      interval={2} 
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `Rp ${val >= 1000 ? (val / 1000) + 'k' : val}`}
                      width={65} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                      formatter={(v: any) => [formatRupiah(v), "Pendapatan"]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Payment Method Pie Chart */}
          <Card className="p-5 flex flex-col h-[350px] bg-white border-zinc-200 shadow-sm rounded-2xl">
            <div className="mb-4">
              <h2 className="text-base font-display font-bold text-zinc-900">Metode Pembayaran</h2>
              <p className="text-zinc-400 text-xs mt-0.5">Proporsi transaksi hari ini</p>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center relative">
              {statsLoading ? (
                <div className="text-zinc-400 text-sm">Loading proportion...</div>
              ) : Object.values(stats?.paymentBreakdown || {}).every(v => v === 0) ? (
                <div className="text-zinc-400 text-xs text-center py-12">Belum ada transaksi hari ini</div>
              ) : (
                <>
                  <div className="w-full h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'CASH', value: stats?.paymentBreakdown?.CASH || 0 },
                            { name: 'QRIS', value: stats?.paymentBreakdown?.QRIS || 0 },
                            { name: 'DEBIT', value: stats?.paymentBreakdown?.DEBIT || 0 }
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="#10b981" /> {/* CASH */}
                          <Cell fill="#6366f1" /> {/* QRIS */}
                          <Cell fill="#f59e0b" /> {/* DEBIT */}
                        </Pie>
                        <Tooltip formatter={(v: any) => formatRupiah(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] font-semibold mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                      <span className="text-zinc-600">Cash ({formatRupiah(stats?.paymentBreakdown?.CASH)})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"></span>
                      <span className="text-zinc-600">QRIS ({formatRupiah(stats?.paymentBreakdown?.QRIS)})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                      <span className="text-zinc-600">Debit ({formatRupiah(stats?.paymentBreakdown?.DEBIT)})</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Operational Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Low Stock Alerts */}
          <Card className="p-5 flex flex-col bg-white border-zinc-200 shadow-sm rounded-2xl h-[360px]">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4 shrink-0">
              <h2 className="text-base font-display font-bold text-zinc-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Stok Menipis (Low Stock)
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lowStockMaterials.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {lowStockMaterials.length} Alert
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {materialsLoading ? (
                <div className="text-zinc-400 text-sm text-center py-12">Loading stock levels...</div>
              ) : lowStockMaterials.length === 0 ? (
                <div className="text-zinc-400 text-sm text-center py-12 flex flex-col items-center justify-center gap-2">
                  <Check className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-full border border-emerald-100" />
                  <span className="font-medium text-zinc-600">Semua aman!</span>
                  <span className="text-xs text-zinc-400">Tidak ada stok bahan baku di bawah batas minimum.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {lowStockMaterials.map((m: any) => (
                    <div key={m.id} className="flex justify-between items-center border border-zinc-100 rounded-xl p-3 hover:bg-zinc-50 transition">
                      <div>
                        <p className="font-semibold text-zinc-800 text-sm">{m.name}</p>
                        <p className="text-[10px] text-zinc-400">Min. Stok: {m.minStock} {m.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600 text-sm">{m.stock} {m.unit}</p>
                        <p className="text-[10px] text-zinc-500">Restock segera</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Top Products sold */}
          <Card className="p-5 flex flex-col bg-white border-zinc-200 shadow-sm rounded-2xl h-[360px]">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4 shrink-0">
              <h2 className="text-base font-display font-bold text-zinc-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                Menu Terlaris Hari Ini
              </h2>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                Top 5
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {statsLoading ? (
                <div className="text-zinc-400 text-sm text-center py-12">Loading products...</div>
              ) : !stats?.topProducts || stats.topProducts.length === 0 ? (
                <div className="text-zinc-400 text-sm text-center py-12 flex flex-col items-center justify-center gap-2">
                  <ShoppingBag className="w-10 h-10 text-zinc-300 bg-zinc-50 p-2 rounded-full border border-zinc-100" />
                  <span className="font-medium text-zinc-600">Belum ada penjualan</span>
                  <span className="text-xs text-zinc-400">Penjualan hari ini akan ditampilkan di sini.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {stats.topProducts.map((p: any, idx: number) => {
                    const maxQty = stats.topProducts[0]?.qty || 1;
                    const percent = (p.qty / maxQty) * 100;
                    return (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-zinc-800">{idx + 1}. {p.name}</span>
                          <span className="font-semibold text-zinc-600">{p.qty} porsi</span>
                        </div>
                        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* R&D and Recent Activity */}
          <Card className="p-5 flex flex-col bg-white border-zinc-200 shadow-sm rounded-2xl h-[360px]">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3 mb-4 shrink-0">
              <h2 className="text-base font-display font-bold text-zinc-900 flex items-center gap-2">
                <Beaker className="w-5 h-5 text-purple-600" />
                Eksperimen R&D Aktif
              </h2>
              <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {activeExperiments.length} Resep
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {recipesLoading ? (
                <div className="text-zinc-400 text-sm text-center py-12">Loading R&D projects...</div>
              ) : activeExperiments.length === 0 ? (
                <div className="text-zinc-400 text-sm text-center py-12 flex flex-col items-center justify-center gap-2">
                  <Beaker className="w-10 h-10 text-purple-400 bg-purple-50 p-2 rounded-full border border-purple-100 animate-pulse" />
                  <span className="font-medium text-zinc-600">Tidak ada eksperimen aktif</span>
                  <span className="text-xs text-zinc-400">Semua resep eksperimen telah di-promote ke menu.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeExperiments.map((r: any) => (
                    <div key={r.id} className="flex justify-between items-center border border-zinc-100 rounded-xl p-3 hover:bg-zinc-50 transition">
                      <div>
                        <p className="font-semibold text-zinc-800 text-sm">{r.name}</p>
                        <p className="text-[10px] text-zinc-400">Terakhir Update: {new Date(r.lastUpdated || r.createdAt).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold
                          ${r.status === 'Tested' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.status}
                        </span>
                        <p className="text-[10px] text-blue-600 mt-1 font-semibold hover:underline">
                          <Link href={`/admin/rnd/${r.id}`}>Uji & Edit</Link>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

        </div>

      </div>
    </AppLayout>
  );
}
