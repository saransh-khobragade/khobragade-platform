import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Trash2, Copy, Check, ExternalLink } from "lucide-react"
import { useFileShare } from "../hooks/useFileShare"
import { useState } from "react"

export function MyShares() {
  const { myShares, loading, deleteShare, deactivateShare } = useFileShare()
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const handleCopyLink = (token: string) => {
    const shareUrl = `${window.location.origin}/#/file-sharing/receive/${token}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const handleDelete = async (token: string) => {
    if (confirm("Are you sure you want to delete this share?")) {
      await deleteShare(token)
    }
  }

  const handleDeactivate = async (token: string) => {
    await deactivateShare(token)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </CardContent>
      </Card>
    )
  }

  if (myShares.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No shares yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Shares</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {myShares.map((share) => {
          const shareUrl = `${window.location.origin}/#/file-sharing/receive/${share.shareToken}`
          return (
            <div
              key={share.id}
              className="p-4 border rounded-lg flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{share.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {(share.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                  {share.shareToken}
                </p>
                {!share.isActive && (
                  <span className="text-xs text-muted-foreground">(Inactive)</span>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyLink(share.shareToken)}
                  title="Copy link"
                >
                  {copiedToken === share.shareToken ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(shareUrl, "_blank")}
                  title="Open link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                {share.isActive && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeactivate(share.shareToken)}
                    title="Deactivate"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(share.shareToken)}
                  title="Delete"
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
