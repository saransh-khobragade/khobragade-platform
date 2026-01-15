import { useState, useRef } from "react"
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
import { instagramApi } from "../api"
import type { CreateInstagramPostInput, InstagramPost } from "../types"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onCreatePost?: (input: CreateInstagramPostInput) => Promise<InstagramPost | void>
}

export function UploadModal({ open, onOpenChange, onSuccess, onCreatePost }: UploadModalProps) {
  const { user } = useAuth()
  const [imageUrl, setImageUrl] = useState("")
  const [caption, setCaption] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const result = await instagramApi.uploadImage(file)
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
    if (!imageUrl || saving) return

    try {
      setSaving(true)
      const input: CreateInstagramPostInput = {
        imageUrl: imageUrl.trim(),
        ...(caption.trim() && { caption: caption.trim() }),
      }
      if (onCreatePost) {
        await onCreatePost(input)
      } else {
        await instagramApi.createPost(input)
      }

      // Reset form
      setImageUrl("")
      setCaption("")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Failed to create post:", error)
      alert(error instanceof Error ? error.message : "Failed to create post")
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving && !uploading) {
      setImageUrl("")
      setCaption("")
      onOpenChange(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image upload */}
          <div className="space-y-2">
            {!imageUrl ? (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
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
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Select Photo
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt="Post preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setImageUrl("")}
                  disabled={saving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <Input
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving || uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !imageUrl || uploading}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                "Share"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
