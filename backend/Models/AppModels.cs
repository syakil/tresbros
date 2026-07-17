using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace backend.Models
{
    public class Category
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        
        [JsonIgnore]
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }

    public class Product
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public double Price { get; set; }
        public int CategoryId { get; set; }
        
        [ForeignKey("CategoryId")]
        public Category? Category { get; set; }
        
        [JsonIgnore]
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<RecipeItem> RecipeItems { get; set; } = new List<RecipeItem>();
    }

    public class Order
    {
        [Key]
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public int QueueNumber { get; set; }
        public string? CustomerName { get; set; }
        public double TotalAmount { get; set; }
        public string Status { get; set; } = "TODO";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CouponCode { get; set; }
        public double DiscountAmount { get; set; } = 0;
        public string PaymentMethod { get; set; } = "CASH";
        
        // Midtrans Fields
        public string? PaymentUrl { get; set; }
        public string? SnapToken { get; set; }
        public string PaymentStatus { get; set; } = "pending";

        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }

    public class OrderItem
    {
        [Key]
        public int Id { get; set; }
        public int OrderId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public double Price { get; set; }
        public string? Notes { get; set; }
        
        [ForeignKey("ProductId")]
        public Product? Product { get; set; }
        
        [ForeignKey("OrderId")]
        [JsonIgnore]
        public Order? Order { get; set; }
    }

    public class Expense
    {
        [Key]
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public double Amount { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int? AccountId { get; set; }
        [ForeignKey("AccountId")]
        public ChartOfAccount? Account { get; set; }

        public int? PaymentAccountId { get; set; }
        [ForeignKey("PaymentAccountId")]
        public ChartOfAccount? PaymentAccount { get; set; }
    }

    public class Income
    {
        [Key]
        public int Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public double Amount { get; set; }
        public string? ImageUrl { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int? AccountId { get; set; }
        [ForeignKey("AccountId")]
        public ChartOfAccount? Account { get; set; }

        public int? PaymentAccountId { get; set; }
        [ForeignKey("PaymentAccountId")]
        public ChartOfAccount? PaymentAccount { get; set; }
    }

    public class Material
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public double Stock { get; set; }
        public double MinStock { get; set; }
        public string Unit { get; set; } = string.Empty;
        public double CostPerUnit { get; set; } = 0;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        
        [JsonIgnore]
        public ICollection<PurchaseItem> PurchaseItems { get; set; } = new List<PurchaseItem>();
        
        [JsonIgnore]
        public ICollection<RecipeItem> RecipeItems { get; set; } = new List<RecipeItem>();
    }

    public class Purchase
    {
        [Key]
        public int Id { get; set; }
        public string PurchaseNo { get; set; } = string.Empty;
        public string SupplierName { get; set; } = string.Empty;
        public double TotalAmount { get; set; }
        public string Status { get; set; } = "COMPLETED";
        public string? ReceiptUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ICollection<PurchaseItem> Items { get; set; } = new List<PurchaseItem>();
    }

    public class PurchaseItem
    {
        [Key]
        public int Id { get; set; }
        public int PurchaseId { get; set; }
        public int MaterialId { get; set; }
        public double Quantity { get; set; }
        public double Price { get; set; }
        
        [ForeignKey("MaterialId")]
        public Material? Material { get; set; }
        
        [ForeignKey("PurchaseId")]
        [JsonIgnore]
        public Purchase? Purchase { get; set; }
    }

    public class RecipeItem
    {
        [Key]
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int MaterialId { get; set; }
        public double Quantity { get; set; }
        
        [ForeignKey("MaterialId")]
        public Material? Material { get; set; }
        
        [ForeignKey("ProductId")]
        [JsonIgnore]
        public Product? Product { get; set; }
    }

    public class Coupon
    {
        [Key]
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public double Value { get; set; }
        public double MinPurchase { get; set; } = 0;
        public double? MaxDiscount { get; set; }
        public int MaxUsage { get; set; }
        public int CurrentUsage { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class MidtransLog
    {
        [Key]
        public int Id { get; set; }
        public string OrderId { get; set; } = string.Empty;
        public string TransactionStatus { get; set; } = string.Empty;
        public string FraudStatus { get; set; } = string.Empty;
        public string RawPayload { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
    public class Setting
    {
        [Key]
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string DataType { get; set; } = "string"; // bool, string, int, float
    }

    public class ChartOfAccount
    {
        [Key]
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
        public double Balance { get; set; } = 0;
        public bool IsActive { get; set; } = true;
    }

    public class JournalEntry
    {
        [Key]
        public int Id { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string Reference { get; set; } = string.Empty; // e.g. OrderNo or PurchaseNo
        public string Description { get; set; } = string.Empty;
        
        public ICollection<JournalEntryLine> Lines { get; set; } = new List<JournalEntryLine>();
    }

    public class JournalEntryLine
    {
        [Key]
        public int Id { get; set; }
        public int JournalEntryId { get; set; }
        public int AccountId { get; set; }
        public double Debit { get; set; } = 0;
        public double Credit { get; set; } = 0;

        [ForeignKey("JournalEntryId")]
        [JsonIgnore]
        public JournalEntry? JournalEntry { get; set; }

        [ForeignKey("AccountId")]
        public ChartOfAccount? Account { get; set; }
    }

    public class MaterialBatch
    {
        [Key]
        public int Id { get; set; }
        public int MaterialId { get; set; }
        public int? PurchaseItemId { get; set; } // Can be null if it's the initial/legacy stock
        public double OriginalQty { get; set; }
        public double RemainingQty { get; set; }
        public double UnitPrice { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("MaterialId")]
        public Material? Material { get; set; }

        [ForeignKey("PurchaseItemId")]
        public PurchaseItem? PurchaseItem { get; set; }
    }

    public class Role
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Permissions { get; set; } = "[]"; // JSON array of allowed modules
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class User
    {
        [Key]
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        
        public int RoleId { get; set; }
        [ForeignKey("RoleId")]
        public Role? Role { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
    public class RnDRecipe
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double TargetCost { get; set; } = 0;
        public double ActualCost { get; set; } = 0;
        public double SellingPrice { get; set; } = 0;
        public string TargetCostType { get; set; } = "nominal"; // nominal, percentage
        public double TargetCostValue { get; set; } = 0;
        public string Notes { get; set; } = string.Empty;
        public string Status { get; set; } = "Draft"; // Draft, Tested, Approved, Rejected
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<RnDRecipeIngredient> Ingredients { get; set; } = new List<RnDRecipeIngredient>();
        public ICollection<RnDTestHistory> TestHistories { get; set; } = new List<RnDTestHistory>();
    }

    public class RnDTestHistory
    {
        [Key]
        public int Id { get; set; }
        public int RnDRecipeId { get; set; }
        public string TestVersion { get; set; } = string.Empty; // e.g., "Test #1"
        public string IngredientsSnapshot { get; set; } = "[]"; // JSON string of ingredients used
        public double ActualCost { get; set; } = 0;
        public string Notes { get; set; } = string.Empty; // User feedback after tasting
        public DateTime TestedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("RnDRecipeId")]
        [JsonIgnore]
        public RnDRecipe? RnDRecipe { get; set; }
    }

    public class RnDRecipeIngredient
    {
        [Key]
        public int Id { get; set; }
        public int RnDRecipeId { get; set; }
        public int MaterialId { get; set; }
        public double Quantity { get; set; }
        public string Unit { get; set; } = string.Empty;
        public double CostPerUnit { get; set; } = 0;
        public double Subtotal => Quantity * CostPerUnit;

        [ForeignKey("RnDRecipeId")]
        [JsonIgnore]
        public RnDRecipe? RnDRecipe { get; set; }

        [ForeignKey("MaterialId")]
        public Material? Material { get; set; }
    }
    public class ClosingPeriod
    {
        [Key]
        public int Id { get; set; }
        public string PeriodType { get; set; } = string.Empty; // DAY, MONTH, YEAR
        public DateTime PeriodDate { get; set; } // The actual date or first day of the month/year being closed
        public DateTime ClosedAt { get; set; } = DateTime.UtcNow;
        public string ClosedBy { get; set; } = string.Empty;
        public double TotalRevenue { get; set; } = 0;
        public double TotalExpense { get; set; } = 0;
        public string Notes { get; set; } = string.Empty;
    }

    public class CalibrationLog
    {
        [Key]
        public int Id { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string Shift { get; set; } = "Pagi"; // Pagi, Siang/Malam
        public string BaristaName { get; set; } = string.Empty;
        public string BeansName { get; set; } = string.Empty; // Legacy
        
        public int? MaterialId { get; set; }
        [ForeignKey("MaterialId")]
        public Material? Material { get; set; }

        public ICollection<CalibrationTrial> Trials { get; set; } = new List<CalibrationTrial>();
    }

    public class CalibrationTrial
    {
        [Key]
        public int Id { get; set; }
        public int CalibrationLogId { get; set; }
        public int TrialNumber { get; set; }
        public string GrindSize { get; set; } = string.Empty;
        public double Dose { get; set; }
        public double Yield { get; set; }
        public int Time { get; set; } // in seconds
        
        // Sensory Evaluation (bool flags)
        public bool Sweetness { get; set; }
        public bool Body { get; set; }
        public bool Clean { get; set; }
        public bool MilkMatch { get; set; }
        
        // Final Status
        public bool Passed { get; set; }
        
        [ForeignKey("CalibrationLogId")]
        [JsonIgnore]
        public CalibrationLog? CalibrationLog { get; set; }
    }
}
