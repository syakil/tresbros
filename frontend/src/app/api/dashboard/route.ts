import { NextResponse } from 'next/server';
import { backendClient } from '@/lib/backendClient';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'today'; // today, yesterday, 7days, thismonth

    const TZ_OFFSET = 7 * 60 * 60 * 1000; // Jakarta is UTC+7
    const now = new Date();
    const localNow = new Date(now.getTime() + TZ_OFFSET);

    let localStart = new Date();
    let localEnd = new Date();

    if (filter === 'today') {
      localStart = startOfDay(localNow);
      localEnd = endOfDay(localNow);
    } else if (filter === 'yesterday') {
      localStart = startOfDay(subDays(localNow, 1));
      localEnd = endOfDay(subDays(localNow, 1));
    } else if (filter === '7days') {
      localStart = startOfDay(subDays(localNow, 7));
      localEnd = endOfDay(localNow);
    } else if (filter === 'thismonth') {
      localStart = startOfMonth(localNow);
      localEnd = endOfMonth(localNow);
    }

    const startDate = new Date(localStart.getTime() - TZ_OFFSET);
    const endDate = new Date(localEnd.getTime() - TZ_OFFSET);

    // Ambil Data dari Backend .NET
    const [allOrders, allExpenses, allIncomes] = await Promise.all([
      backendClient.get('/api/Order'),
      backendClient.get('/api/Finance/expenses'),
      backendClient.get('/api/Finance/incomes')
    ]);

    // Filter di Node.js
    const orders = allOrders.filter((o: any) => {
      const d = new Date(o.createdAt);
      return d >= startDate && d <= endDate && o.paymentStatus === 'success';
    });

    const expenses = allExpenses.filter((e: any) => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });

    const incomes = allIncomes.filter((i: any) => {
      const d = new Date(i.date);
      return d >= startDate && d <= endDate;
    });

    // Kalkulasi Pendapatan & Metode Pembayaran
    let totalRevenue = 0;
    let paymentBreakdown = { CASH: 0, QRIS: 0, DEBIT: 0 };
    
    // Kalkulasi Produk Terlaris
    const productSales: Record<number, { name: string, qty: number }> = {};

    orders.forEach((order: any) => {
      totalRevenue += order.totalAmount;
      
      if (order.paymentMethod === 'CASH') paymentBreakdown.CASH += order.totalAmount;
      else if (order.paymentMethod === 'QRIS') paymentBreakdown.QRIS += order.totalAmount;
      else if (order.paymentMethod === 'DEBIT') paymentBreakdown.DEBIT += order.totalAmount;

      if (order.items) {
        order.items.forEach((item: any) => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.product?.name || `Product ${item.productId}`, qty: 0 };
          }
          productSales[item.productId].qty += item.quantity;
        });
      }
    });

    const totalOrders = orders.length;
    const itemsSold = Object.values(productSales).reduce((sum, p) => sum + p.qty, 0);
    const topProducts = Object.values(productSales)
                              .sort((a, b) => b.qty - a.qty)
                              .slice(0, 5);

    // Kalkulasi Pengeluaran
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    
    // Kalkulasi Pemasukan Manual
    const totalManualIncome = incomes.reduce((sum: number, inc: any) => sum + inc.amount, 0);
    totalRevenue += totalManualIncome;
    
    // Laba Bersih
    const netProfit = totalRevenue - totalExpenses;

    // Persiapkan Data Grafik Harian (hanya jika > 1 hari)
    let chartData = [];
    if (filter === '7days' || filter === 'thismonth') {
      // Group by day
      const dailyData: Record<string, { date: string, revenue: number, expense: number }> = {};
      
      // Init array of dates to ensure empty days are 0
      let currDate = new Date(localStart);
      while (currDate <= localEnd) {
        const dateStr = currDate.toISOString().split('T')[0];
        dailyData[dateStr] = { date: dateStr, revenue: 0, expense: 0 };
        currDate.setDate(currDate.getDate() + 1);
      }

      orders.forEach((order: any) => {
        const dateStr = new Date(new Date(order.createdAt).getTime() + TZ_OFFSET).toISOString().split('T')[0];
        if (dailyData[dateStr]) dailyData[dateStr].revenue += order.totalAmount;
      });

      incomes.forEach((inc: any) => {
        const dateStr = new Date(new Date(inc.date).getTime() + TZ_OFFSET).toISOString().split('T')[0];
        if (dailyData[dateStr]) dailyData[dateStr].revenue += inc.amount;
      });

      expenses.forEach((exp: any) => {
        const dateStr = new Date(new Date(exp.date).getTime() + TZ_OFFSET).toISOString().split('T')[0];
        if (dailyData[dateStr]) dailyData[dateStr].expense += exp.amount;
      });

      chartData = Object.values(dailyData).map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      }));
    } else {
      // Group by hour for today/yesterday
      const hourlyData: Record<number, { time: string, revenue: number, expense: number }> = {};
      
      for(let i=0; i<24; i++) {
        hourlyData[i] = { time: `${i.toString().padStart(2, '0')}:00`, revenue: 0, expense: 0 };
      }

      orders.forEach((order: any) => {
        const hour = new Date(new Date(order.createdAt).getTime() + TZ_OFFSET).getUTCHours();
        hourlyData[hour].revenue += order.totalAmount;
      });
      
      incomes.forEach((inc: any) => {
        const hour = new Date(new Date(inc.date).getTime() + TZ_OFFSET).getUTCHours();
        hourlyData[hour].revenue += inc.amount;
      });

      expenses.forEach((exp: any) => {
        const hour = new Date(new Date(exp.date).getTime() + TZ_OFFSET).getUTCHours();
        hourlyData[hour].expense += exp.amount;
      });

      chartData = Object.values(hourlyData);
    }

    return NextResponse.json({
      revenue: totalRevenue,
      expenses: totalExpenses,
      netProfit,
      orders: totalOrders,
      itemsSold,
      paymentBreakdown,
      topProducts,
      recentOrders: orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      chartData,
      allOrders: orders.map((o: any) => ({ id: `O-${o.id}`, date: o.createdAt, description: `Penjualan POS - ${o.paymentMethod}`, amount: o.totalAmount, type: 'IN' })),
      allIncomes: incomes.map((i: any) => ({ id: `I-${i.id}`, date: i.date, description: `Pemasukan Manual: ${i.description}`, amount: i.amount, type: 'IN' })),
      allExpenses: expenses.map((e: any) => ({ id: `E-${e.id}`, date: e.date, description: `Pengeluaran: ${e.description}`, amount: e.amount, type: 'OUT' }))
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    if (error?.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

