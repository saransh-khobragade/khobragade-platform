import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Video, Plus, Users } from "lucide-react"
import { videoChatApi } from "./api"
import { useAuth } from "@/shared/auth/AuthContext"
import { LoginForm } from "@/components/LoginForm"
import type { Room } from "./types"
import { VideoRoom } from "./components/VideoRoom"

export function VideoChatApp() {
  const { user, loading: authLoading } = useAuth()
  const [roomName, setRoomName] = useState("")
  const [creating, setCreating] = useState(false)
  const [myRooms, setMyRooms] = useState<Room[]>([])
  const [activeRooms, setActiveRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"create" | "my-rooms" | "active">("create")

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  // Video chat requires authentication
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <Video className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">Login Required</h2>
              <p className="text-muted-foreground">
                Please login to use video chat
              </p>
            </div>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return

    try {
      setCreating(true)
      const room = await videoChatApi.createRoom({ name: roomName.trim() })
      setSelectedRoomId(room.id)
      setRoomName("")
    } catch (err) {
      console.error("Failed to create room:", err)
    } finally {
      setCreating(false)
    }
  }

  const loadMyRooms = async () => {
    try {
      setLoadingRooms(true)
      const rooms = await videoChatApi.getMyRooms()
      setMyRooms(rooms)
    } catch (err) {
      console.error("Failed to load my rooms:", err)
    } finally {
      setLoadingRooms(false)
    }
  }

  const loadActiveRooms = async () => {
    try {
      setLoadingRooms(true)
      const rooms = await videoChatApi.getActiveRooms()
      setActiveRooms(rooms)
    } catch (err) {
      console.error("Failed to load active rooms:", err)
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleJoinRoom = (roomId: string) => {
    setSelectedRoomId(roomId)
  }

  const handleLeaveRoom = () => {
    setSelectedRoomId(null)
  }

  // If a room is selected, show the video room
  if (selectedRoomId) {
    return <VideoRoom roomId={selectedRoomId} onLeave={handleLeaveRoom} />
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Video Chat</h1>
        <p className="text-muted-foreground">Connect with others via video and audio</p>
      </div>

      <div className="mb-4 flex gap-2 border-b">
        <Button
          variant={activeTab === "create" ? "default" : "ghost"}
          onClick={() => setActiveTab("create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Room
        </Button>
        <Button
          variant={activeTab === "my-rooms" ? "default" : "ghost"}
          onClick={() => setActiveTab("my-rooms")}
        >
          <Video className="h-4 w-4 mr-2" />
          My Rooms
        </Button>
        <Button
          variant={activeTab === "active" ? "default" : "ghost"}
          onClick={() => setActiveTab("active")}
        >
          <Users className="h-4 w-4 mr-2" />
          Active Rooms
        </Button>
      </div>

      {activeTab === "create" && (
          <Card>
            <CardHeader>
              <CardTitle>Create a Video Chat Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter room name..."
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !creating) {
                      handleCreateRoom()
                    }
                  }}
                />
                <Button onClick={handleCreateRoom} disabled={!roomName.trim() || creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
      )}

      {activeTab === "my-rooms" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>My Rooms</span>
                <Button variant="outline" size="sm" onClick={loadMyRooms} disabled={loadingRooms}>
                  {loadingRooms ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myRooms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No rooms created yet</p>
                  <p className="text-sm mt-2">Create a room to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      <div>
                        <p className="font-medium">{room.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(room.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="sm">
                        <Video className="mr-2 h-4 w-4" />
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
      )}

      {activeTab === "active" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Active Rooms</span>
                <Button variant="outline" size="sm" onClick={loadActiveRooms} disabled={loadingRooms}>
                  {loadingRooms ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeRooms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active rooms</p>
                  <p className="text-sm mt-2">Create a room or wait for others to create one</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeRooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      <div>
                        <p className="font-medium">{room.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Host: {room.host?.username || "Unknown"}
                        </p>
                      </div>
                      <Button size="sm">
                        <Video className="mr-2 h-4 w-4" />
                        Join
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
      )}
    </div>
  )
}
