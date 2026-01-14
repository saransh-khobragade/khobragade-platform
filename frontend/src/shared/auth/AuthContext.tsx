import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authApi } from "./auth.api"
import { getAuthToken } from "@/lib/api/client"
import type { User, LoginInput, RegisterInput } from "./auth.types"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const token = getAuthToken()
      if (token) {
        const userData = await authApi.getMe()
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = async (input: LoginInput) => {
    const data = await authApi.login(input)
    setUser(data.user)
  }

  const register = async (input: RegisterInput) => {
    const data = await authApi.register(input)
    setUser(data.user)
  }

  const logout = () => {
    authApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
