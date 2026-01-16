import { Router } from "express"
import { videoChatController } from "./controller.js"
import { authMiddleware } from "../../shared/auth/auth.middleware.js"

const router = Router()

// All routes require authentication
router.post("/create", authMiddleware, videoChatController.createRoom)
router.get("/active", authMiddleware, videoChatController.getActiveRooms)
router.get("/my-rooms", authMiddleware, videoChatController.getMyRooms)
router.get("/:roomId", authMiddleware, videoChatController.getRoom)
router.post("/:roomId/deactivate", authMiddleware, videoChatController.deactivateRoom)

export const videoChatRouter = router
