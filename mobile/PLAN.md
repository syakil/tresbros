# Plan: React Native Mobile App — Tres Bros Caffe

## 1. Overview

Membangun aplikasi mobile React Native untuk Tres Bros Caffe yang:
- **Clean code** architecture (feature-based folder structure, separation of concerns)
- **Design system** mengikuti frontend (earthy/coffee tones, Outfit + Inter typography)
- **API flow** hit ke frontend Next.js BFF (`/api/*` routes), bukan langsung ke .NET backend

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | **Expo (SDK 53)** + React Native | Managed workflow, fast iteration, OTA updates |
| Language | **TypeScript** | Type safety, consistency with frontend |
| Navigation | **Expo Router (file-based)** | Mirrors Next.js App Router conventions |
| State Management | **Zustand** | Same as frontend (`useCartStore`, `useAuthStore`) |
| Server State | **TanStack React Query** | Same as frontend, caching + refetching |
| HTTP Client | **Axios** | Same as frontend |
| Forms | **React Hook Form** + Zod | Validation layer |
| Fonts | **Outfit** + **Inter** (expo-google-fonts) | Matches design system |
| Animations | **React Native Reanimated** | KDS kanban drag-drop, spring physics |
| Storage | **expo-secure-store** | Token storage (replaces HttpOnly cookie) |
| UI Components | **Custom themed components** | Matches design system tokens |

---

## 3. Architecture

### 3.1 Folder Structure (Clean Code / Feature-Based)

```
mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root layout (providers, fonts)
│   ├── (auth)/                   # Auth group
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (app)/                    # Protected group
│   │   ├── _layout.tsx           # Tab navigator
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx       # Tab bar config
│   │   │   ├── index.tsx         # Dashboard
│   │   │   ├── pos.tsx           # Point of Sale
│   │   │   ├── kds.tsx           # Kitchen Display
│   │   │   └── more.tsx          # More menu (admin features)
│   │   ├── admin/
│   │   │   ├── items.tsx
│   │   │   ├── recipes.tsx
│   │   │   ├── inventory.tsx
│   │   │   ├── purchases.tsx
│   │   │   ├── expenses.tsx
│   │   │   ├── incomes.tsx
│   │   │   ├── coupons.tsx
│   │   │   ├── users.tsx
│   │   │   ├── roles.tsx
│   │   │   ├── settings.tsx
│   │   │   └── accounting/
│   │   │       ├── coa.tsx
│   │   │       ├── journals.tsx
│   │   │       ├── ledger.tsx
│   │   │       └── profit-loss.tsx
│   │   ├── orders/
│   │   │   └── [id].tsx
│   │   └── rnd/
│   │       ├── index.tsx
│   │       └── [id].tsx
│   └── queue.tsx                 # Public queue display
├── src/
│   ├── api/                      # API layer
│   │   ├── client.ts             # Axios instance + interceptors
│   │   ├── auth.ts               # Auth endpoints
│   │   ├── orders.ts             # Order endpoints
│   │   ├── products.ts           # Product endpoints
│   │   ├── categories.ts         # Category endpoints
│   │   ├── materials.ts          # Material endpoints
│   │   ├── recipes.ts            # Recipe endpoints
│   │   ├── purchases.ts          # Purchase endpoints
│   │   ├── expenses.ts           # Expense endpoints
│   │   ├── incomes.ts            # Income endpoints
│   │   ├── coupons.ts            # Coupon endpoints
│   │   ├── users.ts              # User endpoints
│   │   ├── roles.ts              # Role endpoints
│   │   ├── settings.ts           # Settings endpoints
│   │   ├── dashboard.ts          # Dashboard aggregated data
│   │   ├── rnd.ts                # R&D endpoints
│   │   └── accounting.ts         # Accounting endpoints
│   ├── components/               # Shared components
│   │   ├── ui/                   # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── index.ts          # Barrel export
│   │   ├── layout/               # Layout components
│   │   │   ├── ScreenContainer.tsx
│   │   │   ├── Header.tsx
│   │   │   └── TabBar.tsx
│   │   └── features/             # Feature-specific shared components
│   │       ├── OrderCard.tsx
│   │       ├── ProductCard.tsx
│   │       ├── MaterialRow.tsx
│   │       └── CartSidebar.tsx
│   ├── hooks/                    # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   └── usePermissions.ts
│   ├── store/                    # Zustand stores
│   │   ├── useAuthStore.ts
│   │   └── useCartStore.ts
│   ├── theme/                    # Design system tokens
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── shape.ts
│   │   └── index.ts
│   ├── types/                    # TypeScript types
│   │   ├── api.ts                # API response types
│   │   ├── models.ts             # Domain models
│   │   └── navigation.ts         # Navigation param types
│   ├── utils/                    # Utilities
│   │   ├── format.ts             # Currency, date formatting
│   │   ├── validation.ts         # Zod schemas
│   │   └── permissions.ts        # Permission checker
│   └── constants/                # App constants
│       └── config.ts             # API base URL, env vars
├── assets/                       # Static assets
│   ├── fonts/
│   │   ├── Outfit-*.ttf
│   │   └── Inter-*.ttf
│   └── images/
│       └── logo.png
├── app.json                      # Expo config
├── package.json
├── tsconfig.json
└── babel.config.js
```

