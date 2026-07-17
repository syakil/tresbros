using System;
using System.Linq;
using System.Threading.Tasks;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class ClosingService
    {
        private readonly AppDbContext _db;

        public ClosingService(AppDbContext db)
        {
            _db = db;
        }

        // Checks if a specific date (EOD) has been closed
        public async Task<bool> IsDateClosedAsync(DateTime date)
        {
            var targetDate = date.Date;
            return await _db.ClosingPeriods.AnyAsync(c => c.PeriodType == "DAY" && c.PeriodDate.Date == targetDate);
        }

        // Checks if a specific month (EOM) has been closed
        public async Task<bool> IsMonthClosedAsync(int year, int month)
        {
            return await _db.ClosingPeriods.AnyAsync(c => c.PeriodType == "MONTH" && c.PeriodDate.Year == year && c.PeriodDate.Month == month);
        }

        // Checks if a specific year (EOY) has been closed
        public async Task<bool> IsYearClosedAsync(int year)
        {
            return await _db.ClosingPeriods.AnyAsync(c => c.PeriodType == "YEAR" && c.PeriodDate.Year == year);
        }

        // Master check: returns true if the date is blocked by ANY closing (DAY, MONTH, or YEAR)
        public async Task<bool> IsPeriodClosedAsync(DateTime date)
        {
            if (await IsDateClosedAsync(date)) return true;
            if (await IsMonthClosedAsync(date.Year, date.Month)) return true;
            if (await IsYearClosedAsync(date.Year)) return true;
            return false;
        }
    }
}
