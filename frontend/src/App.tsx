import { Routes, Route, Link, useLocation } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { TodoApp } from "@/components/todo-app"
import { HomePage } from "@/components/home-page"
import { MD5Converter } from "@/components/md5-converter"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

function Navigation() {
  const location = useLocation()
  const isHome = location.pathname === "/"

  return (
    <div className="flex justify-between items-center mb-8">
      {isHome ? (
        <div className="flex-1" />
      ) : (
        <Link to="/">
          <Button variant="ghost" size="sm">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      )}
      <ModeToggle />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/todos" element={<TodoApp />} />
            <Route path="/md5-converter" element={<MD5Converter />} />
          </Routes>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App