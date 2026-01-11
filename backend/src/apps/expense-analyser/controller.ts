import { Request, Response } from "express"
import { logger } from "../../lib/logger.js"
import { expenseAnalyserService } from "./service.js"

export const expenseAnalyserController = {
  // Process uploaded Excel file
  processFile: async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No file uploaded",
        })
      }

      const fileBuffer = req.file.buffer
      const bankType = (req.body.bankType as string) || "icici" // Default to ICICI for backward compatibility
      
      const analysis = await expenseAnalyserService.processFile(fileBuffer, bankType)

      res.json(analysis)
    } catch (error) {
      logger.error({ error }, "Failed to process expense file")
      res.status(500).json({
        error: "Failed to process expense file",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    }
  },
}
