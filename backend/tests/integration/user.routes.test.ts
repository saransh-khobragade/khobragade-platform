import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  createUserMock,
  loginMock,
  getByIdMock,
  updateUserMock,
  generateTokensMock,
  refreshAccessTokenMock,
} = vi.hoisted(() => ({
  createUserMock: vi.fn(),
  loginMock: vi.fn(),
  getByIdMock: vi.fn(),
  updateUserMock: vi.fn(),
  generateTokensMock: vi.fn(),
  refreshAccessTokenMock: vi.fn(),
}))

vi.mock("../../src/shared/auth/auth.middleware.js", () => ({
  authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { userId: "user-1", email: "user1@test.com", username: "user1" }
    next()
  },
}))

vi.mock("../../src/shared/user/user.service.js", () => ({
  userService: {
    create: createUserMock,
    login: loginMock,
    getById: getByIdMock,
    update: updateUserMock,
  },
}))

vi.mock("../../src/shared/auth/jwt.service.js", () => ({
  jwtService: {
    generateTokens: generateTokensMock,
    refreshAccessToken: refreshAccessTokenMock,
  },
}))

import userRouter from "../../src/shared/user/user.routes.js"

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/users", userRouter)
  app.use("/api/auth", userRouter)
  return app
}

describe("User/auth routes integration", () => {
  beforeEach(() => {
    createUserMock.mockReset()
    loginMock.mockReset()
    getByIdMock.mockReset()
    updateUserMock.mockReset()
    generateTokensMock.mockReset()
    refreshAccessTokenMock.mockReset()
  })

  it("POST /api/auth/register creates user and returns tokens", async () => {
    createUserMock.mockResolvedValue({
      id: "user-1",
      email: "user1@test.com",
      username: "user1",
      name: null,
      avatar: null,
    })
    generateTokensMock.mockReturnValue({ accessToken: "a", refreshToken: "r" })

    const app = createTestApp()
    const response = await request(app).post("/api/auth/register").send({
      email: "user1@test.com",
      username: "user1",
      password: "secret123",
    })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: "a",
        refreshToken: "r",
      })
    )
  })

  it("POST /api/auth/login returns 401 on invalid credentials", async () => {
    loginMock.mockRejectedValue(new Error("Invalid email or password"))
    const app = createTestApp()
    const response = await request(app).post("/api/auth/login").send({
      email: "user1@test.com",
      password: "wrong",
    })
    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: "Invalid email or password" })
  })

  it("POST /api/auth/refresh returns 400 when token missing", async () => {
    const app = createTestApp()
    const response = await request(app).post("/api/auth/refresh").send({})
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: "Refresh token is required" })
  })

  it("GET /api/users/me returns user profile", async () => {
    getByIdMock.mockResolvedValue({ id: "user-1", email: "user1@test.com", username: "user1" })
    const app = createTestApp()
    const response = await request(app).get("/api/users/me")
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ id: "user-1", email: "user1@test.com", username: "user1" })
  })
})
