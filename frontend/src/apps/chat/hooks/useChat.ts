import { useState, useEffect, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { chatApi } from "../api"
import { getAuthToken } from "@/lib/api/client"
import { useAuth } from "@/shared/auth/AuthContext"
import type { Conversation, Message } from "../types"

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:8080"

export const useChat = () => {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; username: string; name: string | null; avatar: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!user) return

    const token = getAuthToken()
    if (!token) return

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    })

    newSocket.on("connect", () => {
      console.log("Socket connected")
    })

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected")
    })

    newSocket.on("new_message", (message: Message) => {
      setMessages((prev) => {
        const conversationMessages = prev[message.conversationId] || []
        // Avoid duplicates
        if (conversationMessages.some((m) => m.id === message.id)) {
          return prev
        }
        return {
          ...prev,
          [message.conversationId]: [...conversationMessages, message],
        }
      })

      // Update conversation's last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === message.conversationId
            ? {
                ...conv,
                lastMessage: {
                  id: message.id,
                  content: message.content,
                  createdAt: message.createdAt,
                  read: message.read,
                },
                updatedAt: message.createdAt,
              }
            : conv
        )
      )
    })

    newSocket.on("message_received", (message: Message) => {
      // Update message as read if it's the active conversation
      if (activeConversationId === message.conversationId) {
        setMessages((prev) => ({
          ...prev,
          [message.conversationId]: (prev[message.conversationId] || []).map((m) =>
            m.id === message.id ? { ...m, read: true } : m
          ),
        }))
      }
    })

    // Listen for user online/offline events
    newSocket.on("user_online", async (data: { userId: string; username: string }) => {
      // Fetch full user info when they come online
      try {
        const userInfo = await chatApi.getOnlineUsers()
        setOnlineUsers(userInfo)
      } catch (err) {
        console.error("Failed to refresh online users:", err)
        // Fallback: add user with minimal info
        setOnlineUsers((prev) => {
          if (prev.some((u) => u.id === data.userId)) {
            return prev
          }
          return [
            ...prev,
            {
              id: data.userId,
              username: data.username,
              name: null,
              avatar: null,
            },
          ]
        })
      }
    })

    newSocket.on("user_offline", (data: { userId: string }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== data.userId))
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [user, activeConversationId])

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await chatApi.getConversations()
      setConversations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch conversations")
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const data = await chatApi.getOnlineUsers()
      setOnlineUsers(data)
    } catch (err) {
      console.error("Failed to fetch online users:", err)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchConversations()
      fetchOnlineUsers()
    }
  }, [user, fetchConversations, fetchOnlineUsers])

  // Join conversation room
  useEffect(() => {
    if (socket && activeConversationId) {
      socket.emit("join_conversation", { conversationId: activeConversationId })
      return () => {
        socket.emit("leave_conversation", { conversationId: activeConversationId })
      }
    }
  }, [socket, activeConversationId])

  // Fetch messages for active conversation
  useEffect(() => {
    if (activeConversationId && !messages[activeConversationId]) {
      chatApi
        .getMessages(activeConversationId)
        .then((data) => {
          setMessages((prev) => ({
            ...prev,
            [activeConversationId]: data,
          }))
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Failed to fetch messages")
        })
    }
  }, [activeConversationId, messages])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeConversationId || !socket || !user) return

      const conversation = conversations.find((c) => c.id === activeConversationId)
      if (!conversation) return

      const receiverId = conversation.otherUser.id

      // Optimistically add message
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId: activeConversationId,
        senderId: user.id,
        receiverId,
        content,
        read: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: user.id,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
        },
      }

      setMessages((prev) => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), tempMessage],
      }))

      try {
        // Send via socket
        socket.emit("send_message", {
          conversationId: activeConversationId,
          receiverId,
          content,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message")
        // Remove optimistic message on error
        setMessages((prev) => ({
          ...prev,
          [activeConversationId]: (prev[activeConversationId] || []).filter(
            (m) => m.id !== tempMessage.id
          ),
        }))
      }
    },
    [activeConversationId, socket, user, conversations]
  )

  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId)
  }, [])

  const createConversation = useCallback(
    async (userId2: string) => {
      try {
        const conversation = await chatApi.getOrCreateConversation(userId2)
        setConversations((prev) => [conversation, ...prev])
        setActiveConversationId(conversation.id)
        return conversation
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create conversation")
        throw err
      }
    },
    []
  )

  return {
    conversations,
    messages: activeConversationId ? messages[activeConversationId] || [] : [],
    activeConversationId,
    onlineUsers,
    loading,
    error,
    sendMessage,
    selectConversation,
    createConversation,
    fetchConversations,
    fetchOnlineUsers,
  }
}
