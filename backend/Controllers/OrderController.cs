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
        private readonly backend.Services.ClosingService _closingService;

        public OrderController(AppDbContext context, IConfiguration configuration, backend.Services.ClosingService closingService)
        {
            _context = context;
            _configuration = configuration;
            _closingService = closingService;
        }

        // GET: api/Order
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var query = _context.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.RecipeItems)
                            .ThenInclude(r => r.Material)
                .Include(o => o.Customer)
                .AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt >= startDate.Value);
            }
            if (endDate.HasValue)
            {
                // Add 1 day to include the entire end date if it's just the date without time
                var end = endDate.Value.Date.AddDays(1).AddTicks(-1);
                query = query.Where(o => o.CreatedAt <= end);
            }

            return await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
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
                .Include(o => o.Customer)
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
            
            if (await _closingService.IsPeriodClosedAsync(now))
            {
                return BadRequest("Cannot create order on a closed date/period. Please open a new shift or wait until tomorrow.");
            }

            order.CreatedAt = now;
            
            // Format queue using UTC+7 for local day boundary (WIB)
            var localTime = now.AddHours(7);
            var todayDate = now.Date;
            
            var maxQueueToday = await _context.Orders
                .Where(o => o.CreatedAt.Date == todayDate)
                .MaxAsync(o => (int?)o.QueueNumber) ?? 0;

            order.QueueNumber = maxQueueToday + 1;
            order.OrderNumber = $"{localTime:yyyyMMdd}{order.QueueNumber:D3}";

            if (order.PaymentMethod == "CASH" || order.PaymentMethod == "QRIS")
            {
                order.PaymentStatus = "success";
            }

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            Console.WriteLine($"[ORDER CREATED] ID: {order.Id}, OrderNo: {order.OrderNumber}, Queue: {order.QueueNumber}, PaymentMethod: '{order.PaymentMethod}', TotalAmount: {order.TotalAmount}");

            // Process stock deduction & journal immediately for CASH and QRIS orders
            if (order.PaymentMethod == "CASH" || order.PaymentMethod == "QRIS")
            {
                var reloadedOrder = await _context.Orders
                    .Include(o => o.Items)
                        .ThenInclude(i => i.Product)
                            .ThenInclude(p => p.RecipeItems)
                    .FirstOrDefaultAsync(o => o.Id == order.Id);

                if (reloadedOrder != null)
                {
                    await ProcessOrderCompletion(reloadedOrder, _context);
                    await _context.SaveChangesAsync();
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
            // Note: CASH and QRIS are processed immediately on creation, so they are always considered "completed"
            bool isNowCompleted = status == "DONE" || status == "TAKEN" || order.PaymentMethod == "CASH" || order.PaymentMethod == "QRIS";
            bool wasCompleted = oldStatus == "DONE" || oldStatus == "TAKEN" || order.PaymentMethod == "CASH" || order.PaymentMethod == "QRIS";

            if (isNowCompleted && !wasCompleted)
            {
                await ProcessOrderCompletion(order, _context);
            }
            else if (wasCompleted && !isNowCompleted)
            {
                // Revert stock (not reverting FIFO batches logic precisely for simplicity, just adding stock back)
                await RevertOrderStock(order, _context);
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

        // POST: api/Order/5/cancel
        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelOrder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .ThenInclude(p => p.RecipeItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
            {
                return NotFound(new { message = "Order not found." });
            }

            if (order.Status == "CANCELLED")
            {
                return BadRequest(new { message = "Order is already cancelled." });
            }

            string oldStatus = order.Status;
            
            // 1. Update Status
            order.Status = "CANCELLED";
            order.PaymentStatus = "refunded";
            _context.Entry(order).State = EntityState.Modified;

            // 2. Revert Stock (if it was processed)
            bool wasProcessed = oldStatus == "DONE" || oldStatus == "TAKEN" || order.PaymentMethod == "CASH" || order.PaymentMethod == "QRIS";
            if (wasProcessed)
            {
                await RevertOrderStock(order, _context);
            }

            // 3. Delete associated JournalEntry to reverse accounting impact
            var journalEntry = await _context.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference == order.OrderNumber);
                
            if (journalEntry != null)
            {
                _context.JournalEntryLines.RemoveRange(journalEntry.Lines);
                _context.JournalEntries.Remove(journalEntry);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error cancelling order.", details = ex.Message });
            }

            return Ok(new { message = "Order cancelled successfully.", order });
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

        public static async Task ProcessOrderCompletion(Order order, AppDbContext context)
        {
            // 1. Check if already processed (check if journal entry with order number exists)
            bool alreadyProcessed = await context.JournalEntries.AnyAsync(j => j.Reference == order.OrderNumber);
            if (alreadyProcessed) return;

            double totalCogs = 0;

            // Deduct stock for main products
            foreach (var item in order.Items)
            {
                if (item.Product?.RecipeItems != null)
                {
                    foreach (var recipe in item.Product.RecipeItems)
                    {
                        double requiredQty = recipe.Quantity * item.Quantity;
                        var material = await context.Materials.FindAsync(recipe.MaterialId);
                        
                        if (material != null)
                        {
                            material.Stock -= requiredQty;
                            context.Entry(material).State = EntityState.Modified;

                            var batches = await context.MaterialBatches
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
                                context.Entry(batch).State = EntityState.Modified;
                            }
                        }
                    }
                }

                // Deduct recipe for any add-ons/toppings listed in notes
                if (!string.IsNullOrEmpty(item.Notes))
                {
                    var noteParts = item.Notes.Split(',')
                        .Select(p => p.Trim())
                        .Where(p => !string.IsNullOrEmpty(p))
                        .ToList();

                    foreach (var part in noteParts)
                    {
                        var addonProduct = await context.Products
                            .Include(p => p.RecipeItems)
                            .FirstOrDefaultAsync(p => p.Name.ToLower() == part.ToLower());

                        if (addonProduct != null && addonProduct.RecipeItems != null)
                        {
                            foreach (var recipe in addonProduct.RecipeItems)
                            {
                                double requiredQty = recipe.Quantity * item.Quantity;
                                var material = await context.Materials.FindAsync(recipe.MaterialId);

                                if (material != null)
                                {
                                    material.Stock -= requiredQty;
                                    context.Entry(material).State = EntityState.Modified;

                                    var batches = await context.MaterialBatches
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
                                        context.Entry(batch).State = EntityState.Modified;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Create Journal - separate cash (1110) and QRIS (1111)
            string cashAccountCode = order.PaymentMethod == "QRIS" ? "1111" : "1110";
            string cashAccountName = order.PaymentMethod == "QRIS" ? "QRIS" : "Kas Kecil";
            var cashAccount = await context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == cashAccountCode) ?? new ChartOfAccount { Code = cashAccountCode, Name = cashAccountName, Type = "ASSET" };
            var salesAccount = await context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "4110") ?? new ChartOfAccount { Code = "4110", Name = "Pendapatan Penjualan", Type = "REVENUE" };
            var discountAccount = await context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "4120") ?? new ChartOfAccount { Code = "4120", Name = "Diskon & Promo", Type = "REVENUE" };
            var cogsAccount = await context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "5110") ?? new ChartOfAccount { Code = "5110", Name = "HPP", Type = "EXPENSE" };
            var inventoryAccount = await context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "1140") ?? new ChartOfAccount { Code = "1140", Name = "Persediaan Bahan Baku", Type = "ASSET" };
            var taxAccount = await context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "2120") ?? new ChartOfAccount { Code = "2120", Name = "Hutang Pajak (PB1)", Type = "LIABILITY" };
            var roundingAccount = await context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "5150") ?? new ChartOfAccount { Code = "5150", Name = "Selisih Pembulatan", Type = "EXPENSE" };

            if (cashAccount.Id == 0) context.ChartOfAccounts.Add(cashAccount);
            if (salesAccount.Id == 0) context.ChartOfAccounts.Add(salesAccount);
            if (discountAccount.Id == 0) context.ChartOfAccounts.Add(discountAccount);
            if (cogsAccount.Id == 0) context.ChartOfAccounts.Add(cogsAccount);
            if (inventoryAccount.Id == 0) context.ChartOfAccounts.Add(inventoryAccount);
            if (taxAccount.Id == 0) context.ChartOfAccounts.Add(taxAccount);
            if (roundingAccount.Id == 0) context.ChartOfAccounts.Add(roundingAccount);

            // Calculate original subtotal from items
            double originalSubtotal = 0;
            foreach (var item in order.Items)
            {
                originalSubtotal += item.Quantity * item.Price;
            }

            var taxSetting = await context.Settings.FirstOrDefaultAsync(s => s.Key == "TAX_ENABLED");
            bool isTaxEnabled = taxSetting == null || taxSetting.Value == "true";
            
            double taxableAmount = Math.Max(0, originalSubtotal - order.DiscountAmount);
            double taxAmount = isTaxEnabled ? taxableAmount * 0.11 : 0;
            double unroundedTotal = taxableAmount + taxAmount;
            double roundingDifference = order.TotalAmount - unroundedTotal;
            double salesRevenue = originalSubtotal;

            var journal = new JournalEntry 
            {
                Date = DateTime.UtcNow,
                Reference = order.OrderNumber,
                Description = $"Penjualan {order.OrderNumber}"
            };

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

            if (Math.Abs(roundingDifference) > 0.01)
            {
                if (roundingDifference < 0)
                {
                    // Round down: we received less cash, so debit the difference as rounding expense
                    journal.Lines.Add(new JournalEntryLine { Account = roundingAccount, Debit = Math.Abs(roundingDifference), Credit = 0 });
                }
                else
                {
                    // Round up: we received more cash, so credit the difference as rounding gain
                    journal.Lines.Add(new JournalEntryLine { Account = roundingAccount, Debit = 0, Credit = roundingDifference });
                }
            }

            if (totalCogs > 0)
            {
                journal.Lines.Add(new JournalEntryLine { Account = cogsAccount, Debit = totalCogs, Credit = 0 });
                journal.Lines.Add(new JournalEntryLine { Account = inventoryAccount, Debit = 0, Credit = totalCogs });
            }

            context.JournalEntries.Add(journal);
        }

        private async Task RevertOrderStock(Order order, AppDbContext context)
        {
            foreach (var item in order.Items)
            {
                // 1. Revert normal product recipe
                if (item.Product?.RecipeItems != null)
                {
                    foreach (var recipe in item.Product.RecipeItems)
                    {
                        var material = await context.Materials.FindAsync(recipe.MaterialId);
                        if (material != null)
                        {
                            material.Stock += (recipe.Quantity * item.Quantity);
                            context.Entry(material).State = EntityState.Modified;
                        }
                    }
                }

                // 2. Revert add-ons/toppings
                if (!string.IsNullOrEmpty(item.Notes))
                {
                    var noteParts = item.Notes.Split(',')
                        .Select(p => p.Trim())
                        .Where(p => !string.IsNullOrEmpty(p))
                        .ToList();

                    foreach (var part in noteParts)
                    {
                        var addonProduct = await context.Products
                            .Include(p => p.RecipeItems)
                            .FirstOrDefaultAsync(p => p.Name.ToLower() == part.ToLower());

                        if (addonProduct != null && addonProduct.RecipeItems != null)
                        {
                            foreach (var recipe in addonProduct.RecipeItems)
                            {
                                var material = await context.Materials.FindAsync(recipe.MaterialId);
                                if (material != null)
                                {
                                    material.Stock += (recipe.Quantity * item.Quantity);
                                    context.Entry(material).State = EntityState.Modified;
                                }
                            }
                        }
                    }
                }
            }
        }

        private bool OrderExists(int id)
        {
            return _context.Orders.Any(e => e.Id == id);
        }
    }
}
