export interface CreateConversationInput {
  userId2: string
}

export interface SendMessageInput {
  conversationId: string
  receiverId: string
  content: string
}

export interface Conversation {
  id: string
  userId1: string
  userId2: string
  createdAt: Date
  updatedAt: Date
  otherUser: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
  lastMessage?: {
    id: string
    content: string
    createdAt: Date
    read: boolean
  }
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  read: boolean
  createdAt: Date
  sender: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
}
