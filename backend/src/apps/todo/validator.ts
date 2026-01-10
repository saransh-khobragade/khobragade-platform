import type { CreateTodoInput, UpdateTodoInput } from "./types.js"

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export const todoValidator = {
  validateCreate: (input: unknown): CreateTodoInput => {
    if (!input || typeof input !== "object") {
      throw new ValidationError("Input must be an object")
    }

    const { text } = input as { text?: unknown }

    if (!text || typeof text !== "string" || text.trim() === "") {
      throw new ValidationError("Text is required and must be a non-empty string")
    }

    return { text }
  },

  validateUpdate: (input: unknown): UpdateTodoInput => {
    if (!input || typeof input !== "object") {
      throw new ValidationError("Input must be an object")
    }

    const { completed, text } = input as {
      completed?: unknown
      text?: unknown
    }

    const updateData: UpdateTodoInput = {}

    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        throw new ValidationError("Completed must be a boolean")
      }
      updateData.completed = completed
    }

    if (text !== undefined) {
      if (typeof text !== "string" || text.trim() === "") {
        throw new ValidationError("Text must be a non-empty string")
      }
      updateData.text = text
    }

    return updateData
  },
}



