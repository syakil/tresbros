import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  price: z.number().min(0, 'Harga harus lebih dari 0'),
  categoryId: z.number().min(1, 'Kategori wajib dipilih'),
});

export const materialSchema = z.object({
  name: z.string().min(1, 'Nama bahan wajib diisi'),
  stock: z.number().min(0),
  minStock: z.number().min(0),
  unit: z.string().min(1, 'Satuan wajib diisi'),
  costPerUnit: z.number().min(0),
});

export const purchaseSchema = z.object({
  supplierName: z.string().min(1, 'Nama supplier wajib diisi'),
  items: z
    .array(
      z.object({
        materialId: z.number().min(1),
        quantity: z.number().min(0.01, 'Jumlah harus lebih dari 0'),
        price: z.number().min(0, 'Harga harus lebih dari 0'),
      })
    )
    .min(1, 'Minimal 1 item'),
});

export const expenseSchema = z.object({
  description: z.string().min(1, 'Deskripsi wajib diisi'),
  amount: z.number().min(1, 'Jumlah harus lebih dari 0'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  accountId: z.number().min(1, 'Akun wajib dipilih'),
  paymentAccountId: z.number().min(1, 'Akun pembayaran wajib dipilih'),
});

export const userSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
  password: z.string().min(4, 'Password minimal 4 karakter').optional(),
  roleId: z.number().min(1, 'Role wajib dipilih'),
});

export const couponSchema = z.object({
  code: z.string().min(1, 'Kode kupon wajib diisi'),
  type: z.enum(['FIXED', 'PERCENTAGE']),
  value: z.number().min(1, 'Nilai harus lebih dari 0'),
  minPurchase: z.number().min(0),
  maxDiscount: z.number().min(0),
  maxUsage: z.number().min(1),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type MaterialFormData = z.infer<typeof materialSchema>;
export type PurchaseFormData = z.infer<typeof purchaseSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type UserFormData = z.infer<typeof userSchema>;
export type CouponFormData = z.infer<typeof couponSchema>;
