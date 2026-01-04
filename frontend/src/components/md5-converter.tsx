import { useState } from "react"
import { Copy, Loader2, Hash, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { md5Api } from "@/lib/api"

export function MD5Converter() {
  const [input, setInput] = useState("")
  const [hash, setHash] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleConvert = async () => {
    if (input.trim() === "" || loading) return

    try {
      setLoading(true)
      setError(null)
      const result = await md5Api.convert(input.trim())
      setHash(result.hash)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert to MD5")
      setHash(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!hash) return
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      setError("Failed to copy to clipboard")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleConvert()
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Hash className="h-6 w-6" />
            <CardTitle>MD5 Converter</CardTitle>
          </div>
          <CardDescription>
            Enter text to convert it to MD5 hash
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Enter text to convert..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="flex-1"
            />
            <Button
              onClick={handleConvert}
              disabled={loading || input.trim() === ""}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Convert"
              )}
            </Button>
          </div>

          {hash && (
            <div className="space-y-2">
              <label className="text-sm font-medium">MD5 Hash:</label>
              <div className="flex gap-2">
                <Input
                  value={hash}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant={copied ? "default" : "outline"}
                  size="icon"
                  onClick={handleCopy}
                  title={copied ? "Copied!" : "Copy to clipboard"}
                  className={copied ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Copied to clipboard!
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

