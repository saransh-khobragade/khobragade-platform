import prisma from "../../db/index.js"
import { passwordService } from "../auth/password.service.js"
import { jwtService } from "../auth/jwt.service.js"
import { logger } from "../../lib/logger.js"
import type { CreateUserInput, UpdateUserInput, User, LoginInput } from "./user.types.js"
import type { AuthTokens } from "../auth/auth.types.js"

export const userService = {
  /**
   * Create a new user
   */
  create: async (input: CreateUserInput): Promise<User> => {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    })

    if (existingUser) {
      if (existingUser.email === input.email) {
        throw new Error("Email already registered")
      }
      if (existingUser.username === input.username) {
        throw new Error("Username already taken")
      }
    }

    // Hash password
    const hashedPassword = await passwordService.hash(input.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        username: input.username.trim(),
        password: hashedPassword,
        name: input.name?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    logger.info({ userId: user.id, email: user.email }, "User created")
    return user
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },

  /**
   * Get user by email
   */
  getByEmail: async (email: string): Promise<User | null> => {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },

  /**
   * Get user with password (for login)
   */
  getByEmailWithPassword: async (email: string) => {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })
  },

  /**
   * Update user
   */
  update: async (id: string, input: UpdateUserInput): Promise<User> => {
    const updateData: { name?: string; avatar?: string } = {}

    if (input.name !== undefined) {
      updateData.name = input.name.trim() || undefined
    }

    if (input.avatar !== undefined) {
      updateData.avatar = input.avatar
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    logger.info({ userId: id, updates: updateData }, "User updated")
    return user
  },

  /**
   * Login user
   */
  login: async (input: LoginInput): Promise<AuthTokens> => {
    const user = await userService.getByEmailWithPassword(input.email)

    if (!user) {
      throw new Error("Invalid email or password")
    }

    // Verify password
    const isValid = await passwordService.verify(input.password, user.password)
    if (!isValid) {
      throw new Error("Invalid email or password")
    }

    // Generate tokens
    const tokens = jwtService.generateTokens({
      userId: user.id,
      email: user.email,
      username: user.username,
    })

    logger.info({ userId: user.id, email: user.email }, "User logged in")

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      },
    }
  },
}
