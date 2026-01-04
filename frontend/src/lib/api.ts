const API_BASE_URL = import.meta.env.VITE_API_URL

export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export const todoApi = {
  // Get all todos
  getAll: async (): Promise<Todo[]> => {
    const response = await fetch(`${API_BASE_URL}/api/todos`)
    if (!response.ok) {
      throw new Error("Failed to fetch todos")
    }
    return response.json()
  },

  // Create a new todo
  create: async (text: string): Promise<Todo> => {
    const response = await fetch(`${API_BASE_URL}/api/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to create todo")
    }
    return response.json()
  },

  // Update a todo
  update: async (id: string, updates: { completed?: boolean; text?: string }): Promise<Todo> => {
    const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to update todo")
    }
    return response.json()
  },

  // Delete a todo
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/todos/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to delete todo")
    }
  },
}

