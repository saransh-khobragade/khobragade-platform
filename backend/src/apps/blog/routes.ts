import { Router } from "express"
import { blogController } from "./controller.js"
import { authMiddleware } from "../../shared/auth/auth.middleware.js"

const router = Router()

// Public routes
router.get("/posts", blogController.getAllPosts)
router.get("/posts/:id", blogController.getPostById)

// Protected routes
router.post("/posts", authMiddleware, blogController.createPost)
router.patch("/posts/:id", authMiddleware, blogController.updatePost)
router.delete("/posts/:id", authMiddleware, blogController.deletePost)

router.post("/posts/:postId/comments", authMiddleware, blogController.addComment)
router.delete("/comments/:id", authMiddleware, blogController.deleteComment)

router.post("/posts/:postId/like", authMiddleware, blogController.toggleLike)

export default router
