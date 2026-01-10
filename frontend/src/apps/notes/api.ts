import type { Note, CreateNoteInput, UpdateNoteInput } from "./types.js"
import { API_BASE_URL } from "@/lib/api/client.js"

export const notesApi = {
  // Create a new note
  create: async (input: CreateNoteInput): Promise<Note> => {
    const response = await fetch(`${API_BASE_URL}/api/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create note")
    }
    return response.json()
  },

  // Get note by shareId
  getByShareId: async (shareId: string): Promise<Note> => {
    const response = await fetch(`${API_BASE_URL}/api/notes/${shareId}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to fetch note")
    }
    return response.json()
  },

  // Update note by shareId
  update: async (shareId: string, input: UpdateNoteInput): Promise<Note> => {
    const response = await fetch(`${API_BASE_URL}/api/notes/${shareId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update note")
    }
    return response.json()
  },

  // Delete note by shareId
  delete: async (shareId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/notes/${shareId}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete note")
    }
  },
}



