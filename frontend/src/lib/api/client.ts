export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

const getAuthToken = (): string | null => {
  return localStorage.getItem("accessToken")
}

const getRefreshToken = (): string | null => {
  return localStorage.getItem("refreshToken")
}

const setAuthTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem("accessToken", accessToken)
  localStorage.setItem("refreshToken", refreshToken)
}

const clearAuthTokens = (): void => {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
}

/**
 * Make an authenticated API request
 */
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken()
  const url = `${API_BASE_URL}${endpoint}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response = await fetch(url, {
    ...options,
    headers,
  })

  // If 401, try to refresh token
  if (response.status === 401 && token) {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        })

        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setAuthTokens(data.accessToken, refreshToken)

          // Retry original request with new token
          headers.Authorization = `Bearer ${data.accessToken}`
          response = await fetch(url, {
            ...options,
            headers,
          })
        } else {
          // Refresh failed, clear tokens and throw error
          clearAuthTokens()
          throw new Error("Session expired. Please login again.")
        }
      } catch (error) {
        clearAuthTokens()
        throw error
      }
    } else {
      clearAuthTokens()
      throw new Error("Session expired. Please login again.")
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }))
    throw new Error(error.error || "Request failed")
  }

  return response.json()
}

export { getAuthToken, getRefreshToken, setAuthTokens, clearAuthTokens }
