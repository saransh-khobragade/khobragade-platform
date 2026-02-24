# LLM Context

Purpose: fast onboarding for the next model working in this repo.

## Read First (Source of Truth)

1. `/Users/saransh/Desktop/Github/khobragade-platform/backend/src/index.ts`
2. `/Users/saransh/Desktop/Github/khobragade-platform/frontend/src/config/apps.ts`
3. `/Users/saransh/Desktop/Github/khobragade-platform/frontend/src/App.tsx`
4. `/Users/saransh/Desktop/Github/khobragade-platform/backend/prisma/schema.prisma`
5. `/Users/saransh/Desktop/Github/khobragade-platform/ARCHITECTURE.md`

If docs conflict with code, trust code and update docs.

## Run Locally

1. Start DB:
```bash
docker compose up -d
```

2. Backend (`backend/.env`):
```env
PORT=8080
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/render_db?schema=public"
```

3. Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8080
```

4. Run backend:
```bash
cd backend
bun install
bun prisma:generate
bun prisma:migrate
bun dev
```

5. Run frontend:
```bash
cd frontend
bun install
bun dev
```

## Build/Check Commands

- Backend build: `cd backend && bun run build`
- Frontend build: `cd frontend && bun run build`
- DB GUI: `cd backend && bun run prisma:studio`

## Active Frontend Apps

Defined in `frontend/src/config/apps.ts`:

- `todo`, `md5-converter`, `json-formatter`, `json-compare`
- `notes`, `expense-analyser`
- `chat`, `blog`, `instagram`
- `file-sharing`, `video-chat`, `screen-sharing`

Special routes in `frontend/src/App.tsx`:

- `/notes/:shareId`
- `/file-sharing/receive/:token`
- `/screen-sharing/view/:token`

## Mounted Backend Routes

Mounted in `backend/src/index.ts`:

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

## Where To Edit

For a backend-backed app:

1. Backend module: `backend/src/apps/<app>/`
- `routes.ts`
- `controller.ts`
- `service.ts`
- `types.ts`
- `validator.ts` (if needed)
- `socket.handlers.ts` (if realtime)

2. Frontend module: `frontend/src/apps/<app>/`
- `<App>.tsx`
- `api.ts`
- `types.ts`
- `hooks/*` and/or `components/*`

3. Register app:
- Frontend route metadata in `frontend/src/config/apps.ts`
- Backend router mount in `backend/src/index.ts`

4. Persisted data:
- Update `backend/prisma/schema.prisma`
- Run `bun prisma:migrate` in `backend/`

## Shared Modules

Backend shared modules:

- `backend/src/shared/auth`
- `backend/src/shared/user`
- `backend/src/shared/file-upload`
- `backend/src/shared/realtime`
- `backend/src/shared/http`
- `backend/src/shared/validation`

Frontend shared module:

- `frontend/src/shared/auth`

## Known Repo Footguns

- Active spelling is `expense-analyser`; `expense-analyzer` is legacy/unused.
- Empty legacy folders exist (do not assume active):
- `backend/src/apps/investment-analyzer`
- `backend/src/apps/json-formatter`
- `frontend/src/apps/investment-analyzer`
- `frontend/src/apps/expense-analyzer`

## Handoff Checklist

Before finishing a task:

1. Build backend and frontend.
2. Confirm route wiring in both frontend (`apps.ts`) and backend (`index.ts`) if routes changed.
3. Confirm Prisma model/migration if persistence changed.
4. Update `ARCHITECTURE.md` and this file when architecture/routes/models change.
