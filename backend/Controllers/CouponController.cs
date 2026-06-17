using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CouponController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CouponController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Coupon
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Coupon>>> GetCoupons()
        {
            return await _context.Coupons.ToListAsync();
        }

        // GET: api/Coupon/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Coupon>> GetCoupon(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);

            if (coupon == null)
            {
                return NotFound();
            }

            return coupon;
        }

        // POST: api/Coupon
        [HttpPost]
        public async Task<ActionResult<Coupon>> PostCoupon(Coupon coupon)
        {
            coupon.CreatedAt = DateTime.UtcNow;
            
            _context.Coupons.Add(coupon);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCoupon), new { id = coupon.Id }, coupon);
        }

        // PUT: api/Coupon/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCoupon(int id, Coupon coupon)
        {
            if (id != coupon.Id)
            {
                return BadRequest();
            }

            _context.Entry(coupon).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CouponExists(id))
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

        // DELETE: api/Coupon/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCoupon(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null)
            {
                return NotFound();
            }

            _context.Coupons.Remove(coupon);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Coupon/validate
        [HttpPost("validate")]
        public async Task<ActionResult<object>> ValidateCoupon([FromBody] ValidateCouponRequest request)
        {
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == request.Code);

            if (coupon == null || !coupon.IsActive)
            {
                return BadRequest(new { message = "Invalid or inactive coupon code." });
            }

            if (coupon.CurrentUsage >= coupon.MaxUsage)
            {
                return BadRequest(new { message = "Coupon usage limit reached." });
            }

            if (request.TotalAmount < coupon.MinPurchase)
            {
                return BadRequest(new { message = $"Minimum purchase amount of {coupon.MinPurchase} required." });
            }

            double discountAmount = 0;
            if (coupon.Type == "FIXED")
            {
                discountAmount = coupon.Value;
            }
            else if (coupon.Type == "PERCENTAGE")
            {
                discountAmount = request.TotalAmount * (coupon.Value / 100);
                if (coupon.MaxDiscount.HasValue && discountAmount > coupon.MaxDiscount.Value)
                {
                    discountAmount = coupon.MaxDiscount.Value;
                }
            }

            return Ok(new { 
                valid = true,
                coupon = coupon,
                discountAmount = discountAmount 
            });
        }

        private bool CouponExists(int id)
        {
            return _context.Coupons.Any(e => e.Id == id);
        }
    }

    public class ValidateCouponRequest
    {
        public string Code { get; set; } = string.Empty;
        public double TotalAmount { get; set; }
    }
}
