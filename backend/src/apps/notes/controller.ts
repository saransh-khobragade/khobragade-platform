import { Request, Response } from "express"
import { logger } from "../../lib/logger.js"
import { noteService } from "./service.js"
import { noteValidator, ValidationError } from "./validator.js"

export const noteController = {
  // Create a new note
  create: async (req: Request, res: Response) => {
    try {
      const validatedInput = noteValidator.validateCreate(req.body)
      const note = await noteService.create(validatedInput)
      res.status(201).json(note)
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: error.message,
        })
      }
      logger.error({ error }, "Failed to create note")
      res.status(500).json({
        error: "Failed to create note",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },

  // Get note by shareId
  getByShareId: async (req: Request<{ shareId: string }>, res: Response) => {
    const { shareId } = req.params
    try {
      const note = await noteService.getByShareId(shareId)
      
      if (!note) {
        return res.status(404).json({
          error: "Note not found",
        })
      }

      res.json(note)
    } catch (error) {
      logger.error({ error, shareId }, "Failed to fetch note")
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      res.status(500).json({
        error: "Failed to fetch note",
        message: errorMessage,
      })
    }
  },

  // Update note by shareId
  update: async (req: Request<{ shareId: string }>, res: Response) => {
    const { shareId } = req.params
    try {
      const validatedInput = noteValidator.validateUpdate(req.body)
      
      const exists = await noteService.exists(shareId)
      if (!exists) {
        return res.status(404).json({
          error: "Note not found",
        })
      }

      const note = await noteService.update(shareId, validatedInput)
      res.json(note)
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: error.message,
        })
      }
      logger.error({ error, shareId }, "Failed to update note")
      res.status(500).json({
        error: "Failed to update note",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },

  // Delete note by shareId
  delete: async (req: Request<{ shareId: string }>, res: Response) => {
    const { shareId } = req.params
    try {
      const exists = await noteService.exists(shareId)
      if (!exists) {
        return res.status(404).json({
          error: "Note not found",
        })
      }

      await noteService.delete(shareId)
      res.status(204).send()
    } catch (error) {
      logger.error({ error, shareId }, "Failed to delete note")
      res.status(500).json({
        error: "Failed to delete note",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },
}

