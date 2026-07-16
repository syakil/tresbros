using backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseSentry();

// Add services to the container.
builder.Services.AddControllers(options =>
{
    var policy = new AuthorizationPolicyBuilder()
                     .RequireAuthenticatedUser()
                     .Build();
    options.Filters.Add(new AuthorizeFilter(policy));
}).AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Entity Framework Core to use PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"] ?? "TresbrosSuperSecretKeyForJwtAuthentication2026");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        ClockSkew = TimeSpan.Zero
    };
});

var app = builder.Build();

// Apply database migrations automatically at startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    try
    {
        var taxSetting = db.Settings.FirstOrDefault(s => s.Key == "TAX_ENABLED");
        if (taxSetting == null)
        {
            db.Settings.Add(new backend.Models.Setting { Key = "TAX_ENABLED", Value = "true", DataType = "bool" });
            db.SaveChanges();
            System.Console.WriteLine("[SETTINGS SEED] TAX_ENABLED initialized to true.");
        }

        // Seed basic Chart of Accounts if empty
        if (!db.ChartOfAccounts.Any())
        {
            db.ChartOfAccounts.AddRange(
                new backend.Models.ChartOfAccount { Code = "1110", Name = "Kas Kecil", Type = "ASSET" },
                new backend.Models.ChartOfAccount { Code = "1120", Name = "Bank / Piutang Midtrans", Type = "ASSET" },
                new backend.Models.ChartOfAccount { Code = "1200", Name = "Aset Tetap (Fixed Asset)", Type = "ASSET" },
                new backend.Models.ChartOfAccount { Code = "1250", Name = "Akumulasi Penyusutan", Type = "ASSET" },
                new backend.Models.ChartOfAccount { Code = "2110", Name = "Hutang Usaha", Type = "LIABILITY" },
                new backend.Models.ChartOfAccount { Code = "3110", Name = "Modal Pemilik", Type = "EQUITY" },
                new backend.Models.ChartOfAccount { Code = "4110", Name = "Pendapatan Penjualan", Type = "REVENUE" },
                new backend.Models.ChartOfAccount { Code = "4120", Name = "Diskon & Promo", Type = "REVENUE" },
                new backend.Models.ChartOfAccount { Code = "5100", Name = "Harga Pokok Penjualan (HPP)", Type = "EXPENSE" },
                new backend.Models.ChartOfAccount { Code = "5150", Name = "Selisih Pembulatan", Type = "EXPENSE" },
                new backend.Models.ChartOfAccount { Code = "6140", Name = "Beban Penyusutan", Type = "EXPENSE" }
            );
            db.SaveChanges();
            System.Console.WriteLine("[COA SEED] Chart of Accounts initialized.");
        }
    }
    catch (System.Exception ex)
    {
        System.Console.WriteLine($"Error seeding database: {ex.Message}");
    }

    try
    {
        // Reconcile and fix orphan batches for cancelled purchases
        var orphanBatches = db.MaterialBatches
            .Include(b => b.PurchaseItem)
            .ThenInclude(pi => pi.Purchase)
            .Where(b => b.PurchaseItem != null && b.PurchaseItem.Purchase != null && b.PurchaseItem.Purchase.Status == "CANCELLED")
            .ToList();

        if (orphanBatches.Any())
        {
            var affectedMaterialIds = orphanBatches.Select(b => b.MaterialId).Distinct().ToList();
            
            db.MaterialBatches.RemoveRange(orphanBatches);
            db.SaveChanges();

            // Recalculate CostPerUnit for each affected material
            foreach (var materialId in affectedMaterialIds)
            {
                var material = db.Materials.Find(materialId);
                if (material != null)
                {
                    var remainingBatches = db.MaterialBatches
                        .Where(b => b.MaterialId == materialId && b.RemainingQty > 0)
                        .ToList();

                    double totalValue = remainingBatches.Sum(b => b.RemainingQty * b.UnitPrice);
                    double totalStock = remainingBatches.Sum(b => b.RemainingQty);

                    material.CostPerUnit = totalStock > 0 ? totalValue / totalStock : 0;
                    db.Entry(material).State = EntityState.Modified;
                }
            }
            db.SaveChanges();
        }
    }
    catch (System.Exception ex)
    {
        System.Console.WriteLine($"Error reconciling database stocks: {ex.Message}");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
