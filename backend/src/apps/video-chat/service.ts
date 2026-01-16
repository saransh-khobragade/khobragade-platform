import prisma from "../../db/index.js"
import { logger } from "../../lib/logger.js"

export const videoChatService = {
  async createRoom(userId: string, name: string) {
    const room = await prisma.room.create({
      data: {
        name,
        hostId: userId,
        isActive: true,
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    })

    logger.info({ roomId: room.id, userId, name }, "Room created")
    return room
  },

  async getRoomById(roomId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    })

    if (!room) {
      return null
    }

    return room
  },

  async getActiveRooms() {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return rooms
  },

  async getUserRooms(userId: string) {
    const rooms = await prisma.room.findMany({
      where: {
        hostId: userId,
        isActive: true,
      },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return rooms
  },

  async deactivateRoom(roomId: string, userId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      throw new Error("Room not found")
    }

    if (room.hostId !== userId) {
      throw new Error("Only the host can deactivate the room")
    }

    const updatedRoom = await prisma.room.update({
      where: { id: roomId },
      data: { isActive: false },
    })

    logger.info({ roomId, userId }, "Room deactivated")
    return updatedRoom
  },
}
