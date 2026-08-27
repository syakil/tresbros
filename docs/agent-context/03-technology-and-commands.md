# 03 — Technology and Commands

## Web

Defined by `frontend/package.json`:

- Next.js 16, React 19, TypeScript 5.
- App Router.
- Tailwind CSS 4.
- Axios for HTTP.
- TanStack React Query for server state.
- Zustand for client state where used.
- Recharts for charts.
- Playwright for E2E.
- ESLint 9 and `eslint-config-next`.
- Sentry for monitoring.

Commands from `C:\Kerjaan\saas\tresbros\frontend`:

```bash
npm run dev
npm run build
npm run start
npm run lint
npx playwright test
```

There is no frontend `test` script in the manifest; use Playwright configuration for E2E.

## Backend

Defined by `backend/backend.csproj`:

- .NET 8 / ASP.NET Core Web API.
- Entity Framework Core 8.
- PostgreSQL provider via Npgsql.
- JWT Bearer authentication.
- Swagger/Swashbuckle.
- Sentry ASP.NET Core.

Commands from `C:\Kerjaan\saas\tresbros\backend`:

```bash
dotnet restore
dotnet build
dotnet run
```

Use EF tooling only after inspecting the migration state and connection string.

## Mobile

Defined by `mobile/package.json`:

- Expo SDK 53 and React Native 0.79.
- Expo Router 5.
- TypeScript.
- Axios.
- TanStack React Query.
- Zustand.
- React Hook Form + Zod.
- Expo Secure Store.
- Reanimated and gesture handler.

Commands from `C:\Kerjaan\saas\tresbros\mobile`:

```bash
npm install
npm run dev
npm run android
npm run ios
npm run web
npm run lint
npm run typecheck
```

## Container Stack

```bash
docker compose up -d --build
docker compose down
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml down
```

Local ports documented/configured: web `3005`, backend `5052`, PostgreSQL `5432` (production compose binds PostgreSQL to `127.0.0.1:5433`).

Always inspect the actual environment and running service before diagnosing integration failures.