### 3.2 Architecture Principles

1. **Separation of Concerns**: API layer, UI layer, state management terpisah jelas
2. **Feature-based grouping**: File routes mengikuti fitur, bukan tipe file
3. **Barrel exports**: `index.ts` di setiap folder untuk clean imports
4. **Single Responsibility**: Setiap file/component punya 1 tanggung jawab
5. **Dependency Injection via Context**: Providers di root layout

---

## 4. Design System Implementation

### 4.1 Color Tokens (`src/theme/colors.ts`)

```typescript
export const Colors = {
  // Brand
  olive:    '#4B5A3A',   // Primary CTA, "Done" status
  sage:     '#7D8F6A',   // Secondary, "Queue" status
  cream:    '#F3EDE1',   // Light mode background
  brown:    '#A16B3D',   // Accent, "In Progress" status
  dark:     '#3A2B1F',   // Dark mode background

  // Semantic
  statusQueue:       '#7D8F6A',
  statusInProgress:  '#A16B3D',
  statusDone:        '#4B5A3A',
  statusAlert:       '#C53030',

  // Neutral (from frontend)
  white:    '#FFFFFF',
  zinc50:   '#FAFAFA',
  zinc100:  '#F4F4F5',
  zinc200:  '#E4E4E7',
  zinc800:  '#27272A',
  zinc900:  '#18181B',
  zinc950:  '#09090B',

  // Functional
  primary:    '#2563EB',  // Links, focus (from frontend)
  success:    '#10B981',
  warning:    '#F59E0B',
  danger:     '#EF4444',
};
```

### 4.2 Typography (`src/theme/typography.ts`)

Font families: **Outfit** (headings) + **Inter** (body)

| Role | Font | Size | Weight |
|---|---|---|---|
| Headline | Outfit | 36 | 700 |
| Title | Outfit | 24 | 600 |
| Subtitle | Outfit | 20 | 600 |
| Body Large | Inter | 16 | 400 |
| Body | Inter | 14 | 400 |
| Caption | Inter | 12 | 400 |

### 4.3 Shape Tokens (`src/theme/shape.ts`)

| Property | Value |
|---|---|
| Card border radius | 16 |
| Button border radius | 12 |
| Input border radius | 8 |
| Glass opacity | 0.8 |

---

## 5. API Layer Design

### 5.1 Axios Client (`src/api/client.ts`)

```
Base URL: Configurable via .env → EXPO_PUBLIC_API_URL
          Default: http://localhost:3000 (Next.js frontend)

Interceptors:
  Request:  Attach Bearer token from SecureStore
  Response: Handle 401 → clear auth → redirect to login
            Handle network errors globally
```

### 5.2 API Module Pattern

Setiap module API mengikuti pattern yang sama:

