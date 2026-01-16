import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, PhoneOff } from "lucide-react"
import { useWebRTC } from "../hooks/useWebRTC"
import { useAuth } from "@/shared/auth/AuthContext"
import { videoChatApi } from "../api"
import { useState } from "react"

interface VideoRoomProps {
  roomId: string
  onLeave: () => void
}

export function VideoRoom({ roomId, onLeave }: VideoRoomProps) {
  const { user } = useAuth()
  const [roomName, setRoomName] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRefsRef = useRef<Map<string, HTMLVideoElement>>(new Map())

  const { isConnected, participants, localStream, remoteStreams, error, joinRoom, leaveRoom } =
    useWebRTC({
      roomId,
      userId: user?.id || "",
    })

  // Load room info
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const room = await videoChatApi.getRoom(roomId)
        setRoomName(room.name)
      } catch (err) {
        console.error("Failed to load room:", err)
      } finally {
        setLoading(false)
      }
    }
    loadRoom()
  }, [roomId])

  // Join room when component mounts
  useEffect(() => {
    console.log("🎬 VideoRoom useEffect triggered", { userId: user?.id, roomId })
    
    if (!user?.id || !roomId) {
      console.warn("⚠️ Cannot join - missing user or roomId", { userId: user?.id, roomId })
      return
    }

    let isMounted = true
    let socketConnected = false

    // Small delay to ensure auth token is available
    console.log("⏳ Setting timer to call joinRoom in 100ms...")
    const timer = setTimeout(() => {
      if (!isMounted) {
        console.log("⚠️ Component unmounted before joinRoom could execute")
        return
      }
      console.log("⏰ Timer fired, calling joinRoom...")
      joinRoom()
      socketConnected = true
    }, 100)

    return () => {
      console.log("🧹 Cleaning up VideoRoom useEffect", { socketConnected })
      isMounted = false
      clearTimeout(timer)
      // Only leave room if we actually joined
      if (socketConnected) {
        leaveRoom()
      }
    }
  }, [user?.id, roomId]) // Removed joinRoom and leaveRoom from deps to prevent re-renders

  // Update local video element
  useEffect(() => {
    if (!localVideoRef.current || !localStream) {
      if (localStream && !localVideoRef.current) {
        console.warn("⚠️ Local stream available but video element not ready")
      }
      return
    }

    console.log("📹 Setting local video stream to element, stream active:", localStream.active)
    const video = localVideoRef.current
    
    // Only set if it's different to avoid unnecessary updates
    if (video.srcObject !== localStream) {
      video.srcObject = localStream
    }
    
    // Ensure video plays - use a more robust approach
    const playVideo = async () => {
      try {
        if (video.paused) {
          await video.play()
          console.log("✅ Local video playing successfully")
        }
      } catch (err: any) {
        // Ignore AbortError - it's usually harmless (element was removed/recreated)
        if (err.name !== "AbortError") {
          console.error("❌ Error playing local video:", err)
          // Try again after a short delay if it's not an AbortError
          setTimeout(() => {
            if (video.srcObject === localStream && !video.paused) {
              video.play().catch((e: any) => {
                if (e.name !== "AbortError") {
                  console.error("Retry play failed:", e)
                }
              })
            }
          }, 200)
        }
      }
    }
    
    // Set up event handlers (only once)
    if (!video.dataset.listenersAttached) {
      video.onloadedmetadata = () => {
        console.log("📐 Local video metadata loaded, dimensions:", video.videoWidth, "x", video.videoHeight)
        playVideo()
      }
      
      video.onplay = () => {
        console.log("▶️ Local video started playing")
      }
      
      video.onerror = (e) => {
        console.error("❌ Local video error:", e)
      }
      
      video.dataset.listenersAttached = "true"
    }
    
    // Try to play immediately if metadata is already loaded
    if (video.readyState >= 2) {
      playVideo()
    }
  }, [localStream])

  // Update remote video elements when streams are added
  useEffect(() => {
    const handleRemoteStreamAdded = (event: CustomEvent) => {
      const { userId: targetUserId } = event.detail
      console.log("🎬 Remote stream added event for user:", targetUserId)
      const stream = remoteStreams.get(targetUserId)
      const videoElement = remoteVideoRefsRef.current.get(targetUserId)
      
      if (videoElement && stream) {
        // Only set if different to avoid unnecessary updates
        if (videoElement.srcObject !== stream) {
          console.log("📹 Setting remote video for user:", targetUserId)
          videoElement.srcObject = stream
          
          // Play video with better error handling
          const playVideo = async () => {
            try {
              if (videoElement.paused) {
                await videoElement.play()
                console.log("✅ Remote video playing for user:", targetUserId)
              }
            } catch (err: any) {
              // Ignore AbortError - it's usually harmless (element was updated)
              if (err.name !== "AbortError") {
                console.error("❌ Error playing remote video:", err)
              }
            }
          }
          
          // Wait for metadata if needed
          if (videoElement.readyState >= 2) {
            playVideo()
          } else {
            videoElement.onloadedmetadata = () => {
              playVideo()
            }
          }
        }
      }
    }

    window.addEventListener("remoteStreamAdded", handleRemoteStreamAdded as EventListener)
    
    // Also check on participants/streams change
    console.log("🔄 Updating remote video elements, participants:", participants.length, "streams:", remoteStreams.size)
    remoteStreams.forEach((stream, userId) => {
      const videoElement = remoteVideoRefsRef.current.get(userId)
      if (videoElement && stream) {
        // Only set if different to avoid unnecessary updates
        if (videoElement.srcObject !== stream) {
          console.log("📹 Setting remote video for user:", userId)
          videoElement.srcObject = stream
          
          // Play video with better error handling
          const playVideo = async () => {
            try {
              if (videoElement.paused) {
                await videoElement.play()
                console.log("✅ Remote video playing for user:", userId)
              }
            } catch (err: any) {
              // Ignore AbortError - it's usually harmless (element was updated)
              if (err.name !== "AbortError") {
                console.error("❌ Error playing remote video:", err)
              }
            }
          }
          
          // Wait for metadata if needed
          if (videoElement.readyState >= 2) {
            playVideo()
          } else {
            videoElement.onloadedmetadata = () => {
              playVideo()
            }
          }
        }
      }
    })

    return () => {
      window.removeEventListener("remoteStreamAdded", handleRemoteStreamAdded as EventListener)
    }
  }, [participants, remoteStreams])

  const handleLeave = () => {
    leaveRoom()
    onLeave()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{roomName}</h2>
          <p className="text-sm text-muted-foreground">
            {participants.length + 1} participant{participants.length !== 0 ? "s" : ""}
          </p>
        </div>
        <Button variant="destructive" onClick={handleLeave}>
          <PhoneOff className="mr-2 h-4 w-4" />
          Leave Room
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Local video */}
          <Card>
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!localStream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                  {user?.username || "You"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Remote videos */}
          {participants.map((participant) => {
            const setVideoRef = (element: HTMLVideoElement | null) => {
              if (element) {
                remoteVideoRefsRef.current.set(participant.userId, element)
                const stream = remoteStreams.get(participant.userId)
                if (stream && element.srcObject !== stream) {
                  console.log("📹 Setting remote video ref for user:", participant.userId)
                  element.srcObject = stream
                  // Play will be handled by the useEffect above
                }
              } else {
                remoteVideoRefsRef.current.delete(participant.userId)
              }
            }

            return (
              <Card key={participant.userId}>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={setVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {!remoteStreams.has(participant.userId) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      {participant.username}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
