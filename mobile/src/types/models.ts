export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

export interface User {
  id: number;
  username: string;
  fullName: string;
  roleId: number;
  role?: Role;
  isActive: boolean;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  category?: Category;
  recipeItems?: RecipeItem[];
  image?: string;
  availableCount?: number;
  missingMaterials?: string[];
}

export interface Material {
  id: number;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  costPerUnit: number;
  lastUpdated: string;
}

export interface MaterialBatch {
  id: number;
  materialId: number;
  purchaseItemId: number;
  originalQty: number;
  remainingQty: number;
  unitPrice: number;
  createdAt: string;
}

export interface RecipeItem {
  id: number;
  productId: number;
  materialId: number;
  material?: Material;
  quantity: number;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  queueNumber: number;
  customerName?: string;
  totalAmount: number;
  status: string;
  couponCode?: string;
  discountAmount?: number;
  paymentMethod: string;
  paymentUrl?: string;
  snapToken?: string;
  paymentStatus?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  materialId: number;
  material?: Material;
  quantity: number;
  price: number;
}

export interface Purchase {
  id: number;
  purchaseNo: string;
  supplierName: string;
  totalAmount: number;
  status: string;
  receiptUrl?: string;
  createdAt: string;
  items: PurchaseItem[];
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  imageUrl?: string;
  date: string;
  accountId: number;
  paymentAccountId: number;
  account?: ChartOfAccount;
  paymentAccount?: ChartOfAccount;
}

export interface Income {
  id: number;
  description: string;
  amount: number;
  imageUrl?: string;
  date: string;
  accountId: number;
  paymentAccountId: number;
  account?: ChartOfAccount;
  paymentAccount?: ChartOfAccount;
}

export interface Coupon {
  id: number;
  code: string;
  type: 'FIXED' | 'PERCENTAGE';
  value: number;
  minPurchase: number;
  maxDiscount: number;
  maxUsage: number;
  currentUsage: number;
  isActive: boolean;
}

export interface ChartOfAccount {
  id: number;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
  isActive: boolean;
}

export interface JournalEntry {
  id: number;
  date: string;
  reference: string;
  description: string;
  lines: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: number;
  journalEntryId: number;
  accountId: number;
  account?: ChartOfAccount;
  debit: number;
  credit: number;
}

export interface Setting {
  key: string;
  value: string;
  dataType: string;
}

export interface RnDRecipe {
  id: number;
  name: string;
  description: string;
  targetCost: number;
  actualCost: number;
  sellingPrice: number;
  targetCostType: string;
  targetCostValue: number;
  notes: string;
  status: 'Draft' | 'Tested' | 'Approved' | 'Rejected';
  ingredients: RnDRecipeIngredient[];
  testHistories: RnDTestHistory[];
}

export interface RnDRecipeIngredient {
  id: number;
  rndRecipeId: number;
  materialId: number;
  material?: Material;
  quantity: number;
  unit: string;
  costPerUnit: number;
  subtotal: number;
}

export interface RnDTestHistory {
  id: number;
  rndRecipeId: number;
  testVersion: number;
  ingredientsSnapshot: string;
  actualCost: number;
  notes: string;
  testedAt: string;
}

export interface DashboardData {
  todayRevenue: number;
  todayTransactions: number;
  topProducts: { name: string; count: number }[];
  salesTrend: { date: string; revenue: number }[];
  lowStockAlerts: { name: string; stock: number; minStock: number; unit: string }[];
}

export interface ProfitLossData {
  revenues: { accountName: string; amount: number }[];
  expenses: { accountName: string; amount: number }[];
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
}
