import type { Request, Response } from "express"
import { userService } from "./user.service.js"
import { userValidator } from "./user.validator.js"
import { jwtService } from "../auth/jwt.service.js"
import { logger } from "../../lib/logger.js"

export const userController = {
  /**
   * Register a new user
   */
  register: async (req: Request, res: Response): Promise<void> => {
    try {
      const input = userValidator.validateCreate(req.body)
      const user = await userService.create(input)

      // Generate tokens
      const tokens = jwtService.generateTokens({
        userId: user.id,
        email: user.email,
        username: user.username,
      })

      res.status(201).json({
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          name: user.name,
          avatar: user.avatar,
        },
      })
    } catch (error) {
      logger.error({ error }, "Registration failed")
      const message = error instanceof Error ? error.message : "Registration failed"
      res.status(400).json({ error: message })
    }
  },

  /**
   * Login user
   */
  login: async (req: Request, res: Response): Promise<void> => {
    try {
      const input = userValidator.validateLogin(req.body)
      const result = await userService.login(input)

      res.json(result)
    } catch (error) {
      logger.error({ error }, "Login failed")
      const message = error instanceof Error ? error.message : "Invalid email or password"
      res.status(401).json({ error: message })
    }
  },

  /**
   * Refresh access token
   */
  refresh: async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body

      if (!refreshToken || typeof refreshToken !== "string") {
        res.status(400).json({ error: "Refresh token is required" })
        return
      }

      const accessToken = jwtService.refreshAccessToken(refreshToken)

      res.json({ accessToken })
    } catch (error) {
      logger.error({ error }, "Token refresh failed")
      res.status(401).json({ error: "Invalid or expired refresh token" })
    }
  },

  /**
   * Get current user
   */
  getMe: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }

      const user = await userService.getById(req.user.userId)

      if (!user) {
        res.status(404).json({ error: "User not found" })
        return
      }

      res.json(user)
    } catch (error) {
      logger.error({ error }, "Get user failed")
      res.status(500).json({ error: "Failed to get user" })
    }
  },

  /**
   * Update current user
   */
  updateMe: async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" })
        return
      }

      const input = userValidator.validateUpdate(req.body)
      const user = await userService.update(req.user.userId, input)

      res.json(user)
    } catch (error) {
      logger.error({ error }, "Update user failed")
      const message = error instanceof Error ? error.message : "Update failed"
      res.status(400).json({ error: message })
    }
  },
}
