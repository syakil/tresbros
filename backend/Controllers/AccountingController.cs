using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AccountingController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Accounting/COA
        [HttpGet("COA")]
        public async Task<ActionResult<IEnumerable<ChartOfAccount>>> GetChartOfAccounts()
        {
            return await _context.ChartOfAccounts.OrderBy(c => c.Code).ToListAsync();
        }

        // POST: api/Accounting/COA
        [HttpPost("COA")]
        public async Task<ActionResult<ChartOfAccount>> PostChartOfAccount(ChartOfAccount coa)
        {
            _context.ChartOfAccounts.Add(coa);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetChartOfAccounts), new { id = coa.Id }, coa);
        }

        // PUT: api/Accounting/COA/5
        [HttpPut("COA/{id}")]
        public async Task<IActionResult> PutChartOfAccount(int id, ChartOfAccount coa)
        {
            if (id != coa.Id)
            {
                return BadRequest();
            }

            _context.Entry(coa).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ChartOfAccountExists(id))
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

        // DELETE: api/Accounting/COA/5
        [HttpDelete("COA/{id}")]
        public async Task<IActionResult> DeleteChartOfAccount(int id)
        {
            var coa = await _context.ChartOfAccounts.FindAsync(id);
            if (coa == null)
            {
                return NotFound();
            }

            _context.ChartOfAccounts.Remove(coa);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Accounting/Journals
        [HttpGet("Journals")]
        public async Task<ActionResult<IEnumerable<JournalEntry>>> GetJournals()
        {
            return await _context.JournalEntries
                .Include(j => j.Lines)
                    .ThenInclude(l => l.Account)
                .OrderByDescending(j => j.Date)
                .ToListAsync();
        }

        // GET: api/Accounting/Ledger
        [HttpGet("Ledger")]
        public async Task<ActionResult<object>> GetLedger([FromQuery] int accountId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var account = await _context.ChartOfAccounts.FindAsync(accountId);
            if (account == null)
            {
                return NotFound();
            }

            var query = _context.JournalEntryLines
                .Include(l => l.JournalEntry)
                .Where(l => l.AccountId == accountId)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(l => l.JournalEntry!.Date.Date >= startDate.Value.Date);
            
            if (endDate.HasValue)
                query = query.Where(l => l.JournalEntry!.Date.Date <= endDate.Value.Date);

            var lines = await query.OrderBy(l => l.JournalEntry!.Date).ToListAsync();

            return new
            {
                Account = account,
                Lines = lines
            };
        }

        // GET: api/Accounting/ProfitLoss
        [HttpGet("ProfitLoss")]
        public async Task<ActionResult<object>> GetProfitLoss([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var query = _context.JournalEntryLines
                .Include(l => l.JournalEntry)
                .Include(l => l.Account)
                .Where(l => l.Account!.Type == "REVENUE" || l.Account.Type == "EXPENSE")
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(l => l.JournalEntry!.Date.Date >= startDate.Value.Date);
            
            if (endDate.HasValue)
                query = query.Where(l => l.JournalEntry!.Date.Date <= endDate.Value.Date);

            var lines = await query.ToListAsync();

            var grouped = lines.GroupBy(l => new { l.Account!.Id, l.Account.Code, l.Account.Name, l.Account.Type })
                .Select(g => new {
                    AccountId = g.Key.Id,
                    AccountCode = g.Key.Code,
                    AccountName = g.Key.Name,
                    Type = g.Key.Type,
                    TotalDebit = g.Sum(l => l.Debit),
                    TotalCredit = g.Sum(l => l.Credit),
                    Balance = g.Key.Type == "REVENUE" ? g.Sum(l => l.Credit) - g.Sum(l => l.Debit) : g.Sum(l => l.Debit) - g.Sum(l => l.Credit)
                }).OrderBy(a => a.AccountCode).ToList();

            var revenues = grouped.Where(x => x.Type == "REVENUE").ToList();
            var expenses = grouped.Where(x => x.Type == "EXPENSE").ToList();

            var totalRevenue = revenues.Sum(x => x.Balance);
            var totalExpense = expenses.Sum(x => x.Balance);
            var netProfit = totalRevenue - totalExpense;

            return new {
                Revenues = revenues,
                Expenses = expenses,
                TotalRevenue = totalRevenue,
                TotalExpense = totalExpense,
                NetProfit = netProfit
            };
        }

        private bool ChartOfAccountExists(int id)
        {
            return _context.ChartOfAccounts.Any(e => e.Id == id);
        }
    }
}
