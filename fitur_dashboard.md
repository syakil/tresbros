# Detail Fitur: Modul Dashboard

## 1. Deskripsi Umum
Modul Dashboard adalah halaman utama (beranda) yang akan pertama kali dilihat oleh Admin atau Owner saat login ke sistem. Dashboard ini berfungsi sebagai **Command Center** untuk melihat kondisi bisnis dan operasional kafe/resto secara real-time dalam satu tampilan ringkas.

## 2. Pengguna Sasaran (User Target)
* **Owner**: Untuk melihat tren penjualan, performa bisnis, dan ringkasan pendapatan.
* **Admin / Manajer Outlet**: Untuk memantau operasional harian, melihat stok yang menipis, dan melacak pesanan berjalan.

## 3. Komponen Utama Dashboard

### A. Ringkasan Cepat (Summary Cards)
Menampilkan angka-angka krusial hari ini (Today's Highlight).
* **Total Pendapatan Hari Ini**: Total nominal (Rp) dari pesanan yang sudah selesai (Paid/Done).
* **Total Transaksi Hari Ini**: Jumlah struk / order yang berhasil.
* **Pesanan Berjalan**: Jumlah pesanan yang saat ini masih berstatus 'Antrean' atau 'Sedang Dibuat' di dapur.
* **Item Stok Menipis**: Jumlah bahan baku yang kuantitasnya berada di bawah batas `minimum_stock`.

### B. Grafik Tren Penjualan (Sales Trend Chart)
Menyajikan visualisasi data penjualan agar tren lebih mudah dibaca.
* **Tipe Grafik**: Line Chart / Bar Chart.
* **Periode**: Bisa di-filter berdasarkan 7 Hari Terakhir, Bulan Ini, atau Rentang Tanggal Custom.
* **Data yang Ditampilkan**: Total nilai penjualan per hari.

### C. Peringatan Stok Minimum (Low Stock Alerts)
Tabel mini yang menampilkan bahan baku yang perlu segera dibeli/restock.
* **Kolom**: Nama Bahan Baku, Stok Saat Ini, Batas Minimum, Satuan.
* **Aksi**: Terdapat tombol "Buat Pembelian" atau shortcut menuju halaman input pembelian bahan.

### D. Pesanan Aktif (Live Orders Overview)
Menampilkan sekilas kondisi pesanan terkini secara real-time.
* **Tujuan**: Admin bisa melihat apakah dapur sedang kewalahan (bottle-neck) atau sepi.
* **Tampilan**: List sederhana order ID terbaru beserta status posisinya di KDS (Kitchen Display System).

## 4. Sumber Data (Database Mapping)
* `sales`: Digunakan untuk menghitung *Total Pendapatan*, *Total Transaksi*, dan *Grafik Penjualan*.
* `items`: Digunakan untuk memfilter item yang `current_stock` < `minimum_stock`.
* `sales` & `sales_details`: Digunakan untuk memonitor status *Pesanan Aktif*.

## 5. Kriteria Penerimaan (Acceptance Criteria)
- [ ] Angka pada summary cards ter-update otomatis saat ada penjualan baru yang selesai.
- [ ] Grafik penjualan dapat berganti periode dengan lancar.
- [ ] Bahan baku otomatis masuk ke widget Low Stock apabila stoknya berkurang melebihi batas minimum.
- [ ] Akses modul dashboard dibatasi hanya untuk role Admin dan Owner (Kasir dan Gudang tidak memiliki akses).
