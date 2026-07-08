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

        [HttpPost("reset")]
        public async Task<IActionResult> ResetDatabase()
        {
            try
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

                var tablesToTruncate = new List<string>
                {
                    "OrderItems", "Orders",
                    "PurchaseItems", "Purchases",
                    "RecipeItems", "Products",
                    "Categories",
                    "Expenses", "Incomes",
                    "Materials", "MaterialBatches",
                    "Coupons", "MidtransLogs",
                    "JournalEntryLines", "JournalEntries",
                    "RnDRecipeIngredients", "RnDTestHistories", "RnDRecipes"
                };

                foreach (var table in tablesToTruncate)
                {
                    await _context.Database.ExecuteSqlRawAsync($"TRUNCATE TABLE \"{table}\" RESTART IDENTITY CASCADE;");
                }

                // Reset ChartOfAccounts balances to 0
                await _context.Database.ExecuteSqlRawAsync("UPDATE \"ChartOfAccounts\" SET \"Balance\" = 0;");

                await transaction.CommitAsync();

                return Ok(new { message = "Database reset successfully." });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { error = "Reset database failed: " + ex.Message });
            }
        }
    }
}
