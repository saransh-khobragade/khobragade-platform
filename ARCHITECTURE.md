# Platform Architecture

This document describes the modular architecture of the Khobragade Platform.

## Overview

The Khobragade Platform is built on a **modular, app-based architecture** where each application is a self-contained module with its own backend API and frontend UI. This design allows for easy addition of new applications while maintaining clean separation of concerns.

## Folder Structure

### Frontend Structure

```
frontend/src/
├── apps/                          # Individual applications/modules
│   ├── todo/
│   │   ├── TodoApp.tsx            # Main component
│   │   ├── api.ts                 # API client for this app
│   │   ├── types.ts               # TypeScript types
│   │   └── hooks/
│   │       └── useTodos.ts        # Todo state management hook
│   ├── md5-converter/
│   │   ├── MD5Converter.tsx      # Main component
│   │   ├── api.ts                 # API client for this app
│   │   ├── types.ts               # TypeScript types
│   │   └── hooks/
│   │       ├── useMD5Converter.ts    # MD5 conversion logic
│   │       └── useCopyToClipboard.ts # Clipboard functionality
│   ├── json-formatter/
│   │   ├── JsonFormatter.tsx      # Main component
│   │   └── hooks/
│   │       └── useJsonFormatter.ts # JSON formatting logic
│   ├── json-compare/
│   │   ├── JsonCompare.tsx        # Main component
│   │   ├── components/
│   │   │   └── HighlightedJson.tsx # JSON highlighting component
│   │   └── hooks/
│   │       └── useJsonCompare.ts  # JSON comparison logic
│   ├── notes/
│   │   ├── NotesApp.tsx           # Main component
│   │   ├── api.ts                 # API client
│   │   ├── types.ts               # TypeScript types
│   │   ├── components/
│   │   │   └── ShareLink.tsx      # Share link component
│   │   └── hooks/
│   │       └── useNotes.ts        # Notes state management
│   └── expense-analyser/
│       ├── ExpenseAnalyser.tsx    # Main component
│       ├── api.ts                 # API client
│       ├── types.ts               # TypeScript types
│       └── hooks/
│           └── useExpenseAnalyser.ts # Expense analysis logic
├── components/                    # Shared UI components
│   ├── ui/                        # Reusable UI components (buttons, cards, etc.)
│   ├── home-page.tsx              # Home page component
│   ├── theme-provider.tsx         # Theme management
│   └── mode-toggle.tsx            # Theme toggle
├── config/
│   └── apps.ts                    # App configuration (routes, metadata)
├── lib/
│   ├── api/
│   │   └── client.ts              # Shared API client utilities
│   └── utils.ts                   # Shared utilities
└── App.tsx                        # Main app with routing
```

### Backend Structure

```
backend/src/
├── apps/                          # Individual applications/modules
│   ├── todo/
│   │   ├── routes.ts              # Express routes (HTTP layer)
│   │   ├── controller.ts          # HTTP request handling (thin)
│   │   ├── service.ts             # Business logic layer
│   │   ├── validator.ts           # Input validation
│   │   └── types.ts               # TypeScript types & DTOs
│   ├── md5-converter/
│   │   ├── routes.ts              # Express routes (HTTP layer)
│   │   ├── controller.ts          # HTTP request handling (thin)
│   │   ├── service.ts             # Business logic layer
│   │   ├── validator.ts           # Input validation
│   │   └── types.ts               # TypeScript types & DTOs
│   ├── notes/
│   │   ├── routes.ts              # Express routes
│   │   ├── controller.ts          # HTTP request handling
│   │   ├── service.ts             # Business logic
│   │   ├── validator.ts           # Input validation
│   │   └── types.ts               # TypeScript types & DTOs
│   └── expense-analyser/
│       ├── routes.ts              # Express routes
│       ├── controller.ts          # HTTP request handling
│       ├── service.ts             # Business logic (Excel parsing, analysis)
│       ├── validator.ts           # Input validation
│       └── types.ts               # TypeScript types & DTOs
├── db/
│   └── index.ts                   # Prisma client instance
├── lib/
│   └── logger.ts                  # Logging utilities (Pino)
└── index.ts                       # Main server file (Express setup)
```

