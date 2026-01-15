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
│   ├── chat/
│   │   ├── ChatApp.tsx            # Main component
│   │   ├── api.ts                 # API client
│   │   ├── types.ts               # TypeScript types
│   │   └── hooks/
│   │       └── useChat.ts         # Chat state & Socket.io management
│   └── blog/
│       ├── BlogApp.tsx            # Main component
│       ├── api.ts                 # API client
│       ├── types.ts               # TypeScript types
│       ├── components/
│       │   ├── PostCard.tsx       # Post display component
│       │   ├── PostEditor.tsx     # Post create/edit dialog
│       │   └── CommentSection.tsx # Comments component
│       └── hooks/
│           └── useBlog.ts         # Blog state management
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
│   ├── chat/
│   │   ├── routes.ts              # Express routes
│   │   ├── controller.ts          # HTTP request handling
│   │   ├── service.ts             # Business logic
│   │   ├── socket.handlers.ts     # Socket.io event handlers
│   │   └── types.ts               # TypeScript types & DTOs
│   └── blog/
│       ├── routes.ts               # Express routes
│       ├── controller.ts           # HTTP request handling
│       ├── service.ts              # Business logic
│       └── types.ts                # TypeScript types & DTOs
├── shared/                        # Shared modules across apps
│   ├── auth/                      # Authentication & authorization
│   │   ├── auth.middleware.ts     # JWT authentication middleware
│   │   ├── jwt.service.ts         # JWT token generation/verification
│   │   └── password.service.ts    # Password hashing
│   ├── file-upload/                # File upload functionality
│   │   ├── file.routes.ts         # File upload routes
│   │   ├── file.controller.ts     # File upload handling
│   │   ├── file.service.ts         # File metadata management
│   │   └── multer.config.ts       # Multer configuration
│   ├── realtime/                  # Real-time features
│   │   ├── socket.service.ts      # Socket.io server setup
│   │   └── socket.middleware.ts   # Socket authentication
│   └── user/                      # User management
│       ├── user.routes.ts         # User routes
│       ├── user.controller.ts     # User CRUD operations
│       └── user.service.ts        # User business logic
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

7. **Chat App** (`/chat`)
   - Real-time 1-on-1 messaging with Socket.io
   - Online/offline user status
   - Conversation management
   - Read receipts (delivered/read indicators)
   - Backend: `backend/src/apps/chat/`
   - Frontend: `frontend/src/apps/chat/`
   - Requires authentication

8. **Blog App** (`/blog`)
   - Create, edit, and delete blog posts
   - Image uploads for posts
   - Comments on posts
   - Like/unlike posts
   - User authentication required
   - Backend: `backend/src/apps/blog/`
   - Frontend: `frontend/src/apps/blog/`
   - Uses shared file upload module

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

4. **Add authentication** (if needed): Protect routes with `authMiddleware`:
   ```typescript
   import { authMiddleware } from "../../shared/auth/auth.middleware.js"
   
   router.post("/", authMiddleware, yourController.create)
   ```

5. **Database models** (if needed): Update `backend/prisma/schema.prisma`:
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

6. **Add real-time features** (if needed): Use Socket.io via shared realtime module:
   ```typescript
   import { getIO } from "../../shared/realtime/socket.service.js"
   
   // In your service or controller
   const io = getIO()
   io.emit("your-event", data)
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

### User Model
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String
  name      String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  sentMessages     Message[] @relation("Sender")
  receivedMessages Message[] @relation("Receiver")
  conversations1   Conversation[] @relation("User1")
  conversations2   Conversation[] @relation("User2")
  posts            Post[]
  comments         Comment[]
  likes            Like[]

  @@map("users")
}
```

### Conversation Model
```prisma
model Conversation {
  id        String   @id @default(uuid())
  userId1   String
  userId2   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  messages  Message[]
  user1     User @relation("User1", fields: [userId1], references: [id], onDelete: Cascade)
  user2     User @relation("User2", fields: [userId2], references: [id], onDelete: Cascade)

  @@unique([userId1, userId2])
  @@map("conversations")
}
```

### Message Model
```prisma
model Message {
  id             String       @id @default(uuid())
  conversationId String
  senderId       String
  receiverId     String
  content        String
  read           Boolean      @default(false)
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User        @relation("Sender", fields: [senderId], references: [id], onDelete: Cascade)
  receiver       User        @relation("Receiver", fields: [receiverId], references: [id], onDelete: Cascade)

  @@map("messages")
}
```

