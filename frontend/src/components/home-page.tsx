import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { apps } from "@/config/apps.js"

export function HomePage() {

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Khobragade Projects</h1>
        <p className="text-muted-foreground text-lg">
          Select a project to get started
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {apps.map((app) => {
          const Icon = app.icon
          return (
            <Link key={app.id} to={app.path} className="block">
              <Card className="h-full transition-all hover:shadow-lg hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6" />
                    <CardTitle>{app.title}</CardTitle>
                  </div>
                  <CardDescription>{app.description}</CardDescription>
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

