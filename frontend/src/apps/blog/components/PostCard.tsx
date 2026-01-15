import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Heart, MessageCircle, Trash2, Edit2 } from "lucide-react"
import { useAuth } from "@/shared/auth/AuthContext"
import type { Post } from "../types"
import { CommentSection } from "./CommentSection"

interface PostCardProps {
  post: Post
  onLike: (postId: string) => Promise<{ liked: boolean } | void>
  onDelete: (postId: string) => Promise<void>
  onEdit: (post: Post) => void
  onComment: (postId: string, content: string) => Promise<void>
  onDeleteComment: (postId: string, commentId: string) => Promise<void>
}

export function PostCard({
  post,
  onLike,
  onDelete,
  onEdit,
  onComment,
  onDeleteComment,
}: PostCardProps) {
  const { user } = useAuth()
  const [isLiked, setIsLiked] = useState(
    post.likes?.some((l) => l.userId === user?.id) || false
  )
  const [liking, setLiking] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const handleLike = async () => {
    try {
      setLiking(true)
      await onLike(post.id)
      setIsLiked(!isLiked)
    } catch (error) {
      console.error("Failed to toggle like:", error)
    } finally {
      setLiking(false)
    }
  }

  const isOwnPost = post.authorId === user?.id
  const likeCount = post._count?.likes || post.likes?.length || 0
  const commentCount = post._count?.comments || post.comments?.length || 0

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {post.author.username.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <CardTitle className="text-base">
                {post.author.name || post.author.username}
              </CardTitle>
              <p className="text-sm text-muted-foreground">@{post.author.username}</p>
            </div>
          </div>
          {isOwnPost && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(post)}
                className="h-8 w-8"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(post.id)}
                className="h-8 w-8 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
          </div>

          {post.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-4 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={liking}
              className={isLiked ? "text-red-500" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
              {likeCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {commentCount}
            </Button>
          </div>

          {showComments && (
            <CommentSection
              postId={post.id}
              comments={post.comments || []}
              onComment={onComment}
              onDeleteComment={onDeleteComment}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
