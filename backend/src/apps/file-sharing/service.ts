import prisma from "../../db/index.js"
import { logger } from "../../lib/logger.js"
import { randomBytes } from "crypto"
import type { FileShare, CreateFileShareInput } from "./types.js"

export const fileSharingService = {
  /**
   * Generate a unique share token
   */
  generateShareToken: (): string => {
    return randomBytes(16).toString("base64url")
  },

  /**
   * Create a new file share
   */
  createShare: async (
    userId: string,
    input: CreateFileShareInput
  ): Promise<FileShare> => {
    let shareToken: string = ""
    let isUnique = false

    // Generate unique token
    while (!isUnique) {
      shareToken = fileSharingService.generateShareToken()
      const existing = await prisma.fileShare.findUnique({
        where: { shareToken },
      })
      if (!existing) {
        isUnique = true
      }
    }

    const share = await prisma.fileShare.create({
      data: {
        shareToken,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        sharedBy: userId,
        expiresAt: input.expiresAt || null,
      },
      include: {
        sharer: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    })

    logger.info({ shareId: share.id, shareToken, userId }, "File share created")
    return share as FileShare
  },

  /**
   * Get share by token
   */
  getShareByToken: async (token: string): Promise<FileShare | null> => {
    const share = await prisma.fileShare.findUnique({
      where: { shareToken: token },
      include: {
        sharer: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    })

    if (!share) {
      return null
    }

    // Check if expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      logger.warn({ shareToken: token }, "Share token expired")
      return null
    }

    // Check if active
    if (!share.isActive) {
      logger.warn({ shareToken: token }, "Share token is inactive")
      return null
    }

    return share as FileShare
  },

  /**
   * Get shares by user
   */
  getSharesByUser: async (userId: string): Promise<FileShare[]> => {
    const shares = await prisma.fileShare.findMany({
      where: { sharedBy: userId },
      include: {
        sharer: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return shares as FileShare[]
  },

  /**
   * Delete a share
   */
  deleteShare: async (shareToken: string, userId: string): Promise<void> => {
    const share = await prisma.fileShare.findUnique({
      where: { shareToken },
    })

    if (!share) {
      throw new Error("Share not found")
    }

    if (share.sharedBy !== userId) {
      throw new Error("Not authorized to delete this share")
    }

    await prisma.fileShare.delete({
      where: { shareToken },
    })

    logger.info({ shareToken, userId }, "File share deleted")
  },

  /**
   * Deactivate a share (soft delete)
   */
  deactivateShare: async (shareToken: string, userId: string): Promise<void> => {
    const share = await prisma.fileShare.findUnique({
      where: { shareToken },
    })

    if (!share) {
      throw new Error("Share not found")
    }

    if (share.sharedBy !== userId) {
      throw new Error("Not authorized to deactivate this share")
    }

    await prisma.fileShare.update({
      where: { shareToken },
      data: { isActive: false },
    })

    logger.info({ shareToken, userId }, "File share deactivated")
  },
}
