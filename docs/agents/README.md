# Tresbros Cline Agents

Folder ini berisi prompt untuk Custom Mode/agent Cline yang sesuai dengan project `C:\Kerjaan\saas\tresbros`.

## Agent yang Tersedia

| File | Peran | Hak edit yang disarankan |
|---|---|---|
| `01-explorer-analyst.md` | Memahami struktur, mencari implementasi, membuat rencana | Read/search; edit hanya jika diminta |
| `02-fullstack-developer.md` | Fitur lintas web-BFF-backend/database/mobile | Edit dan command |
| `03-backend-database.md` | API .NET, EF Core, PostgreSQL | Edit backend/migrations; command |
| `04-web-frontend.md` | Next.js, BFF, UI, React Query | Edit frontend; command |
| `05-mobile.md` | Expo/React Native | Edit mobile; command |
| `06-qa-testing.md` | Test, lint, typecheck, regression | Edit test; command |
| `07-reviewer-security.md` | Review code, security, correctness | Read/search; edit hanya jika diminta |
| `08-devops-deployment.md` | Docker, CI/CD, runtime config, observability | Edit infra/config; command |

## Cara Memasang di Cline

1. Buka Cline di VS Code.
2. Buka menu mode (`Act`/`Plan`) lalu pilih konfigurasi Custom Modes.
3. Buat mode baru.
4. Salin isi file agent yang diinginkan ke System Prompt.
5. Pilih tools sesuai tabel.
6. Simpan.

`.clinerules` di root berlaku sebagai konteks/aturan bersama. Prompt specialist mempersempit fokus agent, bukan menggantikan aturan global.

## Urutan Pemakaian

- Task belum jelas: `01-explorer-analyst`.
- Fitur lintas layer: `02-fullstack-developer`.
- API/schema: `03-backend-database`.
- Web UI/BFF: `04-web-frontend`.
- Expo/mobile: `05-mobile`.
- Test/validasi: `06-qa-testing`.
- Review sebelum merge: `07-reviewer-security`.
- Docker/deployment/monitoring: `08-devops-deployment`.

Semua agent wajib membaca dokumentasi konteks di `docs/agent-context/` terlebih dahulu.
