"use client";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card } from '@/components/ui/Card';
import { BarChart3, Receipt, Package, TrendingUp, TrendingDown, DollarSign, Download, Calendar, X } from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const [filter, setFilter] = useState('today');
  const [hiddenLines, setHiddenLines] = useState({
    revenue: false,
    expense: false,
    profit: false
  });
  const [modalData, setModalData] = useState<{title: string, transactions: any[]} | null>(null);

  const openModal = (type: 'revenue' | 'expense' | 'profit') => {
    if (!data) return;
    let transactions: any[] = [];
    let title = "";
    if (type === 'revenue') {
      title = "Detail Pemasukan";
      transactions = [...(data.allOrders || []), ...(data.allIncomes || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (type === 'expense') {
      title = "Detail Pengeluaran";
      transactions = [...(data.allExpenses || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      title = "Detail Laba/Rugi (Buku Besar)";
      transactions = [
        ...(data.allOrders || []), 
        ...(data.allIncomes || []), 
        ...(data.allExpenses || [])
      ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    setModalData({ title, transactions });
  };

  const handleLegendClick = (entry: any) => {
    setHiddenLines(prev => ({
      ...prev,
      [entry.dataKey]: !prev[entry.dataKey as keyof typeof prev]
    }));
  };

  const { data, isLoading } = useQuery({
    queryKey: ['dashboardStats', filter],
    queryFn: async () => {
      const res = await axios.get(`/api/dashboard?filter=${filter}`);
      return res.data;
    },
    refetchInterval: 10000
  });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  };

  const handleExportCSV = () => {
    if (!data?.recentOrders) return;
    
    const headers = ['ID Pesanan', 'Tanggal', 'Customer', 'Total Tagihan', 'Metode Pembayaran'];
    const rows = data.recentOrders.map((o: any) => [
      o.id,
      new Date(o.createdAt).toLocaleString('id-ID'),
      o.customerName || 'Pelanggan',
      o.totalAmount,
      o.paymentMethod || 'CASH'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any[]) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `laporan_penjualan_${filter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartDataWithProfit = data?.chartData?.map((d: any) => ({
    ...d,
    profit: d.revenue - d.expense
  })) || [];

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-brand-cream">Laporan Penjualan & Laba Rugi</h1>
          <p className="text-brand-sage">Ringkasan performa finansial Tresbros Coffee</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Custom Tabs instead of Dropdown */}
          <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
            {[
              { id: 'today', label: 'Hari Ini' },
              { id: 'yesterday', label: 'Kemarin' },
              { id: '7days', label: '7 Hari' },
              { id: 'thismonth', label: 'Bulan Ini' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-1.5 text-sm rounded-md transition-all font-medium whitespace-nowrap ${filter === tab.id ? 'bg-brand-olive text-brand-cream shadow-sm' : 'text-brand-sage hover:text-brand-cream hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-brand-olive text-brand-cream px-4 py-2 rounded-lg hover:bg-brand-sage transition font-medium"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-brand-sage animate-pulse mt-10">Memuat laporan analitik...</div>
      ) : (
        <>
          {/* Top Metrics: P&L */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="olive" onClick={() => openModal('revenue')} className="cursor-pointer hover:bg-white/5 transition-colors flex flex-col justify-between p-6 shadow-xl border-l-4 border-l-green-500">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <span className="bg-black/20 text-xs px-2 py-1 rounded text-brand-sage">Pemasukan</span>
              </div>
              <div>
                <p className="text-brand-sage text-sm font-medium">Total Pendapatan Kotor</p>
                <h3 className="text-3xl font-display font-bold text-white">{formatRupiah(data?.revenue)}</h3>
              </div>
            </Card>

            <Card variant="olive" onClick={() => openModal('expense')} className="cursor-pointer hover:bg-white/5 transition-colors flex flex-col justify-between p-6 shadow-xl border-l-4 border-l-red-500">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
                <span className="bg-black/20 text-xs px-2 py-1 rounded text-brand-sage">Pengeluaran</span>
              </div>
              <div>
                <p className="text-brand-sage text-sm font-medium">Total Pengeluaran Ops.</p>
                <h3 className="text-3xl font-display font-bold text-white">{formatRupiah(data?.expenses)}</h3>
              </div>
            </Card>

            <Card variant="olive" onClick={() => openModal('profit')} className={`cursor-pointer hover:bg-white/5 transition-colors flex flex-col justify-between p-6 shadow-xl border-l-4 ${data?.netProfit >= 0 ? 'border-l-blue-400' : 'border-l-orange-500'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <span className="bg-black/20 text-xs px-2 py-1 rounded text-brand-sage">Laba/Rugi</span>
              </div>
              <div>
                <p className="text-brand-sage text-sm font-medium">Laba Bersih (Net Profit)</p>
                <h3 className={`text-3xl font-display font-bold ${data?.netProfit >= 0 ? 'text-blue-400' : 'text-orange-500'}`}>
                  {formatRupiah(data?.netProfit)}
                </h3>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
            
            {/* Charts Area: Single Combined Chart */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <Card variant="olive" className="p-6 flex flex-col h-[400px]">
                <div className="mb-4">
                  <h2 className="text-xl font-display font-bold text-brand-cream">Pemasukan, Pengeluaran, dan Laba</h2>
                  <p className="text-brand-sage text-sm mt-1">Pemantauan kesehatan bisnis secara menyeluruh.</p>
                </div>
                <div className="flex-1 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataWithProfit} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey={filter === '7days' || filter === 'thismonth' ? 'date' : 'time'} stroke="#A16B3D" fontSize={11} tickMargin={10} minTickGap={20} axisLine={false} tickLine={false} />
                      <YAxis stroke="#A16B3D" fontSize={11} tickFormatter={(val) => `Rp${val/1000}k`} width={60} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1C1F1D', borderColor: '#ffffff10', borderRadius: '8px' }} itemStyle={{ color: '#F3EDE1' }} formatter={(v: any) => formatRupiah(v as number)} />
                      <Legend 
                        verticalAlign="bottom" 
                        content={(props) => {
                          const { payload } = props;
                          return (
                            <ul className="flex justify-center gap-6 pt-5">
                              {payload?.map((entry: any, index: number) => (
                                <li 
                                  key={`item-${index}`} 
                                  className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-80 select-none"
                                  onClick={() => handleLegendClick(entry)}
                                  style={{ opacity: hiddenLines[entry.dataKey as keyof typeof hiddenLines] ? 0.4 : 1 }}
                                >
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                  <span className="text-[#F3EDE1] text-[13px]">{entry.value}</span>
                                </li>
                              ))}
                            </ul>
                          );
                        }} 
                      />
                      
                      <Line hide={hiddenLines.revenue} type="monotone" name="Pemasukan" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#1C1F1D', strokeWidth: 2 }} />
                      <Line hide={hiddenLines.expense} type="monotone" name="Pengeluaran" dataKey="expense" stroke="#22c55e" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#22c55e', stroke: '#1C1F1D', strokeWidth: 2 }} />
                      <Line hide={hiddenLines.profit} type="monotone" name="Laba" dataKey="profit" stroke="#ea580c" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#ea580c', stroke: '#1C1F1D', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

            </div>

            {/* Breakdown & Best Sellers */}
            <div className="flex flex-col gap-6">
              
              <Card variant="olive" className="p-6">
                <h2 className="text-lg font-display font-semibold mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-brand-warm" />
                  Sumber Pembayaran
                </h2>
                <div className="space-y-5 mt-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-brand-cream">Tunai (Cash)</span>
                      <span className="font-bold">{formatRupiah(data?.paymentBreakdown?.CASH)}</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2">
                      <div className="bg-brand-warm h-2 rounded-full" style={{ width: `${(data?.paymentBreakdown?.CASH / (data?.revenue||1)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-brand-cream">QRIS / E-Wallet</span>
                      <span className="font-bold">{formatRupiah(data?.paymentBreakdown?.QRIS)}</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{ width: `${(data?.paymentBreakdown?.QRIS / (data?.revenue||1)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-brand-cream">Kartu Debit/Kredit</span>
                      <span className="font-bold">{formatRupiah(data?.paymentBreakdown?.DEBIT)}</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2">
                      <div className="bg-purple-400 h-2 rounded-full" style={{ width: `${(data?.paymentBreakdown?.DEBIT / (data?.revenue||1)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Donut Chart for Best Sellers */}
              <Card variant="olive" className="p-6 flex flex-col">
                <h2 className="text-lg font-display font-semibold mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand-warm" />
                  Produk Terlaris
                </h2>
                {data?.topProducts?.length === 0 ? (
                  <p className="text-brand-sage text-sm text-center py-10 flex-1 flex items-center justify-center">Belum ada data penjualan.</p>
                ) : (
                  <div className="w-full mt-2 h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Pie
                          data={data?.topProducts}
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="qty"
                          nameKey="name"
                          stroke="none"
                        >
                          {data?.topProducts?.map((entry: any, index: number) => {
                            const colors = ['#D4A373', '#A16B3D', '#6A4A2F', '#4A3424', '#2D2016'];
                            return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                          })}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#3A2B1F', borderColor: '#ffffff20', borderRadius: '8px' }}
                          itemStyle={{ color: '#F3EDE1' }}
                          formatter={(value: any, name: any) => [`${value} Porsi`, name]}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#F3EDE1' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

            </div>
          </div>

          <h2 className="text-xl font-display font-semibold mt-6 mb-2">Riwayat Pesanan Terakhir</h2>
          <Card variant="olive" className="p-0 overflow-hidden shadow-xl border-white/10">
            <table className="w-full text-left text-sm text-brand-sage">
              <thead className="bg-black/40 text-brand-cream border-b border-white/10">
                <tr>
                  <th className="px-6 py-5 font-semibold">ID Pesanan</th>
                  <th className="px-6 py-5 font-semibold">Waktu Selesai</th>
                  <th className="px-6 py-5 font-semibold">Customer</th>
                  <th className="px-6 py-5 font-semibold text-center">Metode</th>
                  <th className="px-6 py-5 font-semibold text-right">Total Tagihan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.recentOrders?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">#{order.id}</td>
                    <td className="px-6 py-4">{new Date(order.createdAt).toLocaleTimeString('id-ID')}</td>
                    <td className="px-6 py-4">{order.customerName || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-black/30 px-2 py-1 rounded text-xs">
                        {order.paymentMethod === 'CASH' ? 'Tunai' : order.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-brand-warm text-right text-base">{formatRupiah(order.totalAmount)}</td>
                  </tr>
                ))}
                {(!data?.recentOrders || data.recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-brand-sage/50">Belum ada transaksi di rentang waktu ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* Transaction Detail Modal */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setModalData(null)}>
          <Card variant="olive" onClick={e => e.stopPropagation()} className="max-w-3xl w-full flex flex-col shadow-2xl border-white/10 max-h-[80vh] p-0">
            <div className="flex justify-between items-center p-5 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">{modalData.title}</h2>
              <button onClick={() => setModalData(null)} className="text-brand-sage hover:text-white p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-left text-sm text-brand-sage">
                <thead className="bg-black/40 text-brand-cream sticky top-0 border-b border-white/10 shadow-sm">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Tanggal & Waktu</th>
                    <th className="px-5 py-3 font-semibold">ID / Referensi</th>
                    <th className="px-5 py-3 font-semibold">Keterangan</th>
                    <th className="px-5 py-3 font-semibold text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {modalData.transactions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}<br/>
                        <span className="text-xs">{new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">{t.id}</td>
                      <td className="px-5 py-3">{t.description}</td>
                      <td className={`px-5 py-3 font-bold text-right ${t.type === 'IN' ? 'text-blue-400' : 'text-red-400'}`}>
                        {t.type === 'IN' ? '+' : '-'}{formatRupiah(t.amount)}
                      </td>
                    </tr>
                  ))}
                  {modalData.transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-brand-sage/50">Tidak ada data transaksi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
