import type { Socket } from "socket.io"
import { jwtService } from "../auth/jwt.service.js"
import type { SocketData } from "./socket.types.js"
import { logger } from "../../lib/logger.js"

/**
 * Authenticate socket connections using JWT
 * Allows unauthenticated connections (for file sharing receivers)
 */
export const socketAuthMiddleware = async (
  socket: Socket<{}, {}, {}, SocketData>,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      // Allow unauthenticated connections (for file sharing receivers)
      // They will be validated in the specific handler
      logger.info("Socket connected without authentication (may be file sharing receiver)")
      socket.data.user = undefined
      return next()
    }

    const payload = jwtService.verifyAccessToken(token)

    // Attach user info to socket data
    socket.data.user = {
      userId: payload.userId,
      email: payload.email,
      username: payload.username,
    }

    logger.info({ userId: payload.userId }, "Socket authenticated")
    next()
  } catch (error) {
    logger.error({ error }, "Socket authentication failed")
    // Allow connection but mark as unauthenticated
    socket.data.user = undefined
    next()
  }
}
