import { useState } from "react"
import { expenseAnalyserApi } from "../api.js"
import type { ExpenseAnalysis } from "../types.js"

export function useExpenseAnalyser() {
  const [analysis, setAnalysis] = useState<ExpenseAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const result = await expenseAnalyserApi.uploadFile(file)
      setAnalysis(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to process file"
      setError(errorMessage)
      setAnalysis(null)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setAnalysis(null)
    setError(null)
    setLoading(false)
  }

  return {
    analysis,
    loading,
    error,
    processFile,
    reset,
  }
}
