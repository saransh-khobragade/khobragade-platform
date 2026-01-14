import type { Socket } from "socket.io"
import { jwtService } from "../auth/jwt.service.js"
import type { SocketData } from "./socket.types.js"
import { logger } from "../../lib/logger.js"

/**
 * Authenticate socket connections using JWT
 */
export const socketAuthMiddleware = async (
  socket: Socket<{}, {}, {}, SocketData>,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      return next(new Error("Authentication error: No token provided"))
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
    next(new Error("Authentication error: Invalid token"))
  }
}
