using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> MidtransWebhook([FromBody] JsonElement payload)
        {
            // Parse Midtrans payload
            string? orderIdString = payload.GetProperty("order_id").GetString();
            string? transactionStatus = payload.GetProperty("transaction_status").GetString();
            string? fraudStatus = payload.TryGetProperty("fraud_status", out var fraudProp) ? fraudProp.GetString() : null;

            if (string.IsNullOrEmpty(orderIdString) || string.IsNullOrEmpty(transactionStatus))
            {
                return BadRequest("Invalid payload");
            }

            var parts = orderIdString.Split('-');
            if (parts.Length < 1)
            {
                return BadRequest("Invalid Order ID format");
            }
            
            string orderNumber = parts[0];

            var order = await _context.Orders
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .ThenInclude(p => p.RecipeItems)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            // Determine new payment status based on Midtrans transaction_status
            if (transactionStatus == "capture")
            {
                if (fraudStatus == "challenge")
                {
                    order.PaymentStatus = "challenge";
                }
                else if (fraudStatus == "accept")
                {
                    order.PaymentStatus = "success";
                }
            }
            else if (transactionStatus == "settlement")
            {
                order.PaymentStatus = "success";
            }
            else if (transactionStatus == "cancel" || transactionStatus == "deny" || transactionStatus == "expire")
            {
                order.PaymentStatus = "failed";
            }
            else if (transactionStatus == "pending")
            {
                order.PaymentStatus = "pending";
            }

            _context.Entry(order).State = EntityState.Modified;

            // Log into MidtransLog table
            var rawPayload = payload.GetRawText();
            var log = new MidtransLog
            {
                OrderId = orderIdString,
                TransactionStatus = transactionStatus ?? "",
                FraudStatus = fraudStatus ?? "",
                RawPayload = rawPayload
            };
            _context.MidtransLogs.Add(log);

            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}
