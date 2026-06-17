# BRD - Sistem Pembelian, Stok, Resep, dan Penjualan Cafe

## 1. Tujuan Sistem

Sistem ini dibuat untuk mengelola operasional cafe mulai dari:

* Pembelian bahan baku
* Manajemen stok
* Pengaturan resep produk
* Penjualan
* Pengurangan stok otomatis berdasarkan resep
* Perhitungan kebutuhan bahan dari resep bertingkat

Contoh kasus:

Produk **Cafe Latte** menggunakan:

* Espresso 30 ml
* Susu 150 ml

Sedangkan **Espresso** sendiri adalah sub-resep yang terdiri dari:

* Kopi 15 gram
* Air 20 ml

Maka ketika Cafe Latte terjual, sistem otomatis mengurangi:

* Kopi 15 gram
* Air 20 ml
* Susu 150 ml

---

## 2. Ruang Lingkup Sistem

### 2.1 Modul Pembelian

Modul pembelian digunakan untuk mencatat pembelian bahan baku dari supplier.

Fitur utama:

* Input pembelian bahan
* Pilih supplier
* Input tanggal pembelian
* Input item bahan
* Input qty pembelian
* Input satuan
* Input harga beli
* Update stok otomatis setelah pembelian disimpan
* Riwayat pembelian

Contoh:

| Bahan             | Qty | Satuan |  Harga |
| ----------------- | --: | ------ | -----: |
| Biji Kopi Arabica |   1 | kg     | 120000 |
| Susu Fresh Milk   |  12 | liter  | 240000 |

---

## 3. Modul Master Bahan / Inventory Item

Master bahan digunakan untuk menyimpan data bahan baku dan bahan hasil olahan.

Jenis item:

1. **Bahan Mentah**

   * Kopi bubuk
   * Susu
   * Air
   * Gula
   * Es batu

2. **Sub-Resep / Semi Produk**

   * Espresso
   * Cold Brew
   * Simple Syrup

3. **Produk Jual**

   * Cafe Latte
   * Americano
   * Es Kopi Susu

Field utama:

| Field         | Keterangan                                   |
| ------------- | -------------------------------------------- |
| Item ID       | ID bahan / produk                            |
| Nama Item     | Nama bahan / produk                          |
| Tipe Item     | Raw Material / Sub Recipe / Finished Product |
| Satuan Dasar  | gram, ml, pcs                                |
| Stok Saat Ini | Qty stok                                     |
| Minimum Stok  | Batas minimum stok                           |
| Status        | Aktif / Tidak Aktif                          |

---

## 4. Modul Stok

Modul stok digunakan untuk memantau jumlah bahan yang tersedia.

Fitur utama:

* Lihat stok bahan
* Lihat stok masuk
* Lihat stok keluar
* Penyesuaian stok manual
* Riwayat pergerakan stok
* Notifikasi stok minimum
* Konversi satuan

Jenis transaksi stok:

| Jenis Transaksi  | Keterangan                     |
| ---------------- | ------------------------------ |
| Stock In         | Dari pembelian                 |
| Stock Out        | Dari penjualan                 |
| Adjustment Plus  | Koreksi stok tambah            |
| Adjustment Minus | Koreksi stok kurang            |
| Waste / Rusak    | Bahan terbuang                 |
| Opname           | Penyesuaian hasil stock opname |

---

## 5. Modul Resep

Modul resep digunakan untuk mengatur komposisi bahan dari setiap produk.

Sistem harus mendukung:

* Resep produk jual
* Sub-resep
* Resep bertingkat
* Bahan langsung
* Bahan hasil olahan

Contoh struktur resep:

### 5.1 Resep Espresso

Produk: **Espresso 30 ml**

| Bahan | Qty | Satuan |
| ----- | --: | ------ |
| Kopi  |  15 | gram   |
| Air   |  20 | ml     |

### 5.2 Resep Cafe Latte

Produk: **Cafe Latte**

| Komponen | Qty | Satuan |
| -------- | --: | ------ |
| Espresso |  30 | ml     |
| Susu     | 150 | ml     |

