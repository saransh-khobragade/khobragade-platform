---
name: Multi-App Platform with Shared Modules
overview: Build 5 social apps incrementally (Chat, Blog, Instagram-like, File Sharing, Video Chat) with reusable authentication, real-time communication, and file upload modules. Start with Chat App to establish foundational patterns.
todos: []
---

# Multi-App Platform Development Plan

## Progress Overview

**Current Phase**: Phase 1 - Shared Modules Foundation  
**Last Updated**: [Update after each deployment]

### App Status

- [x] **Phase 1: Shared Modules** - ✅ Completed
- [x] **Phase 2: Chat App** - ✅ Completed
- [x] **Phase 3: Blog App** - ✅ Completed
- [x] **Phase 4: Instagram-like App** - ✅ Completed
- [x] **Phase 5: File Sharing App** - ✅ Completed
- [ ] **Phase 6: Video Chat App** - Not Started
- [ ] **Phase 7: Enhanced Shared Modules** - Not Started
- [ ] **Phase 8: Additional Apps** - Not Started

### Quick Status Legend
- ⬜ Not Started
- 🟡 In Progress
- ✅ Completed
- 🚀 Deployed
- ⚠️ Blocked/Issues

## Overview

Build 5 applications incrementally, starting with Chat App to establish authentication and real-time communication patterns. Each app will reuse common modules while maintaining the existing modular architecture.

## Development Order & Rationale

1. **Chat App** (Foundation) - Establishes auth + real-time patterns
2. **Blog App** - Uses auth + file upload (images for posts)
3. **Instagram-like App** - Uses auth + file upload + real-time (likes/comments)
4. **File Sharing App** - Uses auth + file upload (different file types)
5. **Video Chat App** - Uses auth + real-time + WebRTC

## Phase 1: Shared Modules Foundation

### Backend Shared Modules (`backend/src/shared/`)

#### 1. Authentication Module (`backend/src/shared/auth/`)

- **JWT Service** (`jwt.service.ts`)
  - Generate access/refresh tokens
  - Verify tokens
  - Token refresh logic
- **Auth Middleware** (`auth.middleware.ts`)
  - Protect routes
  - Extract user from token
  - Add to Express request type
- **Password Service** (`password.service.ts`)
  - Hash passwords (bcrypt)
  - Verify passwords
- **Auth Types** (`auth.types.ts`)
  - User payload, tokens, etc.

#### 2. User Module (`backend/src/shared/user/`)

- **User Service** (`user.service.ts`)
  - Create user
  - Get user by ID/email
  - Update user profile
  - Delete user
- **User Routes** (`user.routes.ts`)
  - POST `/api/auth/register` - Register
  - POST `/api/auth/login` - Login
  - POST `/api/auth/refresh` - Refresh token
  - GET `/api/users/me` - Get current user
  - PATCH `/api/users/me` - Update profile
- **User Controller** (`user.controller.ts`)
- **User Validator** (`user.validator.ts`)
- **User Types** (`user.types.ts`)

#### 3. File Upload Module (`backend/src/shared/file-upload/`)

- **File Service** (`file.service.ts`)
  - Save files to `backend/uploads/` directory
  - Generate unique filenames
  - Validate file types/sizes
  - Delete files
- **File Routes** (`file.routes.ts`)
  - POST `/api/files/upload` - Upload file
  - GET `/api/files/:filename` - Serve file
  - DELETE `/api/files/:filename` - Delete file
- **File Controller** (`file.controller.ts`)
- **Multer Config** (`multer.config.ts`)
- **File Types** (`file.types.ts`)

#### 4. Real-time Module (`backend/src/shared/realtime/`)

- **Socket Service** (`socket.service.ts`)
  - Initialize Socket.io server
  - Room management
  - User connection tracking
- **Socket Middleware** (`socket.middleware.ts`)
  - Authenticate socket connections
  - Extract user from token
- **Socket Types** (`socket.types.ts`)

#### 5. WebRTC Module (`backend/src/shared/webrtc/`)

- **WebRTC Signaling Service** (`webrtc-signaling.service.ts`)
  - Handle WebRTC offer/answer exchange
  - ICE candidate exchange
  - Connection state management
- **WebRTC Types** (`webrtc.types.ts`)
  - Offer/Answer types
  - ICE candidate types

#### 6. Room/Session Module (`backend/src/shared/room/`)

- **Room Service** (`room.service.ts`)
  - Create/join/leave rooms
  - Room state management
  - Participant tracking
  - Room permissions
- **Room Routes** (`room.routes.ts`)
  - POST `/api/rooms` - Create room
  - GET `/api/rooms/:id` - Get room info
  - POST `/api/rooms/:id/join` - Join room
  - POST `/api/rooms/:id/leave` - Leave room
