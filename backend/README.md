# Backend API

Node.js + Express + TypeScript backend with PostgreSQL and Prisma.

## Setup

1. Install dependencies:
```bash
bun install
```

2. Start PostgreSQL with Docker Compose:
```bash
docker compose up -d
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Generate Prisma Client:
```bash
bun prisma:generate
```

5. Run database migrations:
```bash
bun prisma:migrate
```

6. Run development server:
```bash
bun dev
```

## API Endpoints

### Health & Testing
- `GET /health` - Health check
- `GET /api/test-db` - Test database connection

### Todos
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create a new todo
  ```json
  {
    "text": "Buy groceries"
  }
  ```
- `PATCH /api/todos/:id` - Update a todo (toggle completed or update text)
  ```json
  {
    "completed": true
  }
  ```
- `DELETE /api/todos/:id` - Delete a todo

## Database

PostgreSQL runs in Docker on port 5432.

### Prisma Commands

- Generate Prisma Client: `bun prisma:generate`
- Run migrations: `bun prisma:migrate`
- Open Prisma Studio: `bun prisma:studio`

### Docker Commands

To stop the database:
```bash
docker compose down
```

To view logs:
```bash
docker compose logs -f postgres
```

