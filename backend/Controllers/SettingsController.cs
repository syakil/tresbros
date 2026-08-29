using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SettingsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Setting>>> GetSettings()
        {
            return await _context.Settings.ToListAsync();
        }

        [HttpGet("{key}")]
        public async Task<ActionResult<Setting>> GetSetting(string key)
        {
            var setting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == key);

            if (setting == null)
            {
                return NotFound();
            }

            return setting;
        }

        [HttpPost]
        public async Task<ActionResult<Setting>> UpsertSetting(Setting setting)
        {
            var existingSetting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == setting.Key);

            if (existingSetting != null)
            {
                existingSetting.Value = setting.Value;
                existingSetting.DataType = setting.DataType;
            }
            else
            {
                _context.Settings.Add(setting);
            }

            await _context.SaveChangesAsync();

            return Ok(setting);
        }

        /// <summary>
        /// Reset Journal Entries only — clears journal lines, journals, and resets ChartOfAccounts balance to 0.
        /// </summary>
        [HttpPost("reset-journals")]
        public async Task<IActionResult> ResetJournals()
        {
            try
            {
                // Run in explicit transaction so all deletes are atomic
                await _context.Database.ExecuteSqlRawAsync(
                    @"BEGIN;
                    DELETE FROM ""JournalEntryLines"";
                    DELETE FROM ""JournalEntries"";
                    UPDATE ""ChartOfAccounts"" SET ""Balance"" = 0;
                    COMMIT;");

                return Ok(new { message = "Jurnal berhasil di-reset. Semua journal entries dan saldo COA telah direset ke 0." });
            }
            catch (System.Exception ex)
            {
                Debug.WriteLine($"[RESET-JOURNALS-ERROR] Type: {ex.GetType().Name}");
                Debug.WriteLine($"[RESET-JOURNALS-ERROR] Message: {ex.Message}");
                Debug.WriteLine($"[RESET-JOURNALS-ERROR] Inner: {ex.InnerException?.Message}");
                Debug.WriteLine($"[RESET-JOURNALS-ERROR] Stack: {ex.StackTrace}");
                try { await _context.Database.ExecuteSqlRawAsync(@"ROLLBACK;"); } catch { }
                var detailedError = $"Gagal reset jurnal. Tipe error: {ex.GetType().Name}. Message: {ex.Message}. Inner: {ex.InnerException?.Message}. Stack: {ex.StackTrace}";
                return StatusCode(500, new { error = detailedError });
            }
        }

        /// <summary>
        /// Reset Transactions — clears orders, order items, purchases, purchase items, expenses, incomes, closing periods, and resets ChartOfAccounts balance.
        /// </summary>
        [HttpPost("reset-transactions")]
        public async Task<IActionResult> ResetTransactions()
        {
            try
            {
                // Delete in dependency order: children first
                await _context.Database.ExecuteSqlRawAsync(
                    @"BEGIN;
                    DELETE FROM ""OrderItems"";
                    DELETE FROM ""Orders"";
                    DELETE FROM ""PurchaseItems"";
                    DELETE FROM ""Purchases"";
                    DELETE FROM ""Expenses"";
                    DELETE FROM ""Incomes"";
                    DELETE FROM ""ClosingPeriods"";
                    UPDATE ""ChartOfAccounts"" SET ""Balance"" = 0;
                    COMMIT;");

                return Ok(new { message = "Transaksi berhasil di-reset. Semua orders, purchases, expenses, dan incomes telah dihapus." });
            }
            catch (System.Exception ex)
            {
                Debug.WriteLine($"[RESET-TRANSACTIONS-ERROR] Type: {ex.GetType().Name}");
                Debug.WriteLine($"[RESET-TRANSACTIONS-ERROR] Message: {ex.Message}");
                Debug.WriteLine($"[RESET-TRANSACTIONS-ERROR] Inner: {ex.InnerException?.Message}");
                Debug.WriteLine($"[RESET-TRANSACTIONS-ERROR] Stack: {ex.StackTrace}");
                try { await _context.Database.ExecuteSqlRawAsync(@"ROLLBACK;"); } catch { }
                var detailedError = $"Gagal reset transaksi. Tipe error: {ex.GetType().Name}. Message: {ex.Message}. Inner: {ex.InnerException?.Message}. Stack: {ex.StackTrace}";
                return StatusCode(500, new { error = detailedError });
            }
        }

        /// <summary>
        /// Reset Stock and Products — clears materials, batches, products, categories, coupons, and R&D data.
        /// </summary>
        [HttpPost("reset-stock")]
        public async Task<IActionResult> ResetStock()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(
                    @"BEGIN;
                    DELETE FROM ""MaterialBatches"";
                    DELETE FROM ""RecipeItems"";
                    DELETE FROM ""RnDRecipeIngredients"";
                    DELETE FROM ""RnDTestHistories"";
                    DELETE FROM ""RnDRecipes"";
                    DELETE FROM ""Products"";
                    DELETE FROM ""Categories"";
                    DELETE FROM ""Coupons"";
                    DELETE FROM ""Assets"";
                    COMMIT;");

                return Ok(new { message = "Stok berhasil di-reset. Semua materials, products, dan recipes telah dihapus." });
            }
            catch (System.Exception ex)
            {
                Debug.WriteLine($"[RESET-STOCK-ERROR] Type: {ex.GetType().Name}");
                Debug.WriteLine($"[RESET-STOCK-ERROR] Message: {ex.Message}");
                Debug.WriteLine($"[RESET-STOCK-ERROR] Inner: {ex.InnerException?.Message}");
                Debug.WriteLine($"[RESET-STOCK-ERROR] Stack: {ex.StackTrace}");
                try { await _context.Database.ExecuteSqlRawAsync(@"ROLLBACK;"); } catch { }
                var detailedError = $"Gagal reset stok. Tipe error: {ex.GetType().Name}. Message: {ex.Message}. Inner: {ex.InnerException?.Message}. Stack: {ex.StackTrace}";
                return StatusCode(500, new { error = detailedError });
            }
        }

        /// <summary>
        /// Full database reset — clears ALL data except users, roles, and settings.
        /// </summary>
        [HttpPost("reset")]
        public async Task<IActionResult> ResetDatabase()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(
                    @"BEGIN;
                    -- Children first
                    DELETE FROM ""OrderItems"";
                    DELETE FROM ""CalibrationTrials"";
                    DELETE FROM ""CalibrationLogs"";
                    DELETE FROM ""PurchaseItems"";
                    DELETE FROM ""JournalEntryLines"";
                    DELETE FROM ""RnDRecipeIngredients"";
                    DELETE FROM ""RnDTestHistories"";
                    DELETE FROM ""MaterialBatches"";
                    DELETE FROM ""RecipeItems"";
                    -- Mid-level
                    DELETE FROM ""Orders"";
                    DELETE FROM ""Purchases"";
                    DELETE FROM ""Expenses"";
                    DELETE FROM ""Incomes"";
                    DELETE FROM ""ClosingPeriods"";
                    DELETE FROM ""JournalEntries"";
                    DELETE FROM ""RnDRecipes"";
                    DELETE FROM ""Products"";
                    DELETE FROM ""Assets"";
                    -- Reference tables
                    DELETE FROM ""Materials"";
                    DELETE FROM ""Categories"";
                    DELETE FROM ""Coupons"";
                    -- Reset balances
                    UPDATE ""ChartOfAccounts"" SET ""Balance"" = 0;
                    COMMIT;");

                return Ok(new { message = "Database berhasil di-reset semua data. Users, roles, dan settings tetap aman." });
            }
            catch (System.Exception ex)
            {
                Debug.WriteLine($"[RESET-FULL-ERROR] Type: {ex.GetType().Name}");
                Debug.WriteLine($"[RESET-FULL-ERROR] Message: {ex.Message}");
                Debug.WriteLine($"[RESET-FULL-ERROR] Inner: {ex.InnerException?.Message}");
                Debug.WriteLine($"[RESET-FULL-ERROR] Stack: {ex.StackTrace}");
                try { await _context.Database.ExecuteSqlRawAsync(@"ROLLBACK;"); } catch { }
                var detailedError = $"Gagal reset database. Tipe error: {ex.GetType().Name}. Message: {ex.Message}. Inner: {ex.InnerException?.Message}. Stack: {ex.StackTrace}";
                return StatusCode(500, new { error = detailedError });
            }
        }
    }
}
