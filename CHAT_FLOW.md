# Chat App - High-Level Request & Data Flow

## Overview

The Chat App uses a hybrid architecture combining **REST API** for initial data loading and **WebSocket (Socket.io)** for real-time bidirectional communication.

---

## Architecture Components

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │◄───────►│   Backend    │◄───────►│  PostgreSQL │
│   (React)   │  HTTP   │  (Express)   │  Prisma │  Database   │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │
      │                        │
      └──────── WebSocket ─────┘
         (Socket.io)
```

---

## 1. Authentication Flow

### Initial Login/Registration
```
User → Frontend (LoginForm)
  ↓
POST /api/auth/login
  ↓
Backend (user.controller.login)
  ↓
userService.login() → Verify password → Generate JWT tokens
  ↓
Response: { accessToken, refreshToken, user }
  ↓
Frontend: Store tokens in localStorage
  ↓
AuthContext: Set user state
```

### Token Refresh
```
API Request with expired accessToken
  ↓
Backend: 401 Unauthorized
  ↓
Frontend (apiRequest): Auto-refresh using refreshToken
  ↓
POST /api/auth/refresh
  ↓
Backend: Verify refreshToken → Generate new accessToken
  ↓
Frontend: Update tokens → Retry original request
```

---

## 2. Socket Connection Flow

### Connection Establishment
```
User logs in → Frontend (useChat hook)
  ↓
io.connect(SOCKET_URL, { auth: { token } })
  ↓
Backend: socketAuthMiddleware
  ↓
Verify JWT token → Extract user info
  ↓
Attach user to socket.data.user
  ↓
Socket connected
  ↓
Backend: Track user in onlineUsers Map
  ↓
Emit "user_online" to all other clients
  ↓
Frontend: Listen for "user_online" → Update onlineUsers state
```

### Connection Cleanup
```
User closes tab/logs out
  ↓
Socket disconnect event
  ↓
Backend: Remove socketId from onlineUsers Map
  ↓
If last socket for user → Remove from onlineUsers
  ↓
Emit "user_offline" to all clients
  ↓
Frontend: Remove user from onlineUsers state
```

---

## 3. Loading Conversations Flow

### Initial Load
```
Component Mount → useChat hook
  ↓
GET /api/chat/conversations
  ↓
Headers: Authorization: Bearer <accessToken>
  ↓
Backend: authMiddleware → Verify token → Attach user to req.user
  ↓
chatController.getConversations()
  ↓
chatService.getConversations(userId)
  ↓
Prisma: Query Conversation table (where userId1 OR userId2 = userId)
  ↓
Include: otherUser, lastMessage
  ↓
Return: Array of conversations
  ↓
Frontend: setConversations(data)
  ↓
Render conversation list
```

---

## 4. Creating a New Conversation

### Flow
```
User clicks "New Chat" → Opens modal
  ↓
User selects online user
  ↓
Frontend: chatApi.getOrCreateConversation(userId2)
  ↓
POST /api/chat/conversations
  Body: { userId2: "..." }
  ↓
Backend: chatController.getOrCreateConversation()
  ↓
chatService.getOrCreateConversation()
  ↓
Prisma: Check if conversation exists
  ├─ EXISTS → Return existing conversation
  └─ NOT EXISTS → Create new Conversation → Return
  ↓
Frontend: Add conversation to list → Select as active
```

---

## 5. Loading Messages Flow

### Flow
```
User selects conversation
  ↓
Frontend: setActiveConversationId(conversationId)
  ↓
useEffect: Check if messages[conversationId] exists
  ├─ EXISTS → Use cached messages
  └─ NOT EXISTS → Fetch from API
      ↓
      GET /api/chat/conversations/:conversationId/messages
      ↓
      Backend: chatController.getMessages()
      ↓
      chatService.getMessages(conversationId, userId)
      ↓
      Prisma: Query Message table (where conversationId = ...)
      ↓
      Include: sender (User relation)
      ↓
      Return: Array of messages
      ↓
      Backend: chatService.markAsRead() → Update Message.read = true
      ↓
      Frontend: setMessages({ ...prev, [conversationId]: data })
      ↓
      Render messages
```

---

## 6. Sending a Message Flow

### Optimistic Update Pattern
```
User types message → Clicks send
  ↓
Frontend: sendMessage(content)
  ↓
Create temporary message object (temp-{timestamp})
  ↓
Optimistically add to UI: setMessages(...prev, tempMessage)
  ↓
Socket.emit("send_message", { conversationId, receiverId, content })
  ↓
Backend: socket.on("send_message")
  ↓
chatService.sendMessage(userId, { conversationId, receiverId, content })
  ↓
Prisma: Create Message record in database
  ↓
Backend: Get Socket.io instance
  ↓
Emit to conversation room: io.to(`conversation:${conversationId}`).emit("new_message", message)
  ↓
Emit to receiver's personal room: io.to(`user:${receiverId}`).emit("message_received", message)
  ↓
Frontend (Sender): socket.on("new_message")
  ├─ Replace temp message with real message
  └─ Update conversation.lastMessage
  ↓
Frontend (Receiver): socket.on("new_message")
  ├─ Add message to messages state
  └─ Update conversation.lastMessage
  ↓
Frontend (Receiver): socket.on("message_received")
  └─ Mark message as read (if active conversation)
