import { test, expect } from '@playwright/test';

test.describe('Tresbros SaaS ERP E2E Flow', () => {

  test('should login and navigate through all main menus, and record an expense', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('/login');
    
    // Fill credentials
    await page.fill('input[placeholder="Enter your username"]', 'admin');
    await page.fill('input[placeholder="Enter your password"]', 'password');
    
    // Click Sign In
    await page.click('button[type="submit"]');
    
    // Wait for redirect to Dashboard
    await page.waitForURL('**/admin/dashboard');
    await expect(page.locator('h1:has-text("Sales & Profit/Loss Report")')).toBeVisible();

    // 2. Navigate to Inventory Page
    await page.goto('/admin/inventory');
    await expect(page.locator('h1:has-text("Stock Management")')).toBeVisible();

    // 3. Navigate to Expenses Page and Record an Expense
    await page.goto('/admin/expenses');
    await expect(page.locator('h2:has-text("Add Expense")')).toBeVisible();

    // Fill Expense Details
    await page.fill('input[placeholder="Expense description..."]', 'E2E Test Buy Coffee Beans');
    await page.fill('input[placeholder="50000"]', '75000');

    // Select COA Expense Account using CustomSelect
    await page.click('text=-- Select Expense Account --');
    await page.click('text=6110 - Beban Operasional');

    // Select COA Payment/Cash Account using CustomSelect
    await page.click('text=-- Select Payment/Cash Account --');
    await page.click('text=1110 - Kas Kecil (Cash on Hand)');

    // Submit Expense
    await page.click('button:has-text("Save Expense")');

    // Verify Expense is visible in history table
    await expect(page.locator('text=E2E Test Buy Coffee Beans').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Category: 6110 - Beban Operasional').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Paid via: 1110 - Kas Kecil (Cash on Hand)').first()).toBeVisible({ timeout: 15000 });

    // 4. Navigate to Incomes Page
    await page.goto('/admin/incomes');
    await expect(page.locator('h2:has-text("Add Income")')).toBeVisible();

    // 5. Navigate to Accounting Pages
    await page.goto('/admin/accounting/coa');
    await expect(page.locator('h1:has-text("Chart of Accounts")')).toBeVisible();

    await page.goto('/admin/accounting/journals');
    await expect(page.locator('h1:has-text("Financial Journals")')).toBeVisible();

    await page.goto('/admin/accounting/ledger');
    await expect(page.locator('h1:has-text("General Ledger")')).toBeVisible();

    await page.goto('/admin/accounting/profit-loss');
    await expect(page.locator('h1:has-text("Profit & Loss")')).toBeVisible();
  });
});
