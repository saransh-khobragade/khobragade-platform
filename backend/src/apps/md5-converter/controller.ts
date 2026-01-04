import { Request, Response } from "express"
import { logger } from "../../lib/logger.js"
import { md5Service } from "./service.js"
import { md5Validator, ValidationError } from "./validator.js"
import type { MD5ConvertResponse } from "./types.js"

export const md5Controller = {
  // Convert text to MD5 hash
  convert: async (req: Request, res: Response<MD5ConvertResponse>) => {
    try {
      const validatedInput = md5Validator.validateConvert(req.body)
      const result = await md5Service.convert(validatedInput)
      res.json(result)
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          error: error.message,
        } as any)
      }
      logger.error({ error }, "Failed to generate MD5 hash")
      res.status(500).json({
        error: "Failed to generate MD5 hash",
        message: error instanceof Error ? error.message : "Unknown error",
      } as any)
    }
  },
}

