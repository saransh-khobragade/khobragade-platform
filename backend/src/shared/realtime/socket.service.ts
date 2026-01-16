import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"
import { socketAuthMiddleware } from "./socket.middleware.js"
import { logger } from "../../lib/logger.js"

let io: SocketIOServer | null = null

// Track online users: userId -> Set of socketIds (allows multiple tabs/devices)
const onlineUsers = new Map<string, Set<string>>()

/**
 * Initialize Socket.io server
 */
export const initializeSocketIO = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  })

  // Apply authentication middleware
  io.use(socketAuthMiddleware)

  io.on("connection", async (socket) => {
    const user = socket.data.user
    logger.info({ userId: user?.userId }, "User connected via socket")

    // Track online user
    if (user?.userId) {
      const wasOffline = !onlineUsers.has(user.userId)
      
      if (!onlineUsers.has(user.userId)) {
        onlineUsers.set(user.userId, new Set())
      }
      onlineUsers.get(user.userId)!.add(socket.id)

      // Emit user_online event to all clients (except the connecting user) only if user just came online
      if (wasOffline) {
        socket.broadcast.emit("user_online", {
          userId: user.userId,
          username: user.username,
        })
      }
    }

    // Setup chat handlers
    const { setupChatSocketHandlers } = await import("../../apps/chat/socket.handlers.js")
    setupChatSocketHandlers(socket)

    // Setup file sharing handlers
    const { setupFileSharingSocketHandlers } = await import("../../apps/file-sharing/socket.handlers.js")
    setupFileSharingSocketHandlers(socket)

    // Setup video chat handlers
    const { setupVideoChatSocketHandlers } = await import("../../apps/video-chat/socket.handlers.js")
    setupVideoChatSocketHandlers(socket)

    socket.on("disconnect", () => {
      logger.info({ userId: user?.userId }, "User disconnected from socket")

      // Remove from online users
      if (user?.userId) {
        const socketIds = onlineUsers.get(user.userId)
        if (socketIds) {
          socketIds.delete(socket.id)
          // If no more sockets for this user, remove from online users
          if (socketIds.size === 0) {
            onlineUsers.delete(user.userId)
            // Emit user_offline event
            if (io) {
              io.emit("user_offline", {
                userId: user.userId,
              })
            }
          }
        }
      }
    })
  })

  logger.info("Socket.io server initialized")
  return io
}

/**
 * Get Socket.io server instance
 */
export const getSocketIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocketIO first.")
  }
  return io
}

/**
 * Get list of online user IDs
 */
export const getOnlineUserIds = (): string[] => {
  return Array.from(onlineUsers.keys())
}

/**
 * Check if a user is online
 */
export const isUserOnline = (userId: string): boolean => {
  return onlineUsers.has(userId)
}
