# Render - Todo App

Full-stack todo application with React frontend, Express backend, and PostgreSQL database.

## Quick Start

## Environment Variables

### Backend
Create `Backend/.env`:
```
PORT=8080
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/render_db?schema=public"
```

### Frontend
Create `Frontend/.env`:
```
VITE_API_URL=http://localhost:8080/api
```
### 1. Start Database

```bash
docker compose up -d
```

### 2. Start Backend

```bash
cd backend
bun install
bun prisma:generate
bun prisma:migrate
bun dev
```

Backend runs on: `http://localhost:8080`

### 3. Start Frontend

```bash
cd frontend
bun install
bun dev
```

Frontend runs on: `http://localhost:5173`

## Stop Services

```bash
# Stop database
docker compose down

# Stop backend/frontend: Ctrl+C in their respective terminals
```

## Render commands
 - render login
 - render services

## psql commands
 - \l -- list databases
 - \c render_db_g221
 - SELECT current_database();
 - Run init.sql query
 - \dt -- list table
 - select * from todos;