Karena Espresso adalah sub-resep, maka sistem harus membaca resep Espresso sampai ke bahan mentah.

Hasil pengurangan stok saat Cafe Latte terjual:

| Bahan Mentah | Qty Dikurangi |
| ------------ | ------------: |
| Kopi         |       15 gram |
| Air          |         20 ml |
| Susu         |        150 ml |

---

## 6. Konsep Resep Bertingkat

Sistem harus bisa membaca resep secara bertingkat.

Contoh:

Cafe Latte
→ Espresso
→ Kopi + Air
→ Susu

Aturan:

1. Jika komponen resep adalah bahan mentah, langsung kurangi stok.
2. Jika komponen resep adalah sub-resep, sistem harus membuka isi resep tersebut.
3. Jika sub-resep memiliki sub-resep lagi, sistem tetap membaca sampai bahan mentah terakhir.
4. Sistem tidak boleh membuat resep yang berputar.

Contoh yang tidak boleh:

* Espresso menggunakan Cafe Latte
* Cafe Latte menggunakan Espresso

Karena bisa menyebabkan looping resep.

---

## 7. Modul Penjualan

Modul penjualan digunakan untuk mencatat transaksi penjualan produk.

Fitur utama:

* Input transaksi penjualan
* Pilih produk
* Input qty produk
* Hitung total harga
* Simpan transaksi
* Kurangi stok otomatis berdasarkan resep
* Validasi stok cukup sebelum transaksi berhasil
* Cetak struk / invoice
* Riwayat penjualan

Contoh transaksi:

| Produk     | Qty |
| ---------- | --: |
| Cafe Latte |   2 |

Jika 1 Cafe Latte membutuhkan:

* Kopi 15 gram
* Air 20 ml
* Susu 150 ml

Maka 2 Cafe Latte akan mengurangi:

* Kopi 30 gram
* Air 40 ml
* Susu 300 ml

---

## 8. Validasi Stok Saat Penjualan

Sebelum transaksi penjualan disimpan, sistem harus mengecek apakah stok bahan mencukupi.

Contoh:

Pesanan:

* 3 Cafe Latte

Kebutuhan:

* Kopi 45 gram
* Air 60 ml
* Susu 450 ml

Jika stok susu hanya 300 ml, maka sistem menolak transaksi.

Pesan error:

> Stok Susu tidak mencukupi. Dibutuhkan 450 ml, tersedia 300 ml.

---

## 9. Modul Konversi Satuan

Sistem harus mendukung konversi satuan agar pembelian dan resep bisa berbeda satuan.

Contoh:

| Dari    | Ke   | Nilai |
| ------- | ---- | ----: |
| 1 kg    | gram |  1000 |
| 1 liter | ml   |  1000 |

Contoh kasus:

Pembelian kopi dicatat dalam kg.

* Beli kopi 1 kg

Stok masuk ke sistem:

* 1000 gram

Resep menggunakan:

* 15 gram per espresso

---

## 10. Modul Stock Movement

Setiap perubahan stok harus dicatat dalam stock movement.

Contoh field:

| Field          | Keterangan                  |
| -------------- | --------------------------- |
| Tanggal        | Tanggal transaksi           |
| Item           | Nama bahan                  |
| Tipe Transaksi | IN / OUT / ADJUSTMENT       |
| Qty            | Jumlah stok                 |
| Satuan         | Satuan                      |
| Referensi      | Nomor pembelian / penjualan |
| Keterangan     | Catatan transaksi           |

Contoh saat Cafe Latte terjual:

| Item | Tipe |     Qty | Referensi |
| ---- | ---- | ------: | --------- |
| Kopi | OUT  | 15 gram | SALES-001 |
| Air  | OUT  |   20 ml | SALES-001 |
| Susu | OUT  |  150 ml | SALES-001 |

---

## 11. Modul Dashboard

Modul dashboard digunakan sebagai halaman utama untuk memberikan ringkasan informasi operasional secara cepat.

Fitur utama:

