export interface Todo {
  id: string
  text: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateTodoInput {
  text: string
}

export interface UpdateTodoInput {
  completed?: boolean
  text?: string
}

