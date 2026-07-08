using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PurchaseController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PurchaseController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Purchase
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Purchase>>> GetPurchases()
        {
            return await _context.Purchases
                .Include(p => p.Items)
                .ThenInclude(i => i.Material)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        // GET: api/Purchase/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Purchase>> GetPurchase(int id)
        {
            var purchase = await _context.Purchases
                .Include(p => p.Items)
                .ThenInclude(i => i.Material)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (purchase == null)
            {
                return NotFound();
            }

            return purchase;
        }

        // POST: api/Purchase
        [HttpPost]
        public async Task<ActionResult<Purchase>> PostPurchase(Purchase purchase)
        {
            purchase.CreatedAt = DateTime.UtcNow;

            if (string.IsNullOrEmpty(purchase.PurchaseNo))
            {
                purchase.PurchaseNo = $"PO-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0, 4)}".ToUpper();
            }

            double totalAmount = 0;

            _context.Purchases.Add(purchase);
            
            // Increment material stock & Create Batch
            if (purchase.Items != null)
            {
                foreach (var item in purchase.Items)
                {
                    totalAmount += item.Price;

                    var material = await _context.Materials.FindAsync(item.MaterialId);
                    if (material != null)
                    {
                        material.Stock += item.Quantity;
                        _context.Entry(material).State = EntityState.Modified;
                        
                        // Create FIFO Batch
                        var batch = new MaterialBatch 
                        {
                            MaterialId = item.MaterialId,
                            PurchaseItem = item,
                            OriginalQty = item.Quantity,
                            RemainingQty = item.Quantity,
                            UnitPrice = item.Quantity > 0 ? item.Price / item.Quantity : 0,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.MaterialBatches.Add(batch);

                        // Update CostPerUnit (Weighted Average of Remaining Batches)
                        var existingBatches = await _context.MaterialBatches
                            .Where(b => b.MaterialId == material.Id && b.RemainingQty > 0)
                            .ToListAsync();
                        
                        double totalValue = existingBatches.Sum(b => b.RemainingQty * b.UnitPrice) + item.Price;
                        double totalStock = existingBatches.Sum(b => b.RemainingQty) + item.Quantity;
                        
                        material.CostPerUnit = totalStock > 0 ? totalValue / totalStock : 0;
                    }
                }
            }

            if (purchase.TotalAmount == 0)
            {
                purchase.TotalAmount = totalAmount;
            }

            // Create Journal Entry
            var invAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "1140");
            var cashAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "1110");
            
            if (invAccount != null && cashAccount != null)
            {
                var journal = new JournalEntry
                {
                    Date = DateTime.UtcNow,
                    Reference = purchase.PurchaseNo,
                    Description = $"Pembelian bahan baku {purchase.PurchaseNo}",
                    Lines = new List<JournalEntryLine>()
                };

                // Debit Inventory, Credit Cash
                journal.Lines.Add(new JournalEntryLine { Account = invAccount, Debit = purchase.TotalAmount, Credit = 0 });
                journal.Lines.Add(new JournalEntryLine { Account = cashAccount, Debit = 0, Credit = purchase.TotalAmount });

                _context.JournalEntries.Add(journal);
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPurchase), new { id = purchase.Id }, purchase);
        }

        // PUT: api/Purchase/5/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdatePurchaseStatus(int id, [FromBody] string status)
        {
            var purchase = await _context.Purchases.FindAsync(id);
            if (purchase == null)
            {
                return NotFound();
            }

            purchase.Status = status;
            _context.Entry(purchase).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PurchaseExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Purchase/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePurchase(int id)
        {
            var purchase = await _context.Purchases
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (purchase == null)
            {
                return NotFound();
            }

            // Remove associated batches and revert stock if it wasn't cancelled yet
            if (purchase.Items != null)
            {
                foreach (var item in purchase.Items)
                {
                    var material = await _context.Materials.FindAsync(item.MaterialId);
                    if (material != null)
                    {
                        // If the purchase was COMPLETED, we need to revert the stock
                        if (purchase.Status == "COMPLETED")
                        {
                            material.Stock -= item.Quantity;
                            _context.Entry(material).State = EntityState.Modified;
                        }

                        // Remove the batch
                        var batch = await _context.MaterialBatches.FirstOrDefaultAsync(b => b.PurchaseItemId == item.Id);
                        if (batch != null)
                        {
                            _context.MaterialBatches.Remove(batch);
                            
                            // Update CostPerUnit
                            var remainingBatches = await _context.MaterialBatches
                                .Where(b => b.MaterialId == material.Id && b.RemainingQty > 0 && b.Id != batch.Id)
                                .ToListAsync();
                            
                            double totalValue = remainingBatches.Sum(b => b.RemainingQty * b.UnitPrice);
                            double totalStock = remainingBatches.Sum(b => b.RemainingQty);
                            
                            material.CostPerUnit = totalStock > 0 ? totalValue / totalStock : 0;
                        }
                    }
                }
            }

            // Remove the Journal Entry
            var journal = await _context.JournalEntries
                .FirstOrDefaultAsync(j => j.Reference == purchase.PurchaseNo);
            if (journal != null)
            {
                _context.JournalEntries.Remove(journal);
            }

            _context.Purchases.Remove(purchase);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/Purchase/5/cancel
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelPurchase(int id)
        {
            var purchase = await _context.Purchases
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (purchase == null)
            {
                return NotFound();
            }

            if (purchase.Status == "CANCELLED")
            {
                return BadRequest("Purchase order ini sudah dibatalkan");
            }

            purchase.Status = "CANCELLED";
            _context.Entry(purchase).State = EntityState.Modified;

            // Revert stock, remove batches, and update CostPerUnit
            if (purchase.Items != null)
            {
                foreach (var item in purchase.Items)
                {
                    var material = await _context.Materials.FindAsync(item.MaterialId);
                    if (material != null)
                    {
                        material.Stock -= item.Quantity;
                        _context.Entry(material).State = EntityState.Modified;

                        // Find and remove the corresponding batch
                        var batch = await _context.MaterialBatches.FirstOrDefaultAsync(b => b.PurchaseItemId == item.Id);
                        if (batch != null)
                        {
                            _context.MaterialBatches.Remove(batch);
                            
                            // Query remaining active batches (excluding the one we are removing)
                            var remainingBatches = await _context.MaterialBatches
                                .Where(b => b.MaterialId == material.Id && b.RemainingQty > 0 && b.Id != batch.Id)
                                .ToListAsync();
                            
                            double totalValue = remainingBatches.Sum(b => b.RemainingQty * b.UnitPrice);
                            double totalStock = remainingBatches.Sum(b => b.RemainingQty);
                            
                            material.CostPerUnit = totalStock > 0 ? totalValue / totalStock : 0;
                        }
                    }
                }
            }

            // Also delete the Journal Entry associated with this purchase (if any) and adjust COA balances back
            var invAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "1140");
            var cashAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "1110");
            
            var journal = await _context.JournalEntries
                .FirstOrDefaultAsync(j => j.Reference == purchase.PurchaseNo);
            
            if (journal != null)
            {
                _context.JournalEntries.Remove(journal);
                
                if (invAccount != null) invAccount.Balance -= purchase.TotalAmount;
                if (cashAccount != null) cashAccount.Balance += purchase.TotalAmount;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PurchaseExists(int id)
        {
            return _context.Purchases.Any(e => e.Id == id);
        }
    }
}
