import { Router } from "express"
import { userController } from "./user.controller.js"
import { authMiddleware } from "../auth/auth.middleware.js"

const router = Router()

// Public routes
router.post("/register", userController.register)
router.post("/login", userController.login)
router.post("/refresh", userController.refresh)

// Protected routes
router.get("/me", authMiddleware, userController.getMe)
router.patch("/me", authMiddleware, userController.updateMe)

export default router
