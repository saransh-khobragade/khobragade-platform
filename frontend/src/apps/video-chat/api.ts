import { apiRequest } from "@/lib/api/client"
import type { Room, CreateRoomInput, RoomInfo } from "./types"

export const videoChatApi = {
  /**
   * Create a new video chat room
   */
  createRoom: async (input: CreateRoomInput): Promise<Room> => {
    return apiRequest<Room>("/api/video-chat/create", {
      method: "POST",
      body: JSON.stringify(input),
    })
  },

  /**
   * Get room info by ID
   */
  getRoom: async (roomId: string): Promise<RoomInfo> => {
    return apiRequest<RoomInfo>(`/api/video-chat/${roomId}`)
  },

  /**
   * Get all active rooms
   */
  getActiveRooms: async (): Promise<Room[]> => {
    return apiRequest<Room[]>("/api/video-chat/active")
  },

  /**
   * Get my rooms
   */
  getMyRooms: async (): Promise<Room[]> => {
    return apiRequest<Room[]>("/api/video-chat/my-rooms")
  },

  /**
   * Deactivate a room
   */
  deactivateRoom: async (roomId: string): Promise<void> => {
    return apiRequest<void>(`/api/video-chat/${roomId}/deactivate`, {
      method: "POST",
    })
  },
}
