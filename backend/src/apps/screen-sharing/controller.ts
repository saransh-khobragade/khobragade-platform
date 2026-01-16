import { Request, Response } from "express"
import { screenSharingService } from "./service.js"
import { logger } from "../../lib/logger.js"

export const screenSharingController = {
  /**
   * Create a new screen share (requires auth)
   */
  async createShare(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.userId
      const { expiresAt } = req.body

      const share = await screenSharingService.createShare(userId, {
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      })
      res.status(201).json(share)
    } catch (error) {
      logger.error({ error }, "Failed to create screen share")
      res.status(500).json({ error: "Failed to create screen share" })
    }
  },

  /**
   * Get share info by token (public, no auth required)
   */
  async getShare(req: Request, res: Response) {
    try {
      const { token } = req.params

      const share = await screenSharingService.getShareByToken(token)

      if (!share) {
        return res.status(404).json({ error: "Screen share not found or expired" })
      }

      res.json(share)
    } catch (error) {
      logger.error({ error }, "Failed to get screen share")
      res.status(500).json({ error: "Failed to get screen share" })
    }
  },

  /**
   * Stop a screen share (requires auth)
   */
  async stopShare(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.userId
      const { token } = req.params

      await screenSharingService.stopShare(token, userId)
      res.json({ message: "Screen share stopped" })
    } catch (error) {
      logger.error({ error }, "Failed to stop screen share")
      if (error instanceof Error) {
        if (error.message === "Share not found") {
          return res.status(404).json({ error: error.message })
        }
        if (error.message === "Not authorized to stop this share") {
          return res.status(403).json({ error: error.message })
        }
      }
      res.status(500).json({ error: "Failed to stop screen share" })
    }
  },
}
