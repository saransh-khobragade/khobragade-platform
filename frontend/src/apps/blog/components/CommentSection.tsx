import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Send, Trash2 } from "lucide-react"
import { useAuth } from "@/shared/auth/AuthContext"
import type { Comment } from "../types"

interface CommentSectionProps {
  postId: string
  comments: Comment[]
  onComment: (postId: string, content: string) => Promise<void>
  onDeleteComment: (postId: string, commentId: string) => Promise<void>
}

export function CommentSection({
  postId,
  comments,
  onComment,
  onDeleteComment,
}: CommentSectionProps) {
  const { user } = useAuth()
  const [commentInput, setCommentInput] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentInput.trim() || sending) return

    try {
      setSending(true)
      await onComment(postId, commentInput.trim())
      setCommentInput("")
    } catch (error) {
      console.error("Failed to add comment:", error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => {
            const isOwnComment = comment.authorId === user?.id
            return (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  {comment.author.username.charAt(0).toUpperCase()}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {comment.author.name || comment.author.username}
                    </span>
                    {isOwnComment && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteComment(postId, comment.id)}
                        className="h-6 w-6 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Write a comment..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            disabled={sending}
          />
          <Button type="submit" disabled={sending || !commentInput.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  )
}
