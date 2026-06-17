using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecipeItemController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RecipeItemController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/RecipeItem
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetRecipeItems([FromQuery] int? productId)
        {
            var query = _context.RecipeItems.Include(r => r.Material).AsQueryable();

            if (productId.HasValue)
            {
                query = query.Where(r => r.ProductId == productId.Value);
            }

            var recipeItems = await query.ToListAsync();

            var formatted = recipeItems.Select(item => new
            {
                id = item.Id,
                material = item.Material?.Name,
                qty = item.Quantity,
                unit = item.Material?.Unit
            });

            return Ok(formatted);
        }

        // POST: api/RecipeItem
        [HttpPost]
        public async Task<ActionResult<object>> PostRecipeItem(RecipeItem recipeItem)
        {
            var existing = await _context.RecipeItems.FirstOrDefaultAsync(r => 
                r.ProductId == recipeItem.ProductId && r.MaterialId == recipeItem.MaterialId);
            
            if (existing != null)
            {
                return BadRequest(new { error = "Bahan baku sudah ada di resep ini" });
            }

            _context.RecipeItems.Add(recipeItem);
            await _context.SaveChangesAsync();

            // Load material
            var created = await _context.RecipeItems
                .Include(r => r.Material)
                .FirstOrDefaultAsync(r => r.Id == recipeItem.Id);

            return CreatedAtAction(nameof(GetRecipeItems), new { id = recipeItem.Id }, new {
                id = created.Id,
                material = created.Material?.Name,
                qty = created.Quantity,
                unit = created.Material?.Unit
            });
        }

        // DELETE: api/RecipeItem/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRecipeItem(int id)
        {
            var recipeItem = await _context.RecipeItems.FindAsync(id);
            if (recipeItem == null)
            {
                return NotFound();
            }

            _context.RecipeItems.Remove(recipeItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
