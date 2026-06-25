# Next Features Task Tracker (Architecture Upgrade)

Daftar tugas ini digunakan untuk melacak progres implementasi teknologi tambahan untuk meningkatkan skala aplikasi (Redis, RabbitMQ, Prometheus, Grafana, dan Unit Test).
Berikan tanda:
- `[ ]` jika belum dikerjakan.
- `[/]` jika sedang dalam pengerjaan (In Progress).
- `[x]` jika sudah selesai sepenuhnya.

---

## 1. Redis (Caching & Performance)
- [ ] Tambahkan `redis` service di dalam `docker-compose.yml` (dan `.prod.yml`).
- [ ] Integrasikan library `StackExchange.Redis` di Backend (.NET Core).
- [ ] Implementasi *Data Caching* untuk endpoint master data (`GET /api/products`, `GET /api/categories`, resep, dsb).
- [ ] (Opsional) Gunakan Redis untuk *Rate Limiting* API.

## 2. RabbitMQ (Message Broker / Asynchronous Processing)
- [ ] Tambahkan `rabbitmq` service di `docker-compose.yml` (dan `.prod.yml`).
- [ ] Integrasikan library `MassTransit` atau `RabbitMQ.Client` di Backend.
- [ ] Setup sistem *Worker/Consumer* untuk memproses antrean pesan (Queue).
- [ ] **Fitur Email Stok Kosong:** Buat logika saat stok bahan habis, sistem melempar pesan ke RabbitMQ. *Worker* memproses antrean dan mengirimkan email notifikasi ke *Owner*.
- [ ] **Fitur Generate Laporan:** Lempar proses pembuatan laporan berat (PDF/Excel) ke RabbitMQ agar tidak memblokir sistem POS.
- [ ] **Fitur Sinkronisasi:** (Untuk masa depan) Kirim data penjualan cabang ke pusat secara *asynchronous*.

## 3. Prometheus & Grafana (Monitoring & Observability)
- [ ] Tambahkan `prometheus` dan `grafana` di `docker-compose.yml`.
- [ ] Install library `prometheus-net.AspNetCore` di .NET Core untuk mengekspos metrik di `/metrics`.
- [ ] Konfigurasi `prometheus.yml` untuk menarik (*scrape*) data metrik dari Backend.
- [ ] Buat *Dashboard* di Grafana untuk memvisualisasikan memori, beban API, dan durasi *query* Database.

## 4. Unit Test (Quality Assurance)
- [ ] Setup *Project* xUnit / NUnit untuk Backend (`backend.Tests`).
- [ ] Tulis *unit test* untuk logika bisnis Backend (misal: Perhitungan total POS, COGS R&D).
- [ ] Setup `Jest` dan `React Testing Library` di project Frontend (Next.js).
- [ ] Tulis *unit test* untuk fungsi *Zustand Store* (Manajemen state keranjang kasir).

## 5. Dokumentasi & README
- [ ] Buat file `README.md` utama di *root directory*.
- [ ] Dokumentasikan Diagram Arsitektur Sistem (Next.js -> .NET -> Postgres, Redis, RabbitMQ).
- [ ] Dokumentasikan *Prerequisites* instalasi dan daftar *Environment Variables* yang dibutuhkan.
- [ ] Dokumentasikan panduan lengkap cara *deploy* / menjalankan aplikasi via Docker Compose.
