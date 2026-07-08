# Tres Bros Caffè - Mobile App

React Native (Expo) mobile application for Tres Bros Caffè POS system.

## Tech Stack

- **Expo SDK 53** + React Native
- **TypeScript**
- **Expo Router** (file-based routing)
- **Zustand** (state management)
- **TanStack React Query** (server state)
- **Axios** (HTTP client)

## Getting Started

```bash
cd mobile
npm install
npx expo start
```

## Environment Variables

Create `.env` file:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

This should point to the **Next.js frontend** URL (not the .NET backend directly).

## Architecture

```
app/              → Expo Router (file-based routes)
src/api/          → API layer (Axios modules per resource)
src/components/   → UI primitives + feature components
src/constants/    → App config, role/permission constants
src/hooks/        → Custom hooks (auth, permissions)
src/store/        → Zustand stores (auth, cart)
src/theme/        → Design tokens (colors, typography, spacing, shape)
src/types/        → TypeScript types (models, API, navigation)
src/utils/        → Utilities (formatting, validation, permissions)
```

## Design System

- **Colors**: Olive `#4B5A3A`, Sage `#7D8F6A`, Cream `#F3EDE1`, Brown `#A16B3D`, Dark `#3A2B1F`
- **Typography**: Outfit (headings) + Inter (body)
- **Border Radius**: 12-16px for cards/buttons

## API Flow

Mobile → Next.js Frontend (`/api/*`) → .NET Backend

The mobile app hits the same Next.js BFF API routes as the web frontend.
