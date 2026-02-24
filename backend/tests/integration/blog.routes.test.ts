import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  getAllPostsMock,
  getPostByIdMock,
  createPostMock,
  toggleLikeMock,
} = vi.hoisted(() => ({
  getAllPostsMock: vi.fn(),
  getPostByIdMock: vi.fn(),
  createPostMock: vi.fn(),
  toggleLikeMock: vi.fn(),
}))

vi.mock("../../src/shared/auth/auth.middleware.js", () => ({
  authMiddleware: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
    req.user = { userId: "user-1", email: "u1@test.com", username: "u1" }
    next()
  },
}))

vi.mock("../../src/apps/blog/service.js", () => ({
  blogService: {
    getAllPosts: getAllPostsMock,
    getPostById: getPostByIdMock,
    createPost: createPostMock,
    toggleLike: toggleLikeMock,
    updatePost: vi.fn(),
    deletePost: vi.fn(),
    addComment: vi.fn(),
    deleteComment: vi.fn(),
  },
}))

import blogRouter from "../../src/apps/blog/routes.js"

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/blog", blogRouter)
  return app
}

describe("Blog routes integration", () => {
  beforeEach(() => {
    getAllPostsMock.mockReset()
    getPostByIdMock.mockReset()
    createPostMock.mockReset()
    toggleLikeMock.mockReset()
  })

  it("GET /api/blog/posts returns posts", async () => {
    getAllPostsMock.mockResolvedValue([{ id: "p1", title: "t1", content: "c1" }])
    const app = createTestApp()
    const response = await request(app).get("/api/blog/posts")
    expect(response.status).toBe(200)
    expect(response.body).toEqual([{ id: "p1", title: "t1", content: "c1" }])
  })

  it("GET /api/blog/posts/:id returns 404 when missing", async () => {
    getPostByIdMock.mockResolvedValue(null)
    const app = createTestApp()
    const response = await request(app).get("/api/blog/posts/missing")
    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: "Post not found" })
  })

  it("POST /api/blog/posts validates title/content", async () => {
    const app = createTestApp()
    const response = await request(app).post("/api/blog/posts").send({ title: "", content: "" })
    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: "Title and content are required and cannot be empty" })
  })

  it("POST /api/blog/posts creates post", async () => {
    createPostMock.mockResolvedValue({ id: "p2", title: "Hello", content: "World" })
    const app = createTestApp()
    const response = await request(app).post("/api/blog/posts").send({ title: "Hello", content: "World" })
    expect(response.status).toBe(201)
    expect(response.body).toEqual({ id: "p2", title: "Hello", content: "World" })
  })
})
