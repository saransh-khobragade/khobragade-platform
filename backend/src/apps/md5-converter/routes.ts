import { Router } from "express"
import { md5Controller } from "./controller.js"

const router = Router()

// POST /api/md5 - Convert text to MD5 hash
router.post("/", md5Controller.convert)

export default router

