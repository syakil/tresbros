using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Category
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
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
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<RecipeItem> RecipeItems { get; set; } = new List<RecipeItem>();
    }

    public class Order
    {
        [Key]
        public int Id { get; set; }
        public string? CustomerName { get; set; }
        public double TotalAmount { get; set; }
        public string Status { get; set; } = "TODO";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CouponCode { get; set; }
        public double DiscountAmount { get; set; } = 0;
        public string PaymentMethod { get; set; } = "CASH";
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
    }

    public class Material
    {
        [Key]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public double Stock { get; set; }
        public double MinStock { get; set; }
        public string Unit { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public ICollection<PurchaseItem> PurchaseItems { get; set; } = new List<PurchaseItem>();
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
}
