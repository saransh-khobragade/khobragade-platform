import prisma from "../../db/index.js"
import { logger } from "../../lib/logger.js"
import type { CreateNoteInput, UpdateNoteInput, Note } from "./types.js"

function generateShareId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const noteService = {
  // Create a new note
  create: async (input: CreateNoteInput): Promise<Note> => {
    let shareId = generateShareId()
    
    // Ensure shareId is unique
    let exists = await prisma.note.findUnique({ where: { shareId } })
    while (exists) {
      shareId = generateShareId()
      exists = await prisma.note.findUnique({ where: { shareId } })
    }

    const note = await prisma.note.create({
      data: {
        content: input.content.trim(),
        title: input.title?.trim() || null,
        shareId,
      },
    })
    
    logger.info({ noteId: note.id, shareId: note.shareId }, "Note created")
    return note
  },

  // Get note by shareId
  getByShareId: async (shareId: string): Promise<Note | null> => {
    const note = await prisma.note.findUnique({
      where: { shareId },
    })
    
    if (note) {
      logger.info({ shareId }, "Note fetched")
    }
    
    return note
  },

  // Update note by shareId
  update: async (shareId: string, input: UpdateNoteInput): Promise<Note> => {
    const updateData: { content?: string; title?: string | null } = {}

    if (input.content !== undefined) {
      updateData.content = input.content.trim()
    }

    if (input.title !== undefined) {
      updateData.title = input.title.trim() || null
    }

    const note = await prisma.note.update({
      where: { shareId },
      data: updateData,
    })

    logger.info({ shareId, updates: updateData }, "Note updated")
    return note
  },

  // Delete note by shareId
  delete: async (shareId: string): Promise<void> => {
    await prisma.note.delete({
      where: { shareId },
    })
    logger.info({ shareId }, "Note deleted")
  },

  // Check if note exists
  exists: async (shareId: string): Promise<boolean> => {
    const count = await prisma.note.count({
      where: { shareId },
    })
    return count > 0
  },
}

