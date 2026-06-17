using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrderController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Order
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
        {
            return await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        // GET: api/Order/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Order>> GetOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound();
            }

            return order;
        }

        // POST: api/Order
        [HttpPost]
        public async Task<ActionResult<Order>> PostOrder(Order order)
        {
            order.CreatedAt = DateTime.UtcNow;
            
            // Note: In a real app, you might want to calculate TotalAmount here on the server
            // instead of trusting the client to send the correct total.

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
        }

        // PUT: api/Order/5/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] string status)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .ThenInclude(p => p.RecipeItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound();
            }

            string oldStatus = order.Status;
            order.Status = status;
            _context.Entry(order).State = EntityState.Modified;

            // Handle Material stock deduction when status becomes DONE or TAKEN
            bool isNowCompleted = status == "DONE" || status == "TAKEN";
            bool wasCompleted = oldStatus == "DONE" || oldStatus == "TAKEN";

            if (isNowCompleted && !wasCompleted)
            {
                // Deduct stock
                foreach (var item in order.Items)
                {
                    if (item.Product?.RecipeItems != null)
                    {
                        foreach (var recipe in item.Product.RecipeItems)
                        {
                            var material = await _context.Materials.FindAsync(recipe.MaterialId);
                            if (material != null)
                            {
                                material.Stock -= (recipe.Quantity * item.Quantity);
                                _context.Entry(material).State = EntityState.Modified;
                            }
                        }
                    }
                }
            }
            else if (wasCompleted && !isNowCompleted)
            {
                // Revert stock
                foreach (var item in order.Items)
                {
                    if (item.Product?.RecipeItems != null)
                    {
                        foreach (var recipe in item.Product.RecipeItems)
                        {
                            var material = await _context.Materials.FindAsync(recipe.MaterialId);
                            if (material != null)
                            {
                                material.Stock += (recipe.Quantity * item.Quantity);
                                _context.Entry(material).State = EntityState.Modified;
                            }
                        }
                    }
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OrderExists(id))
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

        // DELETE: api/Order/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound();
            }

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool OrderExists(int id)
        {
            return _context.Orders.Any(e => e.Id == id);
        }
    }
}
