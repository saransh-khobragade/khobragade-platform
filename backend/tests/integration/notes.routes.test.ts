import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../src/db/index.js", () => {
  return {
    default: {
      note: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
    },
  }
})

import prisma from "../../src/db/index.js"
import notesRouter from "../../src/apps/notes/routes.js"

const prismaMock = prisma as unknown as {
  note: {
    findUnique: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
}

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/notes", notesRouter)
  return app
}

describe("Notes routes integration (mocked database)", () => {
  beforeEach(() => {
    prismaMock.note.findUnique.mockReset()
    prismaMock.note.create.mockReset()
    prismaMock.note.update.mockReset()
    prismaMock.note.delete.mockReset()
    prismaMock.note.count.mockReset()
  })

  it("POST /api/notes creates a note", async () => {
    prismaMock.note.findUnique.mockResolvedValue(null)
    prismaMock.note.create.mockResolvedValue({
      id: "note-1",
      title: "Tax Notes",
      content: "Track FY entries",
      shareId: "abc12345",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    })

    const app = createTestApp()
    const response = await request(app)
      .post("/api/notes")
      .send({ title: "Tax Notes", content: "Track FY entries" })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(
      expect.objectContaining({
        id: "note-1",
        title: "Tax Notes",
        content: "Track FY entries",
        shareId: "abc12345",
      })
    )
  })

  it("GET /api/notes/:shareId returns 404 for missing note", async () => {
    prismaMock.note.findUnique.mockResolvedValue(null)

    const app = createTestApp()
    const response = await request(app).get("/api/notes/missing-share")

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: "Note not found" })
  })

  it("PATCH /api/notes/:shareId updates existing note", async () => {
    prismaMock.note.count.mockResolvedValue(1)
    prismaMock.note.update.mockResolvedValue({
      id: "note-2",
      title: "Updated title",
      content: "Updated content",
      shareId: "share-222",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      updatedAt: new Date("2025-01-02T00:00:00.000Z"),
    })

    const app = createTestApp()
    const response = await request(app)
      .patch("/api/notes/share-222")
      .send({ title: "Updated title", content: "Updated content" })

    expect(response.status).toBe(200)
    expect(response.body).toEqual(
      expect.objectContaining({
        shareId: "share-222",
        title: "Updated title",
      })
    )
  })

  it("DELETE /api/notes/:shareId returns 204 for existing note", async () => {
    prismaMock.note.count.mockResolvedValue(1)
    prismaMock.note.delete.mockResolvedValue(undefined)

    const app = createTestApp()
    const response = await request(app).delete("/api/notes/share-333")

    expect(response.status).toBe(204)
    expect(prismaMock.note.delete).toHaveBeenCalledWith({
      where: { shareId: "share-333" },
    })
  })
})
