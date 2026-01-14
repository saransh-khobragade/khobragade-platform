import { Routes, Route, Link, useLocation } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { HomePage } from "@/components/home-page"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import { apps } from "@/config/apps.js"
import { NotesApp } from "@/apps/notes/NotesApp.js"
import { AuthProvider } from "@/shared/auth/AuthContext"

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
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto py-8">
            <Navigation />
            <Routes>
              <Route path="/" element={<HomePage />} />
              {apps.map((app) => (
                <Route key={app.id} path={app.path} element={<app.component />} />
              ))}
              {/* Notes with shareId */}
              <Route path="/notes/:shareId" element={<NotesApp />} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App