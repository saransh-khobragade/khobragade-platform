import { Router } from "express"
import { instagramController } from "./controller.js"
import { authMiddleware } from "../../shared/auth/auth.middleware.js"

const router = Router()

// Public routes
router.get("/posts", instagramController.getAllPosts)
router.get("/posts/:id", instagramController.getPostById)
router.get("/users/:userId/posts", instagramController.getPostsByUserId)

// Protected routes
router.post("/posts", authMiddleware, instagramController.createPost)
router.patch("/posts/:id", authMiddleware, instagramController.updatePost)
router.delete("/posts/:id", authMiddleware, instagramController.deletePost)
router.post("/posts/:postId/comments", authMiddleware, instagramController.addComment)
router.delete("/comments/:id", authMiddleware, instagramController.deleteComment)
router.post("/posts/:postId/like", authMiddleware, instagramController.toggleLike)

export default router
