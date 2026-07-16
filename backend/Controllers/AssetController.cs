using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssetController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssetController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Asset
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Asset>>> GetAssets()
        {
            return await _context.Assets
                .Include(a => a.AssetAccount)
                .Include(a => a.PaymentAccount)
                .Include(a => a.AccumulatedDepreciationAccount)
                .Include(a => a.DepreciationExpenseAccount)
                .Include(a => a.DisposalAccount)
                .OrderByDescending(a => a.PurchaseDate)
                .ToListAsync();
        }

        // GET: api/Asset/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Asset>> GetAsset(int id)
        {
            var asset = await _context.Assets
                .Include(a => a.AssetAccount)
                .Include(a => a.PaymentAccount)
                .Include(a => a.AccumulatedDepreciationAccount)
                .Include(a => a.DepreciationExpenseAccount)
                .Include(a => a.DisposalAccount)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (asset == null)
            {
                return NotFound();
            }

            return asset;
        }

        // POST: api/Asset
        [HttpPost]
        public async Task<ActionResult<Asset>> PostAsset(Asset asset)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Set default/inferred values
                asset.AccumulatedDepreciation = 0;
                asset.BookValue = asset.PurchasePrice;
                asset.Status = "ACTIVE";
                asset.CreatedAt = DateTime.UtcNow;

                _context.Assets.Add(asset);
                await _context.SaveChangesAsync(); // Save to generate asset.Id

                // Create Journal Entry: Debit Fixed Asset, Credit Cash/Bank (PaymentAccount)
                var journal = new JournalEntry
                {
                    Date = asset.PurchaseDate,
                    Reference = $"AST-PUR-{asset.Id}",
                    Description = $"Pembelian Aset: {asset.Name} (Ref: {asset.Code})",
                    Lines = new List<JournalEntryLine>()
                };

                // Add lines
                journal.Lines.Add(new JournalEntryLine { AccountId = asset.AssetAccountId, Debit = asset.PurchasePrice, Credit = 0 });
                journal.Lines.Add(new JournalEntryLine { AccountId = asset.PaymentAccountId, Debit = 0, Credit = asset.PurchasePrice });

                _context.JournalEntries.Add(journal);

                // Adjust Chart of Account balances
                await UpdateAccountBalanceAsync(asset.AssetAccountId, asset.PurchasePrice, 0);
                await UpdateAccountBalanceAsync(asset.PaymentAccountId, 0, asset.PurchasePrice);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetAsset), new { id = asset.Id }, asset);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // POST: api/Asset/5/depreciate
        [HttpPost("{id}/depreciate")]
        public async Task<IActionResult> DepreciateAsset(int id, [FromBody] DepreciateRequest request)
        {
            if (request == null || request.Amount <= 0)
            {
                return BadRequest("Invalid depreciation details.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var asset = await _context.Assets.FindAsync(id);
                if (asset == null)
                {
                    return NotFound("Asset not found.");
                }

                if (asset.Status != "ACTIVE")
                {
                    return BadRequest("Cannot depreciate a non-active or disposed asset.");
                }

                double maxDepreciation = asset.PurchasePrice - asset.SalvageValue;
                if (asset.AccumulatedDepreciation + request.Amount > maxDepreciation)
                {
                    return BadRequest($"Depreciation exceeds maximum allowable amount. Remaining depreciable value is {maxDepreciation - asset.AccumulatedDepreciation}.");
                }

                // Update Asset Fields
                asset.AccumulatedDepreciation += request.Amount;
                asset.BookValue = asset.PurchasePrice - asset.AccumulatedDepreciation;
                _context.Entry(asset).State = EntityState.Modified;

                // Create Journal Entry: Debit Depreciation Expense, Credit Accumulated Depreciation
                var journal = new JournalEntry
                {
                    Date = request.Date,
                    Reference = $"AST-DEP-{asset.Id}-{DateTime.UtcNow:yyyyMMddHHmmss}",
                    Description = $"{request.Description} - Aset: {asset.Name}",
                    Lines = new List<JournalEntryLine>()
                };

                journal.Lines.Add(new JournalEntryLine { AccountId = asset.DepreciationExpenseAccountId, Debit = request.Amount, Credit = 0 });
                journal.Lines.Add(new JournalEntryLine { AccountId = asset.AccumulatedDepreciationAccountId, Debit = 0, Credit = request.Amount });

                _context.JournalEntries.Add(journal);

                // Adjust balances
                await UpdateAccountBalanceAsync(asset.DepreciationExpenseAccountId, request.Amount, 0);
                await UpdateAccountBalanceAsync(asset.AccumulatedDepreciationAccountId, 0, request.Amount);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(asset);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // DELETE: api/Asset/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DisposeAsset(
            int id, 
            [FromQuery] double disposalPrice = 0, 
            [FromQuery] int? disposalAccountId = null, 
            [FromQuery] DateTime? date = null, 
            [FromQuery] string? description = null)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var asset = await _context.Assets.FindAsync(id);
                if (asset == null)
                {
                    return NotFound("Asset not found.");
                }

                if (asset.Status != "ACTIVE")
                {
                    return BadRequest("Asset is already disposed or inactive.");
                }

                DateTime disposalDate = date ?? DateTime.UtcNow;
                string desc = description ?? $"Pelepasan Aset: {asset.Name}";

                // Update Asset Status
                asset.Status = "DISPOSED";
                asset.DisposalDate = disposalDate;
                asset.DisposalPrice = disposalPrice;
                asset.DisposalAccountId = disposalAccountId;
                _context.Entry(asset).State = EntityState.Modified;

                // Calculate Book Value and Gain/Loss
                double bookValue = asset.PurchasePrice - asset.AccumulatedDepreciation;
                double gainOrLoss = disposalPrice - bookValue;

                // Create Journal Entry
                var journal = new JournalEntry
                {
                    Date = disposalDate,
                    Reference = $"AST-DIS-{asset.Id}",
                    Description = desc,
                    Lines = new List<JournalEntryLine>()
                };

                // 1. Debit Accumulated Depreciation to clear it out
                if (asset.AccumulatedDepreciation > 0)
                {
                    journal.Lines.Add(new JournalEntryLine { AccountId = asset.AccumulatedDepreciationAccountId, Debit = asset.AccumulatedDepreciation, Credit = 0 });
                    await UpdateAccountBalanceAsync(asset.AccumulatedDepreciationAccountId, asset.AccumulatedDepreciation, 0);
                }

                // 2. Debit Cash/Bank for the disposal sale price (if sold)
                if (disposalPrice > 0 && disposalAccountId.HasValue)
                {
                    journal.Lines.Add(new JournalEntryLine { AccountId = disposalAccountId.Value, Debit = disposalPrice, Credit = 0 });
                    await UpdateAccountBalanceAsync(disposalAccountId.Value, disposalPrice, 0);
                }

                // 3. Credit Fixed Asset to remove original cost from the books
                journal.Lines.Add(new JournalEntryLine { AccountId = asset.AssetAccountId, Debit = 0, Credit = asset.PurchasePrice });
                await UpdateAccountBalanceAsync(asset.AssetAccountId, 0, asset.PurchasePrice);

                // 4. Handle Gain or Loss (Using COA ID = 18 / Code 6150)
                int gainLossAccountId = 18; // Default seeded Keuntungan/Kerugian Pelepasan Aset
                if (gainOrLoss > 0)
                {
                    // Gain is Credit (other income)
                    journal.Lines.Add(new JournalEntryLine { AccountId = gainLossAccountId, Debit = 0, Credit = gainOrLoss });
                    await UpdateAccountBalanceAsync(gainLossAccountId, 0, gainOrLoss);
                }
                else if (gainOrLoss < 0)
                {
                    // Loss is Debit (expense)
                    double lossAmount = Math.Abs(gainOrLoss);
                    journal.Lines.Add(new JournalEntryLine { AccountId = gainLossAccountId, Debit = lossAmount, Credit = 0 });
                    await UpdateAccountBalanceAsync(gainLossAccountId, lossAmount, 0);
                }

                _context.JournalEntries.Add(journal);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // GET: api/Asset/report
        [HttpGet("report")]
        public async Task<ActionResult<object>> GetAssetReport()
        {
            var assets = await _context.Assets
                .Include(a => a.AssetAccount)
                .ToListAsync();

            double totalPurchaseCost = assets.Sum(a => a.PurchasePrice);
            double totalAccumDepreciation = assets.Sum(a => a.AccumulatedDepreciation);
            double totalBookValue = assets.Sum(a => a.BookValue);
            int activeCount = assets.Count(a => a.Status == "ACTIVE");
            int disposedCount = assets.Count(a => a.Status == "DISPOSED");

            var groupedByClass = assets.GroupBy(a => new { a.AssetAccountId, Name = a.AssetAccount?.Name ?? "Unknown" })
                .Select(g => new
                {
                    ClassId = g.Key.AssetAccountId,
                    ClassName = g.Key.Name,
                    TotalCost = g.Sum(a => a.PurchasePrice),
                    TotalAccumDepreciation = g.Sum(a => a.AccumulatedDepreciation),
                    TotalBookValue = g.Sum(a => a.BookValue),
                    Count = g.Count()
                }).ToList();

            return new
            {
                TotalPurchaseCost = totalPurchaseCost,
                TotalAccumulatedDepreciation = totalAccumDepreciation,
                TotalBookValue = totalBookValue,
                ActiveCount = activeCount,
                DisposedCount = disposedCount,
                Classes = groupedByClass,
                Assets = assets
            };
        }

        private async Task UpdateAccountBalanceAsync(int accountId, double debit, double credit)
        {
            var coa = await _context.ChartOfAccounts.FindAsync(accountId);
            if (coa != null)
            {
                if (coa.Type == "ASSET" || coa.Type == "EXPENSE")
                {
                    coa.Balance += (debit - credit);
                }
                else
                {
                    coa.Balance += (credit - debit);
                }
                _context.Entry(coa).State = EntityState.Modified;
            }
        }
    }

    public class DepreciateRequest
    {
        public double Amount { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
    }
}
