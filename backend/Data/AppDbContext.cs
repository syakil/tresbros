using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Income> Incomes { get; set; }
        public DbSet<Material> Materials { get; set; }
        public DbSet<Purchase> Purchases { get; set; }
        public DbSet<PurchaseItem> PurchaseItems { get; set; }
        public DbSet<RecipeItem> RecipeItems { get; set; }
        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<MidtransLog> MidtransLogs { get; set; }
        
        public DbSet<Setting> Settings { get; set; }
        public DbSet<ChartOfAccount> ChartOfAccounts { get; set; }
        public DbSet<JournalEntry> JournalEntries { get; set; }
        public DbSet<JournalEntryLine> JournalEntryLines { get; set; }
        public DbSet<MaterialBatch> MaterialBatches { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<RnDRecipe> RnDRecipes { get; set; }
        public DbSet<RnDRecipeIngredient> RnDRecipeIngredients { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Category>().HasIndex(c => c.Name).IsUnique();
            modelBuilder.Entity<Purchase>().HasIndex(p => p.PurchaseNo).IsUnique();
            modelBuilder.Entity<Coupon>().HasIndex(c => c.Code).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
            
            // Default Data Seeding
            modelBuilder.Entity<Role>().HasData(
                new Role 
                { 
                    Id = 1, 
                    Name = "Super Admin", 
                    Description = "Akses Penuh", 
                    Permissions = "[\"dashboard\",\"pos\",\"kds\",\"inventory\",\"purchases\",\"accounting\",\"settings\"]", 
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) 
                }
            );

            modelBuilder.Entity<User>().HasData(
                new User 
                { 
                    Id = 1, 
                    Username = "admin", 
                    Password = "password", 
                    FullName = "Administrator", 
                    RoleId = 1, 
                    IsActive = true, 
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) 
                }
            );

            // COA Data Seeding
            modelBuilder.Entity<ChartOfAccount>().HasData(
                new ChartOfAccount { Id = 1, Code = "1110", Name = "Kas Kecil (Cash on Hand)", Type = "ASSET", IsActive = true },
                new ChartOfAccount { Id = 2, Code = "1120", Name = "Piutang Payment Gateway (Midtrans)", Type = "ASSET", IsActive = true },
                new ChartOfAccount { Id = 3, Code = "1130", Name = "Kas di Bank", Type = "ASSET", IsActive = true },
                new ChartOfAccount { Id = 4, Code = "1140", Name = "Persediaan Bahan Baku", Type = "ASSET", IsActive = true },
                new ChartOfAccount { Id = 5, Code = "2110", Name = "Hutang Usaha (AP)", Type = "LIABILITY", IsActive = true },
                new ChartOfAccount { Id = 6, Code = "2120", Name = "Hutang Pajak (PB1)", Type = "LIABILITY", IsActive = true },
                new ChartOfAccount { Id = 7, Code = "3110", Name = "Modal Pemilik", Type = "EQUITY", IsActive = true },
                new ChartOfAccount { Id = 8, Code = "3120", Name = "Laba Ditahan", Type = "EQUITY", IsActive = true },
                new ChartOfAccount { Id = 9, Code = "4110", Name = "Pendapatan Penjualan", Type = "REVENUE", IsActive = true },
                new ChartOfAccount { Id = 10, Code = "4120", Name = "Diskon & Promo", Type = "REVENUE", IsActive = true },
                new ChartOfAccount { Id = 11, Code = "5110", Name = "Harga Pokok Penjualan (HPP)", Type = "EXPENSE", IsActive = true },
                new ChartOfAccount { Id = 12, Code = "5120", Name = "Biaya Admin Payment Gateway", Type = "EXPENSE", IsActive = true },
                new ChartOfAccount { Id = 13, Code = "6110", Name = "Beban Operasional", Type = "EXPENSE", IsActive = true }
            );

            // Set timestamp columns if needed for PostgreSQL (PostgreSQL requires UTC for timestamps)
            base.OnModelCreating(modelBuilder);
        }
    }
}
