# Detail Fitur: Tampilan Dapur (Kitchen Display System / KDS)

## 1. Deskripsi Umum
Kitchen Display System (KDS) adalah modul yang ditujukan khusus untuk area dapur / meja barista. Modul ini digunakan untuk meniadakan kertas orderan (paperless), mempercepat komunikasi antara kasir dan dapur, serta memonitor kecepatan pelayanan (*Service Level Agreement*). KDS berwujud papan visual bergaya **Kanban**.

## 2. Pengguna Sasaran (User Target)
* **Koki / Barista**: Untuk melihat menu yang harus dibuat, memantau detail request pelanggan, dan menandai jika pesanan sudah selesai.

## 3. Komponen Utama KDS

### A. Papan Kanban Orderan
Tampilan dibagi menjadi 3 kolom utama berdasarkan status proses pesanan.
1. **Kolom "Antrean" (To Do)**:
   * Menampung semua pesanan baru yang baru saja disubmit oleh Kasir.
   * Diurutkan dari pesanan yang paling lama menunggu (FIFO - First In First Out).
2. **Kolom "Sedang Dibuat" (In Progress)**:
   * Menampung pesanan yang sedang diracik/dibuat oleh tim dapur.
3. **Kolom "Selesai" (Done)**:
   * Menampung pesanan yang sudah selesai dibuat dan siap disajikan/diambil oleh pelanggan/pelayan.

### B. Kartu Pesanan (Order Card)
Setiap pesanan diwakili oleh satu kartu.
* **Header Kartu**: Menampilkan Nomor Order/Struk (misal: #ORD-0012) dan Nama Pelanggan / Nomor Meja.
* **Timer**: Menampilkan durasi sejak pesanan diinput (misal: "Menunggu: 05:20" - warna akan berubah menjadi merah jika melebihi batas waktu tunggu standar, misal > 15 menit).
* **Tipe Pesanan**: Label untuk "Dine-In", "Take-away", atau "Online".
* **Isi Singkat**: Rangkuman jumlah item (misal: "3 Item").

### C. Interaksi Papan Kanban
* **Drag-and-Drop**: Pengguna dapat menggeser kartu dari "Antrean" -> "Sedang Dibuat" -> "Selesai".
* **Klik Tombol Status**: Selain di-drag, pada setiap kartu ada tombol aksi cepat (contoh: tombol "Mulai Buat" dan tombol "Selesai!").

### D. Modal / Popup Detail Pesanan
Terbuka ketika sebuah kartu pesanan diklik.
* **Isi Modal**: 
  - Daftar lengkap menu yang dipesan.
  - Jumlah (Qty) tiap menu.
  - **Catatan / Notes**: Permintaan khusus pelanggan dengan font tebal atau highlight (misal: "**Less Sugar**", "**Extra Shot**", "**No Ice**").
* **Aksi Tambahan**: Bisa menekan tombol checklist pada tiap item untuk menandai item mana yang sudah dibuat secara parsial (membantu memantau orderan besar).

## 4. Keterkaitan dengan Modul Lain
* **Modul Penjualan**: Begitu kasir menyimpan transaksi, order otomatis muncul di KDS.
* **Modul Notifikasi**: Saat order dipindah ke kolom "Selesai", sistem dapat mengirimkan notifikasi suara/visual ke layar kasir bahwa pesanan #ORD-0012 siap disajikan.

## 5. Kriteria Penerimaan (Acceptance Criteria)
- [ ] Kartu pesanan baru muncul seketika secara *real-time* tanpa harus me-refresh halaman (menggunakan WebSocket/Polling).
- [ ] Kartu dapat dipindah statusnya baik dengan mekanisme drag-and-drop maupun menekan tombol aksi.
- [ ] Modal detail dapat memunculkan informasi catatan (*notes*) pelanggan secara jelas.
- [ ] Adanya penanda visual (warna) apabila waktu tunggu order sudah terlalu lama.
