# Platform Architecture

This document describes the modular architecture of the Khobragade Platform.

## Folder Structure

### Frontend Structure

```
frontend/src/
├── apps/                    # Individual applications/modules
│   ├── todo/
│   │   ├── TodoApp.tsx      # Main component
│   │   ├── api.ts           # API client for this app
│   │   ├── types.ts         # TypeScript types
│   │   └── hooks/           # Custom React hooks
│   │       └── useTodos.ts  # Todo state management hook
│   └── md5-converter/
│       ├── MD5Converter.tsx # Main component
│       ├── api.ts           # API client for this app
│       ├── types.ts         # TypeScript types
│       └── hooks/           # Custom React hooks
│           ├── useMD5Converter.ts    # MD5 conversion logic
│           └── useCopyToClipboard.ts # Clipboard functionality
├── components/              # Shared UI components
│   ├── ui/                  # Reusable UI components (buttons, cards, etc.)
│   ├── home-page.tsx        # Home page component
│   ├── theme-provider.tsx   # Theme management
│   └── mode-toggle.tsx      # Theme toggle
├── config/
│   └── apps.ts              # App configuration (routes, metadata)
├── lib/
│   ├── api/
│   │   └── client.ts        # Shared API client utilities
│   └── utils.ts             # Shared utilities
└── App.tsx                  # Main app with routing
```

### Backend Structure

```
backend/src/
├── apps/                    # Individual applications/modules
│   ├── todo/
│   │   ├── routes.ts        # Express routes (HTTP layer)
│   │   ├── controller.ts   # HTTP request handling (thin)
│   │   ├── service.ts      # Business logic layer
│   │   ├── validator.ts    # Input validation
│   │   └── types.ts        # TypeScript types & DTOs
│   └── md5-converter/
│       ├── routes.ts        # Express routes (HTTP layer)
│       ├── controller.ts   # HTTP request handling (thin)
│       ├── service.ts      # Business logic layer
│       ├── validator.ts    # Input validation
│       └── types.ts        # TypeScript types & DTOs
├── db/
│   └── index.ts             # Prisma client
├── lib/
│   └── logger.ts            # Logging utilities
└── index.ts                 # Main server file
```

## Adding a New App

### Frontend

1. **Create app folder**: `frontend/src/apps/your-app-name/`
2. **Create files**:
   - `YourApp.tsx` - Main component
   - `api.ts` - API client functions
   - `types.ts` - TypeScript types
   - `hooks/useYourApp.ts` - Custom hook for state management
3. **Add to config**: Update `frontend/src/config/apps.ts`:
   ```typescript
   {
     id: "your-app-id",
     title: "Your App Title",
     description: "App description",
     icon: YourIcon, // from lucide-react
     path: "/your-app-path",
     component: YourApp,
   }
   ```

### Backend

1. **Create app folder**: `backend/src/apps/your-app-name/`
2. **Create files**:
   - `routes.ts` - Express routes (HTTP layer)
   - `controller.ts` - HTTP request handling (thin, delegates to service)
   - `service.ts` - Business logic layer
   - `validator.ts` - Input validation
   - `types.ts` - TypeScript types & DTOs
3. **Register routes**: Update `backend/src/index.ts`:
   ```typescript
   import yourAppRouter from "./apps/your-app-name/routes.js"
   app.use("/api/your-app-path", yourAppRouter)
   ```

## Architecture Layers

### Backend Layers (Request Flow)

```
HTTP Request
    ↓
Routes (routes.ts) - Route definitions
    ↓
Controller (controller.ts) - HTTP handling, validation, error handling
    ↓
Validator (validator.ts) - Input validation
    ↓
Service (service.ts) - Business logic
    ↓
Database (Prisma) - Data persistence
```

### Frontend Layers (Component Flow)

```
Component (YourApp.tsx) - UI rendering
    ↓
Custom Hook (hooks/useYourApp.ts) - State management, side effects
    ↓
API Client (api.ts) - HTTP requests
    ↓
Backend API
```

## Benefits

- **Modularity**: Each app is self-contained
- **Reusability**: Shared utilities, components, and hooks
- **Scalability**: Easy to add new apps following the pattern
- **Maintainability**: Clear separation of concerns (layered architecture)
- **Type Safety**: TypeScript types per app
- **Consistency**: Standardized structure across apps
- **Testability**: Services and hooks can be tested independently
- **Separation of Concerns**: 
  - Controllers handle HTTP, services handle business logic
  - Components handle UI, hooks handle state management

