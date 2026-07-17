using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CalibrationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CalibrationController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Calibration
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CalibrationLog>>> GetCalibrationLogs()
        {
            return await _context.CalibrationLogs
                .Include(c => c.Trials)
                .Include(c => c.Material)
                .OrderByDescending(c => c.Date)
                .ToListAsync();
        }

        // GET: api/Calibration/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CalibrationLog>> GetCalibrationLog(int id)
        {
            var log = await _context.CalibrationLogs
                .Include(c => c.Trials)
                .Include(c => c.Material)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (log == null)
            {
                return NotFound();
            }

            return log;
        }

        // POST: api/Calibration
        [HttpPost]
        public async Task<ActionResult<CalibrationLog>> PostCalibrationLog(CalibrationLog log)
        {
            _context.CalibrationLogs.Add(log);
            await _context.SaveChangesAsync(); // Save to get the ID

            // Process Stock Deduction and Journal Entry
            if (log.MaterialId.HasValue && log.Trials != null && log.Trials.Any())
            {
                double totalDose = log.Trials.Sum(t => t.Dose);
                
                if (totalDose > 0)
                {
                    var material = await _context.Materials.FindAsync(log.MaterialId.Value);
                    if (material != null)
                    {
                        // 1. Deduct Material Stock
                        material.Stock -= totalDose;
                        _context.Entry(material).State = EntityState.Modified;

                        // 2. FIFO Deduction from MaterialBatch to calculate COGS
                        double totalCost = 0;
                        var batches = await _context.MaterialBatches
                            .Where(b => b.MaterialId == material.Id && b.RemainingQty > 0)
                            .OrderBy(b => b.CreatedAt)
                            .ToListAsync();

                        double remainingNeeded = totalDose;
                        foreach (var batch in batches)
                        {
                            if (remainingNeeded <= 0) break;

                            double qtyToDeduct = System.Math.Min(remainingNeeded, batch.RemainingQty);
                            batch.RemainingQty -= qtyToDeduct;
                            remainingNeeded -= qtyToDeduct;

                            totalCost += qtyToDeduct * batch.UnitPrice;
                            _context.Entry(batch).State = EntityState.Modified;
                        }

                        // 3. Create Journal Entry
                        if (totalCost > 0)
                        {
                            var expenseAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "5120") 
                                ?? new ChartOfAccount { Code = "5120", Name = "Biaya Operasional - Kalibrasi", Type = "EXPENSE" };
                            var inventoryAccount = await _context.ChartOfAccounts.FirstOrDefaultAsync(c => c.Code == "1140") 
                                ?? new ChartOfAccount { Code = "1140", Name = "Persediaan Bahan Baku", Type = "ASSET" };

                            if (expenseAccount.Id == 0) _context.ChartOfAccounts.Add(expenseAccount);
                            if (inventoryAccount.Id == 0) _context.ChartOfAccounts.Add(inventoryAccount);
                            
                            await _context.SaveChangesAsync(); // Save accounts if new

                            var journalEntry = new JournalEntry
                            {
                                Date = log.Date,
                                Reference = $"CALIB-{log.Id:D4}",
                                Description = $"Pemakaian bahan baku kalibrasi espresso ({material.Name} - {totalDose}g)"
                            };

                            journalEntry.Lines.Add(new JournalEntryLine
                            {
                                AccountId = expenseAccount.Id,
                                Debit = totalCost,
                                Credit = 0
                            });

                            journalEntry.Lines.Add(new JournalEntryLine
                            {
                                AccountId = inventoryAccount.Id,
                                Debit = 0,
                                Credit = totalCost
                            });

                            _context.JournalEntries.Add(journalEntry);
                        }

                        await _context.SaveChangesAsync();
                    }
                }
            }

            return CreatedAtAction(nameof(GetCalibrationLog), new { id = log.Id }, log);
        }

        // DELETE: api/Calibration/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCalibrationLog(int id)
        {
            var log = await _context.CalibrationLogs
                .Include(c => c.Trials)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (log == null)
            {
                return NotFound();
            }

            // 1. Revert Stock
            if (log.MaterialId.HasValue && log.Trials != null && log.Trials.Any())
            {
                double totalDose = log.Trials.Sum(t => t.Dose);
                if (totalDose > 0)
                {
                    var material = await _context.Materials.FindAsync(log.MaterialId.Value);
                    if (material != null)
                    {
                        material.Stock += totalDose;
                        _context.Entry(material).State = EntityState.Modified;
                    }
                }
            }

            // 2. Delete associated Journal Entry (if any)
            var journalEntry = await _context.JournalEntries
                .Include(j => j.Lines)
                .FirstOrDefaultAsync(j => j.Reference == $"CALIB-{log.Id:D4}");
                
            if (journalEntry != null)
            {
                _context.JournalEntries.Remove(journalEntry);
            }

            _context.CalibrationLogs.Remove(log);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
