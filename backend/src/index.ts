import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import pinoHttp from "pino-http"
import { createServer } from "http"
import prisma from "./db/index.js"
import todosRouter from "./apps/todo/routes.js"
import md5Router from "./apps/md5-converter/routes.js"
import notesRouter from "./apps/notes/routes.js"
import expenseAnalyserRouter from "./apps/expense-analyser/routes.js"
import userRouter from "./shared/user/user.routes.js"
import { initializeSocketIO } from "./shared/realtime/socket.service.js"
import { logger } from "./lib/logger.js"

dotenv.config()

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 3000

// Initialize Socket.io
initializeSocketIO(httpServer)

// Middleware
app.use(cors())
app.use(express.json({
  strict: false, // Allow non-objects (strings, arrays, etc.)
  verify: (req: any, res, buf) => {
    // Log raw body for debugging JSON parsing errors
    try {
      const rawBody = buf.toString('utf8')
      if (rawBody && req.method === 'POST') {
        req.rawBody = rawBody
        logger.info({ rawBody, url: req.url }, "Raw request body received")
      }
    } catch (e) {
      // Ignore errors in logging
    }
  }
}))

// Error handler for JSON parsing errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    logger.error({ 
      error: err.message, 
      rawBody: (req as any).rawBody,
      url: req.url,
      method: req.method
    }, "JSON parsing error")
    return res.status(400).json({ error: "Invalid JSON in request body", details: err.message })
  }
  next(err)
})

// Request logging middleware
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        body: req.body
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  })
)

// Health check route
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    
    logger.info("Health check passed")
    res.json({ 
      status: "ok", 
      message: "Server is running",
      database: "connected"
    })
  } catch (error) {
    logger.error({ error }, "Health check failed")
    res.status(503).json({ 
      status: "error", 
      message: "Server is running but database is unavailable",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    logger.info("Database connection test passed")
    res.json({ 
      status: "ok", 
      message: "Database connected successfully"
    })
  } catch (error) {
    logger.error({ error }, "Database connection test failed")
    res.status(500).json({ 
      status: "error", 
      message: "Database connection failed",
      error: error instanceof Error ? error.message : "Unknown error"
    })
  }
})

// Todo routes
app.use("/api/todos", todosRouter)

// MD5 routes
app.use("/api/md5", md5Router)

// Notes routes
app.use("/api/notes", notesRouter)

// Expense Analyser routes
app.use("/api/expense-analyser", expenseAnalyserRouter)

// Auth/User routes
app.use("/api/auth", userRouter)
app.use("/api/users", userRouter)

// Chat routes
import chatRouter from "./apps/chat/routes.js"
app.use("/api/chat", chatRouter)

// File upload routes
import fileRouter from "./shared/file-upload/file.routes.js"
app.use("/api/files", fileRouter)

// Blog routes
import blogRouter from "./apps/blog/routes.js"
app.use("/api/blog", blogRouter)

// Instagram routes
import instagramRouter from "./apps/instagram/routes.js"
app.use("/api/instagram", instagramRouter)

// File Sharing routes
import fileSharingRouter from "./apps/file-sharing/routes.js"
app.use("/api/file-sharing", fileSharingRouter)

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully")
  await prisma.$disconnect()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  logger.info("Shutting down gracefully")
  await prisma.$disconnect()
  process.exit(0)
})

// Start server
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`)
})

