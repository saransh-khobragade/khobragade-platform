import { apiRequest } from "@/lib/api/client"
import type {
  FileShare,
  FileShareInfo,
  CreateFileShareInput,
} from "./types"

export const fileSharingApi = {
  /**
   * Create a new file share
   */
  createShare: async (input: CreateFileShareInput): Promise<FileShare> => {
    return apiRequest<FileShare>("/api/file-sharing/create-share", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  /**
   * Get share info by token (public)
   */
  getShareByToken: async (token: string): Promise<FileShareInfo> => {
    return apiRequest<FileShareInfo>(`/api/file-sharing/share/${token}`)
  },

  /**
   * Get my shares
   */
  getMyShares: async (): Promise<FileShare[]> => {
    return apiRequest<FileShare[]>("/api/file-sharing/my-shares")
  },

  /**
   * Delete a share
   */
  deleteShare: async (token: string): Promise<void> => {
    return apiRequest<void>(`/api/file-sharing/share/${token}`, {
      method: "DELETE",
    })
  },

  /**
   * Deactivate a share
   */
  deactivateShare: async (token: string): Promise<void> => {
    return apiRequest<void>(`/api/file-sharing/share/${token}/deactivate`, {
      method: "PATCH",
    })
  },
}
