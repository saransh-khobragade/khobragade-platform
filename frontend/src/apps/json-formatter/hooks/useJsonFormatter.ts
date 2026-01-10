import { useState, useCallback } from "react"

export interface FormatResult {
  formatted: string
  valid: boolean
  error?: string
}

export function useJsonFormatter() {
  const [result, setResult] = useState<FormatResult | null>(null)
  const [indent, setIndent] = useState<number>(2)

  const format = useCallback((jsonString: string, indentSpaces: number = indent) => {
    if (!jsonString.trim()) {
      setResult(null)
      return
    }

    try {
      // Parse JSON to validate
      const parsed = JSON.parse(jsonString)

      // Format with specified indent
      const formatted = JSON.stringify(parsed, null, indentSpaces)

      setResult({
        formatted,
        valid: true,
      })
    } catch (error) {
      setResult({
        formatted: "",
        valid: false,
        error: error instanceof Error ? error.message : "Invalid JSON",
      })
    }
  }, [indent])

  const reset = useCallback(() => {
    setResult(null)
  }, [])

  return {
    result,
    indent,
    setIndent,
    format,
    reset,
  }
}



