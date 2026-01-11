import type { ExpenseAnalysis } from "./types.js"
import { API_BASE_URL } from "@/lib/api/client.js"

export const expenseAnalyserApi = {
  // Upload and process Excel file
  uploadFile: async (file: File, bankType: string = "icici"): Promise<ExpenseAnalysis> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("bankType", bankType)

    const response = await fetch(`${API_BASE_URL}/api/expense-analyser/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to process file")
    }

    return response.json()
  },
}
