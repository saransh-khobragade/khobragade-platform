import { useState, useEffect, useCallback } from "react"
import { todoApi } from "../api.js"
import type { Todo } from "../types.js"

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await todoApi.getAll()
      setTodos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load todos")
      console.error("Error fetching todos:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const addTodo = useCallback(async (text: string) => {
    try {
      setError(null)
      const newTodo = await todoApi.create(text.trim())
      setTodos((prev) => [newTodo, ...prev])
      return newTodo
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create todo"
      setError(errorMessage)
      console.error("Error creating todo:", err)
      throw err
    }
  }, [])

  const updateTodo = useCallback(async (id: string, updates: { completed?: boolean; text?: string }) => {
    try {
      setError(null)
      const updatedTodo = await todoApi.update(id, updates)
      setTodos((prev) => prev.map((t) => (t.id === id ? updatedTodo : t)))
      return updatedTodo
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update todo"
      setError(errorMessage)
      console.error("Error updating todo:", err)
      // Revert optimistic update by refetching
      fetchTodos()
      throw err
    }
  }, [fetchTodos])

  const deleteTodo = useCallback(async (id: string) => {
    try {
      setError(null)
      await todoApi.delete(id)
      setTodos((prev) => prev.filter((todo) => todo.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete todo"
      setError(errorMessage)
      console.error("Error deleting todo:", err)
      throw err
    }
  }, [])

  const toggleTodo = useCallback(async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return
    return updateTodo(id, { completed: !todo.completed })
  }, [todos, updateTodo])

  return {
    todos,
    loading,
    error,
    fetchTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
  }
}

