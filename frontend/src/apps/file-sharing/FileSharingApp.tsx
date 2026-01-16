import { useState } from "react"
import { useAuth } from "@/shared/auth/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Share2, List } from "lucide-react"
import { LoginForm } from "@/components/LoginForm"
import { ShareCreator } from "./components/ShareCreator"
import { MyShares } from "./components/MyShares"

export function FileSharingApp() {
  const { user, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<"create" | "my-shares">("create")

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  // Create/share routes require auth
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <Share2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">Login Required</h2>
              <p className="text-muted-foreground">
                Please login to share files
              </p>
            </div>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">File Sharing</h1>
        <p className="text-muted-foreground">Share files directly peer-to-peer</p>
      </div>

      <div className="mb-4 flex gap-2 border-b">
        <Button
          variant={activeTab === "create" ? "default" : "ghost"}
          onClick={() => setActiveTab("create")}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share File
        </Button>
        <Button
          variant={activeTab === "my-shares" ? "default" : "ghost"}
          onClick={() => setActiveTab("my-shares")}
        >
          <List className="h-4 w-4 mr-2" />
          My Shares
        </Button>
      </div>

      {activeTab === "create" && (
        <div className="space-y-6">
          <ShareCreator />
        </div>
      )}

      {activeTab === "my-shares" && <MyShares />}
    </div>
  )
}
