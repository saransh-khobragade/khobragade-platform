import type { Request, Response, NextFunction } from "express"
import { jwtService } from "./jwt.service.js"
import { logger } from "../../lib/logger.js"

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
        username: string
      }
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" })
      return
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix
    const payload = jwtService.verifyAccessToken(token)

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
    }

    next()
  } catch (error) {
    logger.error({ error }, "Authentication failed")
    res.status(401).json({ error: "Invalid or expired token" })
  }
}
