# Frontend Task Tracker (Tres Bros Caffè)

Daftar tugas ini digunakan untuk melacak progres pengerjaan Frontend (Next.js). 
AI **WAJIB** memberikan tanda:
- `[ ]` jika tugas belum dikerjakan.
- `[/]` jika tugas sedang dalam pengerjaan (In Progress).
- `[x]` jika tugas sudah selesai sepenuhnya.

---

## Tahap 1: Inisialisasi & Setup Dasar
- [x] Setup *Project* Next.js dengan TypeScript dan App Router.
- [x] Hapus *boilerplate code* bawaan Next.js di `page.tsx` dan `globals.css`.
- [x] Konfigurasi `tailwind.config.ts` (Masukkan ke-5 warna *Earthy* dari *Design System*).
- [x] Konfigurasi Google Fonts (Outfit & Inter) di `layout.tsx`.
- [x] Instalasi dependensi tambahan: `zustand`, `@tanstack/react-query`, `lucide-react`, `axios`.

## Tahap 2: Pembuatan Komponen Dasar (UI Kit)
- [x] Buat komponen `Button` (Mendukung prop *variant*: Primary Olive, Secondary Sage, Accent Warm).
- [x] Buat komponen `Input` (Text field, Dropdown) dengan *styling focus* warna *warm*.
- [x] Buat komponen `Card` (dengan efek semi-transparan / *glassmorphism*).
- [x] Buat *Layout* utama aplikasi (Mencakup *Sidebar navigasi* & *Topbar* sederhana).

## Tahap 3: Halaman Autentikasi (Auth)
- [x] Buat halaman Login (`/login`).
- [x] Buat *Zustand store* (`useAuthStore`) untuk menyimpan token dan status user.

## Tahap 3.5: Dummy Backend (Next.js API + SQLite)
- [x] Setup Prisma ORM dan koneksi ke SQLite.
- [x] Buat Skema Prisma (Product, Category, Order).
- [x] Seeding data awal produk (*Dummy Data*).
- [x] Buat API Route `GET /api/products`.
- [x] Buat API Route `POST /api/orders`.

## Tahap 4: Point of Sale (POS / Kasir)
- [x] Buat *layout* layar Kasir di halaman `/pos` (Grid Menu di kiri, Keranjang/Cart di kanan).
- [x] Buat *Zustand store* (`useCartStore`) untuk menampung *item* keranjang, subtotal, dan total pajak.
- [x] Tampilkan *mock-data* / *dummy* list produk menu (Kopi, Makanan).
- [x] Implementasi fitur klik produk untuk masuk ke keranjang.
- [x] Buat modal/dialog untuk konfirmasi *Checkout* dan Pembayaran.

## Tahap 5: Kitchen Display System (KDS)
- [x] Buat *layout* halaman `/kds` (Papan Kanban 3 Kolom: Antrean, Diproses, Selesai).
- [x] Render komponen kartu pesanan KDS (menampilkan detail menu, *notes* pesanan, dan indikator *timer* / SLA waktu tunggu).
- [x] Implementasi fungsi pemindahan status kartu (contoh tombol aksi: "Mulai Masak" -> pindah ke Proses, "Selesai" -> pindah ke Selesai).

## Tahap 6: Manajemen Backoffice (Master Data)
- [x] Halaman Kelola Data Produk/Item (`/admin/items`).
- [x] Halaman Kelola Resep / BOM (`/admin/recipes`).
- [x] Halaman *Dashboard* / Laporan Penjualan Sederhana (`/admin/dashboard`).
