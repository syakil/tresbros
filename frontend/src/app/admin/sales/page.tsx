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
  Cell,
  BarChart,
  Bar
} from 'recharts';

export default function DashboardPage() {
  const [filter, setFilter] = useState('today');
  const [hiddenLines, setHiddenLines] = useState({
    revenue: false,
    expense: false,
    profit: false
  });
  const [modalData, setModalData] = useState<{title: string, transactions: any[]} | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const openModal = (type: 'revenue' | 'expense' | 'profit') => {
    if (!data) return;
    let transactions: any[] = [];
    let title = "";
    if (type === 'revenue') {
      title = "Income Details";
      transactions = [...(data.allOrders || []), ...(data.allIncomes || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (type === 'expense') {
      title = "Expense Details";
      transactions = [...(data.allExpenses || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      title = "Profit/Loss Details (General Ledger)";
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
    
    const headers = ['Order ID', 'Date', 'Customer', 'Total Amount', 'Payment Method'];
    const rows = data.recentOrders.map((o: any) => [
      o.id,
      new Date(o.createdAt).toLocaleString('id-ID'),
      o.customerName || 'Customer',
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
    link.setAttribute("download", `sales_report_${filter}.csv`);
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
          <h1 className="text-3xl font-display font-bold text-zinc-900">Sales & Profit/Loss Report</h1>
          <p className="text-zinc-500 mt-1">Summary of your business financial performance</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Custom Tabs */}
          <div className="flex bg-zinc-200/50 p-1 rounded-lg border border-zinc-200/80">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: '7 Days' },
              { id: 'thismonth', label: 'This Month' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setFilter(tab.id); setCurrentPage(1); }}
                className={`px-4 py-1.5 text-sm rounded-md transition-all font-medium whitespace-nowrap ${filter === tab.id ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-50 hover:text-blue-600 transition font-medium shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-zinc-500 animate-pulse mt-10 flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          Loading analytics report...
        </div>
      ) : (
        <>
          {/* Top Metrics: P&L */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card onClick={() => openModal('revenue')} className="cursor-pointer hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <span className="bg-zinc-100 border border-zinc-200 text-xs font-semibold px-2.5 py-1 rounded-full text-zinc-600">Incomes</span>
              </div>
              <div>
                <p className="text-zinc-500 text-sm font-medium mb-1">Total Gross Revenue</p>
                <h3 className="text-3xl font-display font-bold text-zinc-900 tracking-tight">{formatRupiah(data?.revenue)}</h3>
              </div>
            </Card>

            <Card onClick={() => openModal('expense')} className="cursor-pointer hover:border-red-300 hover:shadow-md transition-all flex flex-col justify-between p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <span className="bg-zinc-100 border border-zinc-200 text-xs font-semibold px-2.5 py-1 rounded-full text-zinc-600">Expenses</span>
              </div>
              <div>
                <p className="text-zinc-500 text-sm font-medium mb-1">Total Ops. Expenses</p>
                <h3 className="text-3xl font-display font-bold text-zinc-900 tracking-tight">{formatRupiah(data?.expenses)}</h3>
              </div>
            </Card>

            <Card onClick={() => openModal('profit')} className={`cursor-pointer hover:shadow-md transition-all flex flex-col justify-between p-6 ${data?.netProfit >= 0 ? 'hover:border-emerald-300' : 'hover:border-orange-300'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${data?.netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
                  <DollarSign className={`w-6 h-6 ${data?.netProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'}`} />
                </div>
                <span className="bg-zinc-100 border border-zinc-200 text-xs font-semibold px-2.5 py-1 rounded-full text-zinc-600">Profit/Loss</span>
              </div>
              <div>
                <p className="text-zinc-500 text-sm font-medium mb-1">Net Profit</p>
                <h3 className={`text-3xl font-display font-bold tracking-tight ${data?.netProfit >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                  {formatRupiah(data?.netProfit)}
                </h3>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
            
            {/* Charts Area: Single Combined Chart */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <Card className="p-6 flex flex-col h-[420px]">
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-display font-bold text-zinc-900">Incomes, Expenses, and Profit Chart</h2>
                    <p className="text-zinc-500 text-sm mt-1">Comprehensive business health monitoring.</p>
                  </div>
                </div>
                <div className="flex-1 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartDataWithProfit} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                      <XAxis dataKey={filter === '7days' || filter === 'thismonth' ? 'date' : 'time'} stroke="#71717a" fontSize={12} tickMargin={12} minTickGap={20} axisLine={false} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={12} tickFormatter={(val) => `Rp${val/1000}k`} width={60} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#18181b', fontWeight: 500 }} formatter={(v: any) => formatRupiah(v as number)} />
                      <Legend 
                        verticalAlign="bottom" 
                        content={(props) => {
                          const { payload } = props;
                          return (
                            <ul className="flex justify-center gap-8 pt-6">
                              {payload?.map((entry: any, index: number) => (
                                <li 
                                  key={`item-${index}`} 
                                  className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-70 select-none"
                                  onClick={() => handleLegendClick(entry)}
                                  style={{ opacity: hiddenLines[entry.dataKey as keyof typeof hiddenLines] ? 0.4 : 1 }}
                                >
                                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
                                  <span className="text-zinc-600 font-medium text-sm">{entry.value}</span>
                                </li>
                              ))}
                            </ul>
                          );
                        }} 
                      />
                      
                      <Line hide={hiddenLines.revenue} type="monotone" name="Incomes" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }} />
                      <Line hide={hiddenLines.expense} type="monotone" name="Expenses" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2 }} />
                      <Line hide={hiddenLines.profit} type="monotone" name="Profit" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Quantity Sold Chart */}
              <Card className="p-6 flex flex-col h-[320px]">
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-display font-bold text-zinc-900">Quantity Sold Trend</h2>
                    <p className="text-zinc-500 text-sm mt-1">Number of items sold over time.</p>
                  </div>
                </div>
                <div className="flex-1 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataWithProfit} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                      <XAxis dataKey={filter === '7days' || filter === 'thismonth' ? 'date' : 'time'} stroke="#71717a" fontSize={12} tickMargin={12} minTickGap={20} axisLine={false} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={12} tickFormatter={(val) => `${val}`} width={40} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        itemStyle={{ color: '#18181b', fontWeight: 500 }} 
                        formatter={(v: any) => [`${v} items`, 'Quantity']}
                      />
                      <Bar dataKey="qty" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Quantity Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Breakdown & Best Sellers */}
            <div className="flex flex-col gap-6">
              
              <Card className="p-6">
                <h2 className="text-base font-display font-bold text-zinc-900 mb-5 flex items-center gap-2">
                  <div className="bg-zinc-100 p-1.5 rounded-lg border border-zinc-200">
                    <Receipt className="w-4 h-4 text-zinc-600" />
                  </div>
                  Payment Sources
                </h2>
                <div className="space-y-5 mt-2">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-600 font-medium">Cash</span>
                      <span className="font-bold text-zinc-900">{formatRupiah(data?.paymentBreakdown?.CASH)}</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-zinc-800 h-full rounded-full" style={{ width: `${(data?.paymentBreakdown?.CASH / (data?.revenue||1)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-600 font-medium">QRIS / E-Wallet</span>
                      <span className="font-bold text-zinc-900">{formatRupiah(data?.paymentBreakdown?.QRIS)}</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(data?.paymentBreakdown?.QRIS / (data?.revenue||1)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-600 font-medium">Debit/Credit Card</span>
                      <span className="font-bold text-zinc-900">{formatRupiah(data?.paymentBreakdown?.DEBIT)}</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(data?.paymentBreakdown?.DEBIT / (data?.revenue||1)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Donut Chart for Best Sellers */}
              <Card className="p-6 flex flex-col flex-1">
                <h2 className="text-base font-display font-bold text-zinc-900 mb-2 flex items-center gap-2">
                  <div className="bg-zinc-100 p-1.5 rounded-lg border border-zinc-200">
                    <Package className="w-4 h-4 text-zinc-600" />
                  </div>
                  Best Selling Products
                </h2>
                {data?.topProducts?.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-10 flex-1 flex items-center justify-center bg-zinc-50 rounded-xl mt-4 border border-zinc-100 border-dashed">No sales data yet.</p>
                ) : (
                  <div className="w-full mt-4 flex-1 flex flex-col justify-center items-center gap-6 min-h-[220px]">
                    <div className="w-full flex-1 min-h-[200px] max-h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <Pie
                            data={data?.topProducts}
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="80%"
                            paddingAngle={2}
                            dataKey="qty"
                            nameKey="name"
                            stroke="none"
                          >
                            {data?.topProducts?.map((entry: any, index: number) => {
                              const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#18181b', fontWeight: 500 }}
                            formatter={(value: any, name: any) => [`${value} Qty`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Custom HTML Legend that wraps cleanly */}
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-2 text-[11px] font-medium text-zinc-600 px-2 pb-4">
                      {data?.topProducts?.map((entry: any, index: number) => {
                        const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];
                        const color = colors[index % colors.length];
                        return (
                          <div key={entry.name} className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: color }} />
                            <span className="text-zinc-600">{entry.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>

            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-display font-bold text-zinc-900 mb-4">Recent Order History</h2>
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Order ID</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Completion Time</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Customer</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Cashier</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-center">Method</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {data?.recentOrders?.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((order: any) => (
                      <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <td className="px-6 py-4 font-mono text-xs text-zinc-500">{order.orderNumber || order.id}</td>
                        <td className="px-6 py-4 text-zinc-700 font-medium">{new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-6 py-4 text-zinc-700">{order.customerName || '-'}</td>
                        <td className="px-6 py-4 text-zinc-700">{order.cashierName || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-zinc-100 border border-zinc-200 text-zinc-600 px-2.5 py-1 rounded-md text-xs font-medium">
                            {order.paymentMethod === 'CASH' ? 'Cash' : order.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-900 text-right">{formatRupiah(order.totalAmount)}</td>
                      </tr>
                    ))}
                    {(!data?.recentOrders || data.recentOrders.length === 0) && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-zinc-400 bg-zinc-50/50">No transactions in this time range.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {data?.recentOrders && data.recentOrders.length > 0 && (
                <div className="flex justify-between items-center p-4 border-t border-zinc-200">
                  <span className="text-sm text-zinc-500">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, data.recentOrders.length)} of {data.recentOrders.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button 
                      disabled={currentPage === 1} 
                      onClick={() => setCurrentPage(p => p - 1)} 
                      className="px-3 py-1 bg-white border border-zinc-200 hover:bg-zinc-50 rounded text-sm disabled:opacity-50 transition"
                    >
                      Prev
                    </button>
                    <button 
                      disabled={currentPage === Math.ceil((data.recentOrders.length || 0) / ITEMS_PER_PAGE) || data.recentOrders.length === 0} 
                      onClick={() => setCurrentPage(p => p + 1)} 
                      className="px-3 py-1 bg-white border border-zinc-200 hover:bg-zinc-50 rounded text-sm disabled:opacity-50 transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      {/* Transaction Detail Modal */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setModalData(null)}>
          <Card onClick={e => e.stopPropagation()} className="max-w-3xl w-full flex flex-col max-h-[85vh] p-0 overflow-hidden shadow-2xl border-zinc-200/60 ring-1 ring-black/5">
            <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 bg-white">
              <h2 className="text-lg font-bold text-zinc-900">{modalData.title}</h2>
              <button onClick={() => setModalData(null)} className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-0 bg-white custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-50 text-zinc-500 sticky top-0 border-b border-zinc-200 z-10">
                  <tr>
                    <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Date & Time</th>
                    <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">ID / Reference</th>
                    <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Description</th>
                    <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {modalData.transactions.map((t, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-zinc-900">{new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span><br/>
                        <span className="text-xs text-zinc-500">{new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500">{t.id}</td>
                      <td className="px-6 py-4 text-zinc-700">{t.description}</td>
                      <td className={`px-6 py-4 font-semibold text-right ${t.type === 'IN' ? 'text-blue-600' : 'text-red-600'}`}>
                        {t.type === 'IN' ? '+' : '-'}{formatRupiah(t.amount)}
                      </td>
                    </tr>
                  ))}
                  {modalData.transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-zinc-400">No transaction data.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setSelectedOrder(null)}>
          <Card onClick={e => e.stopPropagation()} className="max-w-xl w-full flex flex-col max-h-[85vh] p-0 overflow-hidden shadow-2xl border-zinc-200/60 ring-1 ring-black/5">
            <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-100 bg-white">
              <h2 className="text-lg font-bold text-zinc-900">Order Details - {selectedOrder.orderNumber || selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-white custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-zinc-500 font-medium mb-1">Customer</p>
                  <p className="font-semibold text-zinc-900">{selectedOrder.customerName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium mb-1">Cashier</p>
                  <p className="font-semibold text-zinc-900">{selectedOrder.cashierName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium mb-1">Date & Time</p>
                  <p className="font-semibold text-zinc-900">{new Date(selectedOrder.createdAt).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 font-medium mb-1">Payment Method</p>
                  <p className="font-semibold text-zinc-900">{selectedOrder.paymentMethod === 'CASH' ? 'Cash' : selectedOrder.paymentMethod}</p>
                </div>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-3 border-b pb-2">Items</h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-zinc-900">{item.product?.name || `Product ${item.productId}`}</p>
                      <p className="text-xs text-zinc-500">{item.quantity} x {formatRupiah(item.price)}</p>
                    </div>
                    <span className="font-semibold">{formatRupiah(item.quantity * item.price)}</span>
                  </div>
                ))}
                {!selectedOrder.items?.length && <p className="text-sm text-zinc-500">No items data.</p>}
              </div>
              <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-center">
                <span className="font-bold text-zinc-900">Total Amount</span>
                <span className="text-xl font-bold text-blue-600">{formatRupiah(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
