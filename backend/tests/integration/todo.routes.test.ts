import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../src/db/index.js", () => {
  return {
    default: {
      todo: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
    },
  }
})

import prisma from "../../src/db/index.js"
import todoRouter from "../../src/apps/todo/routes.js"

const prismaMock = prisma as unknown as {
  todo: {
    findMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
}

const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use("/api/todos", todoRouter)
  return app
}

describe("Todo routes integration (mocked database)", () => {
  beforeEach(() => {
    prismaMock.todo.findMany.mockReset()
    prismaMock.todo.create.mockReset()
    prismaMock.todo.update.mockReset()
    prismaMock.todo.delete.mockReset()
    prismaMock.todo.count.mockReset()
  })

  it("GET /api/todos returns todo list", async () => {
    const todos = [
      {
        id: "todo-1",
        text: "Pay electricity bill",
        completed: false,
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
      },
    ]
    prismaMock.todo.findMany.mockResolvedValue(todos)

    const app = createTestApp()
    const response = await request(app).get("/api/todos")

    expect(response.status).toBe(200)
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "todo-1",
          text: "Pay electricity bill",
          completed: false,
        }),
      ])
    )
    expect(prismaMock.todo.findMany).toHaveBeenCalledTimes(1)
  })

  it("POST /api/todos creates a todo", async () => {
    prismaMock.todo.create.mockResolvedValue({
      id: "todo-2",
      text: "File tax return",
      completed: false,
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      updatedAt: new Date("2025-01-01T00:00:00.000Z"),
    })

    const app = createTestApp()
    const response = await request(app)
      .post("/api/todos")
      .send({ text: "File tax return" })

    expect(response.status).toBe(201)
    expect(response.body).toEqual(
      expect.objectContaining({
        id: "todo-2",
        text: "File tax return",
        completed: false,
      })
    )
    expect(prismaMock.todo.create).toHaveBeenCalledTimes(1)
  })

  it("POST /api/todos returns 400 for invalid payload", async () => {
    const app = createTestApp()
    const response = await request(app).post("/api/todos").send({ text: "" })

    expect(response.status).toBe(400)
    expect(response.body).toEqual(
      expect.objectContaining({
        error: "Text is required and must be a non-empty string",
      })
    )
    expect(prismaMock.todo.create).not.toHaveBeenCalled()
  })

  it("PATCH /api/todos/:id returns 404 when todo does not exist", async () => {
    prismaMock.todo.count.mockResolvedValue(0)

    const app = createTestApp()
    const response = await request(app)
      .patch("/api/todos/missing-id")
      .send({ completed: true })

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: "Todo not found" })
    expect(prismaMock.todo.update).not.toHaveBeenCalled()
  })

  it("DELETE /api/todos/:id returns 204 when todo exists", async () => {
    prismaMock.todo.count.mockResolvedValue(1)
    prismaMock.todo.delete.mockResolvedValue(undefined)

    const app = createTestApp()
    const response = await request(app).delete("/api/todos/todo-3")

    expect(response.status).toBe(204)
    expect(prismaMock.todo.delete).toHaveBeenCalledWith({
      where: { id: "todo-3" },
    })
  })
})
