# 06 — Web Frontend

## Framework Pattern

The web app uses Next.js App Router under `frontend/src/app/`. `src/app/layout.tsx` provides:

- Indonesian document language.
- Plus Jakarta Sans font variable.
- Global CSS.
- `QueryProvider` for TanStack React Query.

The dashboard page is a client component and demonstrates the current style: shared `AppLayout`/UI components, Axios calls to local BFF endpoints, React Query for server state, and Recharts for visualization.

## Data Fetching

Existing code uses two patterns:

1. React Query (`useQuery`, `useMutation`, cache invalidation) for pages such as inventory and dashboard.
2. `useEffect` + Axios + local state for some admin pages.

Follow the nearest feature rather than introducing a third pattern. Preserve query keys and invalidate related keys after mutations.

## API Boundary

Frontend components should normally call `/api/...`, not the .NET URL directly. BFF routes handle backend URL, cookies, headers, import/export, and authentication forwarding. Inspect `frontend/src/app/api/` and `frontend/src/lib/backendClient*` before adding calls.

## Authentication UX

`frontend/src/components/providers/QueryProvider.tsx` redirects to `/login` when a query or mutation receives 401. The login BFF route sets the token cookie and readable user cookie. Do not expose the JWT to client JavaScript or duplicate cookie logic in pages.

## UI Conventions

- Reuse components in `frontend/src/components/ui/` and layout components.
- Reuse existing Tailwind tokens/classes and design-system references.
- Preserve Indonesian user-facing copy unless the feature convention says otherwise.
- Handle loading, empty, error, and success states.
- Use typed models where available; avoid expanding `any`.
- Keep page-specific state local unless an existing shared store/provider is clearly intended.

## Validation

Run from `C:\Kerjaan\saas\tresbros\frontend`:

```bash
npm run lint
npm run build
npx playwright test
```

For API-dependent E2E tests, start the configured web/backend/database stack first.
