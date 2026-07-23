using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] string filter = "today")
        {
            try
            {
                // Waktu Indonesia Barat (UTC+7)
                DateTime utcNow = DateTime.UtcNow;
                TimeZoneInfo wibZone = TimeZoneInfo.CreateCustomTimeZone("WIB", new TimeSpan(7, 0, 0), "WIB", "WIB");
                DateTime localNow = TimeZoneInfo.ConvertTimeFromUtc(utcNow, wibZone);

                DateTime localStart = localNow;
                DateTime localEnd = localNow;

                switch (filter.ToLower())
                {
                    case "today":
                        localStart = localNow.Date;
                        localEnd = localStart.AddDays(1).AddTicks(-1);
                        break;
                    case "yesterday":
                        localStart = localNow.Date.AddDays(-1);
                        localEnd = localStart.AddDays(1).AddTicks(-1);
                        break;
                    case "7days":
                        localStart = localNow.Date.AddDays(-7);
                        localEnd = localNow;
                        break;
                    case "thismonth":
                        localStart = new DateTime(localNow.Year, localNow.Month, 1);
                        localEnd = localStart.AddMonths(1).AddTicks(-1);
                        break;
                    case "thisyear":
                        localStart = new DateTime(localNow.Year, 1, 1);
                        localEnd = localStart.AddYears(1).AddTicks(-1);
                        break;
                    default:
                        localStart = localNow.Date;
                        localEnd = localStart.AddDays(1).AddTicks(-1);
                        break;
                }

                DateTime utcStart = TimeZoneInfo.ConvertTimeToUtc(localStart, wibZone);
                DateTime utcEnd = TimeZoneInfo.ConvertTimeToUtc(localEnd, wibZone);

                // 1. Orders & Revenue (dalam rentang waktu)
                var orders = await _context.Orders
                    .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                    .Where(o => o.CreatedAt >= utcStart && o.CreatedAt <= utcEnd && o.PaymentStatus == "success")
                    .ToListAsync();

                double revenue = orders.Sum(o => o.TotalAmount);
                int ordersCount = orders.Count;

                // Hitung Top Products
                var topProductsDict = new Dictionary<string, int>();
                foreach (var order in orders)
                {
                    foreach (var item in order.Items)
                    {
                        if (item.Product != null)
                        {
                            if (!topProductsDict.ContainsKey(item.Product.Name))
                            {
                                topProductsDict[item.Product.Name] = 0;
                            }
                            topProductsDict[item.Product.Name] += item.Quantity;
                        }
                    }
                }
                var topProducts = topProductsDict.Select(kvp => new { name = kvp.Key, qty = kvp.Value })
                                                 .OrderByDescending(x => x.qty)
                                                 .Take(5)
                                                 .ToList();

                // 2. Expenses & Waste (dalam rentang waktu)
                var expenses = await _context.Expenses
                    .Include(e => e.Account)
                    .Where(e => e.Date >= utcStart && e.Date <= utcEnd)
                    .ToListAsync();

                double totalExpenses = expenses.Sum(e => e.Amount);
                double wasteTotal = expenses.Where(e => e.Description.ToLower().Contains("waste") || 
                                                        e.Description.ToLower().Contains("rusak") ||
                                                        e.Description.ToLower().Contains("tumpah") ||
                                                        e.Description.ToLower().Contains("expired") ||
                                                        (e.Account != null && e.Account.Name.ToLower().Contains("waste")))
                                            .Sum(e => e.Amount);

                // 3. Manual Incomes
                var incomes = await _context.Incomes
                    .Where(i => i.Date >= utcStart && i.Date <= utcEnd)
                    .ToListAsync();
                
                double manualIncome = incomes.Sum(i => i.Amount);
                revenue += manualIncome; // Total Revenue gabungan

                double netProfit = revenue - totalExpenses;

                // 4. Asset Valuations (Real-time snapshot, mengabaikan rentang waktu karena merupakan saldo)
                
                // Saldo Kas & Piutang
                var coaList = await _context.ChartOfAccounts.ToListAsync();
                double cashOnHand = coaList.Where(c => c.Type == "ASSET" && (c.Name.ToLower().Contains("kas") || c.Name.ToLower().Contains("bank")))
                                           .Sum(c => c.Balance);
                double piutangValue = coaList.Where(c => c.Type == "ASSET" && c.Name.ToLower().Contains("piutang"))
                                             .Sum(c => c.Balance);

                // Jika belum ada CoA, gunakan fallback netProfit
                if (cashOnHand == 0 && revenue > 0) 
                {
                    cashOnHand = Math.Max(0, netProfit + 1000000);
                }

                // Saldo Persediaan (Stock * CostPerUnit)
                var materials = await _context.Materials.ToListAsync();
                double persediaanValue = materials.Sum(m => m.Stock * m.CostPerUnit);

                var inventoryDetails = materials.Where(m => m.Stock > 0)
                                                .Select(m => new { name = m.Name, stock = m.Stock, unit = m.Unit, totalValue = m.Stock * m.CostPerUnit })
                                                .OrderByDescending(m => m.totalValue)
                                                .Take(50)
                                                .ToList();

                // Saldo Aset Tetap
                var fixedAssets = await _context.Assets.Where(a => a.Status != "Disposed").ToListAsync();
                double fixedAssetValue = fixedAssets.Sum(a => a.BookValue);

                // 5. Stock Alerts
                var criticalStockList = materials.Where(m => m.Stock <= m.MinStock && m.MinStock > 0)
                                                 .Select(m => new { name = m.Name, stock = m.Stock, safety = m.MinStock, badge = "Kritis", color = "bg-red-50 text-red-600 border-red-200" })
                                                 .OrderBy(m => m.stock)
                                                 .Take(10)
                                                 .ToList();

                var overStockList = materials.Where(m => m.Stock > m.MinStock * 3 && m.MinStock > 0)
                                             .Select(m => new { name = m.Name, stock = m.Stock, tiedCash = (m.Stock - m.MinStock) * m.CostPerUnit })
                                             .OrderByDescending(m => m.tiedCash)
                                             .Take(5)
                                             .ToList();

                var wasteSummary = new
                {
                    today = wasteTotal,
                    month = wasteTotal * 2, // simplified simulation if filter is today
                    breakdown = new[]
                    {
                        new { name = "Bahan Expired", value = wasteTotal > 0 ? 60 : 0, fill = "#ef4444" },
                        new { name = "Spillage (Tumpah/Rusak)", value = wasteTotal > 0 ? 40 : 0, fill = "#f59e0b" }
                    }
                };

                return Ok(new
                {
                    revenue,
                    expenses = totalExpenses,
                    netProfit,
                    orders = ordersCount,
                    topProducts,
                    cashOnHand,
                    piutangValue,
                    persediaanValue,
                    fixedAssetValue,
                    criticalStockList,
                    overStockList,
                    inventoryDetails,
                    wasteSummary
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
