import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  getOrCreateConversationMock,
  getConversationsMock,
  sendMessageMock,
  getMessagesMock,
  markAsReadMock,
  getOnlineUserIdsMock,
  getUserByIdMock,
} = vi.hoisted(() => ({
  getOrCreateConversationMock: vi.fn(),
  getConversationsMock: vi.fn(),
  sendMessageMock: vi.fn(),
  getMessagesMock: vi.fn(),
  markAsReadMock: vi.fn(),
  getOnlineUserIdsMock: vi.fn(),
  getUserByIdMock: vi.fn(),
}))

vi.mock("../../src/shared/auth/auth.middleware.js", () => ({
  authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { userId: "user-1", email: "u1@test.com", username: "u1" }
    next()
  },
}))

vi.mock("../../src/apps/chat/service.js", () => ({
  chatService: {
    getOrCreateConversation: getOrCreateConversationMock,
    getConversations: getConversationsMock,
    sendMessage: sendMessageMock,
    getMessages: getMessagesMock,
    markAsRead: markAsReadMock,
  },
}))

vi.mock("../../src/shared/realtime/socket.service.js", () => ({
  getOnlineUserIds: getOnlineUserIdsMock,
}))

vi.mock("../../src/shared/user/user.service.js", () => ({
  userService: {
    getById: getUserByIdMock,
  },
}))

import chatRouter from "../../src/apps/chat/routes.js"

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/chat", chatRouter)
  return app
}

describe("Chat routes integration", () => {
  beforeEach(() => {
    getOrCreateConversationMock.mockReset()
    getConversationsMock.mockReset()
    sendMessageMock.mockReset()
    getMessagesMock.mockReset()
    markAsReadMock.mockReset()
    getOnlineUserIdsMock.mockReset()
    getUserByIdMock.mockReset()
  })

  it("POST /api/chat/conversations returns 400 for missing userId2", async () => {
    const app = createTestApp()
    const response = await request(app).post("/api/chat/conversations").send({})
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: "userId2 is required" })
  })

  it("POST /api/chat/conversations returns conversation", async () => {
    getOrCreateConversationMock.mockResolvedValue({ id: "conv-1" })
    const app = createTestApp()
    const response = await request(app).post("/api/chat/conversations").send({ userId2: "user-2" })
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: "conv-1" })
  })

  it("GET /api/chat/conversations/:id/messages fetches and marks as read", async () => {
    getMessagesMock.mockResolvedValue([{ id: "msg-1", content: "hello" }])
    markAsReadMock.mockResolvedValue(undefined)
    const app = createTestApp()
    const response = await request(app).get("/api/chat/conversations/conv-1/messages")
    expect(response.status).toBe(200)
    expect(response.body).toEqual([{ id: "msg-1", content: "hello" }])
    expect(markAsReadMock).toHaveBeenCalledWith("conv-1", "user-1")
  })
})
