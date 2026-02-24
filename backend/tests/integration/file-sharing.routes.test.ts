import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  getShareByTokenMock,
  createShareMock,
} = vi.hoisted(() => ({
  getShareByTokenMock: vi.fn(),
  createShareMock: vi.fn(),
}))

vi.mock("../../src/shared/auth/auth.middleware.js", () => ({
  authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { userId: "user-1", email: "u1@test.com", username: "u1" }
    next()
  },
}))

vi.mock("../../src/apps/file-sharing/service.js", () => ({
  fileSharingService: {
    getShareByToken: getShareByTokenMock,
    createShare: createShareMock,
    getSharesByUser: vi.fn(),
    deleteShare: vi.fn(),
    deactivateShare: vi.fn(),
  },
}))

import fileSharingRouter from "../../src/apps/file-sharing/routes.js"

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/file-sharing", fileSharingRouter)
  return app
}

describe("File sharing routes integration", () => {
  beforeEach(() => {
    getShareByTokenMock.mockReset()
    createShareMock.mockReset()
  })

  it("GET /api/file-sharing/share/:token returns 404 when share missing", async () => {
    getShareByTokenMock.mockResolvedValue(null)
    const app = createTestApp()
    const response = await request(app).get("/api/file-sharing/share/missing")
    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: "Share not found or expired" })
  })

  it("GET /api/file-sharing/share/:token returns share payload", async () => {
    getShareByTokenMock.mockResolvedValue({
      shareToken: "tok-1",
      fileName: "statement.pdf",
      fileSize: 1024,
      mimeType: "application/pdf",
      sharer: { id: "user-1", username: "u1" },
      isActive: true,
      expiresAt: null,
    })
    const app = createTestApp()
    const response = await request(app).get("/api/file-sharing/share/tok-1")
    expect(response.status).toBe(200)
    expect(response.body).toEqual(
      expect.objectContaining({
        shareToken: "tok-1",
        fileName: "statement.pdf",
      })
    )
  })

  it("POST /api/file-sharing/create-share validates required fields", async () => {
    const app = createTestApp()
    const response = await request(app).post("/api/file-sharing/create-share").send({ fileName: "a.txt" })
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: "fileName, fileSize, and mimeType are required" })
  })

  it("POST /api/file-sharing/create-share creates share", async () => {
    createShareMock.mockResolvedValue({ shareToken: "tok-2" })
    const app = createTestApp()
    const response = await request(app)
      .post("/api/file-sharing/create-share")
      .send({ fileName: "a.txt", fileSize: 12, mimeType: "text/plain" })
    expect(response.status).toBe(201)
    expect(response.body).toEqual({ shareToken: "tok-2" })
  })
})