* Ringkasan penjualan hari ini (total pendapatan, jumlah transaksi)
* Notifikasi stok minimum / bahan yang perlu dibeli
* Grafik tren penjualan mingguan/bulanan
* Ringkasan pesanan yang sedang berjalan

---

## 12. Modul Tampilan Dapur (Kitchen Display System / KDS)

Modul ini digunakan oleh tim dapur atau barista untuk melihat dan memproses pesanan yang diinput oleh kasir.

Fitur utama:

* Tampilan berupa papan **Kanban** untuk daftar orderan/pesanan masuk.
* Kolom status pesanan (contoh: "Antrean", "Sedang Dibuat", "Selesai").
* **Detail Pesanan**: Saat kartu/orderan diklik, akan muncul detail menu yang dipesan, jumlah (qty), dan catatan/notes (misal: "less ice", "no sugar").
* Pindah status pesanan cukup dengan drag-and-drop atau klik tombol.
* Notifikasi otomatis ke kasir jika pesanan sudah selesai dibuat.

---

## 13. Modul Manajemen User & Hak Akses

Modul ini digunakan untuk mengelola akun pengguna dan peran (role) mereka dalam sistem.

Fitur utama:

* Tambah, edit, non-aktifkan user
* Pengaturan role dan permission masing-masing user

### Detail Hak Akses:

#### Admin

* Kelola semua data
* Kelola user
* Kelola master bahan
* Kelola resep
* Kelola pembelian
* Kelola penjualan
* Lihat laporan

#### Kasir

* Input penjualan
* Lihat produk
* Cetak struk

#### Gudang / Inventory

* Input pembelian
* Cek stok
* Adjustment stok
* Stock opname

#### Owner

* Lihat laporan penjualan
* Lihat laporan stok
* Lihat profit kasar
* Lihat bahan paling banyak digunakan

---

## 14. Laporan

Sistem menyediakan laporan:

* Laporan pembelian
* Laporan penjualan
* Laporan stok bahan
* Laporan stok minimum
* Laporan bahan terpakai
* Laporan produk terlaris
* Laporan waste / bahan rusak
* Laporan HPP produk berdasarkan resep

---

## 15. Perhitungan HPP Produk

Sistem dapat menghitung HPP berdasarkan resep.

Contoh:

Espresso:

| Bahan |     Qty | Harga Satuan | Subtotal |
| ----- | ------: | -----------: | -------: |
| Kopi  | 15 gram |   120 / gram |     1800 |
| Air   |   20 ml |       1 / ml |       20 |

HPP Espresso = 1820

Cafe Latte:

| Komponen    |  HPP |
| ----------- | ---: |
| Espresso    | 1820 |
| Susu 150 ml | 3000 |

HPP Cafe Latte = 4820

---

## 16. Business Rules

1. Pembelian bahan akan menambah stok.
2. Penjualan produk akan mengurangi stok.
3. Pengurangan stok berdasarkan resep.
4. Resep boleh menggunakan bahan mentah atau sub-resep.
5. Sub-resep harus dibaca sampai ke bahan mentah.
6. Sistem harus menolak penjualan jika stok bahan tidak cukup.
7. Semua perubahan stok wajib tercatat di stock movement.
8. Resep tidak boleh saling memanggil secara berputar.
9. Satuan pembelian harus dikonversi ke satuan dasar stok.
10. HPP produk dihitung dari total bahan yang digunakan dalam resep.

---

## 17. Contoh Flow Penjualan

1. Kasir memilih produk Cafe Latte.
2. Kasir input qty 1.
3. Sistem membaca resep Cafe Latte.
4. Sistem menemukan Cafe Latte menggunakan Espresso dan Susu.
5. Sistem membaca resep Espresso.
6. Sistem menemukan Espresso menggunakan Kopi dan Air.
7. Sistem menghitung total bahan:

   * Kopi 15 gram
   * Air 20 ml
   * Susu 150 ml
8. Sistem mengecek stok.
9. Jika stok cukup, transaksi disimpan.
10. Sistem mengurangi stok bahan.
11. Sistem mencatat stock movement.
12. Pesanan otomatis masuk ke Tampilan Dapur (KDS).
13. Struk penjualan dicetak.

