# 02 — Repository Structure

## Root

- `README.md`: overview, local Docker runbook, environment overview.
- `brd.md`: business requirements and domain flow.
- `fitur_*.md`: feature specifications; treat as requirements unless verified in code.
- `design_system/`: design principles, colors, typography, components, mockups.
- `frontend/`: web app and Next.js BFF routes.
- `backend/`: ASP.NET Core API, EF Core models, migrations, controllers, services.
- `mobile/`: Expo Router mobile client.
- `docker-compose.yml`: local stack.
- `docker-compose.prod.yml`: production image stack.
- `.github/workflows/deploy.yml`: build/push/deploy pipeline.

## Frontend

`frontend/src/` is the source root, aliased as `@/*` in `frontend/tsconfig.json`.

- `src/app/`: Next.js App Router pages and API routes.
- `src/app/api/`: BFF endpoints; these proxy/mediate requests to the .NET API.
- `src/components/`: shared UI, layout, and providers.
- `src/lib/`: shared clients/utilities such as backend client.
- `src/instrumentation.ts`: Sentry runtime registration.
- `tests/e2e/`: Playwright end-to-end tests.

Routes are organized into public/login, POS, queue, KDS, and admin domains. Inspect the actual directory before adding a route.

## Backend

- `backend/Program.cs`: service registration, middleware, JWT, database migration/seed startup.
- `backend/Data/AppDbContext.cs`: EF Core DbSets, indexes, model seed.
- `backend/Models/`: domain entities and DTO-adjacent models.
- `backend/Controllers/`: HTTP API controllers.
- `backend/Services/`: application services.
- `backend/Migrations/`: database schema history, if present.
- `backend/appsettings*.json`: runtime configuration; never copy secrets into docs.

## Mobile

- `mobile/app/`: Expo Router file-based screens and route groups.
- `mobile/src/api/`: Axios client and resource modules.
- `mobile/src/components/`: reusable UI/layout.
- `mobile/src/constants/`: API/config and permission constants.
- `mobile/src/hooks/`: authentication and permission hooks.
- `mobile/src/store/`: Zustand stores.
- `mobile/src/theme/`: design tokens.
- `mobile/src/types/`: API/domain/navigation types.
- `mobile/src/utils/`: formatting and validation.

## Navigation Rule

Before editing, locate the nearest existing feature with the same responsibility and follow its file placement, data-fetching style, naming, and error handling.
