import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Save, Trash2, Loader2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useNotes } from "./hooks/useNotes.js"
import { ShareLink } from "./components/ShareLink.js"

export function NotesApp() {
  const { shareId } = useParams<{ shareId: string }>()
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const { note, loading, error, createNote, fetchNote, updateNote, deleteNote, reset } = useNotes()

  // Fetch note if shareId exists
  useEffect(() => {
    if (shareId) {
      fetchNote(shareId).catch(() => {
        // Error handled by hook
      })
    } else {
      reset()
      setTitle("")
      setContent("")
      setIsEditing(false)
    }
  }, [shareId, fetchNote, reset])

  // Update form when note is loaded
  useEffect(() => {
    if (note) {
      setTitle(note.title || "")
      setContent(note.content)
      setIsEditing(false)
    }
  }, [note])

  const handleCreate = async () => {
    if (!content.trim()) return

    try {
      const newNote = await createNote({ content: content.trim(), title: title.trim() || undefined })
      navigate(`/notes/${newNote.shareId}`)
    } catch (err) {
      // Error handled by hook
    }
  }

  const handleUpdate = async () => {
    if (!note || !content.trim()) return

    try {
      await updateNote(note.shareId, {
        content: content.trim(),
        title: title.trim() || undefined,
      })
      setIsEditing(false)
    } catch (err) {
      // Error handled by hook
    }
  }

  const handleDelete = async () => {
    if (!note) return

    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNote(note.shareId)
        navigate("/notes")
        setTitle("")
        setContent("")
      } catch (err) {
        // Error handled by hook
      }
    }
  }

  const handleNewNote = () => {
    navigate("/notes")
    reset()
    setTitle("")
    setContent("")
    setIsEditing(false)
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <CardTitle>Notes Share</CardTitle>
          </div>
          <CardDescription>
            {shareId ? "View and edit shared note" : "Create a new note and share it"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {loading && !note ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p>Loading note...</p>
            </div>
          ) : (
            <>
              {/* Title input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Title (optional):</label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    if (note) setIsEditing(true)
                  }}
                  placeholder="Note title..."
                  disabled={loading}
                />
              </div>

              {/* Content textarea */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Content:</label>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    if (note) setIsEditing(true)
                  }}
                  placeholder="Write your note here..."
                  className="w-full min-h-[400px] p-3 rounded border bg-background font-mono text-sm resize-y"
                  disabled={loading}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!shareId ? (
                  <Button onClick={handleCreate} disabled={loading || !content.trim()}>
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Note"
                    )}
                  </Button>
                ) : (
                  <>
                    {isEditing && (
                      <Button onClick={handleUpdate} disabled={loading || !content.trim()}>
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleNewNote}>
                      New Note
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>

              {/* Share link */}
              {note && (
                <ShareLink shareId={note.shareId} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



