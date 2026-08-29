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

        [HttpPost("reset-journals")]
        public async Task<IActionResult> ResetJournals()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""JournalEntryLines"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""JournalEntries"";");
                await _context.Database.ExecuteSqlRawAsync(@"UPDATE ""ChartOfAccounts"" SET ""Balance"" = 0;");
                return Ok(new { message = "Journal entries cleared successfully." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = "Reset journals failed: " + ex.Message });
            }
        }

        [HttpPost("reset-transactions")]
        public async Task<IActionResult> ResetTransactions()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""OrderItems"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Orders"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""PurchaseItems"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Purchases"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Expenses"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Incomes"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""ClosingPeriods"";");
                await _context.Database.ExecuteSqlRawAsync(@"UPDATE ""ChartOfAccounts"" SET ""Balance"" = 0;");
                return Ok(new { message = "Transactions cleared successfully." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = "Reset transactions failed: " + ex.Message });
            }
        }

        [HttpPost("reset-stock")]
        public async Task<IActionResult> ResetStock()
        {
            try
            {
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""MaterialBatches"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Materials"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""RecipeItems"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Products"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Categories"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Coupons"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""RnDRecipeIngredients"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""RnDTestHistories"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""RnDRecipes"";");
                return Ok(new { message = "Stock and products cleared successfully." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = "Reset stock failed: " + ex.Message });
            }
        }

        [HttpPost("reset")]
        public async Task<IActionResult> ResetDatabase()
        {
            try
            {
                // Delete in correct order (child tables first to respect FK constraints)
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""OrderItems"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Orders"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""ClosingPeriods"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""PurchaseItems"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Purchases"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Expenses"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Incomes"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""JournalEntryLines"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""JournalEntries"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""RecipeItems"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Products"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Materials"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""MaterialBatches"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Categories"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""Coupons"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""RnDRecipeIngredients"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""RnDTestHistories"";");
                await _context.Database.ExecuteSqlRawAsync(@"DELETE FROM ""RnDRecipes"";");

                // Reset ChartOfAccounts balances to 0
                await _context.Database.ExecuteSqlRawAsync(@"UPDATE ""ChartOfAccounts"" SET ""Balance"" = 0;");

                return Ok(new { message = "Database reset successfully." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = "Reset database failed: " + ex.Message });
            }
        }
    }
}
