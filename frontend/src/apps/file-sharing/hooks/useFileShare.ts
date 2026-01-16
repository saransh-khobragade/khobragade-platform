import { useState, useEffect, useCallback } from "react"
import { fileSharingApi } from "../api"
import type { FileShare, CreateFileShareInput } from "../types"

export const useFileShare = () => {
  const [myShares, setMyShares] = useState<FileShare[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch my shares
  const fetchMyShares = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const shares = await fileSharingApi.getMyShares()
      setMyShares(shares)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch shares")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMyShares()
  }, [fetchMyShares])

  // Create a new share
  const createShare = useCallback(async (input: CreateFileShareInput) => {
    try {
      const share = await fileSharingApi.createShare(input)
      setMyShares((prev) => [share, ...prev])
      return share
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create share")
      throw err
    }
  }, [])

  // Delete a share
  const deleteShare = useCallback(async (token: string) => {
    try {
      await fileSharingApi.deleteShare(token)
      setMyShares((prev) => prev.filter((s) => s.shareToken !== token))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete share")
      throw err
    }
  }, [])

  // Deactivate a share
  const deactivateShare = useCallback(async (token: string) => {
    try {
      await fileSharingApi.deactivateShare(token)
      setMyShares((prev) =>
        prev.map((s) => (s.shareToken === token ? { ...s, isActive: false } : s))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate share")
      throw err
    }
  }, [])

  return {
    myShares,
    loading,
    error,
    fetchMyShares,
    createShare,
    deleteShare,
    deactivateShare,
  }
}