```

### Error Handling
```
If socket emit fails:
  ↓
Frontend: Remove optimistic message
  ↓
Show error to user
```

---

## 7. Real-Time Message Reception

### Flow
```
User B receives message from User A
  ↓
Backend: Emit "new_message" to conversation room
  ↓
Frontend (User B): socket.on("new_message")
  ↓
Check if message already exists (avoid duplicates)
  ↓
Add message to messages[conversationId]
  ↓
Update conversation.lastMessage
  ↓
If conversation is active → Auto-scroll to bottom
  ↓
If conversation is NOT active → Show notification badge
```

---

## 8. Online Users Flow

### Initial Load
```
Component Mount → useChat hook
  ↓
fetchOnlineUsers()
  ↓
GET /api/chat/users/online
  ↓
Backend: chatController.getOnlineUsers()
  ↓
socketService.getOnlineUserIds() → Get from onlineUsers Map
  ↓
Filter out current user
  ↓
userService.getById() for each online user
  ↓
Return: Array of online user objects
  ↓
Frontend: setOnlineUsers(data)
  ↓
Render green dots on avatars
```

### Real-Time Updates
```
User comes online
  ↓
Backend: Emit "user_online" to all clients
  ↓
Frontend: socket.on("user_online")
  ↓
Refresh online users list (fetchOnlineUsers())
  ↓
Update UI with green dots
```

---

## 9. Joining Conversation Rooms

### Flow
```
User selects conversation
  ↓
Frontend: setActiveConversationId(conversationId)
  ↓
useEffect: socket.emit("join_conversation", { conversationId })
  ↓
Backend: socket.on("join_conversation")
  ↓
Verify user is part of conversation
  ↓
socket.join(`conversation:${conversationId}`)
  ↓
User now receives messages for this conversation
```

### Leaving Room
```
User switches to different conversation
  ↓
useEffect cleanup: socket.emit("leave_conversation", { conversationId })
  ↓
Backend: socket.leave(`conversation:${conversationId}`)
  ↓
User stops receiving messages for old conversation
```

---

## 10. Data Structures

### Frontend State (useChat hook)
```typescript
{
  conversations: Conversation[]           // List of all conversations
  messages: Record<string, Message[]>   // Messages by conversationId
  activeConversationId: string | null    // Currently selected conversation
  onlineUsers: User[]                    // List of online users
  socket: Socket | null                  // Socket.io connection
}
```

### Backend State (Socket.io)
```typescript
{
  onlineUsers: Map<userId, Set<socketId>>  // Track online users (multi-device support)
  rooms: {
    "conversation:123": [socket1, socket2],  // Users in conversation
    "user:456": [socket3]                     // User's personal room
  }
}
```

### Database Models
```prisma
User {
  id, email, username, password, name, avatar
}

Conversation {
  id, userId1, userId2, createdAt, updatedAt
  messages: Message[]
}

Message {
  id, conversationId, senderId, receiverId, 
  content, read, createdAt
}
```

---

## 11. Key Design Patterns

### 1. **Optimistic Updates**
- Messages appear instantly in UI before server confirmation
- Provides better UX (no waiting)
- Rollback on error

### 2. **Room-Based Broadcasting**
- Messages sent to conversation rooms
- Only users in room receive messages
- Efficient for group conversations (future)

### 3. **Multi-Device Support**
- User can be online on multiple devices
- Tracked via Set of socketIds per userId
- All devices receive messages

### 4. **Hybrid Architecture**
- REST API for initial data (conversations, messages)
- WebSocket for real-time updates (new messages, online status)
- Best of both worlds

### 5. **Authentication on Both Layers**
- HTTP: JWT in Authorization header
- WebSocket: JWT in connection auth
- Consistent security model

---

## 12. Request Flow Summary

### REST API Requests
```
1. GET /api/chat/conversations          → Load conversation list
2. POST /api/chat/conversations         → Create/get conversation
3. GET /api/chat/conversations/:id/messages → Load messages
4. GET /api/chat/users/online          → Get online users
```

### WebSocket Events (Client → Server)
```
1. connect                              → Establish connection
2. join_conversation                    → Join conversation room
3. leave_conversation                   → Leave conversation room
4. send_message                         → Send new message
5. typing                               → Typing indicator
```

### WebSocket Events (Server → Client)
```
1. connect                              → Connection established
2. new_message                          → New message received
3. message_received                     → Message read confirmation
4. user_online                          → User came online
5. user_offline                          → User went offline
6. user_typing                           → User is typing
7. error                                 → Error occurred
```

---

## 13. Performance Optimizations

1. **Message Caching**: Messages cached per conversation in frontend
2. **Lazy Loading**: Messages only loaded when conversation selected
3. **Room-Based Broadcasting**: Only relevant users receive events
4. **Optimistic Updates**: Instant UI feedback
5. **Duplicate Prevention**: Check message.id before adding to state

---

## 14. Error Handling

### Network Errors
- Socket disconnect → Auto-reconnect
- API errors → Show error message to user
- Token expiry → Auto-refresh

### Validation Errors
- Backend validates all inputs
- Returns 400 with error message
- Frontend displays error

### Authorization Errors
- 401 → Redirect to login
- Socket auth failure → Close connection

---

This architecture provides a scalable, real-time chat system with excellent UX through optimistic updates and efficient room-based message delivery.
