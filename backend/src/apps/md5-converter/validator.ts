import type { MD5ConvertInput } from "./types.js"

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export const md5Validator = {
  validateConvert: (input: unknown): MD5ConvertInput => {
    if (!input || typeof input !== "object") {
      throw new ValidationError("Input must be an object")
    }

    const { text } = input as { text?: unknown }

    if (!text || typeof text !== "string") {
      throw new ValidationError("Text is required and must be a string")
    }

    return { text }
  },
}



