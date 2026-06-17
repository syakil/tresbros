# Entity Relationship Diagram (ERD) Tresbros

Berikut adalah relasi antar tabel (skema database) untuk backend `.NET 8` dan `PostgreSQL`. Format penamaan telah disesuaikan: `TB_M_` untuk tabel Master, dan `TB_R_` untuk tabel Transaksi/Riwayat, beserta struktur Header (`_H`) dan Detail (`_D`).

```mermaid
erDiagram
    TB_M_USER {
        int id PK
        string username
        string password_hash
        string role "ADMIN, KASIR, OWNER, GUDANG"
        boolean is_active
    }
    TB_M_UNIT {
        int id PK
        string unit_name
        string unit_code "kg, gram, ml, liter, pcs"
    }
    TB_M_UNIT_CONV {
        int id PK
        int from_unit_id FK
        int to_unit_id FK
        decimal multiplier
    }
    TB_M_ITEM {
        int id PK
        string item_code
        string item_name
        string item_type "RAW, SUB_RECIPE, PRODUCT"
        int base_unit_id FK
        decimal current_stock
        decimal minimum_stock
        boolean is_active
    }
    TB_M_RECIPE_H {
        int id PK
        int item_id FK "Produk Jual / Sub-Resep"
        string recipe_name
        decimal output_qty
        int output_unit_id FK
        boolean is_active
    }
    TB_M_RECIPE_D {
        int id PK
        int recipe_id FK
        int component_item_id FK "Bahan Baku"
        decimal qty
        int unit_id FK
    }
    TB_R_PURCHASE_H {
        int id PK
        string purchase_no
        string supplier_name
        datetime purchase_date
        decimal total_amount
        int user_id FK "Gudang/Admin"
    }
    TB_R_PURCHASE_D {
        int id PK
        int purchase_id FK
        int item_id FK
        decimal qty
        int unit_id FK
        decimal price
    }
    TB_R_SALES_H {
        int id PK
        string sales_no
        datetime sales_date
        decimal total_amount
        string payment_method
        string status "TODO, IN_PROGRESS, DONE"
        int user_id FK "Kasir"
    }
    TB_R_SALES_D {
        int id PK
        int sales_id FK
        int item_id FK
        decimal qty
        decimal price
        decimal subtotal
        string notes "Catatan KDS"
    }
    TB_R_STOCK_MOVEMENT {
        int id PK
        int item_id FK
        datetime movement_date
        string movement_type "IN, OUT, ADJUSTMENT"
        decimal qty
        int unit_id FK
        string reference_type "PURCHASE, SALES, ADJ"
        int reference_id
        string note
        int user_id FK "Petugas"
    }

    TB_M_UNIT ||--o{ TB_M_ITEM : "has_base_unit"
    TB_M_UNIT ||--o{ TB_M_UNIT_CONV : "from_unit"
    TB_M_UNIT ||--o{ TB_M_UNIT_CONV : "to_unit"
    TB_M_ITEM ||--o{ TB_M_RECIPE_H : "has_recipe"
    TB_M_RECIPE_H ||--o{ TB_M_RECIPE_D : "contains"
    TB_M_ITEM ||--o{ TB_M_RECIPE_D : "as_component"
    TB_R_PURCHASE_H ||--o{ TB_R_PURCHASE_D : "has_detail"
    TB_M_ITEM ||--o{ TB_R_PURCHASE_D : "is_bought"
    TB_R_SALES_H ||--o{ TB_R_SALES_D : "has_detail"
    TB_M_ITEM ||--o{ TB_R_SALES_D : "is_sold"
    TB_M_ITEM ||--o{ TB_R_STOCK_MOVEMENT : "tracked"
    TB_M_USER ||--o{ TB_R_SALES_H : "handles_sale"
    TB_M_USER ||--o{ TB_R_PURCHASE_H : "handles_purchase"
    TB_M_USER ||--o{ TB_R_STOCK_MOVEMENT : "records_movement"
```

## Penjelasan Penamaan Tabel (Naming Convention)
- **`TB_M_` (Master)**: Digunakan untuk tabel data *master* yang jarang berubah wujud entitasnya (seperti Item, Satuan, Resep, dan Pengguna).
- **`TB_R_` (Record / Riwayat / Transaksi)**: Digunakan untuk tabel transaksional yang setiap baris datanya merepresentasikan transaksi atau pergerakan yang unik sesuai waktu.
- **`_H` (Header) & `_D` (Detail)**: Transaksi seperti Penjualan (Sales) dan Pembelian (Purchases) dipisah antara informasi payung transaksi (Header: No Struk, Waktu, Total Belanja) dan informasi rincian item (Detail: Qty, Harga Satuan). Format ini sangat lazim dan efisien di sistem ERP & POS.
