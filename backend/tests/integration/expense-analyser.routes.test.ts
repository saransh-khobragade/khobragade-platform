import express from "express"
import request from "supertest"
import { beforeEach, describe, expect, it, vi } from "vitest"
import expenseAnalyserRouter from "../../src/apps/expense-analyser/routes.js"

const { processFileMock } = vi.hoisted(() => ({
  processFileMock: vi.fn(),
}))

vi.mock("../../src/apps/expense-analyser/service.js", () => {
  return {
    expenseAnalyserService: {
      processFile: processFileMock,
    },
  }
})

const createTestApp = () => {
  const app = express()
  app.use("/api/expense-analyser", expenseAnalyserRouter)
  return app
}

describe("Expense analyser routes integration", () => {
  beforeEach(() => {
    processFileMock.mockReset()
  })

  it("POST /api/expense-analyser/upload returns 400 when file is missing", async () => {
    const app = createTestApp()
    const response = await request(app)
      .post("/api/expense-analyser/upload")
      .field("bankType", "icici")

    expect(response.status).toBe(400)
    expect(response.body).toEqual({ error: "No file uploaded" })
  })

  it("POST /api/expense-analyser/upload processes valid file", async () => {
    processFileMock.mockResolvedValue({
      totalTransactions: 2,
      totalDebitAmount: 1000,
      totalCreditAmount: 500,
      locationAnalysis: [],
      timePeriodAnalysis: [],
      categoryAnalysis: [],
      transactions: [],
    })

    const app = createTestApp()
    const response = await request(app)
      .post("/api/expense-analyser/upload")
      .field("bankType", "icici")
      .attach("file", Buffer.from("fake-xlsx-content"), {
        filename: "statement.xlsx",
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })

    expect(response.status).toBe(200)
    expect(processFileMock).toHaveBeenCalledTimes(1)
    expect(response.body).toEqual(
      expect.objectContaining({
        totalTransactions: 2,
      })
    )
  })
})
