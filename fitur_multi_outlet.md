# Detail Fitur: Modul Multi Outlet

## 1. Deskripsi Umum
Fitur Multi Outlet (MVP Phase 4) merupakan pembaruan arsitektur sistem agar aplikasi ini dapat menangani bisnis franchise atau F&B yang memiliki lebih dari satu cabang, namun dikelola dari satu aplikasi / database pusat.

## 2. Fitur Utama & Ruang Lingkup

### A. Pemisahan Data Transaksional
* **Stok Terpisah**: Stok Kopi di Cabang A berbeda dengan stok Kopi di Cabang B.
* **Penjualan Terpisah**: Kasir Cabang A hanya melihat dan memotong stok Cabang A. Laporan penjualan juga dipisah per cabang.

### B. Sentralisasi Master Data
* **Master Bahan & Resep Terpusat**: Owner cukup membuat resep *Cafe Latte* satu kali di Pusat (HQ), dan semua cabang akan menggunakan resep yang sama secara seragam.
* **Harga Jual Seragam**: Update harga produk jual dikendalikan dari pusat.

### C. Manajemen User Multi Cabang
* **Assign Outlet**: Kasir Budi ditugaskan khusus untuk login dan bekerja hanya di Cabang B.
* **Super Admin / Owner**: Dapat memantau seluruh cabang dari satu Dashboard melalui fitur dropdown pilihan cabang.

### D. Mutasi Antar Cabang (Transfer Stock) - Opsional
* Fasilitas untuk memindahkan kelebihan stok dari Gudang Pusat ke Outlet, atau antar outlet.

## 3. Kriteria Penerimaan (Acceptance Criteria)
- [ ] Data master (Item dan Resep) otomatis tersinkronisasi ke semua cabang.
- [ ] Transaksi kasir memotong stok di *branch_id* yang benar (tidak salah potong stok cabang lain).
- [ ] Owner dapat membandingkan performa penjualan antar outlet dalam satu layar.
