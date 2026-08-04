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

        public class CreateJournalLineDto
        {
            public int AccountId { get; set; }
            public double Debit { get; set; }
            public double Credit { get; set; }
        }

        public class CreateJournalDto
        {
            public DateTime Date { get; set; }
            public string Reference { get; set; } = string.Empty;
            public string Description { get; set; } = string.Empty;
            public List<CreateJournalLineDto> Lines { get; set; } = new List<CreateJournalLineDto>();
        }

        // POST: api/Accounting/Journals
        [HttpPost("Journals")]
        public async Task<IActionResult> PostJournal([FromBody] CreateJournalDto dto)
        {
            if (dto.Lines == null || dto.Lines.Count == 0)
                return BadRequest(new { message = "Journal must have at least one line." });

            double totalDebit = dto.Lines.Sum(l => l.Debit);
            double totalCredit = dto.Lines.Sum(l => l.Credit);

            // Using Math.Round to avoid floating point precision issues when checking balance
            if (Math.Round(totalDebit, 2) != Math.Round(totalCredit, 2))
            {
                return BadRequest(new { message = "Debit and Credit must be balanced." });
            }

            var entry = new JournalEntry
            {
                Date = dto.Date,
                Reference = dto.Reference,
                Description = dto.Description
            };

            foreach (var lineDto in dto.Lines)
            {
                entry.Lines.Add(new JournalEntryLine
                {
                    AccountId = lineDto.AccountId,
                    Debit = lineDto.Debit,
                    Credit = lineDto.Credit
                });
            }

            _context.JournalEntries.Add(entry);
            await _context.SaveChangesAsync();

            return Ok(entry);
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

            double openingBalance = 0;

            if (startDate.HasValue)
            {
                var priorQuery = _context.JournalEntryLines
                    .Include(l => l.JournalEntry)
                    .Where(l => l.AccountId == accountId && l.JournalEntry!.Date.Date < startDate.Value.Date);

                double priorDebit = await priorQuery.SumAsync(l => l.Debit);
                double priorCredit = await priorQuery.SumAsync(l => l.Credit);

                if (account.Type == "ASSET" || account.Type == "EXPENSE")
                {
                    openingBalance = priorDebit - priorCredit;
                }
                else
                {
                    openingBalance = priorCredit - priorDebit;
                }
            }

            var query = _context.JournalEntryLines
                .Include(l => l.JournalEntry)
                .Where(l => l.AccountId == accountId)
                .AsQueryable();

            if (startDate.HasValue)
                query = query.Where(l => l.JournalEntry!.Date.Date >= startDate.Value.Date);
            
            if (endDate.HasValue)
                query = query.Where(l => l.JournalEntry!.Date.Date <= endDate.Value.Date);

            var lines = await query.OrderBy(l => l.JournalEntry!.Date)
                .Select(l => new {
                    id = l.Id,
                    debit = l.Debit,
                    credit = l.Credit,
                    journalEntry = new {
                        date = l.JournalEntry!.Date,
                        reference = l.JournalEntry.Reference,
                        description = l.JournalEntry.Description
                    }
                })
                .ToListAsync();

            double totalDebit = lines.Sum(l => l.debit);
            double totalCredit = lines.Sum(l => l.credit);
            
            double closingBalance = openingBalance;
            if (account.Type == "ASSET" || account.Type == "EXPENSE")
            {
                closingBalance += (totalDebit - totalCredit);
            }
            else
            {
                closingBalance += (totalCredit - totalDebit);
            }

            return new
            {
                Account = account,
                OpeningBalance = openingBalance,
                ClosingBalance = closingBalance,
                TotalDebit = totalDebit,
                TotalCredit = totalCredit,
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
