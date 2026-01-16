import { useState, useEffect } from "react"
import { useAuth } from "@/shared/auth/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Monitor, Copy, Check, MonitorOff } from "lucide-react"
import { LoginForm } from "@/components/LoginForm"
import { screenSharingApi } from "./api"
import { useScreenShareWebRTC } from "./hooks/useScreenShareWebRTC"

export function ScreenSharingApp() {
  const { user, loading: authLoading } = useAuth()
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  const {
    isConnected,
    localStream,
    isSharing,
    error,
    joinShare,
    leaveShare,
    startScreenShare,
    stopScreenShare,
    localVideoRef,
  } = useScreenShareWebRTC({
    shareToken: shareToken || "",
    userId: user?.id,
    isSharer: true,
  })

  // Join share when token is available
  useEffect(() => {
    if (shareToken && !isConnected) {
      joinShare()
    }
  }, [shareToken, isConnected, joinShare])

  // Update local video element when stream is available
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      const video = localVideoRef.current
      if (video.srcObject !== localStream) {
        video.srcObject = localStream
        video.play().catch((err) => {
          console.error("Error playing local video:", err)
        })
      }
    }
  }, [localStream, localVideoRef])

  // Don't auto-start screen share - let user click button to start

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  // Requires authentication
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <Monitor className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">Login Required</h2>
              <p className="text-muted-foreground">
                Please login to share your screen
              </p>
            </div>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCreateShare = async () => {
    try {
      setCreating(true)
      const share = await screenSharingApi.createShare()
      setShareToken(share.shareToken)
    } catch (err) {
      console.error("Failed to create share:", err)
    } finally {
      setCreating(false)
    }
  }

  const handleStopShare = async () => {
    if (!shareToken) return
    
    try {
      stopScreenShare()
      leaveShare()
      await screenSharingApi.stopShare(shareToken)
      setShareToken(null)
    } catch (err) {
      console.error("Failed to stop share:", err)
    }
  }

  const copyShareUrl = () => {
    if (!shareToken) return
    
    const url = `${window.location.origin}/#/screen-sharing/view/${shareToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const shareUrl = shareToken ? `${window.location.origin}/#/screen-sharing/view/${shareToken}` : ""

  // If we have a share token, show the sharing interface (even if not connected yet)
  if (shareToken) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Screen Sharing</h1>
          <p className="text-muted-foreground">Your screen is being shared</p>
        </div>

        {error && (
          <Card className="mb-4 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Share URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="font-mono text-sm" />
              <Button onClick={copyShareUrl} variant="outline">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Share this URL with anyone you want to view your screen
            </p>
            {!isConnected && (
              <p className="text-sm text-blue-500 mt-2">
                Connecting... Please wait a moment before starting to share.
              </p>
            )}
          </CardContent>
        </Card>

        {!isConnected && !isSharing && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground mb-4">Connecting to share...</p>
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {shareToken && !isSharing && (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  {isConnected ? "Ready to share your screen" : "Click below to start sharing"}
                </p>
                <Button 
                  onClick={() => startScreenShare().catch(err => {
                    console.error("Failed to start:", err)
                  })} 
                  size="lg"
                  disabled={!shareToken}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Start Sharing Screen
                </Button>
                {!isConnected && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Still connecting... You can start sharing anyway
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isSharing && (
          <Card>
            <CardContent className="p-0">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
                {!localStream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  Your Screen
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-4 flex justify-center">
          <Button variant="destructive" onClick={handleStopShare}>
            <MonitorOff className="mr-2 h-4 w-4" />
            Stop Sharing
          </Button>
        </div>
      </div>
    )
  }

  // Initial screen - create share
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Screen Sharing</h1>
        <p className="text-muted-foreground">Share your screen with anyone via a simple URL</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start Screen Sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Click the button below to create a shareable link. Anyone with the link can view your screen.
          </p>
          <Button 
            onClick={handleCreateShare} 
            disabled={creating}
            className="w-full"
            size="lg"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Monitor className="mr-2 h-4 w-4" />
                Start Sharing
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