## Current Applications

The platform currently includes the following applications:

1. **Todo App** (`/todos`)
   - Full CRUD operations for task management
   - Persistent storage in PostgreSQL
   - Backend: `backend/src/apps/todo/`
   - Frontend: `frontend/src/apps/todo/`

2. **MD5 Converter** (`/md5-converter`)
   - Text to MD5 hash conversion
   - Backend API for server-side hashing
   - Backend: `backend/src/apps/md5-converter/`
   - Frontend: `frontend/src/apps/md5-converter/`

3. **JSON Formatter** (`/json-formatter`)
   - Format and validate JSON
   - Client-side only (no backend)
   - Frontend: `frontend/src/apps/json-formatter/`

4. **JSON Compare** (`/json-compare`)
   - Compare two JSON objects
   - Visual diff highlighting
   - Client-side only (no backend)
   - Frontend: `frontend/src/apps/json-compare/`

5. **Notes Share** (`/notes`)
   - Create and share notes with unique share IDs
   - Persistent storage in PostgreSQL
   - Shareable links: `/notes/:shareId`
   - Backend: `backend/src/apps/notes/`
   - Frontend: `frontend/src/apps/notes/`

6. **Expense Analyser** (`/expense-analyser`)
   - Upload Excel transaction files
   - Analyze spending patterns
   - Location, time period, and category analysis
   - Backend: `backend/src/apps/expense-analyser/`
   - Frontend: `frontend/src/apps/expense-analyser/`

## Adding a New App

### Frontend

1. **Create app folder**: `frontend/src/apps/your-app-name/`

2. **Create files**:
   - `YourApp.tsx` - Main React component
   - `api.ts` - API client functions (if backend needed)
   - `types.ts` - TypeScript types
   - `hooks/useYourApp.ts` - Custom hook for state management

3. **Add to config**: Update `frontend/src/config/apps.ts`:
   ```typescript
   import { YourApp } from "@/apps/your-app-name/YourApp.js"
   import { YourIcon } from "lucide-react"
   
   {
     id: "your-app-id",
     title: "Your App Title",
     description: "App description",
     icon: YourIcon, // from lucide-react
     path: "/your-app-path",
     component: YourApp,
   }
   ```

4. **Add route**: Routes are automatically registered via `apps.ts` config. For special routes (like `/notes/:shareId`), add to `App.tsx`:
   ```typescript
   <Route path="/your-app/:param" element={<YourApp />} />
   ```

### Backend

1. **Create app folder**: `backend/src/apps/your-app-name/`

2. **Create files**:
   - `routes.ts` - Express routes (HTTP layer)
   - `controller.ts` - HTTP request handling (thin, delegates to service)
   - `service.ts` - Business logic layer
   - `validator.ts` - Input validation (optional but recommended)
   - `types.ts` - TypeScript types & DTOs

3. **Register routes**: Update `backend/src/index.ts`:
   ```typescript
   import yourAppRouter from "./apps/your-app-name/routes.js"
   
   // Add after other route registrations
   app.use("/api/your-app-path", yourAppRouter)
   ```

4. **Database models** (if needed): Update `backend/prisma/schema.prisma`:
   ```prisma
   model YourModel {
     id        String   @id @default(uuid())
     // ... fields
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     
     @@map("your_table_name")
   }
   ```
   
   Then run migrations:
   ```bash
   bun prisma:migrate
   ```

## Architecture Layers

### Backend Layers (Request Flow)

```
HTTP Request
    ↓
Express Middleware (CORS, JSON parsing, logging)
    ↓
Routes (routes.ts) - Route definitions and HTTP method mapping
    ↓
Controller (controller.ts) - HTTP handling, error handling, response formatting
    ↓
Validator (validator.ts) - Input validation and sanitization
    ↓
Service (service.ts) - Business logic, data transformation
    ↓
Database (Prisma) - Data persistence and queries
    ↓
Response (JSON)
```