---

## 18. Contoh Struktur Database Awal

### items

Menyimpan bahan, sub-resep, dan produk.

| Column        | Type    | Keterangan                 |
| ------------- | ------- | -------------------------- |
| id            | int     | Primary key                |
| item_code     | varchar | Kode item                  |
| item_name     | varchar | Nama item                  |
| item_type     | varchar | RAW / SUB_RECIPE / PRODUCT |
| base_unit_id  | int     | Satuan dasar               |
| current_stock | decimal | Stok saat ini              |
| minimum_stock | decimal | Minimum stok               |
| is_active     | bit     | Status aktif               |

### recipes

Menyimpan header resep.

| Column         | Type    | Keterangan               |
| -------------- | ------- | ------------------------ |
| id             | int     | Primary key              |
| item_id        | int     | Item yang memiliki resep |
| recipe_name    | varchar | Nama resep               |
| output_qty     | decimal | Hasil resep              |
| output_unit_id | int     | Satuan hasil resep       |
| is_active      | bit     | Status                   |

### recipe_details

Menyimpan detail bahan resep.

| Column            | Type    | Keterangan        |
| ----------------- | ------- | ----------------- |
| id                | int     | Primary key       |
| recipe_id         | int     | ID resep          |
| component_item_id | int     | Bahan / sub-resep |
| qty               | decimal | Jumlah            |
| unit_id           | int     | Satuan            |

### purchases

Menyimpan transaksi pembelian.

| Column        | Type     | Keterangan        |
| ------------- | -------- | ----------------- |
| id            | int      | Primary key       |
| purchase_no   | varchar  | Nomor pembelian   |
| supplier_id   | int      | Supplier          |
| purchase_date | datetime | Tanggal pembelian |
| total_amount  | decimal  | Total pembelian   |

### purchase_details

Menyimpan detail pembelian.

| Column      | Type    | Keterangan   |
| ----------- | ------- | ------------ |
| id          | int     | Primary key  |
| purchase_id | int     | ID pembelian |
| item_id     | int     | Item bahan   |
| qty         | decimal | Jumlah beli  |
| unit_id     | int     | Satuan       |
| price       | decimal | Harga        |

### sales

Menyimpan transaksi penjualan.

| Column         | Type     | Keterangan        |
| -------------- | -------- | ----------------- |
| id             | int      | Primary key       |
| sales_no       | varchar  | Nomor penjualan   |
| sales_date     | datetime | Tanggal penjualan |
| total_amount   | decimal  | Total penjualan   |
| payment_method | varchar  | Metode pembayaran |
| status         | varchar  | Status pesanan (e.g. TODO, IN_PROGRESS, DONE) |

### sales_details

Menyimpan detail produk terjual.

| Column   | Type    | Keterangan   |
| -------- | ------- | ------------ |
| id       | int     | Primary key  |
| sales_id | int     | ID penjualan |
| item_id  | int     | Produk       |
| qty      | decimal | Jumlah       |
| price    | decimal | Harga jual   |
| subtotal | decimal | Subtotal     |
| notes    | varchar | Catatan pesanan |

### stock_movements

Menyimpan semua pergerakan stok.

| Column         | Type     | Keterangan                    |
| -------------- | -------- | ----------------------------- |
| id             | int      | Primary key                   |
| item_id        | int      | Item bahan                    |
| movement_date  | datetime | Tanggal                       |
| movement_type  | varchar  | IN / OUT / ADJUSTMENT / WASTE |
| qty            | decimal  | Jumlah                        |
| unit_id        | int      | Satuan                        |
| reference_type | varchar  | PURCHASE / SALES / ADJUSTMENT |
| reference_id   | int      | ID referensi                  |
| note           | varchar  | Catatan                       |

### users (Baru)

Menyimpan data pengguna.

| Column    | Type    | Keterangan               |
| --------- | ------- | ------------------------ |
| id        | int     | Primary key              |
| username  | varchar | Username pengguna        |
| password  | varchar | Password (hashed)        |
| role      | varchar | ADMIN / KASIR / OWNER    |
| is_active | bit     | Status aktif             |

