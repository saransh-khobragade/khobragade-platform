import { Router } from "express"
import { todoController } from "./controller.js"

const router = Router()

// GET /api/todos - Get all todos
router.get("/", todoController.getAll)

// POST /api/todos - Create a new todo
router.post("/", todoController.create)

// PATCH /api/todos/:id - Update a todo
router.patch("/:id", todoController.update)

// DELETE /api/todos/:id - Delete a todo
router.delete("/:id", todoController.delete)

export default router

