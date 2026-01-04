import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import pinoHttp from "pino-http"
import prisma from "./db/index.js"
import todosRouter from "./routes/todos.js"
import { logger } from "./lib/logger.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

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
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`)
})

