using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

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
                .Include(r => r.TestHistories)
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

            var category = await _context.Categories.FindAsync(request.CategoryId);
            if (category == null)
            {
                category = await _context.Categories.FirstOrDefaultAsync();
                if (category == null)
                {
                    category = new Category { Name = "Uncategorized" };
                    _context.Categories.Add(category);
                    await _context.SaveChangesAsync();
                }
            }

            var newProduct = new Product
            {
                Name = rndRecipe.Name,
                Price = request.Price,
                CategoryId = category.Id
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

        [HttpPost("{id}/test")]
        public async Task<IActionResult> TestRecipe(int id)
        {
            var recipe = await _context.RnDRecipes
                .Include(r => r.Ingredients)
                .ThenInclude(i => i.Material)
                .FirstOrDefaultAsync(r => r.Id == id);
            
            if (recipe == null) return NotFound("Recipe not found");

            double totalCost = 0;
            var invAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "1140");
            var adjAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "5130"); 

            // FIFO Deduction logic
            foreach (var ing in recipe.Ingredients)
            {
                if (ing.Material == null) continue;
                var material = ing.Material;
                double remainingToDeduct = ing.Quantity;
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
                    totalCost += deductFromBatch * batch.UnitPrice;
                }
                
                if (remainingToDeduct > 0)
                {
                    totalCost += remainingToDeduct * material.CostPerUnit;
                }

                material.Stock -= ing.Quantity;
            }

            string dateStr = DateTime.UtcNow.ToString("yyMMdd");
            int count = await _context.RnDTestHistories.CountAsync(t => t.RnDRecipeId == id);
            string testVersion = $"Test #{count + 1}";

            var history = new RnDTestHistory
            {
                RnDRecipeId = recipe.Id,
                TestVersion = testVersion,
                IngredientsSnapshot = JsonSerializer.Serialize(recipe.Ingredients.Select(i => new {
                    i.MaterialId,
                    MaterialName = i.Material?.Name ?? "",
                    i.Quantity,
                    i.Unit,
                    i.CostPerUnit
                })),
                ActualCost = totalCost,
                Notes = "",
                TestedAt = DateTime.UtcNow
            };
            _context.RnDTestHistories.Add(history);

            if (invAccount != null && adjAccount != null && totalCost > 0)
            {
                int journalCount = await _context.JournalEntries.CountAsync(j => j.Reference.StartsWith("RND" + dateStr));
                string refCode = $"RND{dateStr}{(journalCount + 1).ToString("D4")}";

                var journal = new JournalEntry
                {
                    Date = DateTime.UtcNow,
                    Reference = refCode,
                    Description = $"Pengujian R&D: {recipe.Name} ({testVersion})",
                    Lines = new List<JournalEntryLine>()
                };

                journal.Lines.Add(new JournalEntryLine { Account = adjAccount, Debit = totalCost, Credit = 0 });
                journal.Lines.Add(new JournalEntryLine { Account = invAccount, Debit = 0, Credit = totalCost });
                _context.JournalEntries.Add(journal);
            }

            await _context.SaveChangesAsync();
            return Ok(history);
        }

        [HttpPut("history/{historyId}")]
        public async Task<IActionResult> UpdateTestHistory(int historyId, [FromBody] UpdateNotesRequest request)
        {
            var history = await _context.RnDTestHistories.FindAsync(historyId);
            if (history == null) return NotFound();
            
            history.Notes = request.Notes;
            await _context.SaveChangesAsync();
            return Ok(history);
        }

        [HttpPost("{id}/apply-history/{historyId}")]
        public async Task<IActionResult> ApplyHistory(int id, int historyId)
        {
            var recipe = await _context.RnDRecipes
                .Include(r => r.Ingredients)
                .FirstOrDefaultAsync(r => r.Id == id);
            
            var history = await _context.RnDTestHistories.FirstOrDefaultAsync(h => h.Id == historyId && h.RnDRecipeId == id);

            if (recipe == null || history == null) return NotFound();

            var snapshot = JsonSerializer.Deserialize<List<SnapshotIngredient>>(history.IngredientsSnapshot);
            if (snapshot == null) return BadRequest("Invalid snapshot data");

            _context.RnDRecipeIngredients.RemoveRange(recipe.Ingredients);
            
            foreach (var ing in snapshot)
            {
                _context.RnDRecipeIngredients.Add(new RnDRecipeIngredient
                {
                    RnDRecipeId = recipe.Id,
                    MaterialId = ing.MaterialId,
                    Quantity = ing.Quantity,
                    Unit = ing.Unit,
                    CostPerUnit = ing.CostPerUnit
                });
            }

            recipe.ActualCost = history.ActualCost;
            await _context.SaveChangesAsync();
            return Ok(recipe);
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

    public class UpdateNotesRequest
    {
        public string Notes { get; set; } = string.Empty;
    }

    public class SnapshotIngredient
    {
        public int MaterialId { get; set; }
        public string MaterialName { get; set; } = string.Empty;
        public double Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public double CostPerUnit { get; set; }
    }
}
