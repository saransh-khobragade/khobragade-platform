import { Router } from "express"
import { fileSharingController } from "./controller.js"
import { authMiddleware } from "../../shared/auth/auth.middleware.js"

const router = Router()

// Public route - get share info by token
router.get("/share/:token", fileSharingController.getShareByToken)

// Protected routes
router.post("/create-share", authMiddleware, fileSharingController.createShare)
router.get("/my-shares", authMiddleware, fileSharingController.getMyShares)
router.delete("/share/:token", authMiddleware, fileSharingController.deleteShare)
router.patch("/share/:token/deactivate", authMiddleware, fileSharingController.deactivateShare)

export default router
