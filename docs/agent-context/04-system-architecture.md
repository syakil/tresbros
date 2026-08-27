# 04 — System Architecture and Data Flow

## Implemented Topology

```text
Browser / Mobile
        |
        v
Next.js frontend
  - pages/UI
  - /api/* BFF routes
        |
        v
ASP.NET Core .NET 8 API
  - JWT authentication
  - controllers
  - EF Core
        |
        v
PostgreSQL 15
```

The mobile README states that mobile calls the Next.js BFF (`/api/*`) rather than calling .NET directly. Verify each resource module before assuming every route follows this rule.

## Web Request Flow

1. A page in `frontend/src/app/` calls a local `/api/...` endpoint using Axios or React Query.
2. The corresponding Next.js route in `frontend/src/app/api/` reads cookies/headers/body.
3. The route uses the shared backend client and forwards to the .NET API.
4. Backend authentication validates the JWT.
5. Controller executes EF Core query/command.
6. JSON response returns through the BFF to the page.

## Authentication Flow

- Backend `AuthController` exposes anonymous `POST /api/Auth/login`.
- Backend returns a JWT valid for 7 days.
- Web BFF login route calls backend and sets `tresbros_token` as HttpOnly cookie.
- Web also sets `tresbros_user` as a readable cookie for basic UI identity.
- Mobile stores token/user in Expo Secure Store and adds `Authorization: Bearer ...` through Axios interceptor.
- 401 responses redirect/logout through the respective query/client handlers.

## Domain Areas

The active product scope includes:

- Dashboard and operational overview.
- POS/orders and payment integration.
- KDS/queue.
- Products/categories/recipes.
- Materials, batches, stock adjustment, purchases.
- Customers, coupons.
- Income and expenses.
- Accounting: chart of accounts, journals, ledger, profit/loss, closing, assets.
- R&D recipes and calibration.
- Users, roles, permissions, settings.

Confirm route/controller/model existence before claiming a domain is complete.

## Important Boundary

Redis, RabbitMQ, workers, Prometheus, and Grafana appear in root README as TBA/planned architecture. Do not implement or document them as active runtime dependencies without source/config evidence.
