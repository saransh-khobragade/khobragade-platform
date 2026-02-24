import express from "express"
import request from "supertest"
import { describe, expect, it } from "vitest"
import chatRouter from "../../src/apps/chat/routes.js"
import blogRouter from "../../src/apps/blog/routes.js"
import instagramRouter from "../../src/apps/instagram/routes.js"
import fileSharingRouter from "../../src/apps/file-sharing/routes.js"
import { videoChatRouter } from "../../src/apps/video-chat/routes.js"
import { screenSharingRouter } from "../../src/apps/screen-sharing/routes.js"
import userRouter from "../../src/shared/user/user.routes.js"

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/chat", chatRouter)
  app.use("/api/blog", blogRouter)
  app.use("/api/instagram", instagramRouter)
  app.use("/api/file-sharing", fileSharingRouter)
  app.use("/api/video-chat", videoChatRouter)
  app.use("/api/screen-sharing", screenSharingRouter)
  app.use("/api/users", userRouter)
  return app
}

describe("Protected routes auth integration", () => {
  it("rejects unauthenticated chat access", async () => {
    const app = createTestApp()
    const response = await request(app).get("/api/chat/conversations")
    expect(response.status).toBe(401)
  })

  it("rejects unauthenticated blog write", async () => {
    const app = createTestApp()
    const response = await request(app)
      .post("/api/blog/posts")
      .send({ title: "A", content: "B" })
    expect(response.status).toBe(401)
  })

  it("rejects unauthenticated instagram write", async () => {
    const app = createTestApp()
    const response = await request(app)
      .post("/api/instagram/posts")
      .send({ imageUrl: "https://example.com/a.png", caption: "caption" })
    expect(response.status).toBe(401)
  })

  it("rejects unauthenticated file sharing create", async () => {
    const app = createTestApp()
    const response = await request(app)
      .post("/api/file-sharing/create-share")
      .send({ fileName: "a.txt", fileSize: 10, mimeType: "text/plain" })
    expect(response.status).toBe(401)
  })

  it("rejects unauthenticated video chat create", async () => {
    const app = createTestApp()
    const response = await request(app).post("/api/video-chat/create").send({ name: "room-1" })
    expect(response.status).toBe(401)
  })

  it("rejects unauthenticated screen sharing create", async () => {
    const app = createTestApp()
    const response = await request(app).post("/api/screen-sharing/create").send({})
    expect(response.status).toBe(401)
  })

  it("rejects unauthenticated user profile access", async () => {
    const app = createTestApp()
    const response = await request(app).get("/api/users/me")
    expect(response.status).toBe(401)
  })
})
