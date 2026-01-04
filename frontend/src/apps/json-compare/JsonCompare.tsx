import { useState } from "react"
import { Copy, GitCompare, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useJsonCompare, type DiffItem } from "./hooks/useJsonCompare.js"
import { useCopyToClipboard } from "../md5-converter/hooks/useCopyToClipboard.js"
import { HighlightedJson } from "./components/HighlightedJson.js"

function DiffItemDisplay({ item }: { item: DiffItem }) {
  const getColorClass = (type: string) => {
    switch (type) {
      case "added":
        return "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30"
      case "removed":
        return "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30"
      case "changed":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getLabel = (type: string) => {
    switch (type) {
      case "added":
        return "+ Added"
      case "removed":
        return "- Removed"
      case "changed":
        return "~ Changed"
      default:
        return "="
    }
  }

  return (
    <div className={`p-2 rounded border ${getColorClass(item.type)}`}>
      <div className="flex items-start gap-2">
        <span className="font-semibold text-xs">{getLabel(item.type)}</span>
        <div className="flex-1">
          <div className="font-mono text-sm font-semibold">{item.path || "root"}</div>
          {item.type === "removed" && (
            <div className="text-xs mt-1 opacity-75">
              Old: <span className="font-mono">{JSON.stringify(item.oldValue)}</span>
            </div>
          )}
          {item.type === "added" && (
            <div className="text-xs mt-1 opacity-75">
              New: <span className="font-mono">{JSON.stringify(item.newValue)}</span>
            </div>
          )}
          {item.type === "changed" && (
            <div className="text-xs mt-1 space-y-1">
              <div className="opacity-75">
                Old: <span className="font-mono">{JSON.stringify(item.oldValue)}</span>
              </div>
              <div className="opacity-75">
                New: <span className="font-mono">{JSON.stringify(item.newValue)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function JsonCompare() {
  const [leftJson, setLeftJson] = useState("")
  const [rightJson, setRightJson] = useState("")
  const { result, isComparing, compare, reset } = useJsonCompare()
  const leftCopy = useCopyToClipboard()
  const rightCopy = useCopyToClipboard()

  const handleCompare = () => {
    compare(leftJson, rightJson)
  }

  const handleClear = () => {
    setLeftJson("")
    setRightJson("")
    reset()
  }

  const handleCopyLeft = async () => {
    await leftCopy.copy(leftJson)
  }

  const handleCopyRight = async () => {
    await rightCopy.copy(rightJson)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <GitCompare className="h-6 w-6" />
            <CardTitle>JSON Compare</CardTitle>
          </div>
          <CardDescription>
            Compare two JSON objects and see the differences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input areas */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Left JSON */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">JSON 1:</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLeft}
                  disabled={!leftJson}
                >
                  {leftCopy.copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <textarea
                value={leftJson}
                onChange={(e) => setLeftJson(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full min-h-[300px] p-3 rounded border bg-background font-mono text-sm resize-y"
              />
              {result?.leftError && (
                <div className="text-sm text-destructive">{result.leftError}</div>
              )}
            </div>

            {/* Right JSON */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">JSON 2:</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyRight}
                  disabled={!rightJson}
                >
                  {rightCopy.copied ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <textarea
                value={rightJson}
                onChange={(e) => setRightJson(e.target.value)}
                placeholder='{"key": "value"}'
                className="w-full min-h-[300px] p-3 rounded border bg-background font-mono text-sm resize-y"
              />
              {result?.rightError && (
                <div className="text-sm text-destructive">{result.rightError}</div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button onClick={handleCompare} disabled={!leftJson.trim() || !rightJson.trim() || isComparing}>
              {isComparing ? "Comparing..." : "Compare JSON"}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className={`p-4 rounded border ${
                result.identical
                  ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400"
                  : "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400"
              }`}>
                <div className="font-semibold">
                  {result.identical
                    ? "✓ JSON objects are identical"
                    : `⚠ Found ${result.differences.length} difference${result.differences.length !== 1 ? "s" : ""}`}
                </div>
              </div>

              {/* Highlighted JSONs and differences list */}
              {!result.identical && result.differences.length > 0 && (
                <div className="space-y-4">
                  {/* Legend */}
                  <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                    <span className="inline-block w-4 h-4 bg-green-500/20 border-l-4 border-green-500 mr-2"></span>
                    Added
                    <span className="inline-block w-4 h-4 bg-yellow-500/20 border-l-4 border-yellow-500 mr-2 ml-4"></span>
                    Changed
                    <span className="inline-block w-4 h-4 bg-red-500/20 border-l-4 border-red-500 mr-2 ml-4"></span>
                    Removed
                  </div>

                  {/* Highlighted JSONs side by side */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* JSON 1 with highlights (shows removed and changed) */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">JSON 1 (Removed/Changed):</h3>
                      <HighlightedJson json={leftJson} differences={result.differences} showRemoved={true} />
                    </div>

                    {/* JSON 2 with highlights (shows added and changed) */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">JSON 2 (Added/Changed):</h3>
                      <HighlightedJson json={rightJson} differences={result.differences} showRemoved={false} />
                    </div>
                  </div>

                  {/* Differences list */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Differences:</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {result.differences.map((item, index) => (
                        <DiffItemDisplay key={`${item.path}-${index}`} item={item} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

