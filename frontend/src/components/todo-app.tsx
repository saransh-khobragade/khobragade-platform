import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { todoApi, type Todo } from "@/lib/api"

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
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
  }

  const addTodo = async () => {
    if (inputValue.trim() === "" || adding) return

    try {
      setAdding(true)
      setError(null)
      const newTodo = await todoApi.create(inputValue.trim())
      setTodos([newTodo, ...todos])
      setInputValue("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create todo")
      console.error("Error creating todo:", err)
    } finally {
      setAdding(false)
    }
  }

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    try {
      setError(null)
      const updatedTodo = await todoApi.update(id, { completed: !todo.completed })
      setTodos(todos.map((t) => (t.id === id ? updatedTodo : t)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo")
      console.error("Error updating todo:", err)
      // Revert optimistic update
      fetchTodos()
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      setError(null)
      await todoApi.delete(id)
      setTodos(todos.filter((todo) => todo.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo")
      console.error("Error deleting todo:", err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTodo()
    }
  }

  const completedCount = todos.filter((todo) => todo.completed).length
  const totalCount = todos.length

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Todo App</CardTitle>
          <CardDescription>
            {loading
              ? "Loading todos..."
              : totalCount === 0
              ? "No tasks yet. Add one to get started!"
              : `${completedCount} of ${totalCount} tasks completed`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchTodos}
                className="ml-2 h-auto p-1 text-xs"
              >
                Retry
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={adding}
              className="flex-1"
            />
            <Button onClick={addTodo} size="icon" disabled={adding || inputValue.trim() === ""}>
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Loading todos...</p>
            </div>
          ) : todos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your todo list is empty!</p>
              <p className="text-sm mt-2">Add a task above to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todos.map((todo) => (
                <Card
                  key={todo.id}
                  className={`transition-all ${
                    todo.completed ? "opacity-60" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo.id)}
                        id={todo.id}
                      />
                      <label
                        htmlFor={todo.id}
                        className={`flex-1 cursor-pointer ${
                          todo.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {todo.text}
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTodo(todo.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

