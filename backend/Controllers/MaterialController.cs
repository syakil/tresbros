using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    public class MaterialAdjustRequest
    {
        public string AdjustType { get; set; } = "in";
        public double Quantity { get; set; }
        public double TotalPrice { get; set; }
        public string Notes { get; set; } = "";
    }

    public class MaterialBatchUpdateDto
    {
        public double OriginalQty { get; set; }
        public double RemainingQty { get; set; }
        public double UnitPrice { get; set; }
    }

    [Route("api/[controller]")]
    [ApiController]
    public class MaterialController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MaterialController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Material
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Material>>> GetMaterials()
        {
            return await _context.Materials.ToListAsync();
        }

        // GET: api/Material/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Material>> GetMaterial(int id)
        {
            var material = await _context.Materials.FindAsync(id);

            if (material == null)
            {
                return NotFound();
            }

            return material;
        }

        // PUT: api/Material/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMaterial(int id, Material material)
        {
            if (id != material.Id)
            {
                return BadRequest();
            }

            var oldMaterial = await _context.Materials.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
            if (oldMaterial == null)
            {
                return NotFound();
            }

            material.LastUpdated = DateTime.UtcNow;

            double oldTotalValue = oldMaterial.Stock * oldMaterial.CostPerUnit;
            double newTotalValue = material.Stock * material.CostPerUnit;
            double diffValue = newTotalValue - oldTotalValue;

            bool stockChanged = Math.Abs(material.Stock - oldMaterial.Stock) > 0.0001;
            bool costChanged = Math.Abs(material.CostPerUnit - oldMaterial.CostPerUnit) > 0.0001;

            if (stockChanged || costChanged)
            {
                if (Math.Abs(diffValue) > 0.01)
                {
                    var invAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "1140");
                    var adjAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "5130");

                    if (invAccount != null && adjAccount != null)
                    {
                        string dateStr = DateTime.UtcNow.ToString("yyMMdd");
                        string refCode = $"ST-REV-{id}-{DateTime.UtcNow.Ticks % 1000000}";
                        string desc = $"Revisi Stok/Harga Beli: {material.Name} (Dari {oldMaterial.Stock} @ Rp{oldMaterial.CostPerUnit} ke {material.Stock} @ Rp{material.CostPerUnit})";

                        var journal = new JournalEntry
                        {
                            Date = DateTime.UtcNow,
                            Reference = refCode,
                            Description = desc,
                            Lines = new List<JournalEntryLine>()
                        };

                        if (diffValue > 0)
                        {
                            journal.Lines.Add(new JournalEntryLine { Account = invAccount, Debit = diffValue, Credit = 0 });
                            journal.Lines.Add(new JournalEntryLine { Account = adjAccount, Debit = 0, Credit = diffValue });
                        }
                        else
                        {
                            journal.Lines.Add(new JournalEntryLine { Account = adjAccount, Debit = Math.Abs(diffValue), Credit = 0 });
                            journal.Lines.Add(new JournalEntryLine { Account = invAccount, Debit = 0, Credit = Math.Abs(diffValue) });
                        }

                        _context.JournalEntries.Add(journal);
                    }
                }

                var activeBatches = await _context.MaterialBatches
                    .Where(b => b.MaterialId == id && b.RemainingQty > 0)
                    .ToListAsync();
                foreach (var batch in activeBatches)
                {
                    batch.RemainingQty = 0;
                    _context.Entry(batch).State = EntityState.Modified;
                }

                if (material.Stock > 0)
                {
                    var newBatch = new MaterialBatch
                    {
                        MaterialId = id,
                        OriginalQty = material.Stock,
                        RemainingQty = material.Stock,
                        UnitPrice = material.CostPerUnit,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.MaterialBatches.Add(newBatch);
                }
            }

            _context.Entry(material).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MaterialExists(id))
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

        // POST: api/Material
        [HttpPost]
        public async Task<ActionResult<Material>> PostMaterial(Material material)
        {
            material.LastUpdated = DateTime.UtcNow;
            _context.Materials.Add(material);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMaterial), new { id = material.Id }, material);
        }

        // POST: api/Material/{id}/adjust
        [HttpPost("{id}/adjust")]
        public async Task<IActionResult> AdjustMaterialStock(int id, [FromBody] MaterialAdjustRequest request)
        {
            var material = await _context.Materials.FindAsync(id);
            if (material == null) return NotFound("Material not found");

            if (request.Quantity <= 0) return BadRequest("Quantity must be greater than 0");

            double increment = request.AdjustType == "in" ? request.Quantity : -request.Quantity;
            
            if (request.AdjustType == "out" && material.Stock < request.Quantity)
            {
                return BadRequest("Insufficient stock for this adjustment");
            }

            material.Stock += increment;
            material.LastUpdated = DateTime.UtcNow;
            _context.Entry(material).State = EntityState.Modified;

            double actualJournalAmount = 0;

            if (request.AdjustType == "in")
            {
                var batch = new MaterialBatch 
                {
                    MaterialId = material.Id,
                    OriginalQty = request.Quantity,
                    RemainingQty = request.Quantity,
                    UnitPrice = request.Quantity > 0 ? request.TotalPrice / request.Quantity : 0,
                    CreatedAt = DateTime.UtcNow
                };
                _context.MaterialBatches.Add(batch);
                actualJournalAmount = request.TotalPrice;
            }
            else // out
            {
                double remainingToDeduct = request.Quantity;
                var activeBatches = await _context.MaterialBatches
                    .Where(b => b.MaterialId == material.Id && b.RemainingQty > 0)
                    .OrderBy(b => b.CreatedAt)
                    .ToListAsync();
                
                foreach (var batch in activeBatches)
                {
                    if (remainingToDeduct <= 0) break;
                    
                    double deductFromBatch = Math.Min(batch.RemainingQty, remainingToDeduct);
                    batch.RemainingQty -= deductFromBatch;
                    remainingToDeduct -= deductFromBatch;
                    actualJournalAmount += deductFromBatch * batch.UnitPrice;
                }
                
                // If there's still remainingToDeduct (no batches left), we fallback to CostPerUnit
                if (remainingToDeduct > 0)
                {
                    actualJournalAmount += remainingToDeduct * material.CostPerUnit;
                }
            }

            // Create Journal Entry
            if (actualJournalAmount > 0)
            {
                var invAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "1140");
                var adjAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "5130");

                if (invAccount != null && adjAccount != null)
                {
                    string dateStr = DateTime.UtcNow.ToString("yyMMdd");
                    int count = await _context.JournalEntries.CountAsync(j => j.Reference.StartsWith("ST" + dateStr));
                    string refCode = $"ST{dateStr}{(count + 1).ToString("D4")}";
                    string desc = string.IsNullOrEmpty(request.Notes) ? $"Penyesuaian Stok {material.Name}" : request.Notes;

                    var journal = new JournalEntry
                    {
                        Date = DateTime.UtcNow,
                        Reference = refCode,
                        Description = desc,
                        Lines = new List<JournalEntryLine>()
                    };

                    if (request.AdjustType == "in")
                    {
                        // Stock increases: Debit Inventory, Credit Adjustment Account
                        journal.Lines.Add(new JournalEntryLine { Account = invAccount, Debit = actualJournalAmount, Credit = 0 });
                        journal.Lines.Add(new JournalEntryLine { Account = adjAccount, Debit = 0, Credit = actualJournalAmount });
                    }
                    else
                    {
                        // Stock decreases: Debit Adjustment Account, Credit Inventory
                        journal.Lines.Add(new JournalEntryLine { Account = adjAccount, Debit = actualJournalAmount, Credit = 0 });
                        journal.Lines.Add(new JournalEntryLine { Account = invAccount, Debit = 0, Credit = actualJournalAmount });
                    }

                    _context.JournalEntries.Add(journal);
                }
            }

            await _context.SaveChangesAsync();

            // Update CostPerUnit (Weighted Average of Remaining Batches) after save
            var allActiveBatches = await _context.MaterialBatches
                .Where(b => b.MaterialId == material.Id && b.RemainingQty > 0)
                .ToListAsync();
            
            double totalValue = allActiveBatches.Sum(b => b.RemainingQty * b.UnitPrice);
            double totalStock = allActiveBatches.Sum(b => b.RemainingQty);
            
            material.CostPerUnit = totalStock > 0 ? totalValue / totalStock : 0;
            await _context.SaveChangesAsync();

            return Ok(material);
        }

        // GET: api/Material/5/batches
        [HttpGet("{id}/batches")]
        public async Task<ActionResult<IEnumerable<MaterialBatch>>> GetMaterialBatches(int id)
        {
            var material = await _context.Materials.FindAsync(id);
            if (material == null)
            {
                return NotFound("Material not found");
            }

            return await _context.MaterialBatches
                .Where(b => b.MaterialId == id)
                .OrderByDescending(b => b.CreatedAt)
                .ToListAsync();
        }

        // PUT: api/Material/batches/5
        [HttpPut("batches/{batchId}")]
        public async Task<IActionResult> UpdateMaterialBatch(int batchId, [FromBody] MaterialBatchUpdateDto request)
        {
            var batch = await _context.MaterialBatches.Include(b => b.Material).FirstOrDefaultAsync(b => b.Id == batchId);
            if (batch == null) return NotFound("Batch not found");

            double oldQty = batch.RemainingQty;
            double oldPrice = batch.UnitPrice;
            double newQty = request.RemainingQty;
            double newPrice = request.UnitPrice;

            batch.OriginalQty = request.OriginalQty;
            batch.RemainingQty = request.RemainingQty;
            batch.UnitPrice = request.UnitPrice;

            _context.Entry(batch).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            // Recalculate parent Material's total stock and CostPerUnit
            var material = batch.Material;
            if (material != null)
            {
                var allActiveBatches = await _context.MaterialBatches
                    .Where(b => b.MaterialId == material.Id && b.RemainingQty > 0)
                    .ToListAsync();

                double totalValue = allActiveBatches.Sum(b => b.RemainingQty * b.UnitPrice);
                double totalStock = allActiveBatches.Sum(b => b.RemainingQty);

                material.Stock = totalStock;
                material.CostPerUnit = totalStock > 0 ? totalValue / totalStock : 0;
                material.LastUpdated = DateTime.UtcNow;

                _context.Entry(material).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                // Create journal entries to keep accounting in balance
                var invAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "1140");
                var adjAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "5130");

                if (invAccount != null && adjAccount != null)
                {
                    double priceDiffValue = oldQty * (newPrice - oldPrice);
                    double qtyDiffValue = (newQty - oldQty) * newPrice;

                    // 1. Journal for Price adjustment on the old remaining quantity (revaluation)
                    if (Math.Abs(priceDiffValue) > 0.01)
                    {
                        string refCode = $"ST-PRC-{batch.Id}-{DateTime.UtcNow.Ticks % 1000000}";
                        string desc = $"Revaluasi Harga Bahan Baku {material.Name} (Batch #{batch.Id}): Selisih Harga Rp{(newPrice - oldPrice).ToString("N0")} untuk {oldQty} unit";

                        var journal = new JournalEntry
                        {
                            Date = DateTime.UtcNow,
                            Reference = refCode,
                            Description = desc,
                            Lines = new List<JournalEntryLine>()
                        };

                        if (priceDiffValue > 0)
                        {
                            journal.Lines.Add(new JournalEntryLine { Account = invAccount, Debit = priceDiffValue, Credit = 0 });
                            journal.Lines.Add(new JournalEntryLine { Account = adjAccount, Debit = 0, Credit = priceDiffValue });
                        }
                        else
                        {
                            journal.Lines.Add(new JournalEntryLine { Account = adjAccount, Debit = Math.Abs(priceDiffValue), Credit = 0 });
                            journal.Lines.Add(new JournalEntryLine { Account = invAccount, Debit = 0, Credit = Math.Abs(priceDiffValue) });
                        }

                        _context.JournalEntries.Add(journal);
                    }

                    // 2. Journal for Qty adjustment at the new price
                    if (Math.Abs(qtyDiffValue) > 0.01)
                    {
                        string refCode = $"ST-QTY-{batch.Id}-{DateTime.UtcNow.Ticks % 1000000}";
                        string desc = $"Penyesuaian Qty Bahan Baku {material.Name} (Batch #{batch.Id}): Selisih Qty {(newQty - oldQty)} @ Rp{newPrice.ToString("N0")}";

                        var journal = new JournalEntry
                        {
                            Date = DateTime.UtcNow,
                            Reference = refCode,
                            Description = desc,
                            Lines = new List<JournalEntryLine>()
                        };

                        if (qtyDiffValue > 0)
                        {
                            journal.Lines.Add(new JournalEntryLine { Account = invAccount, Debit = qtyDiffValue, Credit = 0 });
                            journal.Lines.Add(new JournalEntryLine { Account = adjAccount, Debit = 0, Credit = qtyDiffValue });
                        }
                        else
                        {
                            journal.Lines.Add(new JournalEntryLine { Account = adjAccount, Debit = Math.Abs(qtyDiffValue), Credit = 0 });
                            journal.Lines.Add(new JournalEntryLine { Account = invAccount, Debit = 0, Credit = Math.Abs(qtyDiffValue) });
                        }

                        _context.JournalEntries.Add(journal);
                    }

                    if (Math.Abs(priceDiffValue) > 0.01 || Math.Abs(qtyDiffValue) > 0.01)
                    {
                        await _context.SaveChangesAsync();
                    }
                }
            }

            return Ok(batch);
        }

        // DELETE: api/Material/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaterial(int id)
        {
            var material = await _context.Materials.FindAsync(id);
            if (material == null)
            {
                return NotFound();
            }

            _context.Materials.Remove(material);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool MaterialExists(int id)
        {
            return _context.Materials.Any(e => e.Id == id);
        }
    }
}
