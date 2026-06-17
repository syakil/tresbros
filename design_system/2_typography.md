# Tipografi (Typography)

Untuk memastikan hierarki visual yang jelas dan keterbacaan yang sangat tinggi di berbagai perangkat (tablet kasir maupun monitor dapur), kita menggunakan perpaduan dua jenis font dari Google Fonts.

## 1. Font Utama (Headings & Display)
**Font Family**: `Outfit`
*   **Karakteristik**: Geometris, modern, dan memberikan kesan dinamis namun elegan.
*   **Penggunaan**: 
    *   Nama Menu Produk di POS.
    *   Total Harga Transaksi (Angka besar).
    *   Judul Halaman / Judul Papan Kanban KDS.
*   **Bobot (Weights)**: Semi-Bold (600) dan Bold (700).

## 2. Font Sekunder (Body & UI Text)
**Font Family**: `Inter`
*   **Karakteristik**: Bersih, proporsional, dirancang khusus untuk layar digital UI/UX. Keterbacaan sangat tinggi dalam ukuran kecil.
*   **Penggunaan**:
    *   Deskripsi Produk dan *Inventory*.
    *   Tabel Data, *Dropdown*, dan Input *Form*.
    *   *Notes* (Catatan Khusus Pelanggan) pada tiket/kartu KDS.
*   **Bobot (Weights)**: Regular (400) dan Medium (500).

## Aturan Hierarki Visual (Contoh Tailwind CSS)
*   `text-3xl` / `text-4xl` (`Outfit`): Angka Total Bayar / Headline.
*   `text-xl` / `text-2xl` (`Outfit`): Nama Menu / Header Modal Detail Pesanan.
*   `text-sm` / `text-base` (`Inter`): Teks paragraf biasa.
*   `text-xs` (`Inter`): Label status riwayat atau penanda waktu tunggu (*timer* KDS).