### units

Menyimpan satuan.

| Column    | Type    | Keterangan               |
| --------- | ------- | ------------------------ |
| id        | int     | Primary key              |
| unit_name | varchar | Nama satuan              |
| unit_code | varchar | gram, kg, ml, liter, pcs |

### unit_conversions

Menyimpan konversi satuan.

| Column       | Type    | Keterangan     |
| ------------ | ------- | -------------- |
| id           | int     | Primary key    |
| from_unit_id | int     | Dari satuan    |
| to_unit_id   | int     | Ke satuan      |
| multiplier   | decimal | Nilai konversi |

---

## 19. MVP Prioritas Pengembangan

### Phase 1 - Core Inventory & Sales

* Master bahan
* Master produk
* Master satuan
* Resep produk
* Pembelian
* Penjualan
* Auto deduct stock
* Stock movement
* Dashboard utama
* Manajemen User & Hak Akses
* Tampilan Dapur (Kitchen Display System)

### Phase 2 - Advanced Recipe

* Resep bertingkat
* Sub-resep
* Validasi circular recipe
* Konversi satuan
* HPP produk

### Phase 3 - Reporting

* Laporan stok
* Laporan penjualan
* Laporan pembelian
* Laporan bahan terpakai
* Laporan produk terlaris
* Laporan HPP

### Phase 4 - Operational Enhancement

* Stock opname
* Waste management
* Multi outlet

---

## 20. Acceptance Criteria

Sistem dianggap berhasil jika:

1. User bisa input pembelian bahan.
2. Stok bertambah otomatis setelah pembelian.
3. User bisa membuat resep produk.
4. Resep bisa memakai bahan mentah.
5. Resep bisa memakai sub-resep.
6. Penjualan otomatis mengurangi stok bahan.
7. Sistem bisa menghitung kebutuhan bahan dari resep bertingkat.
8. Sistem menolak penjualan jika stok tidak cukup.
9. Semua pergerakan stok tercatat.
10. Terdapat Kanban Board pada tampilan dapur untuk melihat pesanan dan detailnya.
11. Owner bisa melihat laporan stok dan penjualan melalui Dashboard dan menu Laporan.

---

## 21. Contoh Use Case

### Use Case: Membuat Resep Espresso

Aktor: Admin

Flow:

1. Admin membuka menu Resep.
2. Admin memilih item Espresso.
3. Admin menambahkan komponen:

   * Kopi 15 gram
   * Air 20 ml
4. Admin menyimpan resep.
5. Sistem menyimpan resep Espresso.

---

### Use Case: Membuat Resep Cafe Latte

Aktor: Admin

Flow:

1. Admin membuka menu Resep.
2. Admin memilih item Cafe Latte.
3. Admin menambahkan komponen:

   * Espresso 30 ml
   * Susu 150 ml
4. Admin menyimpan resep.
5. Sistem menyimpan resep Cafe Latte.

---

### Use Case: Penjualan Cafe Latte

Aktor: Kasir

Flow:

1. Kasir memilih Cafe Latte.
2. Kasir input qty 1.
3. Sistem membaca resep Cafe Latte.
4. Sistem membaca sub-resep Espresso.
5. Sistem menghitung bahan mentah:

   * Kopi 15 gram
   * Air 20 ml
   * Susu 150 ml
6. Sistem validasi stok.
7. Jika stok cukup, transaksi berhasil.
8. Sistem mengurangi stok.
9. Sistem mencatat stock movement.

---

## 22. Catatan Penting

Konsep utama sistem ini bukan hanya stok barang biasa, tetapi stok berbasis resep.

Jadi setiap produk yang dijual harus memiliki resep, dan setiap resep dapat memiliki komponen berupa:

* Bahan mentah
* Sub-resep
* Produk olahan sementara

Dengan konsep ini, sistem bisa digunakan untuk cafe, coffee shop, bakery, cloud kitchen, dan bisnis F&B lain yang membutuhkan kontrol bahan baku secara detail.
