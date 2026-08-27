# 05 — Backend and Database

## Runtime

`backend/Program.cs` is the backend composition root.

- Registers controllers with a global authenticated-user authorization filter.
- Enables JSON cycle ignoring.
- Registers Swagger.
- Registers `AppDbContext` with PostgreSQL using `ConnectionStrings:DefaultConnection`.
- Configures JWT Bearer with issuer, audience, signing key, and zero clock skew.
- Registers `ClosingService`.
- Applies `db.Database.Migrate()` during startup.
- Maps controllers after authentication and authorization middleware.

Development enables Swagger and HTTPS redirection. Production behavior differs; inspect environment settings before changing middleware.

## EF Core DbSets

`backend/Data/AppDbContext.cs` currently exposes:

`Category`, `Customer`, `Product`, `Order`, `OrderItem`, `Expense`, `Income`, `Material`, `Purchase`, `PurchaseItem`, `RecipeItem`, `Coupon`, `MidtransLog`, `Setting`, `ChartOfAccount`, `JournalEntry`, `JournalEntryLine`, `MaterialBatch`, `Role`, `User`, `RnDRecipe`, `RnDRecipeIngredient`, `RnDTestHistory`, `ClosingPeriod`, `Asset`, `CalibrationLog`, and `CalibrationTrial`.

For fields/relationships, read the individual files under `backend/Models/`; do not infer schema from BRD names.

## Constraints and Seed Data

Unique indexes are configured for:

- Category name.
- Purchase number.
- Coupon code.
- Username.

Model seed creates the Super Admin role and `admin` user. Startup also seeds `TAX_ENABLED` and required chart-of-account codes, and reconciles batches connected to cancelled purchases.

## API Conventions

- Controller routes generally use `[Route("api/[controller]")]`.
- A global authentication requirement applies unless an action/controller explicitly allows anonymous access.
- Auth login is the known anonymous exception.
- Inspect controller attributes and DTOs for exact method, route, payload, and response before changing frontend calls.

## Database Safety

- Never commit real passwords, JWT keys, Midtrans keys, or Sentry DSNs.
- Be cautious with automatic migrations and startup seed/reconciliation logic.
- For schema changes, inspect existing migrations and update model, migration, and affected consumers together.
- Preserve accounting and stock invariants; test cancellation, adjustment, and duplicate-code paths.
