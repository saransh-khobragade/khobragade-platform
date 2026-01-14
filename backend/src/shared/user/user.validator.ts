import type { CreateUserInput, UpdateUserInput, LoginInput } from "./user.types.js"

export const userValidator = {
  /**
   * Validate user registration input
   */
  validateCreate: (input: unknown): CreateUserInput => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input")
    }

    const { email, username, password, name } = input as Record<string, unknown>

    if (!email || typeof email !== "string" || !email.includes("@")) {
      throw new Error("Valid email is required")
    }

    if (!username || typeof username !== "string" || username.length < 3) {
      throw new Error("Username must be at least 3 characters")
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      throw new Error("Password must be at least 6 characters")
    }

    return {
      email: email.trim(),
      username: username.trim(),
      password,
      name: name && typeof name === "string" ? name.trim() : undefined,
    }
  },

  /**
   * Validate user update input
   */
  validateUpdate: (input: unknown): UpdateUserInput => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input")
    }

    const { name, avatar } = input as Record<string, unknown>

    const updateData: UpdateUserInput = {}

    if (name !== undefined) {
      if (typeof name !== "string") {
        throw new Error("Name must be a string")
      }
      updateData.name = name.trim() || undefined
    }

    if (avatar !== undefined) {
      if (typeof avatar !== "string") {
        throw new Error("Avatar must be a string")
      }
      updateData.avatar = avatar
    }

    return updateData
  },

  /**
   * Validate login input
   */
  validateLogin: (input: unknown): LoginInput => {
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input")
    }

    const { email, password } = input as Record<string, unknown>

    if (!email || typeof email !== "string") {
      throw new Error("Email is required")
    }

    if (!password || typeof password !== "string") {
      throw new Error("Password is required")
    }

    return {
      email: email.trim(),
      password,
    }
  },
}
