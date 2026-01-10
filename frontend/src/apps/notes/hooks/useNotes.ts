import { useState, useCallback } from "react"
import { notesApi } from "../api.js"
import type { Note, CreateNoteInput, UpdateNoteInput } from "../types.js"

export function useNotes() {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createNote = useCallback(async (input: CreateNoteInput) => {
    try {
      setLoading(true)
      setError(null)
      const newNote = await notesApi.create(input)
      setNote(newNote)
      return newNote
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create note"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchNote = useCallback(async (shareId: string) => {
    try {
      setLoading(true)
      setError(null)
      const fetchedNote = await notesApi.getByShareId(shareId)
      setNote(fetchedNote)
      return fetchedNote
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch note"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateNote = useCallback(async (shareId: string, input: UpdateNoteInput) => {
    try {
      setLoading(true)
      setError(null)
      const updatedNote = await notesApi.update(shareId, input)
      setNote(updatedNote)
      return updatedNote
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update note"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteNote = useCallback(async (shareId: string) => {
    try {
      setLoading(true)
      setError(null)
      await notesApi.delete(shareId)
      setNote(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete note"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setNote(null)
    setError(null)
  }, [])

  return {
    note,
    loading,
    error,
    createNote,
    fetchNote,
    updateNote,
    deleteNote,
    reset,
  }
}



