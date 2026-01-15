import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, Trash2, Edit2, Send, X } from "lucide-react"
import { useAuth } from "@/shared/auth/AuthContext"
import type { InstagramPost } from "../types"

interface PostCardProps {
  post: InstagramPost
  onLike: (postId: string) => Promise<{ liked: boolean } | void>
  onDelete: (postId: string) => Promise<void>
  onEdit: (post: InstagramPost) => void
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
  const [commentInput, setCommentInput] = useState("")
  const [sendingComment, setSendingComment] = useState(false)

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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim() || sendingComment) return

    try {
      setSendingComment(true)
      await onComment(post.id, commentInput.trim())
      setCommentInput("")
    } catch (error) {
      console.error("Failed to add comment:", error)
    } finally {
      setSendingComment(false)
    }
  }

  const isOwnPost = post.authorId === user?.id
  const likeCount = post._count?.likes || post.likes?.length || 0
  const commentCount = post._count?.comments || post.comments?.length || 0
  const comments = post.comments || []

  return (
    <Card className="mb-6 max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {post.author.username.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <p className="font-semibold">{post.author.name || post.author.username}</p>
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
      <CardContent className="p-0">
        {/* Image */}
        <div className="w-full aspect-square bg-muted">
          <img
            src={post.imageUrl}
            alt={post.caption || "Instagram post"}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLike}
              disabled={liking}
              className={`h-9 w-9 ${isLiked ? "text-red-500" : ""}`}
            >
              <Heart className={`h-6 w-6 ${isLiked ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowComments(!showComments)}
              className="h-9 w-9"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>

          {/* Like count */}
          {likeCount > 0 && (
            <p className="font-semibold text-sm mb-1">{likeCount} {likeCount === 1 ? "like" : "likes"}</p>
          )}

          {/* Caption */}
          {post.caption && (
            <div className="mb-2">
              <span className="font-semibold text-sm mr-2">
                {post.author.name || post.author.username}
              </span>
              <span className="text-sm">{post.caption}</span>
            </div>
          )}

          {/* View all comments */}
          {commentCount > 0 && !showComments && (
            <Button
              variant="ghost"
              className="p-0 h-auto text-muted-foreground text-sm"
              onClick={() => setShowComments(true)}
            >
              View all {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </Button>
          )}
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="px-4 py-3 space-y-3 max-h-64 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => {
                const isOwnComment = comment.authorId === user?.id
                return (
                  <div key={comment.id} className="flex items-start gap-2">
                    <Avatar className="h-6 w-6 flex-shrink-0">
                      {comment.author.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {comment.author.name || comment.author.username}
                        </span>
                        {isOwnComment && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteComment(post.id, comment.id)}
                            className="h-5 w-5 text-destructive ml-auto"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                )
              })
            )}

            {/* Comment input */}
            {user && (
              <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2 border-t">
                <Input
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  disabled={sendingComment}
                  className="flex-1"
                />
                <Button type="submit" disabled={sendingComment || !commentInput.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
