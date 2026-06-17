# Detail Fitur: Modul Manajemen User & Hak Akses

## 1. Deskripsi Umum
Modul ini bertanggung jawab untuk mengelola autentikasi (login) dan otorisasi (hak akses) di dalam sistem. Melalui modul ini, pengelola sistem bisa menambah pekerja baru, menonaktifkan pekerja yang sudah *resign*, serta membatasi menu apa saja yang boleh dibuka oleh pekerja tersebut.

## 2. Pengguna Sasaran (User Target)
* **Admin**: Pengelola utama sistem yang bertugas mengatur akun pekerja.

## 3. Komponen Utama

### A. Tabel Daftar Pengguna (User List)
Halaman yang berisi daftar seluruh akun yang terdaftar di dalam sistem.
* **Kolom Tabel**: Username, Nama Lengkap, Role, Status Aktif (Aktif/Non-aktif), Terakhir Login.
* **Fitur Pencarian**: Untuk mencari nama pengguna dengan cepat.

### B. Kelola Akun (Create & Edit User)
* **Tambah Akun Baru**: Form untuk mengisi Username, Password, Nama Lengkap, dan Dropdown Role.
* **Edit Akun**: Form untuk memperbarui data diri, mengubah Role, atau melakukan Reset Password jika karyawan lupa sandi.
* **Non-aktifkan Akun (Soft Delete)**: Akun tidak dihapus dari database demi menjaga riwayat transaksi (referensi relasi database), namun statusnya diubah menjadi tidak aktif sehingga tidak bisa lagi login.

### C. Manajemen Role & Hak Akses (Role-Based Access Control)
Sistem memiliki pengaturan otorisasi berbasis Role.

| Modul / Fitur             | Admin | Owner | Kasir | Gudang |
| ------------------------- | :---: | :---: | :---: | :----: |
| **Dashboard**             |   ✔   |   ✔   |   ✖   |   ✖    |
| **KDS (Tampilan Dapur)**  |   ✔   |   ✖   |   ✔   |   ✖    |
| **Kasir / Penjualan**     |   ✔   |   ✖   |   ✔   |   ✖    |
| **Manajemen Item / Resep**|   ✔   |   ✖   |   ✖   |   ✖    |
| **Manajemen Stok**        |   ✔   |   ✔   |   ✖   |   ✔    |
| **Pembelian Bahan**       |   ✔   |   ✖   |   ✖   |   ✔    |
| **Manajemen User**        |   ✔   |   ✖   |   ✖   |   ✖    |
| **Laporan**               |   ✔   |   ✔   |   ✖   |   ✖    |

*(Catatan: Konfigurasi matriks akses di atas bisa dibuat *hardcoded* untuk rilis MVP, atau dinamis (bisa diatur centang-centangnya via antarmuka UI) jika dibutuhkan fleksibilitas tinggi).*

### D. Sistem Autentikasi (Login / Logout)
* **Halaman Login**: Halaman publik untuk memasukkan username dan password (tersandi / hashed).
* **Proteksi Sesi**: Jika pengguna belum login, sistem otomatis me-redirect ke halaman login. Jika *role* tidak memiliki izin, pengguna diarahkan ke halaman *403 Forbidden Access*.
* **Logout**: Menghapus sesi / token agar pengguna lain dapat memakai perangkat yang sama dengan aman.

## 4. Kriteria Penerimaan (Acceptance Criteria)
- [ ] Pengguna bisa login dengan kredensial yang valid.
- [ ] Password tersimpan di database dalam bentuk *hash* yang tidak bisa dibaca (contoh: bcrypt), bukan teks biasa.
- [ ] Jika Admin mengubah status user menjadi non-aktif, user tersebut tidak bisa login lagi.
- [ ] Setiap halaman modul harus memiliki pengecekan hak akses; mencegah pengaksesan secara paksa melalui pengetikan URL.
- [ ] User tidak dapat menghapus akunnya sendiri atau admin lain.
