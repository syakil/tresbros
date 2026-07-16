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
        public DbSet<RnDTestHistory> RnDTestHistories { get; set; }
        public DbSet<Asset> Assets { get; set; }

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


            // Set timestamp columns if needed for PostgreSQL (PostgreSQL requires UTC for timestamps)
            base.OnModelCreating(modelBuilder);
        }
    }
}
