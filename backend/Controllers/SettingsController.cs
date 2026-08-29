using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
        /// Does NOT delete orders, purchases, stock, or master data.
        /// </summary>
        [HttpPost("reset-journals")]
        public async Task<IActionResult> ResetJournals()
        {
            try
            {
                // Disable FK constraints temporarily, delete journal data, re-enable
                await _context.Database.ExecuteSqlRawAsync(
                    @"DO $$
                    BEGIN
                        ALTER TABLE ""JournalEntryLines"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""JournalEntries"" DISABLE TRIGGER ALL;
                        DELETE FROM ""JournalEntryLines"";
                        DELETE FROM ""JournalEntries"";
                        UPDATE ""ChartOfAccounts"" SET ""Balance"" = 0;
                        ALTER TABLE ""JournalEntryLines"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""JournalEntries"" ENABLE TRIGGER ALL;
                    END $$;");

                return Ok(new { message = "Journal entries cleared successfully." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = "Reset journals failed: " + ex.Message });
            }
        }

        /// <summary>
        /// Reset Transactions — clears orders, order items, purchases, purchase items, expenses, incomes, closing periods, and resets ChartOfAccounts balance.
        /// Does NOT delete master data (products, materials, categories, coupons, recipes, users, settings).
        /// </summary>
        [HttpPost("reset-transactions")]
        public async Task<IActionResult> ResetTransactions()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(
                    @"DO $$
                    BEGIN
                        ALTER TABLE ""OrderItems"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Orders"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""PurchaseItems"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Purchases"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Expenses"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Incomes"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""ClosingPeriods"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""MaterialBatches"" DISABLE TRIGGER ALL;

                        DELETE FROM ""OrderItems"";
                        DELETE FROM ""Orders"";
                        DELETE FROM ""PurchaseItems"";
                        DELETE FROM ""Purchases"";
                        DELETE FROM ""Expenses"";
                        DELETE FROM ""Incomes"";
                        DELETE FROM ""ClosingPeriods"";
                        UPDATE ""ChartOfAccounts"" SET ""Balance"" = 0;

                        ALTER TABLE ""OrderItems"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Orders"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""PurchaseItems"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Purchases"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Expenses"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Incomes"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""ClosingPeriods"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""MaterialBatches"" ENABLE TRIGGER ALL;
                    END $$;");

                return Ok(new { message = "Transactions cleared successfully." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = "Reset transactions failed: " + ex.Message });
            }
        }

        /// <summary>
        /// Reset Stock and Products — clears materials, batches, products, categories, coupons, and R&D data.
        /// Does NOT delete orders, transactions, journal entries, users, or settings.
        /// </summary>
        [HttpPost("reset-stock")]
        public async Task<IActionResult> ResetStock()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(
                    @"DO $$
                    BEGIN
                        ALTER TABLE ""MaterialBatches"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""RecipeItems"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""RnDRecipeIngredients"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""RnDTestHistories"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""PurchaseItems"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""OrderItems"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Assets"" DISABLE TRIGGER ALL;

                        DELETE FROM ""MaterialBatches"";
                        DELETE FROM ""RecipeItems"";
                        DELETE FROM ""RnDRecipeIngredients"";
                        DELETE FROM ""RnDTestHistories"";
                        DELETE FROM ""RnDRecipes"";
                        DELETE FROM ""Products"";
                        DELETE FROM ""Categories"";
                        DELETE FROM ""Coupons"";
                        DELETE FROM ""Assets"";

                        ALTER TABLE ""MaterialBatches"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""RecipeItems"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""RnDRecipeIngredients"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""RnDTestHistories"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""PurchaseItems"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""OrderItems"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Assets"" ENABLE TRIGGER ALL;
                    END $$;");

                return Ok(new { message = "Stock and products cleared successfully." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = "Reset stock failed: " + ex.Message });
            }
        }

        /// <summary>
        /// Full database reset — clears ALL transaction data, stock data, and master data except users, roles, and settings.
        /// </summary>
        [HttpPost("reset")]
        public async Task<IActionResult> ResetDatabase()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(
                    @"DO $$
                    BEGIN
                        -- Disable all triggers on affected tables
                        ALTER TABLE ""OrderItems"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Orders"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""PurchaseItems"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Purchases"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Expenses"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Incomes"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""ClosingPeriods"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""JournalEntryLines"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""JournalEntries"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""MaterialBatches"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""RecipeItems"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""RnDRecipeIngredients"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""RnDTestHistories"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""RnDRecipes"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Products"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Categories"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Coupons"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""Assets"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""CalibrationTrials"" DISABLE TRIGGER ALL;
                        ALTER TABLE ""CalibrationLogs"" DISABLE TRIGGER ALL;

                        -- Delete all data (child tables first)
                        DELETE FROM ""OrderItems"";
                        DELETE FROM ""Orders"";
                        DELETE FROM ""PurchaseItems"";
                        DELETE FROM ""Purchases"";
                        DELETE FROM ""Expenses"";
                        DELETE FROM ""Incomes"";
                        DELETE FROM ""ClosingPeriods"";
                        DELETE FROM ""JournalEntryLines"";
                        DELETE FROM ""JournalEntries"";
                        DELETE FROM ""MaterialBatches"";
                        DELETE FROM ""RecipeItems"";
                        DELETE FROM ""RnDRecipeIngredients"";
                        DELETE FROM ""RnDTestHistories"";
                        DELETE FROM ""RnDRecipes"";
                        DELETE FROM ""Products"";
                        DELETE FROM ""Categories"";
                        DELETE FROM ""Coupons"";
                        DELETE FROM ""Assets"";
                        DELETE FROM ""CalibrationTrials"";
                        DELETE FROM ""CalibrationLogs"";

                        -- Reset ChartOfAccounts balance to 0
                        UPDATE ""ChartOfAccounts"" SET ""Balance"" = 0;

                        -- Re-enable all triggers
                        ALTER TABLE ""OrderItems"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Orders"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""PurchaseItems"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Purchases"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Expenses"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Incomes"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""ClosingPeriods"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""JournalEntryLines"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""JournalEntries"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""MaterialBatches"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""RecipeItems"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""RnDRecipeIngredients"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""RnDTestHistories"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""RnDRecipes"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Products"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Categories"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Coupons"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""Assets"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""CalibrationTrials"" ENABLE TRIGGER ALL;
                        ALTER TABLE ""CalibrationLogs"" ENABLE TRIGGER ALL;
                    END $$;");

                return Ok(new { message = "Database reset successfully." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = "Reset database failed: " + ex.Message });
            }
        }
    }
}
