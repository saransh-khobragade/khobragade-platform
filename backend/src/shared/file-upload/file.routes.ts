import { Router } from "express"
import { fileController } from "./file.controller.js"
import { upload } from "./multer.config.js"
import { authMiddleware } from "../auth/auth.middleware.js"
import { ensureUploadsDir } from "./file.service.js"

const router = Router()

// Ensure uploads directory exists on startup
ensureUploadsDir().catch((error) => {
  console.error("Failed to create uploads directory:", error)
})

// Upload file (protected)
router.post("/upload", authMiddleware, upload.single("file"), fileController.upload)

// Serve file (public)
router.get("/:filename", fileController.serveFile)

// Delete file (protected)
router.delete("/:filename", authMiddleware, fileController.deleteFile)

export default router
