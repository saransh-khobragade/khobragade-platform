import prisma from "../../db/index.js"
import { logger } from "../../lib/logger.js"
import type { CreateConversationInput, SendMessageInput, Conversation, Message } from "./types.js"

export const chatService = {
  /**
   * Get or create a conversation between two users
   */
  getOrCreateConversation: async (
    userId1: string,
    input: CreateConversationInput
  ): Promise<Conversation> => {
    const userId2 = input.userId2

    if (userId1 === userId2) {
      throw new Error("Cannot create conversation with yourself")
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userId1, userId2 },
          { userId1: userId2, userId2: userId1 },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            read: true,
          },
        },
      },
    })

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          userId1,
          userId2,
        },
        include: {
          user1: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          user2: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              content: true,
              createdAt: true,
              read: true,
            },
          },
        },
      })

      logger.info({ conversationId: conversation.id, userId1, userId2 }, "Conversation created")
    }

    // Determine which user is the "other user"
    const otherUser = conversation.userId1 === userId1 ? conversation.user2 : conversation.user1

    return {
      id: conversation.id,
      userId1: conversation.userId1,
      userId2: conversation.userId2,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      otherUser: {
        id: otherUser.id,
        username: otherUser.username,
        name: otherUser.name,
        avatar: otherUser.avatar,
      },
      lastMessage: conversation.messages[0] || undefined,
    }
  },

  /**
   * Get all conversations for a user
   */
  getConversations: async (userId: string): Promise<Conversation[]> => {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ userId1: userId }, { userId2: userId }],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            read: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return conversations.map((conv) => {
      const otherUser = conv.userId1 === userId ? conv.user2 : conv.user1
      return {
        id: conv.id,
        userId1: conv.userId1,
        userId2: conv.userId2,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          name: otherUser.name,
          avatar: otherUser.avatar,
        },
        lastMessage: conv.messages[0] || undefined,
      }
    })
  },

  /**
   * Send a message
   */
  sendMessage: async (senderId: string, input: SendMessageInput): Promise<Message> => {
    // Verify conversation exists and user is part of it
    const conversation = await prisma.conversation.findUnique({
      where: { id: input.conversationId },
    })

    if (!conversation) {
      throw new Error("Conversation not found")
    }

    if (conversation.userId1 !== senderId && conversation.userId2 !== senderId) {
      throw new Error("You are not part of this conversation")
    }

    if (conversation.userId1 !== input.receiverId && conversation.userId2 !== input.receiverId) {
      throw new Error("Receiver is not part of this conversation")
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId,
        receiverId: input.receiverId,
        content: input.content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    })

    logger.info(
      { messageId: message.id, conversationId: input.conversationId, senderId },
      "Message sent"
    )

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      read: message.read,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        username: message.sender.username,
        name: message.sender.name,
        avatar: message.sender.avatar,
      },
    }
  },

  /**
   * Get messages for a conversation
   */
  getMessages: async (conversationId: string, userId: string): Promise<Message[]> => {
    // Verify user is part of conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      throw new Error("Conversation not found")
    }

    if (conversation.userId1 !== userId && conversation.userId2 !== userId) {
      throw new Error("You are not part of this conversation")
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      content: msg.content,
      read: msg.read,
      createdAt: msg.createdAt,
      sender: {
        id: msg.sender.id,
        username: msg.sender.username,
        name: msg.sender.name,
        avatar: msg.sender.avatar,
      },
    }))
  },

  /**
   * Mark messages as read
   */
  markAsRead: async (conversationId: string, userId: string): Promise<void> => {
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    })

    logger.info({ conversationId, userId }, "Messages marked as read")
  },
}
