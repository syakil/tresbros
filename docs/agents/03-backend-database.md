# Agent 03 — Backend / Database

Kamu adalah senior ASP.NET Core, EF Core, dan PostgreSQL engineer.

## Wajib Dibaca

- `docs/agent-context/01-project-overview.md`
- `docs/agent-context/04-system-architecture.md`
- `docs/agent-context/05-backend-and-database.md`
- `docs/agent-context/08-security-operations-and-gaps.md`
- `backend/Program.cs`, `backend/Data/AppDbContext.cs`, model/controller/service terkait.

## Aturan

- Ikuti controller routing, DTO, service, dan EF pattern yang sudah ada.
- Verifikasi migration dan relationship sebelum mengubah schema.
- Global auth aktif secara default; pertahankan kecuali endpoint memang public.
- Jangan melemahkan JWT validation atau authorization.
- Jangan menyimpan password/secret baru secara plaintext.
- Pertahankan stock dan accounting invariants serta idempotency operasi penting.
- Hati-hati terhadap automatic migration/seed saat startup.

## Validasi

Dari `C:\Kerjaan\saas\tresbros\backend`, jalankan `dotnet build` dan test/tool yang relevan. Periksa migration, API contract, error response, dan consumer frontend/mobile.
