using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClosingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClosingController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClosingPeriod>>> GetClosings()
        {
            return await _context.ClosingPeriods.OrderByDescending(c => c.ClosedAt).ToListAsync();
        }

        [HttpPost("eod")]
        public async Task<IActionResult> EndOfDay([FromBody] ClosingRequest request)
        {
            var date = request.Date.Date;
            if (await _context.ClosingPeriods.AnyAsync(c => c.PeriodType == "DAY" && c.PeriodDate.Date == date))
            {
                return BadRequest("End of Day has already been performed for this date.");
            }

            var revenues = await _context.JournalEntryLines
                .Include(l => l.Account)
                .Include(l => l.JournalEntry)
                .Where(l => l.Account.Type == "REVENUE" && l.JournalEntry.Date.Date == date)
                .ToListAsync();

            var expenses = await _context.JournalEntryLines
                .Include(l => l.Account)
                .Include(l => l.JournalEntry)
                .Where(l => l.Account.Type == "EXPENSE" && l.JournalEntry.Date.Date == date)
                .ToListAsync();

            var totalRevenue = revenues.Sum(l => l.Credit) - revenues.Sum(l => l.Debit);
            var totalExpense = expenses.Sum(l => l.Debit) - expenses.Sum(l => l.Credit);

            var closing = new ClosingPeriod
            {
                PeriodType = "DAY",
                PeriodDate = date,
                ClosedAt = DateTime.UtcNow,
                ClosedBy = "System",
                TotalRevenue = totalRevenue,
                TotalExpense = totalExpense,
                Notes = $"EOD Closing for {date:yyyy-MM-dd}"
            };

            _context.ClosingPeriods.Add(closing);
            await _context.SaveChangesAsync();

            return Ok(closing);
        }

        [HttpPost("eom")]
        public async Task<IActionResult> EndOfMonth([FromBody] ClosingRequest request)
        {
            var date = request.Date;
            var year = date.Year;
            var month = date.Month;

            if (await _context.ClosingPeriods.AnyAsync(c => c.PeriodType == "MONTH" && c.PeriodDate.Year == year && c.PeriodDate.Month == month))
            {
                return BadRequest("End of Month has already been performed for this month.");
            }

            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            // Depreciate assets
            var activeAssets = await _context.Assets
                .Where(a => a.Status == "ACTIVE" && a.PurchaseDate.Date <= endDate.Date)
                .ToListAsync();

            foreach (var asset in activeAssets)
            {
                var monthlyDepreciation = (asset.PurchasePrice - asset.SalvageValue) / (asset.UsefulLifeInYears * 12);
                if (asset.BookValue > asset.SalvageValue)
                {
                    var depreciationAmount = Math.Min(monthlyDepreciation, asset.BookValue - asset.SalvageValue);
                    
                    asset.AccumulatedDepreciation += depreciationAmount;
                    asset.BookValue -= depreciationAmount;

                    // Create journal entry for depreciation
                    var journal = new JournalEntry
                    {
                        Date = endDate,
                        Reference = $"DEP-{asset.Id}-{year}{month:D2}",
                        Description = $"Penyusutan Aset: {asset.Name} ({year}-{month:D2})",
                        Lines = new List<JournalEntryLine>
                        {
                            new JournalEntryLine { AccountId = asset.DepreciationExpenseAccountId, Debit = depreciationAmount, Credit = 0 },
                            new JournalEntryLine { AccountId = asset.AccumulatedDepreciationAccountId, Debit = 0, Credit = depreciationAmount }
                        }
                    };
                    _context.JournalEntries.Add(journal);
                }
            }

            var revenues = await _context.JournalEntryLines
                .Include(l => l.Account)
                .Include(l => l.JournalEntry)
                .Where(l => l.Account.Type == "REVENUE" && l.JournalEntry.Date.Date >= startDate && l.JournalEntry.Date.Date <= endDate)
                .ToListAsync();

            var expenses = await _context.JournalEntryLines
                .Include(l => l.Account)
                .Include(l => l.JournalEntry)
                .Where(l => l.Account.Type == "EXPENSE" && l.JournalEntry.Date.Date >= startDate && l.JournalEntry.Date.Date <= endDate)
                .ToListAsync();

            var totalRevenue = revenues.Sum(l => l.Credit) - revenues.Sum(l => l.Debit);
            var totalExpense = expenses.Sum(l => l.Debit) - expenses.Sum(l => l.Credit);

            var closing = new ClosingPeriod
            {
                PeriodType = "MONTH",
                PeriodDate = endDate,
                ClosedAt = DateTime.UtcNow,
                ClosedBy = "System",
                TotalRevenue = totalRevenue,
                TotalExpense = totalExpense,
                Notes = $"EOM Closing for {year}-{month:D2} (Includes Depreciation)"
            };

            _context.ClosingPeriods.Add(closing);
            await _context.SaveChangesAsync();

            return Ok(closing);
        }

        [HttpPost("eoy")]
        public async Task<IActionResult> EndOfYear([FromBody] ClosingRequest request)
        {
            var year = request.Date.Year;

            if (await _context.ClosingPeriods.AnyAsync(c => c.PeriodType == "YEAR" && c.PeriodDate.Year == year))
            {
                return BadRequest("End of Year has already been performed for this year.");
            }

            var startDate = new DateTime(year, 1, 1);
            var endDate = new DateTime(year, 12, 31);

            var revenues = await _context.JournalEntryLines
                .Include(l => l.Account)
                .Include(l => l.JournalEntry)
                .Where(l => l.Account.Type == "REVENUE" && l.JournalEntry.Date.Date >= startDate && l.JournalEntry.Date.Date <= endDate)
                .ToListAsync();

            var expenses = await _context.JournalEntryLines
                .Include(l => l.Account)
                .Include(l => l.JournalEntry)
                .Where(l => l.Account.Type == "EXPENSE" && l.JournalEntry.Date.Date >= startDate && l.JournalEntry.Date.Date <= endDate)
                .ToListAsync();

            var totalRevenue = revenues.Sum(l => l.Credit) - revenues.Sum(l => l.Debit);
            var totalExpense = expenses.Sum(l => l.Debit) - expenses.Sum(l => l.Credit);

            // TODO: Closing entries (Revenue -> Retained Earnings, Expense -> Retained Earnings)
            // But we need Retained Earnings Account ID. Usually handled via Settings.
            // For now, we just lock the year.

            var closing = new ClosingPeriod
            {
                PeriodType = "YEAR",
                PeriodDate = endDate,
                ClosedAt = DateTime.UtcNow,
                ClosedBy = "System",
                TotalRevenue = totalRevenue,
                TotalExpense = totalExpense,
                Notes = $"EOY Closing for {year}"
            };

            _context.ClosingPeriods.Add(closing);
            await _context.SaveChangesAsync();

            return Ok(closing);
        }
    }

    public class ClosingRequest
    {
        public DateTime Date { get; set; }
    }
}
