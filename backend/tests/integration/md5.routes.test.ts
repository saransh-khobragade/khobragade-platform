import express from "express"
import request from "supertest"
import { describe, expect, it } from "vitest"
import md5Router from "../../src/apps/md5-converter/routes.js"

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/md5", md5Router)
  return app
}

describe("MD5 routes integration", () => {
  it("POST /api/md5 returns hash for valid text", async () => {
    const app = createTestApp()
    const response = await request(app).post("/api/md5").send({ text: "hello" })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      hash: "5d41402abc4b2a76b9719d911017c592",
    })
  })

  it("POST /api/md5 returns 400 for invalid payload", async () => {
    const app = createTestApp()
    const response = await request(app).post("/api/md5").send({ text: "" })

    expect(response.status).toBe(400)
    expect(response.body).toEqual(
      expect.objectContaining({
        error: expect.any(String),
      })
    )
  })
})
