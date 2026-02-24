import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  createShareMock,
  getShareByTokenMock,
  stopShareMock,
} = vi.hoisted(() => ({
  createShareMock: vi.fn(),
  getShareByTokenMock: vi.fn(),
  stopShareMock: vi.fn(),
}))

vi.mock("../../src/shared/auth/auth.middleware.js", () => ({
  authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { userId: "user-1", email: "u1@test.com", username: "u1" }
    next()
  },
}))

vi.mock("../../src/apps/screen-sharing/service.js", () => ({
  screenSharingService: {
    createShare: createShareMock,
    getShareByToken: getShareByTokenMock,
    stopShare: stopShareMock,
  },
}))

import { screenSharingRouter } from "../../src/apps/screen-sharing/routes.js"

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/screen-sharing", screenSharingRouter)
  return app
}

describe("Screen sharing routes integration", () => {
  beforeEach(() => {
    createShareMock.mockReset()
    getShareByTokenMock.mockReset()
    stopShareMock.mockReset()
  })

  it("GET /api/screen-sharing/:token returns 404 when share missing", async () => {
    getShareByTokenMock.mockResolvedValue(null)
    const app = createTestApp()
    const response = await request(app).get("/api/screen-sharing/missing-token")
    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: "Screen share not found or expired" })
  })

  it("POST /api/screen-sharing/create creates share", async () => {
    createShareMock.mockResolvedValue({ shareToken: "share-1" })
    const app = createTestApp()
    const response = await request(app).post("/api/screen-sharing/create").send({})
    expect(response.status).toBe(201)
    expect(response.body).toEqual({ shareToken: "share-1" })
  })

  it("POST /api/screen-sharing/:token/stop maps authorization errors to 403", async () => {
    stopShareMock.mockRejectedValue(new Error("Not authorized to stop this share"))
    const app = createTestApp()
    const response = await request(app).post("/api/screen-sharing/share-1/stop").send({})
    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: "Not authorized to stop this share" })
  })
})
