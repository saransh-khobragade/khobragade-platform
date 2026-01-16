import type { LucideIcon } from "lucide-react"
import { CheckSquare, Hash, FileJson, GitCompare, FileText, TrendingUp, MessageSquare, BookOpen, Camera, Share2, Video } from "lucide-react"
import { TodoApp } from "@/apps/todo/TodoApp.js"
import { MD5Converter } from "@/apps/md5-converter/MD5Converter.js"
import { JsonFormatter } from "@/apps/json-formatter/JsonFormatter.js"
import { JsonCompare } from "@/apps/json-compare/JsonCompare.js"
import { NotesApp } from "@/apps/notes/NotesApp.js"
import { ExpenseAnalyser } from "@/apps/expense-analyser/ExpenseAnalyser.js"
import { ChatApp } from "@/apps/chat/ChatApp.js"
import { BlogApp } from "@/apps/blog/BlogApp.js"
import { InstagramApp } from "@/apps/instagram/InstagramApp.js"
import { FileSharingApp } from "@/apps/file-sharing/FileSharingApp.js"
import { VideoChatApp } from "@/apps/video-chat/VideoChatApp.js"
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
  {
    id: "json-formatter",
    title: "JSON Formatter",
    description: "Format and validate JSON with customizable indentation",
    icon: FileJson,
    path: "/json-formatter",
    component: JsonFormatter,
  },
  {
    id: "json-compare",
    title: "JSON Compare",
    description: "Compare two JSON objects and see the differences",
    icon: GitCompare,
    path: "/json-compare",
    component: JsonCompare,
  },
  {
    id: "notes",
    title: "Notes Share",
    description: "Create and share notes with shareable links",
    icon: FileText,
    path: "/notes",
    component: NotesApp,
  },
  {
    id: "expense-analyser",
    title: "Expense Analyser",
    description: "Analyze your transaction history and understand spending patterns",
    icon: TrendingUp,
    path: "/expense-analyser",
    component: ExpenseAnalyser,
  },
  {
    id: "chat",
    title: "Chat",
    description: "Real-time messaging with other users",
    icon: MessageSquare,
    path: "/chat",
    component: ChatApp,
  },
  {
    id: "blog",
    title: "Blog",
    description: "Create and share blog posts with images and comments",
    icon: BookOpen,
    path: "/blog",
    component: BlogApp,
  },
  {
    id: "instagram",
    title: "Instagram",
    description: "Share photos with captions, likes, and comments",
    icon: Camera,
    path: "/instagram",
    component: InstagramApp,
  },
  {
    id: "file-sharing",
    title: "File Sharing",
    description: "Share files directly peer-to-peer using WebRTC",
    icon: Share2,
    path: "/file-sharing",
    component: FileSharingApp,
  },
  {
    id: "video-chat",
    title: "Video Chat",
    description: "Connect with others via video and audio",
    icon: Video,
    path: "/video-chat",
    component: VideoChatApp,
  },
]

