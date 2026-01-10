import type { CreateNoteInput, UpdateNoteInput } from "./types.js"
import { ValidationError } from "../todo/validator.js"

export { ValidationError }

export const noteValidator = {
  validateCreate: (input: unknown): CreateNoteInput => {
    if (!input || typeof input !== "object") {
      throw new ValidationError("Input must be an object")
    }

    const { content, title } = input as { content?: unknown; title?: unknown }

    if (!content || typeof content !== "string" || content.trim() === "") {
      throw new ValidationError("Content is required and must be a non-empty string")
    }

    const result: CreateNoteInput = { content }

    if (title !== undefined) {
      if (typeof title !== "string") {
        throw new ValidationError("Title must be a string")
      }
      result.title = title
    }

    return result
  },

  validateUpdate: (input: unknown): UpdateNoteInput => {
    if (!input || typeof input !== "object") {
      throw new ValidationError("Input must be an object")
    }

    const { content, title } = input as { content?: unknown; title?: unknown }
    const updateData: UpdateNoteInput = {}

    if (content !== undefined) {
      if (typeof content !== "string" || content.trim() === "") {
        throw new ValidationError("Content must be a non-empty string")
      }
      updateData.content = content
    }

    if (title !== undefined) {
      if (typeof title !== "string") {
        throw new ValidationError("Title must be a string")
      }
      updateData.title = title
    }

    return updateData
  },
}