```typescript
// src/api/orders.ts
import { client } from './client';
import { Order, CreateOrderDto } from '@/types/models';

export const ordersApi = {
  getAll: () => client.get<Order[]>('/api/orders'),
  getById: (id: number) => client.get<Order>(`/api/orders/${id}`),
  create: (data: CreateOrderDto) => client.post<Order>('/api/orders', data),
  updateStatus: (id: number, status: string) => client.patch(`/api/orders/${id}`, { status }),
  delete: (id: number) => client.delete(`/api/orders/${id}`),
};
```

### 5.3 Complete API Mapping (Mobile → Frontend → Backend)

| Mobile Module | Frontend Route | Backend Route |
|---|---|---|
| Auth | POST `/api/auth/login` | POST `/api/Auth/login` |
| Orders | GET/POST `/api/orders`, PATCH `/api/orders/[id]` | GET/POST `/api/Order`, PUT `/api/Order/[id]/status` |
| Products | GET/POST `/api/products`, PUT `/api/products/[id]` | GET/POST `/api/Product`, PUT `/api/Product/[id]` |
| Categories | GET `/api/categories` | GET `/api/Category` |
| Materials | GET/POST `/api/materials`, PUT `/api/materials/[id]` | GET/POST `/api/Material`, PUT `/api/Material/[id]` |
| Recipes | GET/POST `/api/recipes`, DELETE `/api/recipes/[id]` | GET/POST `/api/RecipeItem`, DELETE `/api/RecipeItem/[id]` |
| Purchases | GET/POST `/api/purchases`, PATCH `/api/purchases/[id]` | GET/POST `/api/Purchase`, PUT `/api/Purchase/[id]/cancel` |
| Expenses | GET/POST/PUT/DELETE `/api/expenses` | GET/POST/PUT/DELETE `/api/Finance/expenses` |
| Incomes | GET/POST/PUT/DELETE `/api/incomes` | GET/POST/PUT/DELETE `/api/Finance/incomes` |
| Coupons | GET/POST/PUT/DELETE `/api/coupons` | GET/POST/PUT/DELETE `/api/Coupon` |
| Users | GET/POST/PUT/DELETE `/api/users` | GET/POST/PUT/DELETE `/api/User` |
| Roles | GET/POST/PUT/DELETE `/api/roles` | GET/POST/PUT/DELETE `/api/Role` |
| Settings | GET/POST `/api/settings` | GET/POST `/api/Settings` |
| Dashboard | GET `/api/dashboard` | Aggregated from multiple endpoints |
| R&D | CRUD `/api/rnd`, test, promote | CRUD `/api/RnD`, test, promote |
| Accounting | COA, journals, ledger, profit-loss | COA, journals, ledger, profit-loss |

---

## 6. State Management

### 6.1 Zustand Stores

**`useAuthStore`** — Mirrors frontend pattern:
```
State: { user, token, isAuthenticated }
Actions: login(user, token), logout()
Persistence: expo-secure-store for token
```

**`useCartStore`** — Mirrors frontend `useCartStore`:
```
State: { items[], customerName, discountType, discountAmount, appliedCoupon, taxEnabled }
Actions: addItem, removeItem, updateQuantity, setCustomerName, updateNotes, setDiscount, clearCart
Computed: getSubtotal, getDiscount, getTax (11% PB1), getTotal
```

### 6.2 React Query Hooks

Custom hooks per resource:
```typescript
// Example: src/hooks/useOrders.ts
export function useOrders() { return useQuery({ queryKey: ['orders'], queryFn: ordersApi.getAll }); }
export function useCreateOrder() { return useMutation({ mutationFn: ordersApi.create }); }
```

---

## 7. Navigation Structure

### 7.1 Auth Flow

```
Root Layout
├── (auth) group → Login screen (no tab bar)
│   └── login.tsx
└── (app) group → Protected screens (tab bar)
    └── (tabs)
        ├── Dashboard (index)
        ├── POS
        ├── KDS
        └── More → Admin sub-screens (stack navigation)
```

### 7.2 Route Guards

- `_layout.tsx` di `(app)` group: check `useAuthStore.isAuthenticated`
- Jika tidak authenticated → redirect ke `(auth)/login`
- Middleware pattern: `useProtectedRoute()` hook

