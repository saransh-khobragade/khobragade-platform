import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  createRoomMock,
  getRoomByIdMock,
} = vi.hoisted(() => ({
  createRoomMock: vi.fn(),
  getRoomByIdMock: vi.fn(),
}))

vi.mock("../../src/shared/auth/auth.middleware.js", () => ({
  authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { userId: "user-1", email: "u1@test.com", username: "u1" }
    next()
  },
}))

vi.mock("../../src/apps/video-chat/service.js", () => ({
  videoChatService: {
    createRoom: createRoomMock,
    getRoomById: getRoomByIdMock,
    getActiveRooms: vi.fn().mockResolvedValue([]),
    getUserRooms: vi.fn().mockResolvedValue([]),
    deactivateRoom: vi.fn(),
  },
}))

import { videoChatRouter } from "../../src/apps/video-chat/routes.js"

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/video-chat", videoChatRouter)
  return app
}

describe("Video chat routes integration", () => {
  beforeEach(() => {
    createRoomMock.mockReset()
    getRoomByIdMock.mockReset()
  })

  it("POST /api/video-chat/create validates room name", async () => {
    const app = createTestApp()
    const response = await request(app).post("/api/video-chat/create").send({ name: "" })
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: "Room name is required" })
  })

  it("POST /api/video-chat/create creates room", async () => {
    createRoomMock.mockResolvedValue({ id: "room-1", name: "Daily sync" })
    const app = createTestApp()
    const response = await request(app).post("/api/video-chat/create").send({ name: "Daily sync" })
    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: "room-1", name: "Daily sync" })
  })

  it("GET /api/video-chat/:roomId returns 404 when room inactive", async () => {
    getRoomByIdMock.mockResolvedValue({ id: "room-2", isActive: false })
    const app = createTestApp()
    const response = await request(app).get("/api/video-chat/room-2")
    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: "Room is not active" })
  })
})
