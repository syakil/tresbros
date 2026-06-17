# Detail Fitur: Modul Laporan (Reporting)

## 1. Deskripsi Umum
Laporan adalah modul untuk melihat analisis data dari seluruh transaksi (masuk maupun keluar). Modul ini umumnya hanya bisa diakses oleh Owner dan Admin. Semua laporan difokuskan pada MVP Phase 3.

## 2. Fitur Utama & Ruang Lingkup

### A. Laporan Penjualan
* Menampilkan total penjualan (omset) harian, mingguan, bulanan.
* Fitur filter rentang tanggal.
* Export data ke Excel/PDF.

### B. Laporan Pembelian
* Menampilkan histori belanja ke supplier beserta total pengeluaran uang.

### C. Laporan Stok Bahan & Bahan Terpakai
* **Laporan Nilai Stok**: Menghitung total valuasi aset barang yang ada di gudang saat ini (Qty x Harga Beli).
* **Laporan Bahan Terpakai**: Menampilkan berapa kilogram kopi atau berapa liter susu yang habis terpakai dalam satu periode (berdasarkan resep yang terjual).

### D. Laporan Peringatan (Stok Minimum)
* Laporan berisi daftar barang yang harus diprioritaskan untuk dibeli hari ini karena sudah menyentuh batas kritis.

### E. Laporan Produk Terlaris (Best Seller)
* Memvisualisasikan produk apa saja yang menyumbang pendapatan terbesar, dan mana yang kurang laku (dead stock).

### F. Laporan Keuntungan (Margin / HPP)
* Menampilkan Laba Kotor (Gross Profit) dari selisih: Total Penjualan - Total HPP (Cost of Goods).

## 3. Kriteria Penerimaan (Acceptance Criteria)
- [ ] Angka yang ditampilkan di laporan *match* (sinkron) dengan riwayat penjualan dan stok.
- [ ] Semua laporan mendukung *date picker* untuk memfilter data berdasarkan tanggal.
- [ ] Laba kotor dapat terhitung otomatis setiap harinya.
