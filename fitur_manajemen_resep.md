# Detail Fitur: Modul Manajemen Resep & HPP

## 1. Deskripsi Umum
Modul ini adalah *core engine* (jantung) dari sistem *Inventory* F&B. Modul ini mengatur komposisi bahan baku untuk setiap produk yang dijual. Sistem mendukung pemotongan stok otomatis berdasarkan takaran resep.

## 2. Fitur Utama & Ruang Lingkup

### A. Resep Produk (Standard Recipe) - *MVP Phase 1*
* **Fungsi**: Memasukkan bahan-bahan dasar yang membentuk 1 porsi produk.
* **Input**: Pilih Produk -> Tambah Bahan A (qty, satuan) -> Tambah Bahan B (qty, satuan).
* **Contoh**: Cafe Latte = Kopi 15gr + Susu 150ml.

### B. Sub-Resep & Resep Bertingkat (Advanced Recipe) - *MVP Phase 2*
* **Fungsi**: Mengakomodasi produk setengah jadi (semi-product) yang digunakan di beberapa menu lain.
* **Contoh Sub-Resep**: *Espresso* (terdiri dari 15g kopi + 30ml air).
* **Contoh Bertingkat**: *Cafe Latte* terdiri dari 1 shot *Espresso* + 150ml susu.
* **Mekanisme**: Saat Cafe Latte terjual, sistem akan men-trace (membongkar) resep ke tingkat paling bawah, sehingga yang dipotong adalah Kopi, Air, dan Susu.

### C. Validasi Circular Recipe - *MVP Phase 2*
* **Fungsi**: Mencegah *infinite loop* / eror saat Admin salah memasukkan bahan.
* **Contoh Ditolak**: *Sirup Vanila* resepnya butuh *Es Kopi Vanila*, sedangkan *Es Kopi Vanila* resepnya butuh *Sirup Vanila*. Sistem harus memunculkan error "Circular Recipe Detected".

### D. Kalkulasi HPP Otomatis (Cost of Goods Sold) - *MVP Phase 2*
* **Fungsi**: Sistem menghitung modal dasar per porsi (HPP) berdasarkan harga beli terakhir (atau rata-rata) dari bahan mentahnya.
* **Contoh**: Jika beli Kopi Rp120.000/kg (Rp120/gr), maka HPP untuk penggunaan 15gr kopi adalah Rp1.800. HPP ini muncul di layar informasi produk untuk membantu Owner menentukan Harga Jual.

## 3. Kriteria Penerimaan (Acceptance Criteria)
- [ ] Admin dapat menambahkan bahan mentah dan produk olahan ke dalam resep.
- [ ] Sistem berhasil mencegah pembuatan resep yang melingkar (berputar antar produk).
- [ ] Sistem dapat menjumlahkan HPP dari tingkat *raw material* hingga menjadi *finished product* secara otomatis.
- [ ] Sistem menampilkan total *cost* resep dan membandingkannya dengan Harga Jual (untuk menghitung Gross Margin).
