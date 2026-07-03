using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FinanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FinanceController(AppDbContext context)
        {
            _context = context;
        }

        // --- EXPENSES ---

        [HttpGet("expenses")]
        public async Task<ActionResult<IEnumerable<Expense>>> GetExpenses()
        {
            return await _context.Expenses
                .Include(e => e.Account)
                .Include(e => e.PaymentAccount)
                .OrderByDescending(e => e.Date)
                .ToListAsync();
        }

        [HttpGet("expenses/{id}")]
        public async Task<ActionResult<Expense>> GetExpense(int id)
        {
            var expense = await _context.Expenses
                .Include(e => e.Account)
                .Include(e => e.PaymentAccount)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
            {
                return NotFound();
            }

            return expense;
        }

        [HttpPost("expenses")]
        public async Task<ActionResult<Expense>> PostExpense(Expense expense)
        {
            expense.CreatedAt = DateTime.UtcNow;
            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            // Create automatic journal entry
            if (expense.AccountId.HasValue && expense.PaymentAccountId.HasValue)
            {
                var expenseCategoryAcc = await _context.ChartOfAccounts.FindAsync(expense.AccountId.Value);
                var paymentAcc = await _context.ChartOfAccounts.FindAsync(expense.PaymentAccountId.Value);

                if (expenseCategoryAcc != null && paymentAcc != null)
                {
                    var journal = new JournalEntry
                    {
                        Date = expense.Date,
                        Reference = $"EXP-{expense.Id}",
                        Description = $"Pengeluaran: {expense.Description}",
                        Lines = new List<JournalEntryLine>()
                    };

                    journal.Lines.Add(new JournalEntryLine { AccountId = expense.AccountId.Value, Debit = expense.Amount, Credit = 0 });
                    journal.Lines.Add(new JournalEntryLine { AccountId = expense.PaymentAccountId.Value, Debit = 0, Credit = expense.Amount });

                    _context.JournalEntries.Add(journal);
                    await _context.SaveChangesAsync();
                }
            }

            return CreatedAtAction(nameof(GetExpense), new { id = expense.Id }, expense);
        }

        [HttpPut("expenses/{id}")]
        public async Task<IActionResult> PutExpense(int id, Expense expense)
        {
            if (id != expense.Id)
            {
                return BadRequest();
            }

            var existing = await _context.Expenses.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            existing.Description = expense.Description;
            existing.Amount = expense.Amount;
            existing.Date = expense.Date;
            existing.ImageUrl = expense.ImageUrl;
            existing.AccountId = expense.AccountId;
            existing.PaymentAccountId = expense.PaymentAccountId;

            _context.Entry(existing).State = EntityState.Modified;

            // Update associated journal entry
            var existingJournal = await _context.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference == $"EXP-{id}");

            if (existingJournal != null)
            {
                _context.JournalEntries.Remove(existingJournal);
            }

            if (expense.AccountId.HasValue && expense.PaymentAccountId.HasValue)
            {
                var expenseCategoryAcc = await _context.ChartOfAccounts.FindAsync(expense.AccountId.Value);
                var paymentAcc = await _context.ChartOfAccounts.FindAsync(expense.PaymentAccountId.Value);

                if (expenseCategoryAcc != null && paymentAcc != null)
                {
                    var journal = new JournalEntry
                    {
                        Date = expense.Date,
                        Reference = $"EXP-{id}",
                        Description = $"Pengeluaran: {expense.Description}",
                        Lines = new List<JournalEntryLine>()
                    };

                    journal.Lines.Add(new JournalEntryLine { AccountId = expense.AccountId.Value, Debit = expense.Amount, Credit = 0 });
                    journal.Lines.Add(new JournalEntryLine { AccountId = expense.PaymentAccountId.Value, Debit = 0, Credit = expense.Amount });

                    _context.JournalEntries.Add(journal);
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Expenses.Any(e => e.Id == id))
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

        [HttpDelete("expenses/{id}")]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
            {
                return NotFound();
            }

            // Remove associated journal entry
            var existingJournal = await _context.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference == $"EXP-{id}");

            if (existingJournal != null)
            {
                _context.JournalEntries.Remove(existingJournal);
            }

            _context.Expenses.Remove(expense);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // --- INCOMES ---

        [HttpGet("incomes")]
        public async Task<ActionResult<IEnumerable<Income>>> GetIncomes()
        {
            return await _context.Incomes
                .Include(i => i.Account)
                .Include(i => i.PaymentAccount)
                .OrderByDescending(i => i.Date)
                .ToListAsync();
        }

        [HttpGet("incomes/{id}")]
        public async Task<ActionResult<Income>> GetIncome(int id)
        {
            var income = await _context.Incomes
                .Include(i => i.Account)
                .Include(i => i.PaymentAccount)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (income == null)
            {
                return NotFound();
            }

            return income;
        }

        [HttpPost("incomes")]
        public async Task<ActionResult<Income>> PostIncome(Income income)
        {
            income.CreatedAt = DateTime.UtcNow;
            _context.Incomes.Add(income);
            await _context.SaveChangesAsync();

            // Create automatic journal entry
            if (income.AccountId.HasValue && income.PaymentAccountId.HasValue)
            {
                var revenueAcc = await _context.ChartOfAccounts.FindAsync(income.AccountId.Value);
                var paymentAcc = await _context.ChartOfAccounts.FindAsync(income.PaymentAccountId.Value);

                if (revenueAcc != null && paymentAcc != null)
                {
                    var journal = new JournalEntry
                    {
                        Date = income.Date,
                        Reference = $"INC-{income.Id}",
                        Description = $"Pemasukan: {income.Description}",
                        Lines = new List<JournalEntryLine>()
                    };

                    journal.Lines.Add(new JournalEntryLine { AccountId = income.PaymentAccountId.Value, Debit = income.Amount, Credit = 0 });
                    journal.Lines.Add(new JournalEntryLine { AccountId = income.AccountId.Value, Debit = 0, Credit = income.Amount });

                    _context.JournalEntries.Add(journal);
                    await _context.SaveChangesAsync();
                }
            }

            return CreatedAtAction(nameof(GetIncome), new { id = income.Id }, income);
        }

        [HttpPut("incomes/{id}")]
        public async Task<IActionResult> PutIncome(int id, Income income)
        {
            if (id != income.Id)
            {
                return BadRequest();
            }

            var existing = await _context.Incomes.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            existing.Description = income.Description;
            existing.Amount = income.Amount;
            existing.Date = income.Date;
            existing.ImageUrl = income.ImageUrl;
            existing.AccountId = income.AccountId;
            existing.PaymentAccountId = income.PaymentAccountId;

            _context.Entry(existing).State = EntityState.Modified;

            // Update associated journal entry
            var existingJournal = await _context.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference == $"INC-{id}");

            if (existingJournal != null)
            {
                _context.JournalEntries.Remove(existingJournal);
            }

            if (income.AccountId.HasValue && income.PaymentAccountId.HasValue)
            {
                var revenueAcc = await _context.ChartOfAccounts.FindAsync(income.AccountId.Value);
                var paymentAcc = await _context.ChartOfAccounts.FindAsync(income.PaymentAccountId.Value);

                if (revenueAcc != null && paymentAcc != null)
                {
                    var journal = new JournalEntry
                    {
                        Date = income.Date,
                        Reference = $"INC-{id}",
                        Description = $"Pemasukan: {income.Description}",
                        Lines = new List<JournalEntryLine>()
                    };

                    journal.Lines.Add(new JournalEntryLine { AccountId = income.PaymentAccountId.Value, Debit = income.Amount, Credit = 0 });
                    journal.Lines.Add(new JournalEntryLine { AccountId = income.AccountId.Value, Debit = 0, Credit = income.Amount });

                    _context.JournalEntries.Add(journal);
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Incomes.Any(i => i.Id == id))
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

        [HttpDelete("incomes/{id}")]
        public async Task<IActionResult> DeleteIncome(int id)
        {
            var income = await _context.Incomes.FindAsync(id);
            if (income == null)
            {
                return NotFound();
            }

            // Remove associated journal entry
            var existingJournal = await _context.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference == $"INC-{id}");

            if (existingJournal != null)
            {
                _context.JournalEntries.Remove(existingJournal);
            }

            _context.Incomes.Remove(income);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
