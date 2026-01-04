import prisma from "../../db/index.js"
import { logger } from "../../lib/logger.js"
import type { CreateTodoInput, UpdateTodoInput, Todo } from "./types.js"

export const todoService = {
  // Get all todos
  getAll: async (): Promise<Todo[]> => {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })
    logger.info({ count: todos.length }, "Todos fetched")
    return todos
  },

  // Create a new todo
  create: async (input: CreateTodoInput): Promise<Todo> => {
    const todo = await prisma.todo.create({
      data: {
        text: input.text.trim(),
        completed: false,
      },
    })
    logger.info({ todoId: todo.id, text: todo.text }, "Todo created")
    return todo
  },

  // Update a todo
  update: async (id: string, input: UpdateTodoInput): Promise<Todo> => {
    const updateData: { completed?: boolean; text?: string } = {}

    if (typeof input.completed === "boolean") {
      updateData.completed = input.completed
    }

    if (input.text !== undefined) {
      updateData.text = input.text.trim()
    }

    const todo = await prisma.todo.update({
      where: { id },
      data: updateData,
    })

    logger.info({ todoId: id, updates: updateData }, "Todo updated")
    return todo
  },

  // Delete a todo
  delete: async (id: string): Promise<void> => {
    await prisma.todo.delete({
      where: { id },
    })
    logger.info({ id }, "Todo deleted")
  },

  // Check if todo exists
  exists: async (id: string): Promise<boolean> => {
    const count = await prisma.todo.count({
      where: { id },
    })
    return count > 0
  },
}

