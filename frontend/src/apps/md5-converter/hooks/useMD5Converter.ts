import { useState, useCallback } from "react"
import { md5Api } from "../api.js"
import type { MD5Response } from "../types.js"

export function useMD5Converter() {
  const [hash, setHash] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const convert = useCallback(async (text: string) => {
    if (text.trim() === "" || loading) return

    try {
      setLoading(true)
      setError(null)
      const result: MD5Response = await md5Api.convert(text.trim())
      setHash(result.hash)
      return result.hash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to convert to MD5"
      setError(errorMessage)
      setHash(null)
      console.error("Error converting to MD5:", err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loading])

  const reset = useCallback(() => {
    setHash(null)
    setError(null)
  }, [])

  return {
    hash,
    loading,
    error,
    convert,
    reset,
  }
}



