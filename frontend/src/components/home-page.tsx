import { Link } from "react-router-dom"
import { CheckSquare, Hash } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function HomePage() {
  const projects = [
    {
      id: "todos",
      title: "Todo App",
      description: "Manage your tasks with a full-featured todo list application",
      icon: CheckSquare,
      path: "/todos",
    },
    {
      id: "md5",
      title: "MD5 Converter",
      description: "Convert any text string to its MD5 hash",
      icon: Hash,
      path: "/md5-converter",
    },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Khobragade Projects</h1>
        <p className="text-muted-foreground text-lg">
          Select a project to get started
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => {
          const Icon = project.icon
          return (
            <Link key={project.id} to={project.path} className="block">
              <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6" />
                    <CardTitle>{project.title}</CardTitle>
                  </div>
                  <CardDescription>{project.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Click to open →
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

