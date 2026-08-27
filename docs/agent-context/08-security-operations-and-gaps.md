# 08 — Security, Operations, and Known Gaps

## Security Rules for Agents

- Treat all configuration values as sensitive, including database passwords, JWT keys, Midtrans keys, Sentry tokens/DSNs, and CI secrets.
- Use environment variables or deployment secret storage; do not hard-code new secrets.
- Do not log tokens/passwords or include them in generated docs.
- Preserve authentication and authorization checks. Backend controllers are authenticated by default.
- Treat the readable `tresbros_user` cookie as non-sensitive display data only; never put a token in it.
- Validate ownership/role/permission behavior when modifying admin features.

## Operations

Local Compose runs PostgreSQL, backend, and frontend. The backend container listens on 8080 internally and is mapped to host port 5052. The frontend listens on 3000 internally and is mapped to host port 3005.

Production Compose pulls `syakil/tresbros-frontend:latest` and `syakil/tresbros-backend:latest`, injects environment values, and binds PostgreSQL locally to port 5433. GitHub Actions builds/pushes images on pushes to `main`, then copies production compose and deploys via SSH.

## Monitoring

Sentry is configured in both web and backend. Frontend uses `withSentryConfig`, server/edge initialization, and a monitoring tunnel. Backend calls `UseSentry()`. Confirm DSN/token configuration before relying on event delivery.

## Known Gaps / Verification Items

1. Root README describes RabbitMQ, Redis, workers, Prometheus, and Grafana as TBA; no active dependency should be assumed.
2. `mobile/PLAN.md` contains planned file lists and architecture; actual source is authoritative.
3. Frontend manifest includes Prisma/libSQL packages, while the documented primary database path is backend EF Core/PostgreSQL. Determine actual usage before using or removing them.
4. Root and generated template READMEs contain different run instructions/ports; prefer root Compose configuration for the integrated stack.
5. Configuration files contain placeholders and must be reviewed before deployment.
6. Backend login currently compares the stored password directly; any password-security improvement requires coordinated migration of existing seeded/account data.
7. Automatic startup migrations and seed/reconciliation operations can mutate the database; test carefully in deployment environments.

## Agent Completion Checklist

- Read relevant context documents.
- Confirm actual files/routes/models before assumptions.
- Reuse existing patterns/dependencies.
- Make the smallest scoped change.
- Run lint/typecheck/build/test relevant to changed area.
- Inspect final diff and update context docs if architecture changed.
