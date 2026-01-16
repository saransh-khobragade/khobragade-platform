import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, Copy, Check } from "lucide-react"
import { useFileShare } from "../hooks/useFileShare"
import { useP2PFileTransfer } from "../hooks/useP2PFileTransfer"

export function ShareCreator() {
  const { createShare } = useFileShare()
  const [file, setFile] = useState<File | null>(null)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { initializeConnection, startSend, status, progress, error, cleanup } =
    useP2PFileTransfer({
      shareToken: shareToken || "",
      role: "sender",
    })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setShareToken(null)
    }
  }

  const handleCreateShare = async () => {
    if (!file) return

    try {
      setCreating(true)
      const share = await createShare({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      })
      setShareToken(share.shareToken)

      // Initialize WebRTC connection with the token directly (don't wait for state update)
      await initializeConnection(share.shareToken)
    } catch (err) {
      console.error("Failed to create share:", err)
    } finally {
      setCreating(false)
    }
  }

  const handleStartTransfer = async () => {
    if (!file || !shareToken) return
    await startSend(file)
  }

  const handleCopyLink = () => {
    if (shareToken) {
      const shareUrl = `${window.location.origin}/#/file-sharing/receive/${shareToken}`
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareUrl = shareToken
    ? `${window.location.origin}/#/file-sharing/receive/${shareToken}`
    : ""

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share a File</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!shareToken ? (
          <>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-select"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </Button>
            </div>

            {file && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <Button
              onClick={handleCreateShare}
              disabled={!file || creating}
              className="w-full"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Share...
                </>
              ) : (
                "Create Share Link"
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Share Link:</p>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {status === "connected" && (
              <Button
                onClick={handleStartTransfer}
                className="w-full"
                disabled={status !== "connected"}
              >
                Start Transfer
              </Button>
            )}

            {status === "transferring" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Transferring...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {status === "completed" && (
              <div className="p-4 bg-green-500/10 text-green-600 rounded-lg text-sm">
                Transfer completed! The receiver can now download the file.
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => {
                cleanup()
                setShareToken(null)
                setFile(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ""
                }
              }}
              className="w-full"
            >
              Share Another File
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
