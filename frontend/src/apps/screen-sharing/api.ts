import { apiRequest } from "@/lib/api/client"
import type { ScreenShare, CreateScreenShareInput, ScreenShareInfo } from "./types"

export const screenSharingApi = {
  /**
   * Create a new screen share (requires auth)
   */
  createShare: async (input?: CreateScreenShareInput): Promise<ScreenShare> => {
    return apiRequest<ScreenShare>("/api/screen-sharing/create", {
      method: "POST",
      body: JSON.stringify(input || {}),
    })
  },

  /**
   * Get share info by token (public, no auth required)
   */
  getShare: async (token: string): Promise<ScreenShareInfo> => {
    return apiRequest<ScreenShareInfo>(`/api/screen-sharing/${token}`)
  },

  /**
   * Stop a screen share (requires auth)
   */
  stopShare: async (token: string): Promise<void> => {
    return apiRequest<void>(`/api/screen-sharing/${token}/stop`, {
      method: "POST",
    })
  },
}
