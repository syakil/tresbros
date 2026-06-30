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

            material.LastUpdated = DateTime.UtcNow;
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
