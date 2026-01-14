import type { Request, Response } from "express"
import { chatService } from "./service.js"
import { getOnlineUserIds } from "../../shared/realtime/socket.service.js"
import { userService } from "../../shared/user/user.service.js"
import { logger } from "../../lib/logger.js"

export const chatController = {
  /**
   * Get or create a conversation
   */
  getOrCreateConversation: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }

      const { userId2 } = req.body

      if (!userId2 || typeof userId2 !== "string") {
        res.status(400).json({ error: "userId2 is required" })
        return
      }

      const conversation = await chatService.getOrCreateConversation(req.user.userId, {
        userId2,
      })

      res.json(conversation)
    } catch (error) {
      logger.error({ error }, "Get or create conversation failed")
      const message = error instanceof Error ? error.message : "Failed to get conversation"
      res.status(400).json({ error: message })
    }
  },

  /**
   * Get all conversations for current user
   */
  getConversations: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }

      const conversations = await chatService.getConversations(req.user.userId)
      res.json(conversations)
    } catch (error) {
      logger.error({ error }, "Get conversations failed")
      res.status(500).json({ error: "Failed to get conversations" })
    }
  },

  /**
   * Send a message
   */
  sendMessage: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }

      const { conversationId, receiverId, content } = req.body

      if (!conversationId || typeof conversationId !== "string") {
        res.status(400).json({ error: "conversationId is required" })
        return
      }

      if (!receiverId || typeof receiverId !== "string") {
        res.status(400).json({ error: "receiverId is required" })
        return
      }

      if (!content || typeof content !== "string" || content.trim().length === 0) {
        res.status(400).json({ error: "content is required" })
        return
      }

      const message = await chatService.sendMessage(req.user.userId, {
        conversationId,
        receiverId,
        content,
      })

      res.status(201).json(message)
    } catch (error) {
      logger.error({ error }, "Send message failed")
      const message = error instanceof Error ? error.message : "Failed to send message"
      res.status(400).json({ error: message })
    }
  },

  /**
   * Get messages for a conversation
   */
  getMessages: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }

      const { conversationId } = req.params

      if (!conversationId) {
        res.status(400).json({ error: "conversationId is required" })
        return
      }

      const messages = await chatService.getMessages(conversationId, req.user.userId)

      // Mark messages as read
      await chatService.markAsRead(conversationId, req.user.userId)

      res.json(messages)
    } catch (error) {
      logger.error({ error }, "Get messages failed")
      const message = error instanceof Error ? error.message : "Failed to get messages"
      res.status(400).json({ error: message })
    }
  },

  /**
   * Get online users
   */
  getOnlineUsers: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }

      const onlineUserIds = getOnlineUserIds()
      // Filter out current user
      const otherOnlineUserIds = onlineUserIds.filter((id) => id !== req.user!.userId)

      // Fetch user info for online users
      const onlineUsers = await Promise.all(
        otherOnlineUserIds.map(async (userId) => {
          const user = await userService.getById(userId)
          if (!user) return null
          return {
            id: user.id,
            username: user.username,
            name: user.name,
            avatar: user.avatar,
          }
        })
      )

      // Filter out nulls (users that don't exist)
      const validOnlineUsers = onlineUsers.filter((user) => user !== null)

      res.json(validOnlineUsers)
    } catch (error) {
      logger.error({ error }, "Get online users failed")
      res.status(500).json({ error: "Failed to get online users" })
    }
  },
}
