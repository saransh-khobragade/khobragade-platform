import { Request, Response } from "express"
import { videoChatService } from "./service"
import { logger } from "../../lib/logger"

export const videoChatController = {
  async createRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.userId
      const { name } = req.body

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Room name is required" })
      }

      const room = await videoChatService.createRoom(userId, name.trim())
      res.status(201).json(room)
    } catch (error) {
      logger.error({ error }, "Failed to create room")
      res.status(500).json({ error: "Failed to create room" })
    }
  },

  async getRoom(req: Request, res: Response) {
    try {
      const { roomId } = req.params

      const room = await videoChatService.getRoomById(roomId)

      if (!room) {
        return res.status(404).json({ error: "Room not found" })
      }

      if (!room.isActive) {
        return res.status(404).json({ error: "Room is not active" })
      }

      res.json(room)
    } catch (error) {
      logger.error({ error }, "Failed to get room")
      res.status(500).json({ error: "Failed to get room" })
    }
  },

  async getActiveRooms(req: Request, res: Response) {
    try {
      const rooms = await videoChatService.getActiveRooms()
      res.json(rooms)
    } catch (error) {
      logger.error({ error }, "Failed to get active rooms")
      res.status(500).json({ error: "Failed to get active rooms" })
    }
  },

  async getMyRooms(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.userId
      const rooms = await videoChatService.getUserRooms(userId)
      res.json(rooms)
    } catch (error) {
      logger.error({ error }, "Failed to get user rooms")
      res.status(500).json({ error: "Failed to get user rooms" })
    }
  },

  async deactivateRoom(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.userId
      const { roomId } = req.params

      await videoChatService.deactivateRoom(roomId, userId)
      res.json({ message: "Room deactivated" })
    } catch (error) {
      logger.error({ error }, "Failed to deactivate room")
      if (error instanceof Error) {
        if (error.message === "Room not found") {
          return res.status(404).json({ error: error.message })
        }
        if (error.message === "Only the host can deactivate the room") {
          return res.status(403).json({ error: error.message })
        }
      }
      res.status(500).json({ error: "Failed to deactivate room" })
    }
  },
}
