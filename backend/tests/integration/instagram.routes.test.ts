import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  getAllPostsMock,
  createPostMock,
} = vi.hoisted(() => ({
  getAllPostsMock: vi.fn(),
  createPostMock: vi.fn(),
}))

vi.mock("../../src/shared/auth/auth.middleware.js", () => ({
  authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { userId: "user-1", email: "u1@test.com", username: "u1" }
    next()
  },
}))

vi.mock("../../src/apps/instagram/service.js", () => ({
  instagramService: {
    getAllPosts: getAllPostsMock,
    createPost: createPostMock,
    getPostById: vi.fn(),
    getPostsByUserId: vi.fn(),
    updatePost: vi.fn(),
    deletePost: vi.fn(),
    addComment: vi.fn(),
    deleteComment: vi.fn(),
    toggleLike: vi.fn(),
  },
}))

import instagramRouter from "../../src/apps/instagram/routes.js"

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/instagram", instagramRouter)
  return app
}

describe("Instagram routes integration", () => {
  beforeEach(() => {
    getAllPostsMock.mockReset()
    createPostMock.mockReset()
  })

  it("GET /api/instagram/posts returns posts", async () => {
    getAllPostsMock.mockResolvedValue([{ id: "i1", imageUrl: "https://x/y.png", caption: "c1" }])
    const app = createTestApp()
    const response = await request(app).get("/api/instagram/posts")
    expect(response.status).toBe(200)
    expect(response.body).toEqual([{ id: "i1", imageUrl: "https://x/y.png", caption: "c1" }])
  })

  it("POST /api/instagram/posts validates imageUrl", async () => {
    const app = createTestApp()
    const response = await request(app).post("/api/instagram/posts").send({ caption: "No image" })
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: "Image URL is required" })
  })

  it("POST /api/instagram/posts creates post", async () => {
    createPostMock.mockResolvedValue({ id: "i2", imageUrl: "https://x/z.png", caption: "cap" })
    const app = createTestApp()
    const response = await request(app).post("/api/instagram/posts").send({ imageUrl: "https://x/z.png", caption: "cap" })
    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: "i2", imageUrl: "https://x/z.png", caption: "cap" })
  })
})
