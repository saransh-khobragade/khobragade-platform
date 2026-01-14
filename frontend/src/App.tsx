import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { HomePage } from "@/components/home-page"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, LogOut } from "lucide-react"
import { apps } from "@/config/apps.js"
import { NotesApp } from "@/apps/notes/NotesApp.js"
import { AuthProvider, useAuth } from "@/shared/auth/AuthContext"

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isHome = location.pathname === "/"

  const handleLogout = () => {
    logout()
    navigate("/")
  }

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
      <div className="flex items-center gap-3">
        <ModeToggle />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 flex items-center justify-center">
                <Avatar className="h-10 w-10">
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.name || user.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    @{user.username}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
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