### File Model
```prisma
model File {
  id          String   @id @default(uuid())
  filename    String   @unique
  originalName String
  mimeType    String
  size        Int
  uploadedBy  String?
  createdAt   DateTime @default(now())

  @@map("files")
}
```

### Post Model
```prisma
model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  imageUrl  String?
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments  Comment[]
  likes     Like[]

  @@map("posts")
}
```

### Comment Model
```prisma
model Comment {
  id        String   @id @default(uuid())
  content   String
  postId    String
  authorId  String
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("comments")
}
```

### Like Model
```prisma
model Like {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@map("likes")
}
```

## API Structure

All backend APIs follow RESTful conventions:

- `GET /api/{app-name}` - List resources
- `GET /api/{app-name}/:id` - Get single resource
- `POST /api/{app-name}` - Create resource
- `PATCH /api/{app-name}/:id` - Update resource
- `DELETE /api/{app-name}/:id` - Delete resource

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user (returns access & refresh tokens)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/users/me` - Get current user (protected)

### File Upload Endpoints
- `POST /api/files/upload` - Upload file (protected, multipart/form-data)
- `GET /api/files/:filename` - Serve file (public)
- `DELETE /api/files/:filename` - Delete file (protected)

### Real-time (Socket.io)
- WebSocket connection: `ws://localhost:8080`
- Events: `new_message`, `message_received`, `user_online`, `user_offline`

Special endpoints:
- `GET /health` - Health check (includes DB connection check)
- `GET /api/test-db` - Database connection test

## Shared Modules

The platform includes several shared modules that can be used across applications:

### Authentication (`backend/src/shared/auth/`)
- JWT-based authentication with access and refresh tokens
- Password hashing with bcrypt
- Authentication middleware for protecting routes
- Used by: Chat App, Blog App

### File Upload (`backend/src/shared/file-upload/`)
- Multer-based file upload handling
- File metadata storage in database
- File serving endpoint
- Used by: Blog App

### Real-time (`backend/src/shared/realtime/`)
- Socket.io server setup and management
- Socket authentication middleware
- Used by: Chat App

### User Management (`backend/src/shared/user/`)
- User CRUD operations
- User profile management
- Used by: All authenticated apps

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
- **Authentication**: Centralized auth system reusable across apps
- **Real-time**: Socket.io integration for live features

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

## Authentication & Authorization

The platform uses JWT-based authentication:

- **Access Tokens**: Short-lived tokens for API requests (stored in localStorage)
- **Refresh Tokens**: Long-lived tokens for refreshing access tokens
- **Protected Routes**: Use `authMiddleware` to protect backend routes
- **Frontend**: Use `ProtectedRoute` component or check `useAuth()` hook

### Using Authentication in Your App

**Backend:**
```typescript
import { authMiddleware } from "../../shared/auth/auth.middleware.js"

router.post("/", authMiddleware, yourController.create)

// Access user in controller:
const userId = req.user?.userId
```

**Frontend:**
```typescript
import { useAuth } from "@/shared/auth/AuthContext"

const { user, loading } = useAuth()
if (!user) {
  return <LoginForm />
}
```

## Real-time Features

The platform uses Socket.io for real-time communication:

- **Server Setup**: Socket.io server initialized in `backend/src/shared/realtime/socket.service.ts`
- **Authentication**: Socket connections authenticated via JWT tokens
- **Event Handling**: App-specific handlers in `socket.handlers.ts`

### Using Socket.io in Your App

**Backend:**
```typescript
import { getIO } from "../../shared/realtime/socket.service.js"

// Emit events
const io = getIO()
io.to(roomId).emit("your-event", data)
```

**Frontend:**
```typescript
import { io } from "socket.io-client"

const socket = io(SOCKET_URL, {
  auth: { token: getAuthToken() }
})

socket.on("your-event", (data) => {
  // Handle event
})
```

## File Uploads

The platform includes a shared file upload module:

- **Upload Endpoint**: `POST /api/files/upload` (multipart/form-data)
- **File Serving**: `GET /api/files/:filename`
- **Metadata Storage**: Files stored in `File` model in database
- **File Storage**: Physical files in `backend/uploads/` directory

### Using File Uploads in Your App

**Backend:** Files are automatically handled via Multer middleware

**Frontend:**
```typescript
import { blogApi } from "../api" // Example from Blog app

const formData = new FormData()
formData.append("file", file)

const result = await blogApi.uploadImage(file)
// Returns: { url: string, filename: string }
```
