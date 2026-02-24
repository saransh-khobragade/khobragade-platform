# Khobragade Platform

Modular full‑stack platform with multiple apps on a shared React frontend and Express backend.

## Quick Start

1. Start Postgres:
```bash
docker compose up -d
```

2. Backend env (`backend/.env`):
```env
PORT=8080
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/render_db?schema=public"
```

3. Frontend env (`frontend/.env`):
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

Frontend: `http://localhost:5173`  
Backend: `http://localhost:8080`
Backend integration tests: `cd backend && bun run test:integration`

## Apps (High Level)

- Todo, Notes, MD5 Converter
- JSON Formatter, JSON Compare
- Expense Analyser
- Chat, Blog, Instagram
- File Sharing (WebRTC), Video Chat, Screen Sharing

## Architecture

See `/Users/saransh/Desktop/Github/khobragade-platform/ARCHITECTURE.md` for the full structure and module details.
For LLM onboarding, see `/Users/saransh/Desktop/Github/khobragade-platform/LLM_context.md`.
