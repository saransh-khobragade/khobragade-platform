import { Router } from "express"
import multer from "multer"
import { expenseAnalyserController } from "./controller.js"

const router = Router()

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel files
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.endsWith(".xls") ||
      file.originalname.endsWith(".xlsx")
    ) {
      cb(null, true)
    } else {
      cb(new Error("Only Excel files (.xls, .xlsx) are allowed"))
    }
  },
})

// POST /api/expense-analyser/upload - Process uploaded Excel file
router.post("/upload", upload.single("file"), expenseAnalyserController.processFile)

export default router
