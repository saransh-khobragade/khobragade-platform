import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { TodoApp } from "@/components/todo-app"

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="flex justify-end mb-8">
            <ModeToggle />
          </div>
          <TodoApp />
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App