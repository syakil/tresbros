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

            // Create Journal Entry
            if (request.TotalPrice > 0)
            {
                var invAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "1140");
                if (invAccount == null)
                {
                    invAccount = new ChartOfAccount { Code = "1140", Name = "Persediaan Bahan Baku", Type = "ASSET", IsActive = true };
                    _context.ChartOfAccounts.Add(invAccount);
                }

                var adjAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "5130");
                if (adjAccount == null)
                {
                    adjAccount = new ChartOfAccount { Code = "5130", Name = "Penyesuaian Persediaan", Type = "EXPENSE", IsActive = true };
                    _context.ChartOfAccounts.Add(adjAccount);
                }

                string refCode = $"ADJ-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4)}".ToUpper();
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
                    journal.Lines.Add(new JournalEntryLine { Account = invAccount, Debit = request.TotalPrice, Credit = 0 });
                    journal.Lines.Add(new JournalEntryLine { Account = adjAccount, Debit = 0, Credit = request.TotalPrice });
                }
                else
                {
                    // Stock decreases: Debit Adjustment Account, Credit Inventory
                    journal.Lines.Add(new JournalEntryLine { Account = adjAccount, Debit = request.TotalPrice, Credit = 0 });
                    journal.Lines.Add(new JournalEntryLine { Account = invAccount, Debit = 0, Credit = request.TotalPrice });
                }

                _context.JournalEntries.Add(journal);
            }

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
