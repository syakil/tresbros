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
    public class AssetControllerTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly DbContextOptions<AppDbContext> _contextOptions;

        public AssetControllerTests()
        {
            _connection = new SqliteConnection("Filename=:memory:");
            _connection.Open();

            _contextOptions = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlite(_connection)
                .Options;

            using var context = new AppDbContext(_contextOptions);
            context.Database.EnsureCreated();
        }

        public void Dispose()
        {
            _connection.Dispose();
        }

        private AppDbContext CreateContext() => new AppDbContext(_contextOptions);

        [Fact]
        public async Task PostAsset_CreatesAssetAndPurchaseJournalEntry()
        {
            // Arrange
            using var context = CreateContext();
            var controller = new AssetController(context);

            var newAsset = new Asset
            {
                Code = "AST-0001",
                Name = "Mesin Kopi Espresso",
                Description = "La Marzocco Linea Classic",
                PurchaseDate = DateTime.UtcNow,
                PurchasePrice = 80000000,
                SalvageValue = 8000000,
                UsefulLifeInYears = 5,
                AssetAccountId = 15, // Aset Tetap (Seeded ID = 15)
                PaymentAccountId = 3, // Kas di Bank (Seeded ID = 3)
                AccumulatedDepreciationAccountId = 16, // Akumulasi Penyusutan (Seeded ID = 16)
                DepreciationExpenseAccountId = 17 // Beban Penyusutan (Seeded ID = 17)
            };

            // Act
            var result = await controller.PostAsset(newAsset);

            // Assert
            var actionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
            var createdAsset = Assert.IsType<Asset>(actionResult.Value);
            Assert.Equal("Mesin Kopi Espresso", createdAsset.Name);
            Assert.Equal(80000000, createdAsset.BookValue);

            // Verify in DB
            using var checkContext = CreateContext();
            var dbAsset = await checkContext.Assets.FindAsync(createdAsset.Id);
            Assert.NotNull(dbAsset);
            Assert.Equal("ACTIVE", dbAsset.Status);

            // Verify general ledger journal entry
            var journal = await checkContext.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference == $"AST-PUR-{dbAsset.Id}");

            Assert.NotNull(journal);
            Assert.Equal(2, journal.Lines.Count);

            var debitLine = journal.Lines.First(l => l.Debit > 0);
            var creditLine = journal.Lines.First(l => l.Credit > 0);

            Assert.Equal(15, debitLine.AccountId); // Aset Tetap (AssetAccount)
            Assert.Equal(80000000, debitLine.Debit);

            Assert.Equal(3, creditLine.AccountId); // Kas di Bank (PaymentAccount)
            Assert.Equal(80000000, creditLine.Credit);

            // Verify account balances updated
            var assetAccount = await checkContext.ChartOfAccounts.FindAsync(15);
            var bankAccount = await checkContext.ChartOfAccounts.FindAsync(3);
            Assert.Equal(80000000, assetAccount!.Balance);
            Assert.Equal(-80000000, bankAccount!.Balance); // Credit decreases bank asset balance
        }

        [Fact]
        public async Task DepreciateAsset_UpdatesAssetAndJournalEntry()
        {
            // Arrange
            using var initContext = CreateContext();
            var initController = new AssetController(initContext);

            var asset = new Asset
            {
                Code = "AST-0002",
                Name = "Komputer Kasir",
                PurchaseDate = DateTime.UtcNow,
                PurchasePrice = 12000000,
                SalvageValue = 2000000,
                UsefulLifeInYears = 5,
                AssetAccountId = 15,
                PaymentAccountId = 3,
                AccumulatedDepreciationAccountId = 16,
                DepreciationExpenseAccountId = 17
            };

            await initController.PostAsset(asset);

            // Act - Depreciate by 1,000,000
            using var depreciateContext = CreateContext();
            var depreciateController = new AssetController(depreciateContext);
            var depreciateRequest = new DepreciateRequest
            {
                Amount = 1000000,
                Date = DateTime.UtcNow,
                Description = "Penyusutan Bulan 1"
            };

            var depreciateResult = await depreciateController.DepreciateAsset(asset.Id, depreciateRequest);

            // Assert
            var actionResult = Assert.IsType<OkObjectResult>(depreciateResult);
            var updatedAsset = Assert.IsType<Asset>(actionResult.Value);
            Assert.Equal(1000000, updatedAsset.AccumulatedDepreciation);
            Assert.Equal(11000000, updatedAsset.BookValue);

            // Verify in DB and Journal Entry
            using var checkContext = CreateContext();
            var dbAsset = await checkContext.Assets.FindAsync(asset.Id);
            Assert.Equal(1000000, dbAsset!.AccumulatedDepreciation);

            var journal = await checkContext.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference.StartsWith($"AST-DEP-{asset.Id}"));

            Assert.NotNull(journal);
            Assert.Equal(2, journal.Lines.Count);

            var debitLine = journal.Lines.First(l => l.Debit > 0);
            var creditLine = journal.Lines.First(l => l.Credit > 0);

            Assert.Equal(17, debitLine.AccountId); // Beban Penyusutan
            Assert.Equal(1000000, debitLine.Debit);

            Assert.Equal(16, creditLine.AccountId); // Akumulasi Penyusutan
            Assert.Equal(1000000, creditLine.Credit);

            // Verify COA Balance updates
            var accumAccount = await checkContext.ChartOfAccounts.FindAsync(16);
            var expAccount = await checkContext.ChartOfAccounts.FindAsync(17);
            Assert.Equal(-1000000, accumAccount!.Balance);
            Assert.Equal(1000000, expAccount!.Balance);
        }

        [Fact]
        public async Task DisposeAsset_WithGain_CreatesJournalEntries()
        {
            // Arrange
            using var initContext = CreateContext();
            var initController = new AssetController(initContext);

            var asset = new Asset
            {
                Code = "AST-0003",
                Name = "Kendaraan Operasional",
                PurchaseDate = DateTime.UtcNow,
                PurchasePrice = 200000000,
                SalvageValue = 20000000,
                UsefulLifeInYears = 5,
                AssetAccountId = 15,
                PaymentAccountId = 3,
                AccumulatedDepreciationAccountId = 16,
                DepreciationExpenseAccountId = 17
            };

            await initController.PostAsset(asset);

            // Depreciate by 50,000,000 first
            using var deprContext = CreateContext();
            var deprController = new AssetController(deprContext);
            await deprController.DepreciateAsset(asset.Id, new DepreciateRequest { Amount = 50000000, Date = DateTime.UtcNow, Description = "Penyusutan Awal" });

            // Act - Dispose/Sell asset for 160,000,000 (Book Value = 150,000,000, so Gain = 10,000,000)
            using var disposeContext = CreateContext();
            var disposeController = new AssetController(disposeContext);
            var disposeResult = await disposeController.DisposeAsset(asset.Id, 160000000, 3, DateTime.UtcNow, "Penjualan Mobil");

            // Assert
            Assert.IsType<NoContentResult>(disposeResult);

            using var checkContext = CreateContext();
            var dbAsset = await checkContext.Assets.FindAsync(asset.Id);
            Assert.Equal("DISPOSED", dbAsset!.Status);
            Assert.Equal(160000000, dbAsset.DisposalPrice);

            // Verify Journal Entry:
            // Debit: Accum. Depreciation (16) = 50M
            // Debit: Cash/Bank (3) = 160M
            // Credit: Fixed Asset (15) = 200M
            // Credit: Gain/Loss on Disposal (18) = 10M
            var journal = await checkContext.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference == $"AST-DIS-{asset.Id}");

            Assert.NotNull(journal);
            Assert.Equal(4, journal.Lines.Count);

            var deprLine = journal.Lines.First(l => l.AccountId == 16);
            Assert.Equal(50000000, deprLine.Debit);
            Assert.Equal(0, deprLine.Credit);

            var cashLine = journal.Lines.First(l => l.AccountId == 3 && l.Debit > 0);
            Assert.Equal(160000000, cashLine.Debit);

            var assetLine = journal.Lines.First(l => l.AccountId == 15);
            Assert.Equal(0, assetLine.Debit);
            Assert.Equal(200000000, assetLine.Credit);

            var gainLine = journal.Lines.First(l => l.AccountId == 18);
            Assert.Equal(0, gainLine.Debit);
            Assert.Equal(10000000, gainLine.Credit);
        }

        [Fact]
        public async Task DisposeAsset_WithLoss_CreatesJournalEntries()
        {
            // Arrange
            using var initContext = CreateContext();
            var initController = new AssetController(initContext);

            var asset = new Asset
            {
                Code = "AST-0004",
                Name = "Laptop Kerja",
                PurchaseDate = DateTime.UtcNow,
                PurchasePrice = 10000000,
                SalvageValue = 1000000,
                UsefulLifeInYears = 3,
                AssetAccountId = 15,
                PaymentAccountId = 3,
                AccumulatedDepreciationAccountId = 16,
                DepreciationExpenseAccountId = 17
            };

            await initController.PostAsset(asset);

            // Depreciate by 4,000,000 first
            using var deprContext = CreateContext();
            var deprController = new AssetController(deprContext);
            await deprController.DepreciateAsset(asset.Id, new DepreciateRequest { Amount = 4000000, Date = DateTime.UtcNow, Description = "Penyusutan Laptop" });

            // Act - Dispose/Sell asset for 4,000,000 (Book Value = 6,000,000, so Loss = 2,000,000)
            using var disposeContext = CreateContext();
            var disposeController = new AssetController(disposeContext);
            var disposeResult = await disposeController.DisposeAsset(asset.Id, 4000000, 3, DateTime.UtcNow, "Penjualan Laptop Rusak");

            // Assert
            Assert.IsType<NoContentResult>(disposeResult);

            using var checkContext = CreateContext();
            var dbAsset = await checkContext.Assets.FindAsync(asset.Id);
            Assert.Equal("DISPOSED", dbAsset!.Status);
            Assert.Equal(4000000, dbAsset.DisposalPrice);

            // Verify Journal Entry:
            // Debit: Accum. Depreciation (16) = 4M
            // Debit: Cash/Bank (3) = 4M
            // Debit: Gain/Loss on Disposal (18) = 2M
            // Credit: Fixed Asset (15) = 10M
            var journal = await checkContext.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference == $"AST-DIS-{asset.Id}");

            Assert.NotNull(journal);
            Assert.Equal(4, journal.Lines.Count);

            var deprLine = journal.Lines.First(l => l.AccountId == 16);
            Assert.Equal(4000000, deprLine.Debit);
            Assert.Equal(0, deprLine.Credit);

            var cashLine = journal.Lines.First(l => l.AccountId == 3 && l.Debit > 0);
            Assert.Equal(4000000, cashLine.Debit);

            var lossLine = journal.Lines.First(l => l.AccountId == 18);
            Assert.Equal(2000000, lossLine.Debit);
            Assert.Equal(0, lossLine.Credit);

            var assetLine = journal.Lines.First(l => l.AccountId == 15);
            Assert.Equal(0, assetLine.Debit);
            Assert.Equal(10000000, assetLine.Credit);
        }
    }
}
