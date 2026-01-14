import { useState, useEffect, useRef } from "react"
import { useChat } from "./hooks/useChat"
import { useAuth } from "@/shared/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Send, Plus } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { LoginForm } from "@/components/LoginForm"

export function ChatApp() {
  const { user, loading: authLoading } = useAuth()
  const {
    conversations,
    messages,
    activeConversationId,
    onlineUsers,
    loading,
    error,
    sendMessage,
    selectConversation,
    createConversation,
  } = useChat()

  const [messageInput, setMessageInput] = useState("")
  const [sending, setSending] = useState(false)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change or conversation changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, activeConversationId])

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sending || !activeConversationId) return

    try {
      setSending(true)
      await sendMessage(messageInput.trim())
      setMessageInput("")
    } catch (err) {
      console.error("Failed to send message:", err)
    } finally {
      setSending(false)
    }
  }

  const handleStartConversation = async (userId: string) => {
    try {
      await createConversation(userId)
      setNewChatOpen(false)
    } catch (err) {
      console.error("Failed to create conversation:", err)
    }
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please login to use the Chat app
            </p>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[600px] gap-4">
            {/* Conversations List */}
            <div className="w-1/3 border-r pr-4 flex flex-col">
              {/* New Chat Button */}
              <div className="mb-4">
                <Button
                  onClick={() => setNewChatOpen(true)}
                  className="w-full"
                  variant="default"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {conversations.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2 text-center">
                      No conversations yet
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => selectConversation(conversation.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          activeConversationId === conversation.id
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              {conversation.otherUser.username.charAt(0).toUpperCase()}
                            </Avatar>
                            {onlineUsers.some((u) => u.id === conversation.otherUser.id) && (
                              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background ring-1 ring-background"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {conversation.otherUser.name || conversation.otherUser.username}
                            </div>
                            {conversation.lastMessage && (
                              <div className="text-sm text-muted-foreground truncate">
                                {conversation.lastMessage.content}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* New Chat Dialog */}
            <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Start New Chat</DialogTitle>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto">
                  {onlineUsers.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-8 text-center">
                      No users online
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {onlineUsers.map((onlineUser) => {
                        // Check if conversation already exists
                        const existingConv = conversations.find(
                          (c) => c.otherUser.id === onlineUser.id
                        )
                        return (
                          <div
                            key={onlineUser.id}
                            onClick={() => {
                              if (existingConv) {
                                selectConversation(existingConv.id)
                                setNewChatOpen(false)
                              } else {
                                handleStartConversation(onlineUser.id)
                              }
                            }}
                            className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted flex items-center gap-3"
                          >
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                {onlineUser.username.charAt(0).toUpperCase()}
                              </Avatar>
                              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background ring-1 ring-background"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {onlineUser.name || onlineUser.username}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                @{onlineUser.username}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="border-b pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          {activeConversation.otherUser.username.charAt(0).toUpperCase()}
                        </Avatar>
                        {onlineUsers.some((u) => u.id === activeConversation.otherUser.id) && (
                          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-background ring-1 ring-background"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {activeConversation.otherUser.name ||
                            activeConversation.otherUser.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{activeConversation.otherUser.username}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {messages.map((message) => {
                      const isOwn = message.senderId === user?.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            {!isOwn && (
                              <div className="text-xs text-muted-foreground/70 mb-1">
                                {message.sender.username}
                              </div>
                            )}
                            <div>{message.content}</div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      disabled={sending}
                    />
                    <Button onClick={handleSendMessage} disabled={sending || !messageInput.trim()}>
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a conversation or start a new one
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
