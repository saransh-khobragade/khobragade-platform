import { Router } from "express"
import crypto from "crypto"
import { logger } from "../lib/logger.js"

const router = Router()

// POST /api/md5 - Convert text to MD5 hash
router.post("/", async (req, res) => {
  try {
    const { text } = req.body

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        error: "Text is required and must be a string",
      })
    }

    const hash = crypto.createHash("md5").update(text).digest("hex")

    logger.info({ textLength: text.length }, "MD5 hash generated")
    res.json({ hash })
  } catch (error) {
    logger.error({ error }, "Failed to generate MD5 hash")
    res.status(500).json({
      error: "Failed to generate MD5 hash",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
})

export default router

