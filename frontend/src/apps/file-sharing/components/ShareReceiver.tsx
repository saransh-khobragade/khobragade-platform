import { useState, useEffect } from "react"
import { useParams, useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Download } from "lucide-react"
import { fileSharingApi } from "../api"
import { useP2PFileTransfer } from "../hooks/useP2PFileTransfer"
import type { FileShareInfo } from "../types"

export function ShareReceiver() {
  const params = useParams<{ token?: string }>()
  const location = useLocation()
  const token = params.token || location.pathname.split("/receive/")[1]?.split("/")[0] || ""
  const [shareInfo, setShareInfo] = useState<FileShareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { initializeConnection, getReceivedFile, status, progress, error: transferError, cleanup } =
    useP2PFileTransfer({
      shareToken: token || "",
      role: "receiver",
    })

  useEffect(() => {
    if (token) {
      loadShareInfo()
    }
  }, [token])

  const loadShareInfo = async () => {
    if (!token) return

    try {
      setLoading(true)
      setError(null)
      const info = await fileSharingApi.getShareByToken(token)
      setShareInfo(info)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load share info")
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!token) {
      console.error("No token available")
      return
    }
    try {
      console.log("Connecting with token:", token)
      await initializeConnection()
    } catch (err) {
      console.error("Connection error:", err)
      setError(err instanceof Error ? err.message : "Failed to connect")
    }
  }

  const handleDownload = () => {
    const fileBlob = getReceivedFile()
    if (fileBlob && shareInfo) {
      const url = URL.createObjectURL(fileBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = shareInfo.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      // Try to get file from chunks if blob is not ready
      console.warn("File blob not ready yet")
    }
  }

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading share info...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !shareInfo) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive">{error || "Share not found or expired"}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receive File</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium">{shareInfo.fileName}</p>
          <p className="text-sm text-muted-foreground">
            {(shareInfo.fileSize / 1024 / 1024).toFixed(2)} MB
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Shared by: {shareInfo.sharedBy.name || shareInfo.sharedBy.username}
          </p>
        </div>

        {status === "connecting" && (
          <div className="space-y-2">
            <Button 
              className="w-full relative z-10"
              disabled={true}
              type="button"
            >
              Connecting...
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Waiting for sender to connect...
            </p>
          </div>
        )}

        {status === "idle" && (
          <Button 
            onClick={handleConnect} 
            className="w-full relative z-10"
            disabled={!token}
            type="button"
          >
            Connect to Sender
          </Button>
        )}

        {status === "error" && (
          <Button 
            onClick={handleConnect} 
            className="w-full relative z-10"
            disabled={!token}
            type="button"
          >
            Retry Connection
          </Button>
        )}

        {status === "connected" && (
          <div className="p-4 bg-blue-500/10 text-blue-600 rounded-lg text-sm text-center">
            Connected! Waiting for file transfer...
          </div>
        )}

        {status === "transferring" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Receiving file...</span>
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
          <div className="space-y-2">
            <div className="p-4 bg-green-500/10 text-green-600 rounded-lg text-sm text-center">
              File received successfully!
            </div>
            <Button onClick={handleDownload} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          </div>
        )}

        {(transferError || error) && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
            {transferError || error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
