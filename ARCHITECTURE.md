# Platform Architecture

This document is the practical architecture map for engineers and LLM agents working in this repository.

## Goal

- Keep changes app-scoped where possible.
- Reuse shared modules for auth, file upload, realtime, and HTTP helpers.
- Make onboarding fast by pointing to canonical source files.

## Canonical Source Files

Read these first. They are the source of truth for runtime behavior:

1. `/Users/saransh/Desktop/Github/khobragade-platform/backend/src/index.ts`
2. `/Users/saransh/Desktop/Github/khobragade-platform/frontend/src/config/apps.ts`
3. `/Users/saransh/Desktop/Github/khobragade-platform/frontend/src/App.tsx`
4. `/Users/saransh/Desktop/Github/khobragade-platform/backend/prisma/schema.prisma`

If this document conflicts with code, trust the code and update this file.

## High-Level System

- Frontend: React + Vite app shell hosting multiple app modules.
- Backend: Express + Socket.io API with modular app routers.
- Database: PostgreSQL via Prisma.
- Auth: JWT access/refresh tokens.

## Frontend Structure

```txt
frontend/src/
├── apps/               # App modules
├── components/         # Shared UI
├── config/             # Route/app metadata
├── lib/                # Shared client/util helpers
├── shared/auth/        # Frontend auth context + guards
└── App.tsx             # Router composition
```

### Active Frontend Apps (from `config/apps.ts`)

- `todo` (`/todos`)
- `md5-converter` (`/md5-converter`)
- `json-formatter` (`/json-formatter`)
- `json-compare` (`/json-compare`)
- `notes` (`/notes`)
- `expense-analyser` (`/expense-analyser`)
- `chat` (`/chat`)
- `blog` (`/blog`)
- `instagram` (`/instagram`)
- `file-sharing` (`/file-sharing`)
- `video-chat` (`/video-chat`)
- `screen-sharing` (`/screen-sharing`)

### Frontend Special Routes (outside app config)

Defined in `App.tsx`:

- `/notes/:shareId`
- `/file-sharing/receive/:token`
- `/screen-sharing/view/:token`

## Backend Structure

```txt
backend/src/
├── apps/               # App modules (router/controller/service/types)
├── shared/
│   ├── auth/           # JWT + auth middleware
│   ├── user/           # register/login/profile routes
│   ├── file-upload/    # upload endpoints + multer config
│   ├── realtime/       # Socket.io bootstrap + middleware
│   ├── http/           # shared response helpers
│   └── validation/     # validation error type
├── db/                 # Prisma client init
├── lib/                # logger
└── index.ts            # server bootstrap + route mounting
```

### Mounted Backend API Routes (from `backend/src/index.ts`)

- `/api/todos`
- `/api/md5`
- `/api/notes`
- `/api/expense-analyser`
- `/api/auth`
- `/api/users`
- `/api/chat`
- `/api/files`
- `/api/blog`
- `/api/instagram`
- `/api/file-sharing`
- `/api/video-chat`
- `/api/screen-sharing`

## Database Models

Defined in `backend/prisma/schema.prisma`:

- `Todo`, `Note`, `User`
- `Conversation`, `Message`
- `File`
- `Post`, `Comment`, `Like`
- `InstagramPost`, `InstagramComment`, `InstagramLike`
- `FileShare`
- `Room` (video chat)
- `ScreenShare`

## App Module Convention

For backend apps, preferred layout is:

- `routes.ts`
- `controller.ts`
- `service.ts`
- `types.ts`
- `validator.ts` (if input validation needed)
- `socket.handlers.ts` (for realtime apps)

For frontend apps, preferred layout is:

- `<AppName>.tsx`
- `api.ts` (if backend integration)
- `types.ts`
- `hooks/*`
- `components/*`

## How to Add a New App (Fast Path)

1. Frontend module in `frontend/src/apps/<app-name>/`.
2. Register app in `frontend/src/config/apps.ts`.
3. Backend module in `backend/src/apps/<app-name>/` with router/controller/service.
4. Mount backend router in `backend/src/index.ts`.
5. Add Prisma model only if persistence is needed.
6. Reuse shared modules before creating new cross-cutting utilities.

## Known Repository Inconsistencies

These folders currently exist but are not active in routing:

- `backend/src/apps/investment-analyzer/` (empty)
- `backend/src/apps/json-formatter/` (empty)
- `frontend/src/apps/investment-analyzer/` (empty)
- `frontend/src/apps/expense-analyzer/` (legacy empty folder)

Naming note:

- Active implementation uses `expense-analyser` (British spelling).
- `expense-analyzer` is legacy and currently not wired.

## LLM Handoff Checklist

For fast continuation by another model:

1. Read the 4 canonical source files listed above.
2. Confirm route path exists in both frontend config and backend mount (if backend-backed app).
3. Confirm DB impact in `schema.prisma` before changing persistence logic.
4. Prefer app-local changes first; use shared modules only for real cross-app concerns.
5. Update this document when adding/removing mounted routes or models.
