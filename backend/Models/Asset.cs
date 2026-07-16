using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace backend.Models
{
    public class Asset
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string Code { get; set; } = string.Empty;
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        [Required]
        public DateTime PurchaseDate { get; set; }
        
        [Required]
        public double PurchasePrice { get; set; }
        
        public double SalvageValue { get; set; } = 0;
        
        [Required]
        public int UsefulLifeInYears { get; set; } = 5;
        
        [Required]
        public int AssetAccountId { get; set; } // e.g. Fixed Asset COA (Code 1200)
        [ForeignKey("AssetAccountId")]
        public ChartOfAccount? AssetAccount { get; set; }
        
        [Required]
        public int PaymentAccountId { get; set; } // Cash/Bank or AP COA
        [ForeignKey("PaymentAccountId")]
        public ChartOfAccount? PaymentAccount { get; set; }

        [Required]
        public int AccumulatedDepreciationAccountId { get; set; } // e.g. Accum. Depreciation (Code 1250)
        [ForeignKey("AccumulatedDepreciationAccountId")]
        public ChartOfAccount? AccumulatedDepreciationAccount { get; set; }

        [Required]
        public int DepreciationExpenseAccountId { get; set; } // e.g. Depreciation Expense (Code 6140)
        [ForeignKey("DepreciationExpenseAccountId")]
        public ChartOfAccount? DepreciationExpenseAccount { get; set; }
        
        public double AccumulatedDepreciation { get; set; } = 0;
        public double BookValue { get; set; } // PurchasePrice - AccumulatedDepreciation
        
        public string Status { get; set; } = "ACTIVE"; // ACTIVE, DISPOSED
        
        public DateTime? DisposalDate { get; set; }
        public double? DisposalPrice { get; set; } // Cash received if sold
        public int? DisposalAccountId { get; set; } // Cash/Bank COA for disposal proceeds
        [ForeignKey("DisposalAccountId")]
        public ChartOfAccount? DisposalAccount { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
