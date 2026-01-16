import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, PhoneOff, Monitor, MonitorOff } from "lucide-react"
import { useScreenShareWebRTC } from "../hooks/useScreenShareWebRTC"
import { useAuth } from "@/shared/auth/AuthContext"
import { screenSharingApi } from "../api"

interface ScreenShareRoomProps {
  roomId: string
  onLeave: () => void
}

export function ScreenShareRoom({ roomId, onLeave }: ScreenShareRoomProps) {
  const { user } = useAuth()
  const [roomName, setRoomName] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRefsRef = useRef<Map<string, HTMLVideoElement>>(new Map())

  const {
    isConnected,
    participants,
    localStream,
    remoteStreams,
    isSharing,
    error,
    joinRoom,
    leaveRoom,
    startScreenShare,
    stopScreenShare,
  } = useScreenShareWebRTC({
    roomId,
    userId: user?.id || "",
  })

  // Load room info
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const room = await screenSharingApi.getRoom(roomId)
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
    if (!user?.id || !roomId) {
      return
    }

    const timer = setTimeout(() => {
      joinRoom()
    }, 100)

    return () => {
      clearTimeout(timer)
      leaveRoom()
    }
  }, [user?.id, roomId])

  // Update local video element
  useEffect(() => {
    if (!localVideoRef.current || !localStream) {
      return
    }

    const video = localVideoRef.current
    if (video.srcObject !== localStream) {
      video.srcObject = localStream
    }

    const playVideo = async () => {
      try {
        if (video.paused) {
          await video.play()
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Error playing local video:", err)
        }
      }
    }

    if (!video.dataset.listenersAttached) {
      video.onloadedmetadata = () => {
        playVideo()
      }
      video.dataset.listenersAttached = "true"
    }

    if (video.readyState >= 2) {
      playVideo()
    }
  }, [localStream])

  // Update remote video elements
  useEffect(() => {
    const handleRemoteStreamAdded = (event: CustomEvent) => {
      const { userId: targetUserId } = event.detail
      const stream = remoteStreams.get(targetUserId)
      const videoElement = remoteVideoRefsRef.current.get(targetUserId)

      if (videoElement && stream && videoElement.srcObject !== stream) {
        videoElement.srcObject = stream
        const playVideo = async () => {
          try {
            if (videoElement.paused) {
              await videoElement.play()
            }
          } catch (err: any) {
            if (err.name !== "AbortError") {
              console.error("Error playing remote video:", err)
            }
          }
        }

        if (videoElement.readyState >= 2) {
          playVideo()
        } else {
          videoElement.onloadedmetadata = () => {
            playVideo()
          }
        }
      }
    }

    window.addEventListener("remoteStreamAdded", handleRemoteStreamAdded as EventListener)

    remoteStreams.forEach((stream, userId) => {
      const videoElement = remoteVideoRefsRef.current.get(userId)
      if (videoElement && stream && videoElement.srcObject !== stream) {
        videoElement.srcObject = stream
        const playVideo = async () => {
          try {
            if (videoElement.paused) {
              await videoElement.play()
            }
          } catch (err: any) {
            if (err.name !== "AbortError") {
              console.error("Error playing remote video:", err)
            }
          }
        }

        if (videoElement.readyState >= 2) {
          playVideo()
        } else {
          videoElement.onloadedmetadata = () => {
            playVideo()
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

  const handleStartShare = async () => {
    try {
      await startScreenShare()
    } catch (err) {
      console.error("Failed to start screen share:", err)
    }
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
        <div className="flex gap-2">
          {!isSharing && (
            <Button variant="outline" onClick={handleStartShare}>
              <Monitor className="mr-2 h-4 w-4" />
              Start Sharing
            </Button>
          )}
          {isSharing && (
            <Button variant="outline" onClick={stopScreenShare}>
              <MonitorOff className="mr-2 h-4 w-4" />
              Stop Sharing
            </Button>
          )}
          <Button variant="destructive" onClick={handleLeave}>
            <PhoneOff className="mr-2 h-4 w-4" />
            Leave Room
          </Button>
        </div>
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
        <div className="space-y-4">
          {/* Local screen share */}
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
                    {user?.username || "You"} (Sharing)
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!isSharing && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Screen sharing not started</p>
                  <Button onClick={handleStartShare}>
                    <Monitor className="mr-2 h-4 w-4" />
                    Start Sharing Screen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Remote screen shares */}
          {participants.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {participants.map((participant) => {
                const setVideoRef = (element: HTMLVideoElement | null) => {
                  if (element) {
                    remoteVideoRefsRef.current.set(participant.userId, element)
                    const stream = remoteStreams.get(participant.userId)
                    if (stream && element.srcObject !== stream) {
                      element.srcObject = stream
                    }
                  } else {
                    remoteVideoRefsRef.current.delete(participant.userId)
                  }
                }

                return (
                  <Card key={participant.userId}>
                    <CardContent className="p-0">
                      <div className="relative bg-black rounded-lg overflow-hidden">
                        <video
                          ref={setVideoRef}
                          autoPlay
                          playsInline
                          className="w-full h-auto max-h-[50vh] object-contain"
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
      )}
    </div>
  )
}
