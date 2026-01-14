import jwt from "jsonwebtoken"
import type { JWTPayload, TokenPair } from "./auth.types.js"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key-change-in-production"
const ACCESS_TOKEN_EXPIRY = "15m"
const REFRESH_TOKEN_EXPIRY = "7d"

export const jwtService = {
  /**
   * Generate access and refresh tokens
   */
  generateTokens: (payload: JWTPayload): TokenPair => {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    })

    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    })

    return { accessToken, refreshToken }
  },

  /**
   * Verify access token
   */
  verifyAccessToken: (token: string): JWTPayload => {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      throw new Error("Invalid or expired access token")
    }
  },

  /**
   * Verify refresh token
   */
  verifyRefreshToken: (token: string): JWTPayload => {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
    } catch (error) {
      throw new Error("Invalid or expired refresh token")
    }
  },

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken: (refreshToken: string): string => {
    const payload = jwtService.verifyRefreshToken(refreshToken)
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    })
  },
}
