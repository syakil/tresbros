# Sistem Akuntansi & Jurnal Transaksi (Tresbros POS)

Dokumen ini merumuskan konsep **Chart of Accounts (COA)** dan **Jurnal Akuntansi** standar untuk bisnis F&B (Coffee Shop / Restoran) yang sesuai dengan alur transaksi yang sudah ada di aplikasi Tresbros saat ini.

---

## 1. Chart of Accounts (COA) / Bagan Akun
Berikut adalah rancangan nomor dan nama akun yang diperlukan untuk mencatat seluruh pergerakan finansial di sistem Tresbros.

### Aset (Aktiva) - 1XXX
- **1110 - Kas Kecil (Cash on Hand)**: Untuk mencatat uang tunai yang diterima di laci kasir.
- **1120 - Piutang Payment Gateway (Midtrans)**: Uang yang mengendap di Midtrans sebelum dicairkan (settlement) ke rekening bank.
- **1130 - Kas di Bank**: Rekening utama bisnis.
- **1140 - Persediaan Bahan Baku (Raw Material Inventory)**: Nilai stok bahan baku yang ada di gudang/dapur (berdasarkan data Master Material).

### Kewajiban (Pasiva/Utang) - 2XXX
- **2110 - Hutang Usaha (Accounts Payable)**: Untuk mencatat pembelian bahan baku ke supplier yang belum dibayar lunas.
- **2120 - Hutang Pajak (Tax Payable)**: Pajak restoran/PB1 (11%) yang dipungut dari customer dan harus disetorkan ke negara.

### Ekuitas (Modal) - 3XXX
- **3110 - Modal Pemilik**
- **3120 - Laba Ditahan**

### Pendapatan (Revenue) - 4XXX
- **4110 - Pendapatan Penjualan (Sales Revenue)**: Nilai total produk yang terjual (sebelum pajak & diskon).
- **4120 - Diskon & Promo (Sales Discount)**: Pengurang pendapatan akibat kupon atau diskon manual.

### Beban (Expenses) - 5XXX / 6XXX
- **5110 - Harga Pokok Penjualan (HPP / COGS)**: Biaya modal dari bahan baku yang terpakai untuk membuat pesanan (berdasarkan pemotongan stok via BOM).
- **5120 - Biaya Admin Payment Gateway**: Potongan biaya dari layanan Midtrans (misal QRIS 0.7%).
- **6110 - Beban Operasional**: Sewa, Listrik, Gaji, dll.

---

## 2. Jurnal Transaksi (Entry Jurnal)

Berdasarkan fitur Tresbros (Penjualan Kasir, Webhook Midtrans, Pemotongan Resep/BOM, dan Pembelian Bahan), berikut adalah *mapping* jurnal pembukuannya:

### Transaksi 1: Penjualan via TUNAI (CASH)
**Skenario:** Customer membeli Kopi (Rp 50.000) + Pajak 11% (Rp 5.500) = Total Rp 55.500. Dibayar tunai.
* **[Dr] 1110 - Kas Kecil** .......................... Rp 55.500
  * **[Cr] 4110 - Pendapatan Penjualan** .... Rp 50.000
  * **[Cr] 2120 - Hutang Pajak (PB1)** ........ Rp 5.500

### Transaksi 2: Penjualan via MIDTRANS (QRIS/Transfer)
**Skenario:** Sama dengan di atas, tapi dibayar via QRIS Midtrans.
* **[Dr] 1120 - Piutang Payment Gateway** .. Rp 55.500
  * **[Cr] 4110 - Pendapatan Penjualan** .... Rp 50.000
  * **[Cr] 2120 - Hutang Pajak (PB1)** ........ Rp 5.500
*(Catatan: Uang belum masuk ke bank, tapi masuk ke saldo akun Midtrans)*

### Transaksi 3: Penjualan dengan KUPON / DISKON MANUAL
**Skenario:** Harga Kopi (Rp 50.000). Ada diskon 10% (Rp 5.000). DPP = Rp 45.000 + Pajak 11% (Rp 4.950). Total Bayar Tunai = Rp 49.950.
* **[Dr] 1110 - Kas Kecil** .......................... Rp 49.950
* **[Dr] 4120 - Diskon & Promo** ............... Rp 5.000
  * **[Cr] 4110 - Pendapatan Penjualan** .... Rp 50.000
  * **[Cr] 2120 - Hutang Pajak (PB1)** ........ Rp 4.950

### Transaksi 4: Pemotongan Stok (COGS / HPP) saat Pesanan Selesai / "DONE"
**Skenario:** Pesanan Kopi sudah selesai dibuat. Sistem secara otomatis memotong stok 12 gram kopi (nilai HPP-nya misalnya dihitung Rp 8.000).
* **[Dr] 5110 - Harga Pokok Penjualan (HPP)** .. Rp 8.000
  * **[Cr] 1140 - Persediaan Bahan Baku** ........ Rp 8.000
*(Jurnal ini sangat penting agar laporan laba rugi menampilkan profit kotor yang akurat)*

### Transaksi 5: Pencairan (Settlement) dari Midtrans ke Rekening Bank
**Skenario:** Midtrans mencairkan saldo Rp 55.500 ke rekening Anda, dipotong biaya admin QRIS 0.7% (Rp 388). Uang bersih masuk ke bank Rp 55.112.
* **[Dr] 1130 - Kas di Bank** ............................. Rp 55.112
* **[Dr] 5120 - Biaya Admin Payment Gateway** .. Rp 388
  * **[Cr] 1120 - Piutang Payment Gateway** ...... Rp 55.500

### Transaksi 6: Pembelian (Restock) Bahan Baku (Purchasing)
**Skenario:** Membeli kopi mentah 1 kg seharga Rp 150.000 secara tunai. Stok bahan baku bertambah.
* **[Dr] 1140 - Persediaan Bahan Baku** ....... Rp 150.000
  * **[Cr] 1110 - Kas Kecil (atau 1130 Kas Bank)** .. Rp 150.000

---

## 3. Implementasi ke Database (Opsional untuk Fase Selanjutnya)
Jika nanti Tresbros ingin memiliki fitur Laporan Akuntansi otomatis, kita perlu membuat 2 tabel baru di database:
1. `ChartOfAccounts` (Id, AccountCode, AccountName, Type)
2. `JournalEntries` (Id, Date, OrderId, Reference, Description)
3. `JournalEntryLines` (Id, JournalEntryId, AccountId, Debit, Credit)

Setiap kali `OrderController.cs` melakukan transaksi sukses, ia tidak hanya mengupdate status pesanan, tetapi juga otomatis melakukan *insert* ke tabel `JournalEntryLines` berdasarkan rincian harga, pajak, dan HPP.
