export interface JWTPayload {
  userId: string
  email: string
  username: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthTokens extends TokenPair {
  user: {
    id: string
    email: string
    username: string
    name: string | null
    avatar: string | null
  }
}
