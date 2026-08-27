# 01 — Project Overview

## Status

Dokumen ini adalah ringkasan konteks bersama untuk semua agent yang bekerja di repository Tresbros.

## Identitas Project

- Nama: Tresbros Caffè
- Domain: Point of Sale (POS), Kitchen Display System (KDS), dan backoffice SaaS untuk bisnis Food & Beverage.
- Repository: `C:\Kerjaan\saas\tresbros`
- Bentuk: monorepo multi-aplikasi.

## Komponen Utama

| Komponen | Lokasi | Status aktual |
|---|---|---|
| Web frontend dan BFF | `frontend/` | Next.js App Router aktif |
| Backend API | `backend/` | ASP.NET Core/.NET 8 aktif |
| Database | PostgreSQL | Dipakai oleh EF Core backend |
| Mobile app | `mobile/` | Expo SDK 53/React Native aktif |
| Design reference | `design_system/` | Dokumentasi visual dan UI |
| Deployment | root Docker + `.github/workflows/` | Docker Compose dan GitHub Actions |

## Tujuan Bisnis

Sistem menghubungkan proses penjualan, dapur/barista, persediaan, pembelian, resep/R&D, akuntansi, pelanggan, pengguna, dan laporan dalam satu platform.

## Sumber Kebenaran

Prioritas informasi saat terjadi perbedaan:

1. Source code dan konfigurasi yang sedang dijalankan.
2. Migration/model/API aktual.
3. README dan dokumentasi teknis.
4. BRD/feature specification sebagai requirement, bukan bukti implementasi.
5. `mobile/PLAN.md` sebagai rencana/blueprint; jangan menganggap semua itemnya sudah tersedia.

## Aturan Ringkas untuk Agent

- Baca dokumen dalam folder ini sebelum coding.
- Bedakan fakta aktual, requirement, dan rencana.
- Cari implementasi serupa sebelum membuat pola baru.
- Jangan menambah dependency tanpa kebutuhan dan verifikasi manifest.
- Jangan menaruh credential, token, password, atau DSN ke dokumentasi/commit.
- Setelah perubahan, jalankan validasi yang relevan dan periksa diff.
