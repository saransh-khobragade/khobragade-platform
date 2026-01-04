import { Router } from "express"
import prisma from "../db/index.js"
import { logger } from "../lib/logger.js"

const router = Router()

// GET /api/todos - Get all todos
router.get("/", async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })
    logger.info({ count: todos.length }, "Todos fetched")
    res.json(todos)
  } catch (error) {
    logger.error({ error }, "Failed to fetch todos")
    res.status(500).json({
      error: "Failed to fetch todos",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

// POST /api/todos - Create a new todo
router.post("/", async (req, res) => {
  try {
    const { text } = req.body

    if (!text || typeof text !== "string" || text.trim() === "") {
      return res.status(400).json({
        error: "Text is required and must be a non-empty string",
      })
    }

    const todo = await prisma.todo.create({
      data: {
        text: text.trim(),
        completed: false,
      },
    })

    logger.info({ todoId: todo.id, text: todo.text }, "Todo created")
    res.status(201).json(todo)
  } catch (error) {
    logger.error({ error }, "Failed to create todo")
    res.status(500).json({
      error: "Failed to create todo",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

// PATCH /api/todos/:id - Update a todo (toggle completed or update text)
router.patch("/:id", async (req, res) => {
  const { id } = req.params
  try {
    const { completed, text } = req.body

    const updateData: { completed?: boolean; text?: string } = {}

    if (typeof completed === "boolean") {
      updateData.completed = completed
    }

    if (text !== undefined) {
      if (typeof text !== "string" || text.trim() === "") {
        return res.status(400).json({
          error: "Text must be a non-empty string",
        })
      }
      updateData.text = text.trim()
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
    })

    logger.info({ todoId: id, updates: updateData }, "Todo updated")
    res.json(todo)
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to update does not exist")) {
      return res.status(404).json({
        error: "Todo not found",
      })
    }
    logger.error({ error, id }, "Failed to update todo")
    res.status(500).json({
      error: "Failed to update todo",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

// DELETE /api/todos/:id - Delete a todo
router.delete("/:id", async (req, res) => {
  const { id } = req.params
  try {
    await prisma.todo.delete({
      where: { id },
    })

    logger.info({ id }, "Todo deleted")
    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return res.status(404).json({
        error: "Todo not found",
      })
    }
    logger.error({ error, id }, "Failed to delete todo")
    res.status(500).json({
      error: "Failed to delete todo",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

export default router

