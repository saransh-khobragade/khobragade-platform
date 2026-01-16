import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Monitor } from "lucide-react"
import { screenSharingApi } from "./api"
import { useScreenShareWebRTC } from "./hooks/useScreenShareWebRTC"

export function ScreenShareViewer() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareInfo, setShareInfo] = useState<any>(null)

  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteStreamsRef = useRef<Map<string, HTMLVideoElement>>(new Map())

  const {
    isConnected,
    remoteStreams,
    error: webrtcError,
    joinShare,
    leaveShare,
  } = useScreenShareWebRTC({
    shareToken: token || "",
    isSharer: false,
  })

  // Load share info
  useEffect(() => {
    const loadShare = async () => {
      if (!token) {
        setError("Invalid share token")
        setLoading(false)
        return
      }

      try {
        const share = await screenSharingApi.getShare(token)
        setShareInfo(share)
        setLoading(false)
      } catch (err: any) {
        setError(err.message || "Screen share not found or expired")
        setLoading(false)
      }
    }
    loadShare()
  }, [token])

  // Join share when info is loaded
  useEffect(() => {
    if (shareInfo && !isConnected && !loading) {
      joinShare()
    }
  }, [shareInfo, isConnected, loading, joinShare])

  // Update remote video element
  useEffect(() => {
    if (!remoteVideoRef.current || remoteStreams.size === 0) {
      return
    }

    // Get the first remote stream (from sharer)
    const stream = Array.from(remoteStreams.values())[0]
    if (stream && remoteVideoRef.current.srcObject !== stream) {
      remoteVideoRef.current.srcObject = stream
      const playVideo = async () => {
        try {
          if (remoteVideoRef.current && remoteVideoRef.current.paused) {
            await remoteVideoRef.current.play()
          }
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.error("Error playing remote video:", err)
          }
        }
      }

      if (remoteVideoRef.current.readyState >= 2) {
        playVideo()
      } else {
        remoteVideoRef.current.onloadedmetadata = () => {
          playVideo()
        }
      }
    }
  }, [remoteStreams])

  // Handle remote stream added event
  useEffect(() => {
    const handleRemoteStreamAdded = (event: CustomEvent) => {
      const stream = Array.from(remoteStreams.values())[0]
      if (remoteVideoRef.current && stream && remoteVideoRef.current.srcObject !== stream) {
        remoteVideoRef.current.srcObject = stream
        remoteVideoRef.current.play().catch((err) => {
          console.error("Error playing video:", err)
        })
      }
    }

    window.addEventListener("remoteStreamAdded", handleRemoteStreamAdded as EventListener)
    return () => {
      window.removeEventListener("remoteStreamAdded", handleRemoteStreamAdded as EventListener)
    }
  }, [remoteStreams])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveShare()
    }
  }, [leaveShare])

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || webrtcError) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-destructive mb-4">{error || webrtcError}</p>
              <Button onClick={() => navigate("/screen-sharing")} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Viewing Screen Share</h2>
          {shareInfo && (
            <p className="text-sm text-muted-foreground">
              Shared by {shareInfo.sharedBy?.username || "Unknown"}
            </p>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate("/screen-sharing")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {!isConnected && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      )}

      {isConnected && (
        <Card>
          <CardContent className="p-0">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              {remoteStreams.size === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="h-12 w-12 mx-auto mb-4 text-white opacity-50" />
                    <p className="text-white">Waiting for screen share to start...</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
