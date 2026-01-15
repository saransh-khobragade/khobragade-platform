import { useState } from "react"
import { useBlog } from "./hooks/useBlog"
import { useAuth } from "@/shared/auth/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus } from "lucide-react"
import { LoginForm } from "@/components/LoginForm"
import { PostCard } from "./components/PostCard"
import { PostEditor } from "./components/PostEditor"
import type { Post } from "./types"

export function BlogApp() {
  const { user, loading: authLoading } = useAuth()
  const {
    posts,
    loading,
    error,
    createPost,
    updatePost,
    deletePost,
    addComment,
    deleteComment,
    toggleLike,
  } = useBlog()

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)

  const handleCreatePost = () => {
    setEditingPost(null)
    setEditorOpen(true)
  }

  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setEditorOpen(true)
  }

  const handleEditorSuccess = () => {
    // Posts will be refreshed automatically via the hook
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
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please login to use the Blog app
            </p>
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
          <h1 className="text-3xl font-bold mb-2">Blog</h1>
          <p className="text-muted-foreground">Share your thoughts and ideas</p>
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
            <p className="text-muted-foreground mb-4">No posts yet</p>
            <Button onClick={handleCreatePost}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={toggleLike}
              onDelete={deletePost}
              onEdit={handleEditPost}
              onComment={handleComment}
              onDeleteComment={deleteComment}
            />
          ))}
        </div>
      )}

      <PostEditor
        post={editingPost}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSuccess={handleEditorSuccess}
        onCreatePost={createPost}
        onUpdatePost={updatePost}
      />
    </div>
  )
}
