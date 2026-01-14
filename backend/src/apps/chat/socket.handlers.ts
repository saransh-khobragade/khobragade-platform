import type { Socket } from "socket.io"
import { getSocketIO } from "../../shared/realtime/socket.service.js"
import { chatService } from "./service.js"
import { logger } from "../../lib/logger.js"

/**
 * Setup chat socket handlers
 */
export const setupChatSocketHandlers = (socket: Socket): void => {
  const user = socket.data.user

  if (!user) {
    return
  }

  // Join user's personal room for direct messages
  socket.join(`user:${user.userId}`)

  // Join conversation room
  socket.on("join_conversation", async (data: { conversationId: string }) => {
    try {
      const { conversationId } = data

      // Verify user is part of conversation
      const conversations = await chatService.getConversations(user.userId)
      const isPartOfConversation = conversations.some(
        (conv) => conv.id === conversationId
      )

      if (!isPartOfConversation) {
        socket.emit("error", { message: "Not part of this conversation" })
        return
      }

      socket.join(`conversation:${conversationId}`)
      logger.info({ userId: user.userId, conversationId }, "User joined conversation room")
    } catch (error) {
      logger.error({ error }, "Join conversation failed")
      socket.emit("error", { message: "Failed to join conversation" })
    }
  })

  // Leave conversation room
  socket.on("leave_conversation", (data: { conversationId: string }) => {
    const { conversationId } = data
    socket.leave(`conversation:${conversationId}`)
    logger.info({ userId: user.userId, conversationId }, "User left conversation room")
  })

  // Handle new message
  socket.on("send_message", async (data: { conversationId: string; receiverId: string; content: string }) => {
    try {
      const { conversationId, receiverId, content } = data

      // Send message via service
      const message = await chatService.sendMessage(user.userId, {
        conversationId,
        receiverId,
        content,
      })

      const io = getSocketIO()

      // Emit to conversation room
      io.to(`conversation:${conversationId}`).emit("new_message", message)

      // Also emit to receiver's personal room for notifications
      io.to(`user:${receiverId}`).emit("message_received", message)

      logger.info({ messageId: message.id, conversationId }, "Message sent via socket")
    } catch (error) {
      logger.error({ error }, "Send message via socket failed")
      socket.emit("error", { message: "Failed to send message" })
    }
  })

  // Typing indicator
  socket.on("typing", (data: { conversationId: string; isTyping: boolean }) => {
    const { conversationId, isTyping } = data
    socket.to(`conversation:${conversationId}`).emit("user_typing", {
      userId: user.userId,
      username: user.username,
      isTyping,
    })
  })
}
