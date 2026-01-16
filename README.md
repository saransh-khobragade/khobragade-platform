# Khobragade Platform

A modular full-stack platform hosting multiple web applications with React frontend, Express backend, and PostgreSQL database.

## 🚀 Features

The platform includes the following applications:

- **Todo App** - Full-featured task management with persistence
- **MD5 Converter** - Convert text strings to MD5 hash
- **JSON Formatter** - Format and validate JSON with customizable indentation
- **JSON Compare** - Compare two JSON objects and visualize differences
- **Notes Share** - Create and share notes with shareable links
- **Expense Analyser** - Analyze transaction history from Excel files with spending insights
- **Chat App** - Real-time messaging with online/offline status, 1-on-1 conversations
- **Blog App** - Create and share blog posts with images, comments, and likes
- **Instagram App** - Share photos with captions, likes, and comments (image-focused social feed)
- **File Sharing App** - Peer-to-peer file transfer using WebRTC (no server storage)

## 🛠️ Tech Stack

### Backend
- **Runtime**: Bun
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Logging**: Pino
- **Language**: TypeScript
- **Real-time**: Socket.io for WebSocket connections
- **File Upload**: Multer for file handling
- **Authentication**: JWT (access & refresh tokens)

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Charts**: Recharts

### Infrastructure
- **Local Development**: Docker Compose
- **Deployment**: Render.com

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed
- Docker and Docker Compose installed
- PostgreSQL 16+ (via Docker)

## 🏃 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/saransh-khobragade/khobragade-platform.git
cd khobragade-platform
```

### 2. Environment Variables

#### Backend
Create `backend/.env`:
```env
PORT=8080
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/render_db?schema=public"
```

#### Frontend
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8080
```

**Note**: The API URL should be the base URL (without `/api` suffix) as the frontend adds `/api` to endpoints automatically.

### 3. Start Database

```bash
docker compose up -d
```

This starts a PostgreSQL container on port `5432`.

### 4. Start Backend

```bash
cd backend
bun install
bun prisma:generate
bun prisma:migrate
bun dev
```

Backend runs on: `http://localhost:8080`

### 5. Start Frontend

In a new terminal:

```bash
cd frontend
bun install
bun dev
```

Frontend runs on: `http://localhost:5173`

## 🛑 Stop Services

```bash
# Stop database
docker compose down

# Stop backend/frontend: Press Ctrl+C in their respective terminals
```

## 📁 Project Structure

```
khobragade-platform/
├── backend/              # Express API server
│   ├── src/
│   │   ├── apps/        # Individual application modules
│   │   ├── db/          # Prisma client
│   │   └── lib/         # Shared utilities
│   └── prisma/          # Database schema and migrations
├── frontend/            # React application
│   └── src/
│       ├── apps/        # Individual application components
│       ├── components/  # Shared UI components
│       └── config/      # App configuration
├── docker-compose.yml   # Local PostgreSQL setup
└── render.yaml          # Render.com deployment config
```

## 🏗️ Architecture

This platform follows a **modular, app-based architecture** where each application is self-contained with its own:
- Backend routes, controllers, services, and validators
- Frontend components, hooks, and API clients
- TypeScript types

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## 🔧 Available Scripts

### Backend
- `bun dev` - Start development server with hot reload
- `bun build` - Build for production
- `bun start` - Start production server
- `bun prisma:generate` - Generate Prisma client
- `bun prisma:migrate` - Run database migrations
- `bun prisma:studio` - Open Prisma Studio (database GUI)

### Frontend
- `bun dev` - Start development server
- `bun build` - Build for production
- `bun preview` - Preview production build

## 🌐 Deployment

The platform is configured for deployment on Render.com:

- **Backend**: Node.js web service with PostgreSQL database
- **Frontend**: Static site

See `render.yaml` for deployment configuration. The platform auto-deploys on commits to the main branch.

## 📝 Database

The platform uses PostgreSQL with Prisma ORM. Current models:

- **Todo** - Task management
- **Note** - Shared notes with unique share IDs
- **User** - User accounts with authentication
- **Conversation** - Chat conversations between users
- **Message** - Chat messages with read receipts
- **File** - Uploaded file metadata
- **Post** - Blog posts with images
- **Comment** - Comments on blog posts
- **Like** - Likes on blog posts
- **InstagramPost** - Instagram posts with required images and captions
- **InstagramComment** - Comments on Instagram posts
- **InstagramLike** - Likes on Instagram posts
- **FileShare** - File share metadata with shareable tokens

To interact with the database:

```bash
# Connect to PostgreSQL container
docker exec -it render_postgres psql -U postgres -d render_db

# Useful psql commands:
# \l              - List databases
# \dt             - List tables
# \d table_name   - Describe table structure
```

## 🧪 Health Checks

- Backend health: `GET http://localhost:8080/health`
- Database connection test: `GET http://localhost:8080/api/test-db`

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture and development guide
- [Backend README](./backend/README.md) - Backend-specific documentation
- [Frontend README](./frontend/README.md) - Frontend-specific documentation

## 🤝 Contributing

To add a new application to the platform, follow the patterns outlined in [ARCHITECTURE.md](./ARCHITECTURE.md).

## 📄 License

This project is private and proprietary.
