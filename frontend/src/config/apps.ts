import type { LucideIcon } from "lucide-react"
import { CheckSquare, Hash } from "lucide-react"
import { TodoApp } from "@/apps/todo/TodoApp.js"
import { MD5Converter } from "@/apps/md5-converter/MD5Converter.js"
import type { ComponentType } from "react"

export interface AppConfig {
  id: string
  title: string
  description: string
  icon: LucideIcon
  path: string
  component: ComponentType
}

export const apps: AppConfig[] = [
  {
    id: "todo",
    title: "Todo App",
    description: "Manage your tasks with a full-featured todo list application",
    icon: CheckSquare,
    path: "/todos",
    component: TodoApp,
  },
  {
    id: "md5-converter",
    title: "MD5 Converter",
    description: "Convert any text string to its MD5 hash",
    icon: Hash,
    path: "/md5-converter",
    component: MD5Converter,
  },
]

