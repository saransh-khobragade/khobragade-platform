import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import { useInstagram } from "../hooks/useInstagram"
import type { InstagramPost } from "../types"

interface ProfileProps {
  userId: string
  username: string
  name: string | null
  avatar: string | null
}

export function Profile({ userId, username, name }: ProfileProps) {
  const { fetchUserPosts } = useInstagram()
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true)
        const userPosts = await fetchUserPosts(userId)
        setPosts(userPosts)
      } catch (error) {
        console.error("Failed to load user posts:", error)
      } finally {
        setLoading(false)
      }
    }

    loadPosts()
  }, [userId, fetchUserPosts])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
      {/* Profile header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              {username.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold mb-2">{name || username}</h1>
              <p className="text-muted-foreground">@{username}</p>
              <p className="text-sm mt-2">{posts.length} {posts.length === 1 ? "post" : "posts"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No posts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img
                src={post.imageUrl}
                alt={post.caption || "Post"}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
