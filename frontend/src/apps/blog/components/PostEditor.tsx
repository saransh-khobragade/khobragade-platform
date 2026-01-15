import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, X } from "lucide-react"
import { useAuth } from "@/shared/auth/AuthContext"
import { blogApi } from "../api"
import type { Post, CreatePostInput, UpdatePostInput } from "../types"

interface PostEditorProps {
  post?: Post | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onCreatePost?: (input: CreatePostInput) => Promise<Post>
  onUpdatePost?: (postId: string, input: UpdatePostInput) => Promise<Post>
}

export function PostEditor({ post, open, onOpenChange, onSuccess, onCreatePost, onUpdatePost }: PostEditorProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update form when post changes or dialog opens
  useEffect(() => {
    if (open) {
      if (post) {
        setTitle(post.title)
        setContent(post.content)
        setImageUrl(post.imageUrl || "")
      } else {
        setTitle("")
        setContent("")
        setImageUrl("")
      }
    } else {
      // Reset form when dialog closes
      setTitle("")
      setContent("")
      setImageUrl("")
    }
  }, [post, open])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB")
      return
    }

    try {
      setUploading(true)
      const result = await blogApi.uploadImage(file)
      setImageUrl(result.url)
    } catch (error) {
      console.error("Failed to upload image:", error)
      alert(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || saving) return

    try {
      setSaving(true)
      if (post) {
        // Update existing post
        const input: UpdatePostInput = {
          title: title.trim(),
          content: content.trim(),
          ...(imageUrl && imageUrl.trim() !== "" ? { imageUrl: imageUrl.trim() } : imageUrl === "" ? { imageUrl: undefined } : {}),
        }
        if (onUpdatePost) {
          await onUpdatePost(post.id, input)
        } else {
          await blogApi.updatePost(post.id, input)
        }
      } else {
        // Create new post
        const input: CreatePostInput = {
          title: title.trim(),
          content: content.trim(),
          ...(imageUrl && imageUrl.trim() !== "" && { imageUrl: imageUrl.trim() }),
        }
        if (onCreatePost) {
          await onCreatePost(input)
        } else {
          await blogApi.createPost(input)
        }
      }

      // Reset form
      setTitle("")
      setContent("")
      setImageUrl("")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Failed to save post:", error)
      alert(error instanceof Error ? error.message : "Failed to save post")
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? "Edit Post" : "Create New Post"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <textarea
              className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Write your post content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </>
                )}
              </Button>
            </div>

            {imageUrl && (
              <div className="relative inline-block">
                <img
                  src={imageUrl}
                  alt="Post preview"
                  className="max-w-full h-auto max-h-64 rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => setImageUrl("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim() || !content.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                post ? "Update Post" : "Create Post"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
