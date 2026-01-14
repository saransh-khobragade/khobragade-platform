export interface Conversation {
  id: string
  userId1: string
  userId2: string
  createdAt: string
  updatedAt: string
  otherUser: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
  lastMessage?: {
    id: string
    content: string
    createdAt: string
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
  createdAt: string
  sender: {
    id: string
    username: string
    name: string | null
    avatar: string | null
  }
}
