import { useState } from "react"
import { useInstagram } from "./hooks/useInstagram"
import { useAuth } from "@/shared/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Plus, Camera } from "lucide-react"
import { LoginForm } from "@/components/LoginForm"
import { PostCard } from "./components/PostCard"
import { UploadModal } from "./components/UploadModal"

export function InstagramApp() {
  const { user, loading: authLoading } = useAuth()
  const {
    posts,
    loading,
    error,
    fetchPosts,
    createPost,
    deletePost,
    addComment,
    deleteComment,
    toggleLike,
  } = useInstagram()

  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  const handleCreatePost = () => {
    setUploadModalOpen(true)
  }

  const handleUploadSuccess = () => {
    fetchPosts()
  }

  const handleComment = async (postId: string, content: string) => {
    await addComment(postId, { content })
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <Camera className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">Login Required</h2>
              <p className="text-muted-foreground">
                Please login to use Instagram
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Instagram</h1>
          <p className="text-muted-foreground">Share your photos</p>
        </div>
        <Button onClick={handleCreatePost}>
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No posts yet</p>
            <Button onClick={handleCreatePost}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={async (postId) => {
                await toggleLike(postId)
              }}
              onDelete={deletePost}
              onEdit={() => {}} // TODO: Implement edit functionality
              onComment={handleComment}
              onDeleteComment={deleteComment}
            />
          ))}
        </div>
      )}

      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={handleUploadSuccess}
        onCreatePost={async (input) => {
          await createPost(input)
        }}
      />
    </div>
  )
}
