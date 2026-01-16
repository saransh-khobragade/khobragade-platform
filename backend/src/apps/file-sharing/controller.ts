import { Request, Response } from "express"
import { fileSharingService } from "./service.js"
import { logger } from "../../lib/logger.js"
import type { CreateFileShareInput } from "./types.js"

export const fileSharingController = {
  /**
   * Create a new file share
   */
  createShare: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId
      const input: CreateFileShareInput = req.body

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      if (!input.fileName || !input.fileSize || !input.mimeType) {
        return res.status(400).json({
          error: "fileName, fileSize, and mimeType are required",
        })
      }

      const share = await fileSharingService.createShare(userId, input)
      res.status(201).json(share)
    } catch (error) {
      logger.error({ error }, "Failed to create file share")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to create file share",
      })
    }
  },

  /**
   * Get share by token (public endpoint)
   */
  getShareByToken: async (req: Request, res: Response) => {
    try {
      const { token } = req.params

      const share = await fileSharingService.getShareByToken(token)

      if (!share) {
        return res.status(404).json({ error: "Share not found or expired" })
      }

      res.json({
        shareToken: share.shareToken,
        fileName: share.fileName,
        fileSize: share.fileSize,
        mimeType: share.mimeType,
        sharedBy: share.sharer,
        isActive: share.isActive,
        expiresAt: share.expiresAt,
      })
    } catch (error) {
      logger.error({ error }, "Failed to get file share")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get file share",
      })
    }
  },

  /**
   * Get shares by current user
   */
  getMyShares: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      const shares = await fileSharingService.getSharesByUser(userId)
      res.json(shares)
    } catch (error) {
      logger.error({ error }, "Failed to get user shares")
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get user shares",
      })
    }
  },

  /**
   * Delete a share
   */
  deleteShare: async (req: Request, res: Response) => {
    try {
      const { token } = req.params
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      await fileSharingService.deleteShare(token, userId)
      res.json({ message: "Share deleted successfully" })
    } catch (error) {
      logger.error({ error }, "Failed to delete file share")
      if (error instanceof Error && error.message === "Share not found") {
        return res.status(404).json({ error: "Share not found" })
      }
      if (error instanceof Error && error.message.includes("Not authorized")) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to delete file share",
      })
    }
  },

  /**
   * Deactivate a share
   */
  deactivateShare: async (req: Request, res: Response) => {
    try {
      const { token } = req.params
      const userId = req.user?.userId

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" })
      }

      await fileSharingService.deactivateShare(token, userId)
      res.json({ message: "Share deactivated successfully" })
    } catch (error) {
      logger.error({ error }, "Failed to deactivate file share")
      if (error instanceof Error && error.message === "Share not found") {
        return res.status(404).json({ error: "Share not found" })
      }
      if (error instanceof Error && error.message.includes("Not authorized")) {
        return res.status(403).json({ error: error.message })
      }
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to deactivate file share",
      })
    }
  },
}
