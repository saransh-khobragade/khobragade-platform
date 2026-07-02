# Frontend

React + TypeScript + Vite frontend for Khobragade Platform.

The app shell registers modules from `src/config/apps.ts` and serves them through React Router's `HashRouter`, so local routes look like `http://localhost:5173/#/todos`.

## Setup

1. Install dependencies:
```bash
bun install
```

2. Create `.env`:
```env
VITE_API_URL=http://localhost:8080
```

3. Start the dev server:
```bash
bun dev
```

## Commands

- Dev server: `bun dev`
- Production build: `bun run build`
- Preview production build: `bun run preview`

## Apps

Backend-backed apps:

- Todo
- Notes Share
- MD5 Converter
- Expense Analyser
- Chat
- Blog
- Instagram
- File Sharing
- Video Chat
- Screen Sharing

Frontend-only apps:

- JSON Formatter
- JSON Compare

The social and realtime apps use the shared auth UI and require a backend user session.

## Testing

UI flows are covered by full-stack Playwright end-to-end tests that run against the real backend. They live in `../e2e` and are launched from the repo root:

```bash
docker compose up -d
bun run test:e2e
```

See the [E2E README](../e2e/README.md) for the full scenario list.
