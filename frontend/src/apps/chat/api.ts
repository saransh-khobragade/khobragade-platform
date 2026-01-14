import { apiRequest } from "@/lib/api/client"
import type { Conversation, Message } from "./types"

export const chatApi = {
  /**
   * Get or create a conversation
   */
  getOrCreateConversation: async (userId2: string): Promise<Conversation> => {
    return apiRequest<Conversation>("/api/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ userId2 }),
    })
  },

  /**
   * Get all conversations
   */
  getConversations: async (): Promise<Conversation[]> => {
    return apiRequest<Conversation[]>("/api/chat/conversations")
  },

  /**
   * Send a message
   */
  sendMessage: async (
    conversationId: string,
    receiverId: string,
    content: string
  ): Promise<Message> => {
    return apiRequest<Message>("/api/chat/messages", {
      method: "POST",
      body: JSON.stringify({ conversationId, receiverId, content }),
    })
  },

  /**
   * Get messages for a conversation
   */
  getMessages: async (conversationId: string): Promise<Message[]> => {
    return apiRequest<Message[]>(`/api/chat/conversations/${conversationId}/messages`)
  },

  /**
   * Get online users
   */
  getOnlineUsers: async (): Promise<Array<{ id: string; username: string; name: string | null; avatar: string | null }>> => {
    return apiRequest<Array<{ id: string; username: string; name: string | null; avatar: string | null }>>("/api/chat/users/online")
  },
}
