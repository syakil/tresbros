using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RnDController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RnDController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/RnD
        [HttpGet]
        public async Task<ActionResult<IEnumerable<RnDRecipe>>> GetRnDRecipes()
        {
            return await _context.RnDRecipes
                .Include(r => r.Ingredients)
                .ThenInclude(i => i.Material)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
        }

        // GET: api/RnD/5
        [HttpGet("{id}")]
        public async Task<ActionResult<RnDRecipe>> GetRnDRecipe(int id)
        {
            var recipe = await _context.RnDRecipes
                .Include(r => r.Ingredients)
                .ThenInclude(i => i.Material)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (recipe == null)
            {
                return NotFound();
            }

            return recipe;
        }

        // POST: api/RnD
        [HttpPost]
        public async Task<ActionResult<RnDRecipe>> PostRnDRecipe(RnDRecipe recipe)
        {
            _context.RnDRecipes.Add(recipe);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetRnDRecipe", new { id = recipe.Id }, recipe);
        }

        // PUT: api/RnD/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRnDRecipe(int id, RnDRecipe recipe)
        {
            if (id != recipe.Id)
            {
                return BadRequest();
            }

            // Remove existing ingredients before adding the new ones
            var existingIngredients = _context.RnDRecipeIngredients.Where(i => i.RnDRecipeId == id);
            _context.RnDRecipeIngredients.RemoveRange(existingIngredients);

            if (recipe.Ingredients != null)
            {
                foreach(var ingredient in recipe.Ingredients)
                {
                    ingredient.Id = 0; // Reset Id for insertion
                    _context.RnDRecipeIngredients.Add(ingredient);
                }
            }

            _context.Entry(recipe).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RnDRecipeExists(id))
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

        // DELETE: api/RnD/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRnDRecipe(int id)
        {
            var recipe = await _context.RnDRecipes.FindAsync(id);
            if (recipe == null)
            {
                return NotFound();
            }

            _context.RnDRecipes.Remove(recipe);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/RnD/5/promote
        [HttpPost("{id}/promote")]
        public async Task<IActionResult> PromoteRecipe(int id, [FromBody] PromoteRequest request)
        {
            var rndRecipe = await _context.RnDRecipes
                .Include(r => r.Ingredients)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (rndRecipe == null) return NotFound("RnD Recipe not found");

            var newProduct = new Product
            {
                Name = rndRecipe.Name,
                Price = request.Price,
                CategoryId = request.CategoryId
            };

            _context.Products.Add(newProduct);
            await _context.SaveChangesAsync(); // save to get new product Id

            foreach (var ing in rndRecipe.Ingredients)
            {
                _context.RecipeItems.Add(new RecipeItem
                {
                    ProductId = newProduct.Id,
                    MaterialId = ing.MaterialId,
                    Quantity = ing.Quantity
                });
            }

            rndRecipe.Status = "Approved";
            await _context.SaveChangesAsync();

            return Ok(newProduct);
        }

        private bool RnDRecipeExists(int id)
        {
            return _context.RnDRecipes.Any(e => e.Id == id);
        }
    }

    public class PromoteRequest
    {
        public double Price { get; set; }
        public int CategoryId { get; set; }
    }
}
