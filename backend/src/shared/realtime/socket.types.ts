export interface SocketUser {
  userId: string
  email: string
  username: string
}

export interface SocketData {
  user?: SocketUser
}
