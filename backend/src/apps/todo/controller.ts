import { Request, Response } from "express"
import { logger } from "../../lib/logger.js"
import { todoService } from "./service.js"
import { todoValidator, ValidationError } from "./validator.js"

export const todoController = {
  // Get all todos
  getAll: async (_req: Request, res: Response) => {
    try {
      const todos = await todoService.getAll()
      res.json(todos)
    } catch (error) {
      logger.error({ error }, "Failed to fetch todos")
      res.status(500).json({
        error: "Failed to fetch todos",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },

  // Create a new todo
  create: async (req: Request, res: Response) => {
    try {
      const validatedInput = todoValidator.validateCreate(req.body)
      const todo = await todoService.create(validatedInput)
      res.status(201).json(todo)
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: error.message,
        })
      }
      logger.error({ error }, "Failed to create todo")
      res.status(500).json({
        error: "Failed to create todo",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },

  // Update a todo
  update: async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params
    try {
      const validatedInput = todoValidator.validateUpdate(req.body)
      
      // Check if todo exists
      const exists = await todoService.exists(id)
      if (!exists) {
        return res.status(404).json({
          error: "Todo not found",
        })
      }

      const todo = await todoService.update(id, validatedInput)
      res.json(todo)
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: error.message,
        })
      }
      logger.error({ error, id }, "Failed to update todo")
      res.status(500).json({
        error: "Failed to update todo",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },

  // Delete a todo
  delete: async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params
    try {
      // Check if todo exists
      const exists = await todoService.exists(id)
      if (!exists) {
        return res.status(404).json({
          error: "Todo not found",
        })
      }

      await todoService.delete(id)
      res.status(204).send()
    } catch (error) {
      logger.error({ error, id }, "Failed to delete todo")
      res.status(500).json({
        error: "Failed to delete todo",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },
}

