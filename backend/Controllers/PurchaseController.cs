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
            
            // Increment material stock
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
                    }
                }
            }

            if (purchase.TotalAmount == 0)
            {
                purchase.TotalAmount = totalAmount;
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
            var purchase = await _context.Purchases.FindAsync(id);
            if (purchase == null)
            {
                return NotFound();
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

            // Revert stock
            if (purchase.Items != null)
            {
                foreach (var item in purchase.Items)
                {
                    var material = await _context.Materials.FindAsync(item.MaterialId);
                    if (material != null)
                    {
                        material.Stock -= item.Quantity;
                        _context.Entry(material).State = EntityState.Modified;
                    }
                }
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
