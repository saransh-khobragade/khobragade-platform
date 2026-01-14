export interface CreateUserInput {
  email: string
  username: string
  password: string
  name?: string
}

export interface UpdateUserInput {
  name?: string
  avatar?: string
}

export interface User {
  id: string
  email: string
  username: string
  name: string | null
  avatar: string | null
  createdAt: Date
  updatedAt: Date
}

export interface LoginInput {
  email: string
  password: string
}
