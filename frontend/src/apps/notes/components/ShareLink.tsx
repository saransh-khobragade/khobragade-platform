import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "../../md5-converter/hooks/useCopyToClipboard.js"

interface ShareLinkProps {
  shareId: string
}

export function ShareLink({ shareId }: ShareLinkProps) {
  const { copied, copy } = useCopyToClipboard()
  const shareUrl = `${window.location.origin}/#/notes/${shareId}`

  const handleCopy = async () => {
    await copy(shareUrl)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Share Link:</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 px-3 py-2 rounded border bg-muted font-mono text-sm"
        />
        <Button
          variant={copied ? "default" : "outline"}
          size="icon"
          onClick={handleCopy}
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
          Link copied to clipboard!
        </p>
      )}
    </div>
  )
}



