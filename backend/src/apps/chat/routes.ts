import { Router } from "express"
import { chatController } from "./controller.js"
import { authMiddleware } from "../../shared/auth/auth.middleware.js"

const router = Router()

// All routes require authentication
router.use(authMiddleware)

// Get or create conversation
router.post("/conversations", chatController.getOrCreateConversation)

// Get all conversations
router.get("/conversations", chatController.getConversations)

// Send message
router.post("/messages", chatController.sendMessage)

// Get messages for a conversation
router.get("/conversations/:conversationId/messages", chatController.getMessages)

// Get online users
router.get("/users/online", chatController.getOnlineUsers)

export default router
