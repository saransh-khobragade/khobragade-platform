# Backend

Express + TypeScript API with Prisma/Postgres for persisted modules.

## Setup

1. Install dependencies:
```bash
bun install
```

2. Create `.env`:
```env
PORT=8080
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/render_db?schema=public"
JWT_SECRET="replace-me-in-production"
JWT_REFRESH_SECRET="replace-me-in-production"
FRONTEND_URL="http://localhost:5173"
API_URL="http://localhost:8080"
```

3. Start Postgres from repo root:
```bash
docker compose up -d
```

4. Generate Prisma client and run migrations:
```bash
bun prisma:generate
bun prisma:migrate
```

5. Start backend:
```bash
bun dev
```

## Route Map

- `GET /health`
- `GET /api/test-db`
- `/api/todos`
- `/api/md5`
- `/api/notes`
- `/api/expense-analyser`
- `/api/auth`, `/api/users`
- `/api/chat`
- `/api/files`
- `/api/blog`
- `/api/instagram`
- `/api/file-sharing`
- `/api/video-chat`
- `/api/screen-sharing`

For exact handlers, see `src/index.ts`.

## Integration Tests

Run all backend integration tests:
```bash
bun run test:integration
```

Run in watch mode:
```bash
bun run test:integration:watch
```

Run one file:
```bash
bunx vitest run tests/integration/todo.routes.test.ts
```

## Test Strategy

- Integration tests execute Express routes through `supertest`.
- Database access is mocked in integration tests (Prisma and selected services are stubbed) to keep tests fast and deterministic.
- Auth-gated modules are tested with mocked auth middleware or token services where needed.

Current suite:

- `tests/integration/todo.routes.test.ts`
- `tests/integration/md5.routes.test.ts`
- `tests/integration/notes.routes.test.ts`
- `tests/integration/expense-analyser.routes.test.ts`
- `tests/integration/user.routes.test.ts`
- `tests/integration/protected-routes-auth.test.ts`
- `tests/integration/chat.routes.test.ts`
- `tests/integration/blog.routes.test.ts`
- `tests/integration/instagram.routes.test.ts`
- `tests/integration/file-sharing.routes.test.ts`
- `tests/integration/video-chat.routes.test.ts`
- `tests/integration/screen-sharing.routes.test.ts`

## End-to-End Tests

Beyond these mocked integration tests, full-stack [Playwright](https://playwright.dev/) tests exercise this backend for real (live HTTP/WebSocket calls against a Docker Postgres). They live in `../e2e` and run from the repo root with `bun run test:e2e`. See the [E2E README](../e2e/README.md).

## Useful Commands

- Build: `bun run build`
- Start built server: `bun run start`
- Prisma Studio: `bun prisma:studio`
- Deploy migrations: `bun prisma:migrate:deploy`
- Stop Postgres (repo root): `docker compose down`
