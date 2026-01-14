import { apiRequest, setAuthTokens, clearAuthTokens } from "@/lib/api/client"
import type { AuthTokens, LoginInput, RegisterInput, User } from "./auth.types"

export const authApi = {
  /**
   * Register a new user
   */
  register: async (input: RegisterInput): Promise<AuthTokens> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Registration failed" }))
      throw new Error(error.error || "Registration failed")
    }

    const data: AuthTokens = await response.json()
    setAuthTokens(data.accessToken, data.refreshToken)
    return data
  },

  /**
   * Login user
   */
  login: async (input: LoginInput): Promise<AuthTokens> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Login failed" }))
      throw new Error(error.error || "Login failed")
    }

    const data: AuthTokens = await response.json()
    setAuthTokens(data.accessToken, data.refreshToken)
    return data
  },

  /**
   * Get current user
   */
  getMe: async (): Promise<User> => {
    return apiRequest<User>("/api/users/me")
  },

  /**
   * Logout (clear tokens)
   */
  logout: (): void => {
    clearAuthTokens()
  },
}
