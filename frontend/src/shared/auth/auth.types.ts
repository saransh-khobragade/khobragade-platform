export interface User {
  id: string
  email: string
  username: string
  name: string | null
  avatar: string | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: User
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  username: string
  password: string
  name?: string
}
