# Detail Fitur: Modul Manajemen Stok (Inventory)

## 1. Deskripsi Umum
Modul ini menjadi pusat pemantauan seluruh pergerakan barang. Modul ini secara konstan diperbarui oleh sistem secara *real-time* dari modul Pembelian (Stok Masuk) dan Penjualan (Stok Keluar via Resep).

## 2. Fitur Utama & Ruang Lingkup

### A. Auto Deduct Stock - *MVP Phase 1*
* Pengurangan stok bekerja sepenuhnya di *background* saat transaksi penjualan di Kasir selesai dibayar.
* Jika ada pembatalan order (Void), stok akan dikembalikan secara otomatis.

### B. Stock Movement (Buku Besar Stok) - *MVP Phase 1*
* **Fungsi**: Memcatat setiap penambahan atau pengurangan stok layaknya rekening koran bank.
* **Detail**: Menampilkan Waktu, Tipe Transaksi (IN/OUT/ADJ), Referensi (No Invoice/No Order), Jumlah Perubahan (+/-), dan Saldo Akhir.

### C. Stock Opname (Penyesuaian Fisik) - *MVP Phase 4*
* **Fungsi**: Mencatat hasil penghitungan fisik di gudang/kulkas dan membandingkannya dengan sistem.
* **Proses**: 
  1. Print lembar opname.
  2. Input stok fisik riil ke sistem.
  3. Sistem membuat jurnal penyesuaian (Adjustment Plus / Minus) beserta selisih nilainya.

### D. Waste Management (Barang Rusak/Terbuang) - *MVP Phase 4*
* **Fungsi**: Mencatat bahan baku yang tumpah, basi, atau kadaluwarsa.
* **Catatan**: Waste dibedakan dengan penjualan agar laporan kerugian lebih presisi dan HPP tidak tercampur.

## 3. Kriteria Penerimaan (Acceptance Criteria)
- [ ] Menu riwayat *Stock Movement* harus akurat, saldo akhir harus sama persis dengan saldo yang tampil di master barang.
- [ ] Penjualan Kasir berhasil memotong stok hingga ke bahan baku terdalam (sub-resep).
- [ ] Admin Gudang dapat melakukan input Stock Opname, dan sistem mengkoreksi stok (Adjustment) disertai log catatan yang jelas.
- [ ] Admin dapat memisahkan barang "Waste" dari "Adjustment biasa".
