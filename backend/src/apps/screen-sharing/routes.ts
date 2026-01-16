import { Router } from "express"
import { screenSharingController } from "./controller.js"
import { authMiddleware } from "../../shared/auth/auth.middleware.js"

const router = Router()

// Create share requires authentication
router.post("/create", authMiddleware, screenSharingController.createShare)

// Get share by token is public (no auth required)
router.get("/:token", screenSharingController.getShare)

// Stop share requires authentication
router.post("/:token/stop", authMiddleware, screenSharingController.stopShare)

export const screenSharingRouter = router
