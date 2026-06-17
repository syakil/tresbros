# Detail Fitur: Modul Master Data

## 1. Deskripsi Umum
Modul Master Data adalah fondasi dari seluruh sistem. Di sinilah pengguna mendefinisikan semua entitas dasar yang akan digunakan dalam transaksi pembelian, resep, dan penjualan. Tanpa master data yang benar, sistem tidak bisa berjalan.

## 2. Fitur Utama & Ruang Lingkup

### A. Master Satuan (Unit)
* **Fungsi**: Mendefinisikan ukuran/takaran baku (contoh: Gram, Kg, Mililiter, Liter, Pcs, Cup).
* **Atribut**: ID Satuan, Nama Satuan (misal: Kilogram), Kode (misal: kg).

### B. Konversi Satuan (Unit Conversion) - *MVP Phase 2*
* **Fungsi**: Mendefinisikan rasio konversi agar pembelian dan pemakaian di resep bisa menggunakan satuan yang berbeda namun dihitung akurat.
* **Contoh**: 
  - 1 kg = 1000 gram
  - 1 liter = 1000 ml
* **Atribut**: Satuan Asal, Satuan Tujuan, Nilai Pengali (Multiplier).

### C. Master Bahan (Raw Material)
* **Fungsi**: Mencatat barang mentah yang dibeli dari supplier.
* **Atribut**: 
  - Kode Item (SKU)
  - Nama Bahan (misal: Biji Kopi Arabica)
  - Satuan Dasar (Base Unit, misal: gram)
  - Minimum Stok (Batas peringatan untuk restock)
* **Sifat**: Stoknya bertambah saat *Pembelian*, dan berkurang saat terjadi *Penjualan* produk yang memakai bahan ini.

### D. Master Produk Jual (Finished Product)
* **Fungsi**: Mencatat menu/produk yang ditawarkan ke pelanggan.
* **Atribut**:
  - Kode Item
  - Nama Produk (misal: Cafe Latte)
  - Kategori (misal: Kopi, Non-Kopi, Makanan)
  - Harga Jual
  - Status (Tersedia / Habis)
* **Sifat**: Produk ini yang akan muncul di layar Kasir (Modul Penjualan).

## 3. Kriteria Penerimaan (Acceptance Criteria)
- [ ] Sistem berhasil menyimpan master satuan dan turunannya (konversi).
- [ ] Admin dapat membuat master bahan baku dan produk jual.
- [ ] Satuan yang sudah dipakai dalam transaksi tidak bisa dihapus, hanya bisa di-nonaktifkan.
- [ ] Sistem otomatis memvalidasi duplikasi kode item agar tidak ada 2 item dengan SKU yang sama.
