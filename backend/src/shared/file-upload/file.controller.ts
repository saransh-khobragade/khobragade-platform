import { Request, Response } from "express"
import { fileService } from "./file.service.js"
import { logger } from "../../lib/logger.js"
import path from "path"
import fs from "fs/promises"

export const fileController = {
  /**
   * Upload a file
   */
  upload: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" })
      }

      const userId = req.user?.userId

      const metadata = await fileService.saveFileMetadata(
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        userId
      )

      const url = fileService.getFileUrl(req.file.filename)

      logger.info({ filename: req.file.filename, userId }, "File uploaded successfully")

      res.status(201).json({
        id: metadata.id,
        filename: metadata.filename,
        originalName: metadata.originalName,
        mimeType: metadata.mimeType,
        size: metadata.size,
        url,
        uploadedBy: metadata.uploadedBy,
        createdAt: metadata.createdAt,
      })
    } catch (error) {
      logger.error({ error }, "File upload failed")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to upload file",
      })
    }
  },

  /**
   * Serve a file
   */
  serveFile: async (req: Request, res: Response) => {
    try {
      const { filename } = req.params

      logger.info({ filename }, "Serving file")

      const metadata = await fileService.getFileMetadata(filename)
      if (!metadata) {
        logger.warn({ filename }, "File metadata not found")
        return res.status(404).json({ error: "File not found" })
      }

      const filePath = fileService.getFilePath(filename)

      // Check if file exists
      try {
        await fs.access(filePath)
      } catch {
        logger.warn({ filename, filePath }, "File not found on disk")
        return res.status(404).json({ error: "File not found on disk" })
      }

      // Set appropriate headers for images
      res.setHeader("Content-Type", metadata.mimeType)
      res.setHeader("Content-Disposition", `inline; filename="${metadata.originalName}"`)
      
      // Add cache headers for images
      if (metadata.mimeType.startsWith("image/")) {
        res.setHeader("Cache-Control", "public, max-age=31536000")
      }

      // Stream the file
      const fileStream = await fs.readFile(filePath)
      logger.info({ filename, size: fileStream.length }, "File served successfully")
      res.send(fileStream)
    } catch (error) {
      logger.error({ error, filename: req.params.filename }, "File serve failed")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to serve file",
      })
    }
  },

  /**
   * Delete a file
   */
  deleteFile: async (req: Request, res: Response) => {
    try {
      const { filename } = req.params
      const userId = req.user?.userId

      const metadata = await fileService.getFileMetadata(filename)
      if (!metadata) {
        return res.status(404).json({ error: "File not found" })
      }

      // Check if user owns the file (optional - can be made more permissive)
      if (metadata.uploadedBy && metadata.uploadedBy !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this file" })
      }

      await fileService.deleteFile(filename)

      logger.info({ filename, userId }, "File deleted successfully")

      res.json({ message: "File deleted successfully" })
    } catch (error) {
      logger.error({ error }, "File deletion failed")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete file",
      })
    }
  },
}