**Example Flow:**
```typescript
// routes.ts
router.post("/", todoController.create)

// controller.ts
export const create = async (req: Request, res: Response) => {
  try {
    const validated = todoValidator.validateCreate(req.body)
    const todo = await todoService.create(validated)
    res.status(201).json(todo)
  } catch (error) {
    // Error handling
  }
}

// service.ts
export const create = async (input: CreateTodoInput): Promise<Todo> => {
  return await prisma.todo.create({ data: input })
}
```

### Frontend Layers (Component Flow)

```
Component (YourApp.tsx) - UI rendering, user interactions
    ↓
Custom Hook (hooks/useYourApp.ts) - State management, side effects, business logic
    ↓
API Client (api.ts) - HTTP requests, error handling
    ↓
Shared API Client (lib/api/client.ts) - Base URL, common config
    ↓
Backend API
    ↓
Response handling in hook
    ↓
State update
    ↓
Component re-render
```

**Example Flow:**
```typescript
// YourApp.tsx
const { data, loading, error, fetchData } = useYourApp()

// hooks/useYourApp.ts
export const useYourApp = () => {
  const [data, setData] = useState([])
  const fetchData = async () => {
    const result = await yourAppApi.getAll()
    setData(result)
  }
  return { data, fetchData }
}

// api.ts
export const getAll = async () => {
  const response = await fetch(`${API_BASE_URL}/api/your-app`)
  return response.json()
}
```

## Database Schema

The platform uses PostgreSQL with Prisma ORM. Current models:

### Todo Model
```prisma
model Todo {
  id        String   @id @default(uuid())
  text      String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("todos")
}
```

### Note Model
```prisma
model Note {
  id        String   @id @default(uuid())
  content   String
  title     String?
  shareId   String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("notes")
}
```

## API Structure

All backend APIs follow RESTful conventions:

- `GET /api/{app-name}` - List resources
- `GET /api/{app-name}/:id` - Get single resource
- `POST /api/{app-name}` - Create resource
- `PATCH /api/{app-name}/:id` - Update resource
- `DELETE /api/{app-name}/:id` - Delete resource

Special endpoints:
- `GET /health` - Health check (includes DB connection check)
- `GET /api/test-db` - Database connection test

## Benefits

- **Modularity**: Each app is self-contained with its own backend and frontend code
- **Reusability**: Shared utilities, components, and hooks reduce duplication
- **Scalability**: Easy to add new apps following the established pattern
- **Maintainability**: Clear separation of concerns (layered architecture)
- **Type Safety**: End-to-end TypeScript types with Prisma integration
- **Consistency**: Standardized structure across all apps
- **Testability**: Services and hooks can be tested independently
- **Separation of Concerns**: 
  - Controllers handle HTTP, services handle business logic
  - Components handle UI, hooks handle state management
  - Validators ensure data integrity
- **Developer Experience**: Clear patterns make onboarding and development faster

## Technology Choices

### Why Bun?
- Fast runtime and package manager
- Native TypeScript support
- Excellent performance for development

### Why Prisma?
- Type-safe database access
- Auto-generated TypeScript types
- Migration management
- Great developer experience

### Why React Router?
- Declarative routing
- Easy integration with app config
- Support for dynamic routes

### Why Tailwind CSS?
- Utility-first approach
- Consistent design system
- Dark mode support built-in
- Fast development iteration

## Development Guidelines

### Backend Best Practices

1. **Controllers should be thin** - Delegate to services
2. **Services contain business logic** - No HTTP concerns
3. **Use validators** - Validate all inputs
4. **Log important operations** - Use the logger utility
5. **Handle errors gracefully** - Return appropriate status codes
6. **Use Prisma types** - Import from `@prisma/client`

### Frontend Best Practices

1. **Keep components focused** - Single responsibility
2. **Use custom hooks** - Extract state logic
3. **Handle loading and error states** - Always show feedback
4. **Type everything** - Use TypeScript types
5. **Follow the app pattern** - Consistency is key
6. **Use shared components** - Don't duplicate UI

### Code Organization

- **One app per folder** - Keep related code together
- **Consistent naming** - Follow existing patterns
- **Clear file purposes** - Each file has a single responsibility
- **Document complex logic** - Add comments where needed

