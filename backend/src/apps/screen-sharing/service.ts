import prisma from "../../db/index.js"
import { logger } from "../../lib/logger.js"
import { randomBytes } from "crypto"
import type { ScreenShare, CreateScreenShareInput } from "./types.js"

export const screenSharingService = {
  /**
   * Generate a unique share token
   */
  generateShareToken: (): string => {
    return randomBytes(16).toString("base64url")
  },

  /**
   * Create a new screen share
   */
  createShare: async (
    userId: string,
    input: CreateScreenShareInput
  ): Promise<ScreenShare> => {
    let shareToken: string = ""
    let isUnique = false

    // Generate unique token
    while (!isUnique) {
      shareToken = screenSharingService.generateShareToken()
      const existing = await prisma.screenShare.findUnique({
        where: { shareToken },
      })
      if (!existing) {
        isUnique = true
      }
    }

    const share = await prisma.screenShare.create({
      data: {
        shareToken,
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

    logger.info({ shareId: share.id, shareToken, userId }, "Screen share created")
    return share as ScreenShare
  },

  /**
   * Get share by token (public access, no auth required)
   */
  getShareByToken: async (token: string): Promise<ScreenShare | null> => {
    const share = await prisma.screenShare.findUnique({
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
      logger.warn({ shareToken: token }, "Screen share token expired")
      return null
    }

    // Check if active
    if (!share.isActive) {
      logger.warn({ shareToken: token }, "Screen share token is inactive")
      return null
    }

    return share as ScreenShare
  },

  /**
   * Stop/deactivate a screen share
   */
  stopShare: async (shareToken: string, userId: string): Promise<void> => {
    const share = await prisma.screenShare.findUnique({
      where: { shareToken },
    })

    if (!share) {
      throw new Error("Share not found")
    }

    if (share.sharedBy !== userId) {
      throw new Error("Not authorized to stop this share")
    }

    await prisma.screenShare.update({
      where: { shareToken },
      data: { isActive: false },
    })

    logger.info({ shareToken, userId }, "Screen share stopped")
  },
}