- **Room Controller** (`room.controller.ts`)
- **Room Types** (`room.types.ts`)

#### 7. Voting/Ranking Module (`backend/src/shared/voting/`)

- **Voting Service** (`voting.service.ts`)
  - Create votes/polls
  - Submit votes
  - Get results (sorted by score)
  - Upvote/downvote functionality
- **Voting Routes** (`voting.routes.ts`)
  - POST `/api/votes` - Create vote item
  - POST `/api/votes/:id/vote` - Submit vote
  - GET `/api/votes/:id/results` - Get results
- **Voting Controller** (`voting.controller.ts`)
- **Voting Types** (`voting.types.ts`)

#### 8. Permission/Role Module (`backend/src/shared/permissions/`)

- **Permission Service** (`permission.service.ts`)
  - Check user permissions
  - Role-based access control
  - Moderator/admin roles
- **Permission Middleware** (`permission.middleware.ts`)
  - Protect routes by role
  - Check ownership
- **Permission Types** (`permission.types.ts`)

### Frontend Shared Modules (`frontend/src/shared/`)

#### 1. Auth Module (`frontend/src/shared/auth/`)

- **Auth Context** (`AuthContext.tsx`)
  - User state management
  - Login/logout functions
  - Token management
- **Auth Hook** (`useAuth.ts`)
  - Access auth state
  - Login/logout functions
- **Auth API** (`auth.api.ts`)
  - Register/login API calls
  - Token refresh
- **Protected Route** (`ProtectedRoute.tsx`)
  - Route wrapper for authenticated routes
- **Auth Types** (`auth.types.ts`)

#### 2. API Client Enhancement (`frontend/src/lib/api/client.ts`)

- Add JWT token to requests
- Handle 401 errors (auto logout)
- Token refresh on expiry

#### 3. WebRTC Module (`frontend/src/shared/webrtc/`)

- **WebRTC Hook** (`useWebRTC.ts`)
  - Create peer connection
  - Handle offer/answer
  - ICE candidate management
  - Connection state
- **Data Channel Hook** (`useDataChannel.ts`)
  - Create data channel
  - Send/receive files via data channel
  - File chunking for large files
- **WebRTC Types** (`webrtc.types.ts`)

#### 4. Collaboration Module (`frontend/src/shared/collaboration/`)

