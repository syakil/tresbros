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
        private readonly IConfiguration _configuration;

        public OrderController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
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
            
            // Generate a temporary Id for Midtrans OrderId if needed, but since it's not saved yet, 
            // we will save it first to get the DB ID, then call Midtrans.
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            Console.WriteLine($"[ORDER CREATED] ID: {order.Id}, PaymentMethod: '{order.PaymentMethod}', TotalAmount: {order.TotalAmount}");

            // Midtrans Integration
            if (order.PaymentMethod == "MIDTRANS")
            {
                var serverKey = _configuration["Midtrans:ServerKey"];
                var isProduction = _configuration.GetValue<bool>("Midtrans:IsProduction");
                var snapUrl = isProduction ? "https://app.midtrans.com/snap/v1/transactions" : "https://app.sandbox.midtrans.com/snap/v1/transactions";

                var authString = Convert.ToBase64String(System.Text.Encoding.ASCII.GetBytes($"{serverKey}:"));
                
                using var client = new HttpClient();
                client.DefaultRequestHeaders.Add("Authorization", $"Basic {authString}");
                client.DefaultRequestHeaders.Add("Accept", "application/json");

                var payload = new
                {
                    transaction_details = new
                    {
                        order_id = $"TRX-{order.Id}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
                        gross_amount = (int)order.TotalAmount
                    },
                    customer_details = new
                    {
                        first_name = order.CustomerName ?? "Guest"
                    }
                };

                var response = await client.PostAsJsonAsync(snapUrl, payload);
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
                    order.SnapToken = result.GetProperty("token").GetString();
                    order.PaymentUrl = result.GetProperty("redirect_url").GetString();
                    order.PaymentStatus = "pending";
                    
                    _context.Entry(order).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
                else
                {
                    var errorResponse = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[MIDTRANS ERROR] Status Code: {response.StatusCode}, Response: {errorResponse}");
                }
            }

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
