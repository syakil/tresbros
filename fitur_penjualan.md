# Detail Fitur: Modul Penjualan (Point of Sales)

## 1. Deskripsi Umum
Modul Penjualan adalah antarmuka utama bagi Kasir untuk menginput pesanan pelanggan. Modul ini dirancang agar cepat, minim klik, dan responsif. Sistem penjualan ini terhubung langsung ke sistem Stok dan KDS (Kitchen Display System).

## 2. Fitur Utama & Ruang Lingkup

### A. Antarmuka Kasir (POS) - *MVP Phase 1*
* **Menu Produk**: Menampilkan daftar produk jual berupa grid tombol (bisa dilengkapi gambar dan harga).
* **Keranjang Belanja (Cart)**: Menampilkan item yang dipilih, Qty, Harga Satuan, dan Subtotal.
* **Fitur Modifikasi**: Bisa menambahkan catatan (Notes) pada per item (contoh: "Less Ice").
* **Perhitungan Otomatis**: Menghitung Pajak (PB1/PPN) jika ada, dan Total Tagihan.

### B. Validasi Stok Saat Penjualan - *MVP Phase 1*
* **Skenario**: Saat Kasir menekan tombol "Bayar", sistem akan men-simulasi resep di belakang layar.
* **Pengecekan**: Jika pelanggan memesan 3 Latte, sistem mengecek stok Susu, Air, dan Kopi. Jika Kopi habis, transaksi ditolak dan muncul peringatan: "Stok Kopi tidak cukup untuk memproses pesanan ini".

### C. Pembayaran (Payment)
* Mendukung tipe pembayaran: Cash, Debit, QRIS, dll.
* Menghitung uang kembalian (Change) jika pembayaran tunai.

### D. Cetak Struk (Receipt)
* Mencetak bukti bayar ke printer thermal.
* Mengirimkan orderan secara *wireless* ke Kitchen Display System (Dapur).

## 3. Kriteria Penerimaan (Acceptance Criteria)
- [ ] Kasir dapat dengan lancar memilih item, mengedit Qty, dan menyelesaikan pembayaran.
- [ ] Validasi stok berfungsi 100% mencegah over-selling bahan baku (mencegah stok minus).
- [ ] Pesanan yang berhasil dibayar langsung terkirim ke KDS dan langsung memotong stok.
- [ ] Laporan penjualan langsung tercatat hari itu juga.