---

## 8. Feature Implementation Phases

### Phase 1: Foundation (Core Setup)
1. Inisialisasi Expo project dengan TypeScript
2. Setup folder structure sesuai plan
3. Install dependencies (zustand, react-query, axios, expo-secure-store, expo-font)
4. Implement theme tokens (colors, typography, shape)
5. Build UI primitives (Button, Card, Input, Select, Badge, Modal)
6. Setup Axios client dengan interceptors
7. Setup Zustand stores (auth, cart)
8. Setup React Query provider
9. Implement font loading (Outfit + Inter)
10. Setup Expo Router dengan auth flow

### Phase 2: Auth & Core Navigation
1. Login screen (matching frontend design)
2. Auth API integration (`/api/auth/login`)
3. Token storage di SecureStore
4. Auth state management (login, logout, auto-refresh)
5. Route guards (protected vs public routes)
6. Tab navigator dengan permission-based visibility
7. Logout flow

### Phase 3: POS (Point of Sale)
1. Product grid layout (touch-friendly cards)
2. Category filter
3. Cart sidebar / drawer
4. Add/remove/update cart items
5. Notes per item
6. Discount (nominal / percentage)
7. Coupon validation
8. Tax calculation (11% PB1)
9. Checkout flow (Cash / Midtrans)
10. Order creation → `/api/orders`
11. Receipt / order confirmation

### Phase 4: KDS (Kitchen Display System)
1. Kanban board layout (3 columns: Queue, In Progress, Done)
2. Order cards dengan item details + notes
3. Status transitions (TODO → DONE → TAKEN)
4. Auto-refresh polling (3s interval)
5. SLA timer dengan pulse animation saat breach
6. Fade-in animation untuk order baru