- **useCollaboration** (`useCollaboration.ts`)
  - Real-time state sync
  - Conflict resolution
  - Presence awareness (who's online)
  - Cursor/selection tracking
- **Collaboration Types** (`collaboration.types.ts`)

#### 5. Media Player Module (`frontend/src/shared/media/`)

- **Media Player Hook** (`useMediaPlayer.ts`)
  - Play/pause/seek controls
  - Playlist management
  - Volume control
  - Progress tracking
- **Media Player Component** (`MediaPlayer.tsx`)
  - Audio/video player UI
  - Playlist display
  - Controls
- **Media Types** (`media.types.ts`)

#### 6. Canvas Module (`frontend/src/shared/canvas/`)

- **Canvas Hook** (`useCanvas.ts`)
  - Drawing operations
  - Tool selection (pen, eraser, shapes)
  - Undo/redo
  - Export canvas
- **Canvas Component** (`Canvas.tsx`)
  - Drawing surface
  - Toolbar
  - Color picker
- **Drawing Utils** (`drawing.utils.ts`)
  - Path drawing
  - Shape rendering
  - Transformations
- **Canvas Types** (`canvas.types.ts`)

#### 7. Text Editor Module (`frontend/src/shared/editor/`)

- **Text Editor Hook** (`useTextEditor.ts`)
  - Text operations (insert, delete)
  - Cursor position
  - Selection handling
  - Operational Transform integration
- **Text Editor Component** (`TextEditor.tsx`)
  - Rich text editor
  - Collaborative cursors
  - Formatting toolbar
- **OT Utils** (`ot.utils.ts`)
  - Operational Transform helpers
  - Conflict resolution
- **Editor Types** (`editor.types.ts`)

#### 8. Screen Capture Module (`frontend/src/shared/screen-capture/`)

- **Screen Capture Hook** (`useScreenCapture.ts`)
  - Request screen share
  - Handle stream
  - Stop sharing
  - Track sharing state
- **Screen Share Component** (`ScreenShare.tsx`)
  - Display shared screen
  - Controls
- **Screen Capture Types** (`screen-capture.types.ts`)

#### 9. Common UI Components (`frontend/src/components/shared/`)

- **Avatar** (`avatar.tsx`) - User avatar display
- **Loading Spinner** (`loading.tsx`) - Loading states
- **Error Boundary** (`error-boundary.tsx`) - Error handling
- **File Upload** (`file-upload.tsx`) - File upload component (for Blog/Instagram apps)
- **VoteButton** (`vote-button.tsx`) - Upvote/downvote button
- **RoomList** (`room-list.tsx`) - List of rooms/sessions
- **ParticipantList** (`participant-list.tsx`) - Show room participants
- **ModeratorPanel** (`moderator-panel.tsx`) - Moderation controls

### Database Schema Updates

Add to `backend/prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String   // hashed
  name      String?
  avatar    String?  // filename
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  sentMessages     Message[] @relation("Sender")
  receivedMessages Message[] @relation("Receiver")
  posts            Post[]
  comments         Comment[]
  likes            Like[]
  hostedRooms      Room[] @relation("RoomHost")
  roomParticipants RoomParticipant[]
  votes            Vote[]

  @@map("users")
}

model File {
  id        String   @id @default(uuid())
  filename  String   @unique
  originalName String
  mimeType  String
  size      Int
  uploadedBy String? // userId
  createdAt DateTime @default(now())

  @@map("files")
}

model Room {
  id          String   @id @default(uuid())
  name        String
  description String?
  hostId      String
  isActive    Boolean  @default(true)
  maxParticipants Int @default(100)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  host        User     @relation("RoomHost", fields: [hostId], references: [id])
  participants RoomParticipant[]
  permissions RoomPermission[]

  @@map("rooms")
}

model RoomParticipant {
  id        String   @id @default(uuid())
  roomId    String
  userId    String
  role      String   @default("participant") // participant, moderator, admin
  joinedAt  DateTime @default(now())

  room      Room     @relation(fields: [roomId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([roomId, userId])
  @@map("room_participants")
}

model RoomPermission {
  id        String   @id @default(uuid())
  roomId    String
  userId    String?
  permission String  // "can_edit", "can_delete", "can_moderate"
  granted   Boolean  @default(true)

  room      Room     @relation(fields: [roomId], references: [id])

  @@map("room_permissions")
}

model Vote {
  id          String   @id @default(uuid())
  itemId      String   // ID of item being voted on (question, post, etc.)
  itemType    String   // "question", "post", "comment", etc.
  userId      String
  value       Int      // 1 for upvote, -1 for downvote, 0 for remove
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])

  @@unique([itemId, itemType, userId])
  @@map("votes")
}
```

## Phase 2: Chat App MVP

**Status**: ⬜ Not Started | **Deployment**: ⬜ Not Deployed

### Features

- [ ] User registration/login
- [ ] 1-on-1 messaging
- [ ] Online/offline status
- [ ] Message history
- [ ] Real-time message delivery

### Deployment Checklist

- [ ] Backend deployed and tested
- [ ] Frontend deployed and tested
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Real-time functionality verified
- [ ] End-to-end testing completed
- [ ] Production URL: `_________________`

### Notes & Learnings

_Add notes here after deployment..._

### Backend (`backend/src/apps/chat/`)

- **Routes** (`routes.ts`) - Protected routes
- **Controller** (`controller.ts`)
- **Service** (`service.ts`)
  - Create conversation
  - Send message
  - Get conversations
  - Get messages
- **Socket Handlers** (`socket.handlers.ts`)
  - Join room
  - Send message
  - Typing indicators
- **Types** (`types.ts`)

### Frontend (`frontend/src/apps/chat/`)

- **ChatApp.tsx** - Main component
- **ChatList.tsx** - Conversation list
- **ChatWindow.tsx** - Message display
- **MessageInput.tsx** - Message composer
- **useChat.ts** - Chat state management
- **chat.api.ts** - API calls
- **types.ts**

### Database Schema

```prisma
model Conversation {
  id        String   @id @default(uuid())
  userId1   String
  userId2   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  messages  Message[]
  user1     User @relation("User1", fields: [userId1], references: [id])
  user2     User @relation("User2", fields: [userId2], references: [id])

  @@unique([userId1, userId2])
  @@map("conversations")
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  senderId       String
  receiverId     String
  content        String
  read           Boolean      @default(false)
  createdAt      DateTime     @default(now())

  conversation   Conversation @relation(fields: [conversationId], references: [id])
  sender         User        @relation("Sender", fields: [senderId], references: [id])
  receiver       User        @relation("Receiver", fields: [receiverId], references: [id])

  @@map("messages")
}
```

## Phase 3: Blog App MVP

**Status**: ⬜ Not Started | **Deployment**: ⬜ Not Deployed

### Features

- [ ] Create/edit/delete posts
- [ ] View all posts (feed)
- [ ] Basic comments
- [ ] Image upload for posts
- [ ] User profiles

### Deployment Checklist

- [ ] Backend deployed and tested
- [ ] Frontend deployed and tested
- [ ] Database migrations applied
- [ ] File upload functionality verified
- [ ] End-to-end testing completed
- [ ] Production URL: `_________________`

### Notes & Learnings

_Add notes here after deployment..._

### Backend (`backend/src/apps/blog/`)

- Uses shared auth + file upload modules
- **Routes** - CRUD for posts, comments
- **Service** - Post management, comment management
- **Types** - Post, Comment types

### Frontend (`frontend/src/apps/blog/`)

- **BlogApp.tsx** - Main component
- **PostList.tsx** - Feed display
- **PostEditor.tsx** - Create/edit post
- **PostCard.tsx** - Individual post
- **CommentSection.tsx** - Comments
- **useBlog.ts** - State management
- **blog.api.ts** - API calls

### Database Schema

```prisma
model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  imageUrl  String?
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author    User     @relation(fields: [authorId], references: [id])
  comments  Comment[]
  likes     Like[]

  @@map("posts")
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  postId    String
  authorId  String
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id])
  author    User     @relation(fields: [authorId], references: [id])

  @@map("comments")
}

model Like {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([postId, userId])
  @@map("likes")
}
```

## Phase 4: Instagram-like App MVP

**Status**: ✅ Completed | **Deployment**: ⬜ Not Deployed

### Features

- [x] Photo upload
- [x] Feed with images
- [x] Like/unlike posts
- [x] Comments
- [x] User profiles with posts grid
- [ ] Real-time updates (Socket.io) - Optional enhancement
- [ ] Follow/unfollow - Future enhancement

### Deployment Checklist

- [x] Backend implemented and tested locally
- [x] Frontend implemented and tested locally
- [ ] Database migrations applied (ready to run)
- [ ] Real-time updates verified (optional)
- [ ] Image optimization tested
- [ ] End-to-end testing completed
- [ ] Production deployment
- [ ] Production URL: `_________________`

### Notes & Learnings

- Built separate Instagram models (`InstagramPost`, `InstagramComment`, `InstagramLike`) for better separation from Blog app
- Instagram posts require images (unlike Blog where images are optional)
- Used Instagram-style UI with square images and cleaner layout
- Profile component shows user posts in a grid layout
- Upload modal handles image uploads with preview
- Similar patterns to Blog app but optimized for image-first content

### Backend (`backend/src/apps/instagram/`)

- ✅ `routes.ts` - Express routes registered at `/api/instagram`
- ✅ `controller.ts` - HTTP request handling with error handling
- ✅ `service.ts` - Business logic for posts, comments, likes
- ✅ `types.ts` - TypeScript types and DTOs
- Uses shared auth + file upload modules
- Separate models from Blog for better separation
- Image URL required for posts (unlike Blog)

### Frontend (`frontend/src/apps/instagram/`)

- ✅ **InstagramApp.tsx** - Main component with feed
- ✅ **PostCard.tsx** - Instagram-style post card with square images
- ✅ **UploadModal.tsx** - Photo upload with preview
- ✅ **Profile.tsx** - User profile with posts grid
- ✅ **api.ts** - API client functions
- ✅ **hooks/useInstagram.ts** - State management hook
- ✅ **types.ts** - TypeScript interfaces
- Real-time updates via Socket.io (optional enhancement)

### Database Schema

Add to `backend/prisma/schema.prisma`:

```prisma
model InstagramPost {
  id        String   @id @default(uuid())
  imageUrl  String   // Required for Instagram
  caption   String?
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments  InstagramComment[]
  likes     InstagramLike[]

  @@map("instagram_posts")
}

model InstagramComment {
  id        String   @id @default(uuid())
  content   String
  postId    String
  authorId  String
  createdAt DateTime @default(now())

  post      InstagramPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User          @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("instagram_comments")
}

model InstagramLike {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  post      InstagramPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([postId, userId])
  @@map("instagram_likes")
}
```

Update User model to include Instagram relations:
```prisma
model User {
  // ... existing fields
  instagramPosts   InstagramPost[]
  instagramComments InstagramComment[]
  instagramLikes   InstagramLike[]
}
```

## Phase 5: File Sharing App MVP (WebRTC P2P)

**Status**: ✅ Completed | **Deployment**: ⬜ Not Deployed

### Features

- [x] Generate shareable links with connection info
- [x] Direct peer-to-peer file transfer (no server storage)
- [x] File metadata (name, size, type) stored on server
- [x] Real-time connection status
- [x] File transfer progress
- [x] Support for any file type
- [x] Automatic chunking for large files (64KB chunks)

### Deployment Checklist

- [ ] Backend deployed and tested
- [ ] Frontend deployed and tested
- [ ] Database migrations applied
- [ ] WebRTC P2P transfer verified
- [ ] TURN server configured (if needed)
- [ ] File transfer tested with different file sizes
- [ ] Connection error handling tested
- [ ] End-to-end testing completed
- [ ] Production URL: `_________________`

### Notes & Learnings

_Add notes here after deployment..._

### Architecture

- **No server file storage** - Files transfer directly between peers
- **Server only stores metadata** - File info, share tokens, connection state
- **WebRTC Data Channels** - For actual file transfer
- **Socket.io signaling** - For WebRTC connection setup
- **TURN server** - For NAT traversal (can use free services like Twilio STUN/TURN or Xirsys)

### Backend (`backend/src/apps/file-sharing/`)

- ✅ `routes.ts` - Express routes registered at `/api/file-sharing`
- ✅ `controller.ts` - HTTP request handling
- ✅ `service.ts` - Share creation, validation, and management
- ✅ `socket.handlers.ts` - WebRTC signaling handlers (offer/answer/ICE)
- ✅ `types.ts` - TypeScript types and DTOs
- Uses shared auth + real-time modules
- WebRTC signaling via Socket.io rooms (`share:{token}`)

### Frontend (`frontend/src/apps/file-sharing/`)

- ✅ **FileSharingApp.tsx** - Main component with tabs (create/my-shares)
- ✅ **ShareCreator.tsx** - Create share link, select file, start transfer
- ✅ **ShareReceiver.tsx** - Receive files via share token
- ✅ **MyShares.tsx** - List and manage user's shares
- ✅ **useFileShare.ts** - File sharing state management
- ✅ **useP2PFileTransfer.ts** - WebRTC data channel hook with chunking
- ✅ **api.ts** - API client functions
- ✅ **types.ts** - TypeScript interfaces

### Database Schema

```prisma
model FileShare {
  id          String   @id @default(uuid())
  shareToken  String   @unique
  fileName    String
  fileSize    Int
  mimeType    String
  sharedBy    String
  isActive    Boolean  @default(true)
  expiresAt   DateTime?
  createdAt   DateTime @default(now())

  sharer      User     @relation(fields: [sharedBy], references: [id])

  @@map("file_shares")
}
```

### WebRTC Flow

```
1. Sender creates share link → Server stores metadata
2. Receiver enters share link → Gets metadata
3. Both connect via Socket.io → Exchange WebRTC signaling
4. WebRTC peer connection established → Data channel created
5. File sent in chunks via data channel → Direct P2P transfer
6. Transfer complete → Connection closed
```

### Implementation Notes

- Use WebRTC Data Channels (not media streams)
- Implement file chunking (64KB chunks recommended)
- Handle connection errors and retries
- Show transfer progress to users
- Support multiple concurrent transfers
- Use TURN server for users behind NAT/firewalls

## Phase 6: Video Chat App MVP

**Status**: ⬜ Not Started | **Deployment**: ⬜ Not Deployed

### Features

- [ ] Create/join rooms
- [ ] Video/audio streaming (WebRTC)
- [ ] Screen sharing (optional)
- [ ] Room management
- [ ] Real-time signaling via Socket.io

### Deployment Checklist

- [ ] Backend deployed and tested
- [ ] Frontend deployed and tested
- [ ] Database migrations applied
- [ ] WebRTC video/audio streaming verified
- [ ] Multiple participants tested
- [ ] TURN server configured
- [ ] Screen sharing tested (if implemented)
- [ ] End-to-end testing completed
- [ ] Production URL: `_________________`

### Notes & Learnings

_Add notes here after deployment..._

### Backend (`backend/src/apps/video-chat/`)

- Uses shared auth + real-time + WebRTC signaling modules
- **Routes** - Create room, join room, get room info
- **Socket Handlers** - WebRTC signaling (offer/answer/ICE) for media streams

### Frontend (`frontend/src/apps/video-chat/`)

- **VideoChatApp.tsx** - Main component
- **Room.tsx** - Video room component
- **VideoStream.tsx** - Individual video stream
- **useWebRTC.ts** - WebRTC logic hook
- **video-chat.api.ts** - API calls

### Database Schema

```prisma
model Room {
  id        String   @id @default(uuid())
  name      String
  hostId    String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  host      User     @relation(fields: [hostId], references: [id])

  @@map("rooms")
}
```

## Implementation Steps

### Step 1: Setup Shared Modules

**Status**: ⬜ Not Started

- [ ] Create `backend/src/shared/` directory structure
- [ ] Install dependencies: `jsonwebtoken`, `bcrypt`, `socket.io`, `multer`
- [ ] Implement auth module (JWT service, middleware)
- [ ] Implement user module (routes, service, controller)
- [ ] Update Prisma schema with User model
- [ ] Run migrations
- [ ] Create frontend auth context and hooks
- [ ] Update API client to handle JWT tokens
- [ ] Test authentication flow end-to-end

### Step 2: Build Chat App

**Status**: ⬜ Not Started

- [ ] Create chat app structure
- [ ] Add Conversation and Message models to Prisma
- [ ] Run database migrations
- [ ] Implement chat backend (routes, service, socket handlers)
- [ ] Implement chat frontend (components, hooks)
- [ ] Test end-to-end locally
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Render
- [ ] Test deployed app
- [ ] Update PLAN.md with deployment URL and notes

### Step 3: Build File Upload Module

**Status**: ⬜ Not Started

- [ ] Create file upload shared module
- [ ] Add File model to Prisma
- [ ] Run database migrations
- [ ] Implement file service and routes
- [ ] Create file upload UI component
- [ ] Test with Chat App (profile pictures)
- [ ] Verify file storage and serving

### Step 4: Build Blog App

**Status**: ⬜ Not Started

- [ ] Create blog app structure
- [ ] Add Post, Comment, Like models to Prisma
- [ ] Run database migrations
- [ ] Implement blog backend
- [ ] Implement blog frontend
- [ ] Test locally
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test deployed app
- [ ] Update PLAN.md with deployment URL and notes

### Step 5: Build File Sharing App (WebRTC P2P)

**Status**: ⬜ Not Started

- [ ] Create file sharing app structure
- [ ] Add FileShare model to Prisma
- [ ] Run database migrations
- [ ] Implement backend (routes, service, socket handlers)
- [ ] Implement frontend (share creator, receiver, transfer UI)
- [ ] Implement WebRTC data channel file transfer
- [ ] Test P2P file transfer locally
- [ ] Configure TURN server (if needed)
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test deployed app
- [ ] Update PLAN.md with deployment URL and notes

### Step 6: Build Instagram App

**Status**: ⬜ Not Started

- [ ] Create instagram app structure
- [ ] Implement backend (reuse Post/Comment/Like models from Blog)
- [ ] Implement frontend (image-focused feed)
- [ ] Test locally
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test deployed app
- [ ] Update PLAN.md with deployment URL and notes

### Step 7: Build Video Chat App

**Status**: ⬜ Not Started

- [ ] Create video chat app structure
- [ ] Implement backend (reuse Room model + WebRTC signaling)
- [ ] Implement frontend (video streams, useWebRTC hook)
- [ ] Test video/audio streaming locally
- [ ] Configure TURN server
- [ ] Test with multiple participants
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Test deployed app
- [ ] Update PLAN.md with deployment URL and notes

### Step 8: Build Enhanced Shared Modules (for next 5 apps)

1. **Room/Session Module**

   - Create room service and routes
   - Add Room, RoomParticipant, RoomPermission models
   - Implement room management
   - Test room creation/joining

2. **Voting/Ranking Module**

   - Create voting service
   - Add Vote model
   - Implement upvote/downvote logic
   - Test voting system

3. **Permission Module**

   - Create permission service and middleware
   - Implement role checking
   - Test permission system

4. **Frontend Collaboration Module**

   - Create useCollaboration hook
   - Implement presence awareness
   - Test real-time sync

5. **Media Player Module**

   - Create useMediaPlayer hook
   - Build MediaPlayer component
   - Test audio playback

6. **Canvas Module**

   - Create useCanvas hook
   - Build Canvas component
   - Implement drawing utilities
   - Test drawing operations

7. **Text Editor Module**

   - Create useTextEditor hook
   - Build TextEditor component
   - Integrate OT library (optional)
   - Test collaborative editing

8. **Screen Capture Module**

   - Create useScreenCapture hook
   - Build ScreenShare component
   - Test screen sharing

## Phase 7: Additional Apps (Quick Builds)

### App 1: Screen Sharing App

**Status**: ⬜ Not Started | **Deployment**: ⬜ Not Deployed

**Uses**: Auth + Room + WebRTC + Screen Capture modules

**MVP Features**:

- [ ] Create/join sharing sessions
- [ ] Screen share via WebRTC
- [ ] Multiple viewers
- [ ] Chat alongside sharing

**Implementation**:

- Backend: Reuse Room + WebRTC signaling
- Frontend: Use ScreenCapture + Room components
- **Estimated time**: 2-3 days (most code reused)

**Deployment Checklist**:

- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Screen sharing tested
- [ ] Multiple viewers tested
- [ ] Production URL: `_________________`

**Notes & Learnings**:

_Add notes here after deployment..._

### App 2: Live Q&A Platform

**Status**: ⬜ Not Started | **Deployment**: ⬜ Not Deployed

**Uses**: Auth + Room + Voting + Real-time modules

**MVP Features**:

- [ ] Create Q&A sessions
- [ ] Submit questions
- [ ] Upvote/downvote questions
- [ ] Real-time question feed (sorted by votes)
- [ ] Moderator controls

**Implementation**:

- Backend: Reuse Room + Voting modules
- Frontend: Use VoteButton + RoomList + ModeratorPanel
- **Estimated time**: 2-3 days

**Deployment Checklist**:

- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Voting system tested
- [ ] Real-time feed tested
- [ ] Moderator controls tested
- [ ] Production URL: `_________________`

**Notes & Learnings**:

_Add notes here after deployment..._

### App 3: Music Playlist Sharing

**Status**: ⬜ Not Started | **Deployment**: ⬜ Not Deployed

**Uses**: Auth + File Upload + Media Player + Real-time modules

**MVP Features**:

- [ ] Upload audio files
- [ ] Create playlists
- [ ] Share playlists
- [ ] Real-time synchronized playback
- [ ] Comments on tracks

**Implementation**:

- Backend: Reuse File Upload + Room modules
- Frontend: Use MediaPlayer + Room components
- **Estimated time**: 3-4 days

**Deployment Checklist**:

- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Audio upload tested
- [ ] Playlist creation tested
- [ ] Synchronized playback tested
- [ ] Production URL: `_________________`

**Notes & Learnings**:

_Add notes here after deployment..._

### App 4: Document Collaboration

**Status**: ⬜ Not Started | **Deployment**: ⬜ Not Deployed

**Uses**: Auth + Room + Text Editor + Real-time modules

**MVP Features**:

- [ ] Create documents
- [ ] Real-time collaborative editing
- [ ] Cursor positions visible
- [ ] Comments
- [ ] Version history (optional MVP)

**Implementation**:

- Backend: Reuse Room + add Document model
- Frontend: Use TextEditor + Collaboration modules
- **Estimated time**: 4-5 days (OT/CRDT complexity)

**Deployment Checklist**:

- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Collaborative editing tested
- [ ] Cursor sync tested
- [ ] Conflict resolution tested
- [ ] Production URL: `_________________`

**Notes & Learnings**:

_Add notes here after deployment..._

### App 5: Collaborative Whiteboard

**Status**: ⬜ Not Started | **Deployment**: ⬜ Not Deployed

**Uses**: Auth + Room + Canvas + Real-time modules

**MVP Features**:

- [ ] Create whiteboard sessions
- [ ] Real-time collaborative drawing
- [ ] Multiple tools (pen, shapes, text)
- [ ] Undo/redo
- [ ] Export canvas

**Implementation**:

- Backend: Reuse Room module
- Frontend: Use Canvas + Collaboration modules
- **Estimated time**: 3-4 days

**Deployment Checklist**:

- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Collaborative drawing tested
- [ ] Multiple tools tested
- [ ] Undo/redo tested
- [ ] Export functionality tested
- [ ] Production URL: `_________________`

**Notes & Learnings**:

_Add notes here after deployment..._

## File Structure

```
backend/src/
├── shared/
│   ├── auth/
│   │   ├── jwt.service.ts
│   │   ├── auth.middleware.ts
│   │   ├── password.service.ts
│   │   └── auth.types.ts
│   ├── user/
│   │   ├── user.service.ts
│   │   ├── user.controller.ts
│   │   ├── user.routes.ts
│   │   ├── user.validator.ts
│   │   └── user.types.ts
│   ├── file-upload/
│   │   ├── file.service.ts
│   │   ├── file.controller.ts
│   │   ├── file.routes.ts
│   │   ├── multer.config.ts
│   │   └── file.types.ts
│   ├── realtime/
│   │   ├── socket.service.ts
│   │   ├── socket.middleware.ts
│   │   └── socket.types.ts
│   ├── webrtc/
│   │   ├── webrtc-signaling.service.ts
│   │   └── webrtc.types.ts
│   ├── room/
│   │   ├── room.service.ts
│   │   ├── room.controller.ts
│   │   ├── room.routes.ts
│   │   └── room.types.ts
│   ├── voting/
│   │   ├── voting.service.ts
│   │   ├── voting.controller.ts
│   │   ├── voting.routes.ts
│   │   └── voting.types.ts
│   └── permissions/
│       ├── permission.service.ts
│       ├── permission.middleware.ts
│       └── permission.types.ts
├── apps/
│   ├── chat/
│   ├── blog/
│   ├── instagram/
│   ├── file-sharing/
│   └── video-chat/
└── index.ts (register shared routes + socket.io)

frontend/src/
├── shared/
│   ├── auth/
│   │   ├── AuthContext.tsx
│   │   ├── useAuth.ts
│   │   ├── auth.api.ts
│   │   ├── ProtectedRoute.tsx
│   │   └── auth.types.ts
│   ├── webrtc/
│   │   ├── useWebRTC.ts
│   │   ├── useDataChannel.ts
│   │   └── webrtc.types.ts
│   ├── collaboration/
│   │   ├── useCollaboration.ts
│   │   └── collaboration.types.ts
│   ├── media/
│   │   ├── useMediaPlayer.ts
│   │   ├── MediaPlayer.tsx
│   │   └── media.types.ts
│   ├── canvas/
│   │   ├── useCanvas.ts
│   │   ├── Canvas.tsx
│   │   ├── drawing.utils.ts
│   │   └── canvas.types.ts
│   ├── editor/
│   │   ├── useTextEditor.ts
│   │   ├── TextEditor.tsx
│   │   ├── ot.utils.ts
│   │   └── editor.types.ts
│   └── screen-capture/
│       ├── useScreenCapture.ts
│       ├── ScreenShare.tsx
│       └── screen-capture.types.ts
│   └── components/
│       ├── avatar.tsx
│       ├── loading.tsx
│       ├── file-upload.tsx
│       ├── error-boundary.tsx
│       ├── vote-button.tsx
│       ├── room-list.tsx
│       ├── participant-list.tsx
│       └── moderator-panel.tsx
├── apps/
│   ├── chat/
│   ├── blog/
│   ├── instagram/
│   ├── file-sharing/
│   └── video-chat/
└── lib/api/client.ts (enhanced with JWT)
```

## Key Design Decisions

1. **Unified User System**: All apps share the same User model for seamless experience
2. **Shared Auth**: Single authentication system across all apps
3. **Modular Real-time**: Socket.io service can be used by any app
4. **File Upload Abstraction**: Single file service handles HTTP uploads (Blog/Instagram)
5. **WebRTC Module**: Reusable WebRTC signaling and data channels for P2P apps
6. **P2P File Sharing**: WebRTC Data Channels for direct file transfer (no server storage)
7. **Progressive Enhancement**: Each app builds on previous patterns
8. **MVP Focus**: Start minimal, add features incrementally
9. **Enhanced Shared Modules**: Room, Voting, Permissions, Canvas, Editor, Media Player modules enable rapid app development
10. **Reusability First**: Build once, use many times - each new app becomes faster to build

## Dependencies to Add

### Backend

- `jsonwebtoken` + `@types/jsonwebtoken` - JWT tokens
- `bcrypt` + `@types/bcrypt` - Password hashing
- `socket.io` - Real-time communication
- `multer` + `@types/multer` - File uploads (already installed)

### Frontend

- `socket.io-client` - Socket.io client
- `fabric` or `konva` - Canvas library (for whiteboard)
- `slate` or `quill` - Rich text editor (for document collaboration)
- `react-player` or `howler` - Media player (for music playlists)
- `yjs` or `sharedb` - Operational Transform/CRDT (optional, for advanced collaboration)

## Testing Strategy

1. **Unit Tests**: Test shared modules (auth, file upload)
2. **Integration Tests**: Test API endpoints
3. **E2E Testing**: Manual testing after each app deployment
4. **Real-time Testing**: Test Socket.io connections

## How to Update This Plan After Deployment

1. **Update Status**: Change status from ⬜ to 🟡 (In Progress) → ✅ (Completed) → 🚀 (Deployed)
2. **Check Features**: Mark completed features with [x]
3. **Fill Deployment Checklist**: Check off all completed items
4. **Add Production URL**: Fill in the production URL field
5. **Add Notes**: Document any issues, learnings, or improvements needed
6. **Update Progress Overview**: Update the "Last Updated" date and current phase

## Deployment Considerations

1. **File Storage**:

   - Blog/Instagram: For production, migrate from local to S3/Cloudinary
   - File Sharing: No server storage needed (P2P), only metadata

2. **Socket.io**: Ensure Render supports WebSocket connections
3. **WebRTC TURN Server**:

   - Use free TURN services (Twilio, Xirsys) for MVP
   - Or self-hosted TURN server (coturn) for production
   - Required for users behind NAT/firewalls

4. **Environment Variables**:

   - `JWT_SECRET` - JWT signing secret
   - `JWT_REFRESH_SECRET` - Refresh token secret
   - `TURN_SERVER_URL` - TURN server URL (optional)
   - `TURN_USERNAME` - TURN credentials (optional)
   - `TURN_CREDENTIAL` - TURN credentials (optional)

5. **Database Migrations**: Run migrations on each deployment
6. **WebRTC Considerations**:

   - HTTPS required for WebRTC (production)
   - TURN server needed for most real-world scenarios
   - Data channel size limits (64KB chunks recommended)
