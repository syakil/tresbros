using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Controllers;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace backend.tests
{
    public class FinanceControllerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly DbContextOptions<AppDbContext> _contextOptions;

        public FinanceControllerTests()
        {
            // Open a connection to an in-memory SQLite database
            _connection = new SqliteConnection("Filename=:memory:");
            _connection.Open();

            _contextOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(_connection)
                .Options;

            // Create schema (EnsureCreated automatically seeds ChartOfAccounts seeded in AppDbContext.OnModelCreating)
            using var context = new AppDbContext(_contextOptions);
            context.Database.EnsureCreated();
        }

        public void Dispose()
        {
            _connection.Dispose();
        }

        private AppDbContext CreateContext() => new AppDbContext(_contextOptions);

        [Fact]
        public async Task PostExpense_WithValidAccounts_CreatesExpenseAndJournalEntry()
        {
            // Arrange
            using var context = CreateContext();
            var controller = new FinanceController(context);

            var newExpense = new Expense
            {
                Description = "Beli Kopi Mentah",
                Amount = 50000,
                Date = DateTime.UtcNow,
                AccountId = 13, // Beban Operasional (Seeded ID = 13)
                PaymentAccountId = 1 // Kas Kecil (Seeded ID = 1)
            };

            // Act
            var result = await controller.PostExpense(newExpense);

            // Assert
            var actionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var createdExpense = Assert.IsType<Expense>(actionResult.Value);
            Assert.Equal("Beli Kopi Mentah", createdExpense.Description);
            Assert.Equal(50000, createdExpense.Amount);

            // Verify expense is in the DB
            using var checkContext = CreateContext();
            var dbExpense = await checkContext.Expenses.FindAsync(createdExpense.Id);
            Assert.NotNull(dbExpense);
            Assert.Equal(13, dbExpense.AccountId);

            // Verify automatic journal was created
            var journal = await checkContext.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference == $"EXP-{dbExpense.Id}");

            Assert.NotNull(journal);
            Assert.Equal(2, journal.Lines.Count);

            var debitLine = journal.Lines.First(l => l.Debit > 0);
            var creditLine = journal.Lines.First(l => l.Credit > 0);

            Assert.Equal(13, debitLine.AccountId); // Beban Operasional
            Assert.Equal(50000, debitLine.Debit);

            Assert.Equal(1, creditLine.AccountId); // Kas Kecil
            Assert.Equal(50000, creditLine.Credit);
        }

        [Fact]
        public async Task PutExpense_UpdatesExpenseAndRebuildsJournalEntry()
        {
            // Arrange
            using var initContext = CreateContext();
            var initController = new FinanceController(initContext);

            var expense = new Expense
            {
                Description = "Pengeluaran Awal",
                Amount = 10000,
                Date = DateTime.UtcNow,
                AccountId = 13,
                PaymentAccountId = 1
            };
            await initController.PostExpense(expense);

            // Act - Modify the expense details
            using var updateContext = CreateContext();
            var updateController = new FinanceController(updateContext);

            var updatedExpense = new Expense
            {
                Id = expense.Id,
                Description = "Pengeluaran Baru",
                Amount = 15000,
                Date = expense.Date,
                AccountId = 13,
                PaymentAccountId = 1
            };

            var putResult = await updateController.PutExpense(expense.Id, updatedExpense);

            // Assert
            Assert.IsType<NoContentResult>(putResult);

            using var checkContext = CreateContext();
            var dbExpense = await checkContext.Expenses.FindAsync(expense.Id);
            Assert.Equal("Pengeluaran Baru", dbExpense.Description);
            Assert.Equal(15000, dbExpense.Amount);

            // Verify journal was updated
            var journal = await checkContext.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference == $"EXP-{expense.Id}");

            Assert.NotNull(journal);
            var debitLine = journal.Lines.First(l => l.Debit > 0);
            Assert.Equal(15000, debitLine.Debit);
        }

        [Fact]
        public async Task DeleteExpense_RemovesExpenseAndAssociatedJournal()
        {
            // Arrange
            using var initContext = CreateContext();
            var initController = new FinanceController(initContext);

            var expense = new Expense
            {
                Description = "Pengeluaran Harian",
                Amount = 25000,
                Date = DateTime.UtcNow,
                AccountId = 13,
                PaymentAccountId = 1
            };
            await initController.PostExpense(expense);

            // Act
            using var deleteContext = CreateContext();
            var deleteController = new FinanceController(deleteContext);
            var deleteResult = await deleteController.DeleteExpense(expense.Id);

            // Assert
            Assert.IsType<NoContentResult>(deleteResult);

            using var checkContext = CreateContext();
            var dbExpense = await checkContext.Expenses.FindAsync(expense.Id);
            Assert.Null(dbExpense);

            // Verify journal is deleted
            var journal = await checkContext.JournalEntries
                .FirstOrDefaultAsync(j => j.Reference == $"EXP-{expense.Id}");
            Assert.Null(journal);
        }

        [Fact]
        public async Task PostIncome_WithValidAccounts_CreatesIncomeAndJournalEntry()
        {
            // Arrange
            using var context = CreateContext();
            var controller = new FinanceController(context);

            var newIncome = new Income
            {
                Description = "Sewa Tempat",
                Amount = 120000,
                Date = DateTime.UtcNow,
                AccountId = 9, // Pendapatan Penjualan (Seeded ID = 9)
                PaymentAccountId = 1 // Kas Kecil (Seeded ID = 1)
            };

            // Act
            var result = await controller.PostIncome(newIncome);

            // Assert
            var actionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var createdIncome = Assert.IsType<Income>(actionResult.Value);
            Assert.Equal("Sewa Tempat", createdIncome.Description);

            // Verify journal
            using var checkContext = CreateContext();
            var journal = await checkContext.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference == $"INC-{createdIncome.Id}");

            Assert.NotNull(journal);
            Assert.Equal(2, journal.Lines.Count);

            var debitLine = journal.Lines.First(l => l.Debit > 0);
            var creditLine = journal.Lines.First(l => l.Credit > 0);

            Assert.Equal(1, debitLine.AccountId); // Kas Kecil gets Debited (asset increase)
            Assert.Equal(120000, debitLine.Debit);

            Assert.Equal(9, creditLine.AccountId); // Pendapatan gets Credited (revenue increase)
            Assert.Equal(120000, creditLine.Credit);
        }
    }
}