### Phase 5: Dashboard
1. Sales summary cards (today's revenue, transaction count)
2. Sales trend chart
3. Top products list
4. Stock alerts (minimum stock)
5. Date filter (today, yesterday, 7 days, month)

### Phase 6: Admin - Inventory & Recipes
1. Materials list (CRUD)
2. Stock adjustment (in/out)
3. Material batches view
4. Products list (CRUD)
5. Recipe management (product → materials mapping)
6. Categories management

### Phase 7: Admin - Purchases & Finance
1. Purchase orders list (CRUD)
2. Create purchase with items
3. Cancel purchase
4. Expenses CRUD
5. Incomes CRUD
6. Coupon management

### Phase 8: Admin - Users & Settings
1. User CRUD
2. Role CRUD (with permissions JSON)
3. Settings management
4. Database reset (with confirmation)

### Phase 9: Admin - Accounting
1. Chart of Accounts
2. Journal entries
3. General ledger
4. Profit & Loss report

### Phase 10: R&D Module
1. R&D experiments list
2. Create/edit experiment
3. Test experiment (stock deduction)
4. Promote to product
5. Test history view

### Phase 11: Polish & Optimization
1. Dark mode support (using cream/dark brown tokens)
2. Pull-to-refresh on all list screens
3. Error states & empty states
4. Loading skeletons
5. Offline support (React Query cache persistence)
6. Push notifications (stock alerts, new orders)
7. Tablet responsive layout (POS split-panel)
8. App icon + splash screen

---

## 9. Key Implementation Details

### 9.1 Auth Token Strategy

Frontend menggunakan HttpOnly cookies → Mobile tidak bisa. Strategy:
1. Login → POST `/api/auth/login` → dapat JWT token
2. Simpan token di `expo-secure-store`
3. Setiap API request → `Authorization: Bearer {token}` header
4. Frontend API routes perlu support Bearer token juga (atau mobile hit backend langsung)

**Decision**: Mobile akan hit **frontend Next.js API routes** dengan Bearer token. Frontend sudah punya `backendClient` yang forward auth header ke backend. Perlu modifikasi kecil di frontend untuk accept Bearer token dari mobile (selain cookie).

### 9.2 Frontend Modification Needed

Tambahkan di `src/lib/backendClient.ts`:
```typescript
// Accept Bearer token from mobile, fallback to cookie
const token = headers().get('authorization')?.replace('Bearer ', '') 
              ?? cookies().get('tresbros_token')?.value;
```

### 9.3 Cart Implementation

Cart di mobile mirip frontend tapi optimized untuk touch:
- Swipe-to-remove items
- Quantity stepper (+/- buttons)
- Bottom sheet untuk cart detail (mobile) vs sidebar (desktop web)
- Notes input via modal

### 9.4 KDS Kanban di Mobile

- Horizontal scroll kanban (3 columns)
- Drag-and-drop via `react-native-gesture-handler` + `react-native-reanimated`
- Fallback: tap to change status (simpler UX on small screens)
- SLA timer dengan `setInterval` + pulse animation

---

## 10. Dependencies

```json
{
  "dependencies": {
    "expo": "~53.0.0",
    "expo-router": "~5.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-font": "~13.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-status-bar": "~2.2.0",
    "react": "19.0.0",
    "react-native": "0.79.0",
    "react-native-safe-area-context": "~5.4.0",
    "react-native-screens": "~4.10.0",
    "react-native-gesture-handler": "~2.24.0",
    "react-native-reanimated": "~3.17.0",
    "@react-navigation/native": "^7.0.0",
    "@tanstack/react-query": "^5.101.0",
    "zustand": "^5.0.14",
    "axios": "^1.17.0",
    "date-fns": "^4.4.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "react-native-web": "~0.19.0"
  },
  "devDependencies": {
    "@types/react": "~19.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 11. Files to Create (Phase 1 - Foundation)

Berikut urutan pembuatan file untuk Phase 1:

1. `mobile/package.json` — Dependencies
2. `mobile/app.json` — Expo config
3. `mobile/tsconfig.json` — TypeScript config
4. `mobile/babel.config.js` — Babel config
5. `mobile/app/_layout.tsx` — Root layout (providers, fonts)
6. `mobile/src/theme/colors.ts` — Color tokens
7. `mobile/src/theme/typography.ts` — Typography tokens
8. `mobile/src/theme/spacing.ts` — Spacing tokens
9. `mobile/src/theme/shape.ts` — Shape tokens
10. `mobile/src/theme/index.ts` — Barrel export
11. `mobile/src/constants/config.ts` — API URL config
12. `mobile/src/api/client.ts` — Axios instance
13. `mobile/src/api/auth.ts` — Auth API
14. `mobile/src/types/models.ts` — Domain model types
15. `mobile/src/types/api.ts` — API types
16. `mobile/src/store/useAuthStore.ts` — Auth store
17. `mobile/src/store/useCartStore.ts` — Cart store
18. `mobile/src/components/ui/Button.tsx` — Button component
19. `mobile/src/components/ui/Card.tsx` — Card component
20. `mobile/src/components/ui/Input.tsx` — Input component
21. `mobile/src/components/ui/Select.tsx` — Select component
22. `mobile/src/components/ui/Badge.tsx` — Badge component
23. `mobile/src/components/ui/Modal.tsx` — Modal component
24. `mobile/src/components/ui/EmptyState.tsx` — Empty state
25. `mobile/src/components/ui/LoadingSpinner.tsx` — Loading
26. `mobile/src/components/ui/index.ts` — Barrel export
27. `mobile/src/components/layout/ScreenContainer.tsx`
28. `mobile/src/components/layout/Header.tsx`
29. `mobile/src/utils/format.ts` — Currency/date formatting
30. `mobile/src/utils/validation.ts` — Zod schemas
31. `mobile/src/hooks/useAuth.ts` — Auth hook
32. `mobile/src/hooks/usePermissions.ts` — Permission hook

---

## 12. Verification Plan

1. **Lint**: Setup ESLint dengan same rules sebagai frontend
2. **Type Check**: `npx tsc --noEmit` pastikan zero errors
3. **API Integration Test**: Test login flow → get dashboard data
4. **UI Verification**: Compare screens dengan frontend design
5. **Navigation Test**: Verify auth guards, tab visibility, deep links
6. **Performance**: React DevTools Profiler untuk re-render analysis
