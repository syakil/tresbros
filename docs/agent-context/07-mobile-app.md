# 07 — Mobile App

## Framework and Routes

`mobile` is an Expo SDK 53 app using Expo Router. Route groups separate public/auth screens from protected application screens. Read `mobile/app/` for the current route tree; `mobile/PLAN.md` includes planned screens and must not be treated as a complete inventory.

## Root Providers

`mobile/app/_layout.tsx` currently configures:

- Splash screen lifecycle.
- Local Outfit and Inter fonts.
- Auth-store restoration.
- Protected route hook.
- Unauthorized logout and redirect.
- Safe-area provider.
- A shared TanStack Query client.
- Stack routes for auth, app, and queue.

## API and Auth

`mobile/src/api/client.ts` creates an Axios client using `API_URL`, 30-second timeout, JSON headers, and an interceptor that loads `tresbros_token` from Expo Secure Store into the Bearer header. A response interceptor invokes the registered unauthorized handler for 401.

`mobile/src/store/useAuthStore.ts` stores token and user in Expo Secure Store and exposes `login`, `logout`, and `loadStored`. Do not use web HttpOnly-cookie assumptions in mobile code.

## Organization

Use resource modules under `mobile/src/api/`, domain types under `mobile/src/types/`, Zustand only for client state, and React Query for server state. Reuse theme tokens/components and existing forms/validation.

## API Flow

Documented target flow:

```text
Mobile → Next.js /api/* BFF → .NET backend → PostgreSQL
```

The API base URL comes from `EXPO_PUBLIC_API_URL`/the config implementation. The mobile README says it should point to the Next.js frontend; verify the config file and environment per resource before changing it.

## Validation

Run from `C:\Kerjaan\saas\tresbros\mobile`:

```bash
npm run typecheck
npm run lint
```

Also verify navigation/auth behavior on the target platform when changing route groups or secure storage.
