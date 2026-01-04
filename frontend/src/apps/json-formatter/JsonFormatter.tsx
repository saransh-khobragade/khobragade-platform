import { useState } from "react"
import { Copy, FileJson, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useJsonFormatter } from "./hooks/useJsonFormatter.js"
import { useCopyToClipboard } from "../md5-converter/hooks/useCopyToClipboard.js"

export function JsonFormatter() {
  const [input, setInput] = useState("")
  const { result, indent, setIndent, format, reset } = useJsonFormatter()
  const { copied, copy } = useCopyToClipboard()

  const handleFormat = () => {
    if (input.trim() === "") {
      reset()
      return
    }
    format(input, indent)
  }

  const handleCopy = async () => {
    if (result?.formatted) {
      await copy(result.formatted)
    }
  }

  const handleClear = () => {
    setInput("")
    reset()
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileJson className="h-6 w-6" />
            <CardTitle>JSON Formatter</CardTitle>
          </div>
          <CardDescription>
            Format and validate JSON with customizable indentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Indent selector */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Indentation:</label>
            <div className="flex gap-2">
              {[0, 2, 4].map((spaces) => (
                <Button
                  key={spaces}
                  variant={indent === spaces ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIndent(spaces)}
                >
                  {spaces === 0 ? "None" : `${spaces} spaces`}
                </Button>
              ))}
            </div>
          </div>

          {/* Input area */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Input JSON:</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full min-h-[200px] p-3 rounded border bg-background font-mono text-sm resize-y"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button onClick={handleFormat} disabled={input.trim() === ""}>
              Format JSON
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>

          {/* Error display */}
          {result && !result.valid && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <strong>Error:</strong> {result.error}
            </div>
          )}

          {/* Output area */}
          {result && result.valid && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Formatted JSON:</label>
                <Button
                  variant={copied ? "default" : "outline"}
                  size="sm"
                  onClick={handleCopy}
                  className={copied ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <textarea
                value={result.formatted}
                readOnly
                className="w-full min-h-[200px] p-3 rounded border bg-muted font-mono text-sm resize-y"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

