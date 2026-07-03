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
                        .ThenInclude(p => p.RecipeItems)
                            .ThenInclude(r => r.Material)
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
                        .ThenInclude(p => p.RecipeItems)
                            .ThenInclude(r => r.Material)
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
            var now = DateTime.UtcNow;
            order.CreatedAt = now;
            
            // Format queue using UTC+7 for local day boundary (WIB)
            var localTime = now.AddHours(7);
            var todayDate = now.Date;
            
            var maxQueueToday = await _context.Orders
                .Where(o => o.CreatedAt.Date == todayDate)
                .MaxAsync(o => (int?)o.QueueNumber) ?? 0;

            order.QueueNumber = maxQueueToday + 1;
            order.OrderNumber = $"{localTime:yyyyMMdd}{order.QueueNumber:D3}";

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            Console.WriteLine($"[ORDER CREATED] ID: {order.Id}, OrderNo: {order.OrderNumber}, Queue: {order.QueueNumber}, PaymentMethod: '{order.PaymentMethod}', TotalAmount: {order.TotalAmount}");

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
                        order_id = $"{order.OrderNumber}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
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
                double totalCogs = 0;

                // Deduct stock
                foreach (var item in order.Items)
                {
                    if (item.Product?.RecipeItems != null)
                    {
                        foreach (var recipe in item.Product.RecipeItems)
                        {
                            double requiredQty = recipe.Quantity * item.Quantity;
                            var material = await _context.Materials.FindAsync(recipe.MaterialId);
                            
                            if (material != null)
                            {
                                material.Stock -= requiredQty;
                                _context.Entry(material).State = EntityState.Modified;

                                // FIFO deduction from MaterialBatch
                                var batches = await _context.MaterialBatches
                                    .Where(b => b.MaterialId == material.Id && b.RemainingQty > 0)
                                    .OrderBy(b => b.CreatedAt)
                                    .ToListAsync();

                                double remainingNeeded = requiredQty;

                                foreach (var batch in batches)
                                {
                                    if (remainingNeeded <= 0) break;

                                    double qtyToDeduct = Math.Min(remainingNeeded, batch.RemainingQty);
                                    batch.RemainingQty -= qtyToDeduct;
                                    remainingNeeded -= qtyToDeduct;
                                    
                                    totalCogs += qtyToDeduct * batch.UnitPrice;
                                    _context.Entry(batch).State = EntityState.Modified;
                                }
                            }
                        }
                    }
                }

                // Create Journal for Sales, Tax, COGS
                var cashOrReceivableCode = order.PaymentMethod == "MIDTRANS" ? "1120" : "1110";
                var cashAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == cashOrReceivableCode) ?? new ChartOfAccount { Code = cashOrReceivableCode, Name = order.PaymentMethod == "MIDTRANS" ? "Piutang Midtrans" : "Kas Kecil", Type = "ASSET" };
                var salesAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "4110") ?? new ChartOfAccount { Code = "4110", Name = "Pendapatan Penjualan", Type = "REVENUE" };
                var discountAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "4120") ?? new ChartOfAccount { Code = "4120", Name = "Diskon & Promo", Type = "REVENUE" };
                var cogsAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "5110") ?? new ChartOfAccount { Code = "5110", Name = "HPP", Type = "EXPENSE" };
                var inventoryAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "1140") ?? new ChartOfAccount { Code = "1140", Name = "Persediaan Bahan Baku", Type = "ASSET" };
                var taxAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "2120") ?? new ChartOfAccount { Code = "2120", Name = "Hutang Pajak (PB1)", Type = "LIABILITY" };

                if (cashAccount.Id == 0) _context.ChartOfAccounts.Add(cashAccount);
                if (salesAccount.Id == 0) _context.ChartOfAccounts.Add(salesAccount);
                if (discountAccount.Id == 0) _context.ChartOfAccounts.Add(discountAccount);
                if (cogsAccount.Id == 0) _context.ChartOfAccounts.Add(cogsAccount);
                if (inventoryAccount.Id == 0) _context.ChartOfAccounts.Add(inventoryAccount);
                if (taxAccount.Id == 0) _context.ChartOfAccounts.Add(taxAccount);

                var taxSetting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "TAX_ENABLED");
                bool isTaxEnabled = taxSetting?.Value == "true";
                
                double taxAmount = isTaxEnabled ? order.TotalAmount - (order.TotalAmount / 1.11) : 0;
                double salesRevenue = (order.TotalAmount - taxAmount) + order.DiscountAmount;

                var journal = new JournalEntry 
                {
                    Date = DateTime.UtcNow,
                    Reference = order.OrderNumber,
                    Description = $"Penjualan {order.OrderNumber}"
                };

                // Sales & Cash/Receivable
                journal.Lines.Add(new JournalEntryLine { Account = cashAccount, Debit = order.TotalAmount, Credit = 0 });
                journal.Lines.Add(new JournalEntryLine { Account = salesAccount, Debit = 0, Credit = salesRevenue });
                
                if (order.DiscountAmount > 0)
                {
                    journal.Lines.Add(new JournalEntryLine { Account = discountAccount, Debit = order.DiscountAmount, Credit = 0 });
                }

                if (isTaxEnabled && taxAmount > 0)
                {
                    journal.Lines.Add(new JournalEntryLine { Account = taxAccount, Debit = 0, Credit = taxAmount });
                }

                // COGS & Inventory
                if (totalCogs > 0)
                {
                    journal.Lines.Add(new JournalEntryLine { Account = cogsAccount, Debit = totalCogs, Credit = 0 });
                    journal.Lines.Add(new JournalEntryLine { Account = inventoryAccount, Debit = 0, Credit = totalCogs });
                }

                _context.JournalEntries.Add(journal);
            }
            else if (wasCompleted && !isNowCompleted)
            {
                // Revert stock (not reverting FIFO batches logic precisely for simplicity, just adding stock back. A full rollback would be more complex)
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
