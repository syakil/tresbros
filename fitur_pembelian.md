# Detail Fitur: Modul Pembelian (Procurement)

## 1. Deskripsi Umum
Modul ini digunakan oleh bagian Gudang / Purchasing untuk mencatat barang atau bahan baku yang masuk dari pemasok (Supplier). Setiap transaksi di modul ini akan menambah kuantitas stok di sistem.

## 2. Fitur Utama & Ruang Lingkup

### A. Pencatatan Pembelian - *MVP Phase 1*
* **Informasi Header**: Nomor Invoice Pembelian, Tanggal, Nama Supplier.
* **Informasi Detail Barang**: 
  - Pilih Bahan Baku.
  - Jumlah (Qty) yang dibeli.
  - Satuan Beli (Bisa berbeda dengan satuan dasar, misal beli dalam "Karung" atau "Box").
  - Harga Beli (Total harga atau Harga per satuan).
* **Auto-Conversion**: Jika beli 1 Kg kopi, sistem akan memasukkan 1000 gram ke stok dasar secara otomatis.

### B. Manajemen Supplier (Opsional / Terintegrasi)
* Pencatatan nama, nomor telepon, dan alamat pemasok untuk memudahkan *restock* di masa mendatang.

## 3. Kriteria Penerimaan (Acceptance Criteria)
- [ ] User (Admin/Gudang) dapat mencatat transaksi pembelian bahan.
- [ ] Setelah formulir pembelian di-submit, stok item tersebut bertambah di modul Stok.
- [ ] Harga beli terakhir (*last purchase price*) akan meng-update nilai acuan HPP di Modul Resep.
- [ ] User dapat melihat riwayat pembelian yang sudah lalu.
