using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

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
                try { await _context.Database.ExecuteSqlRawAsync(@"ROLLBACK;"); } catch { }
                return StatusCode(500, new {
                    error = "Gagal reset jurnal.",
                    type = ex.GetType().Name,
                    message = ex.Message ?? "null",
                    inner = ex.InnerException?.Message ?? "null"
                });
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
                try { await _context.Database.ExecuteSqlRawAsync(@"ROLLBACK;"); } catch { }
                return StatusCode(500, new {
                    error = "Gagal reset transaksi.",
                    type = ex.GetType().Name,
                    message = ex.Message ?? "null",
                    inner = ex.InnerException?.Message ?? "null"
                });
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
                try { await _context.Database.ExecuteSqlRawAsync(@"ROLLBACK;"); } catch { }
                return StatusCode(500, new {
                    error = "Gagal reset stok.",
                    type = ex.GetType().Name,
                    message = ex.Message ?? "null",
                    inner = ex.InnerException?.Message ?? "null"
                });
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
                try { await _context.Database.ExecuteSqlRawAsync(@"ROLLBACK;"); } catch { }
                return StatusCode(500, new {
                    error = "Gagal reset database.",
                    type = ex.GetType().Name,
                    message = ex.Message ?? "null",
                    inner = ex.InnerException?.Message ?? "null"
                });
            }
        }
    }
}
