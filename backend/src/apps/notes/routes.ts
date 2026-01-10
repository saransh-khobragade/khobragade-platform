import { Router } from "express"
import { noteController } from "./controller.js"

const router = Router()

// POST /api/notes - Create a new note
router.post("/", noteController.create)

// GET /api/notes/:shareId - Get note by shareId
router.get("/:shareId", noteController.getByShareId)

// PATCH /api/notes/:shareId - Update note by shareId
router.patch("/:shareId", noteController.update)

// DELETE /api/notes/:shareId - Delete note by shareId
router.delete("/:shareId", noteController.delete)

export default router



