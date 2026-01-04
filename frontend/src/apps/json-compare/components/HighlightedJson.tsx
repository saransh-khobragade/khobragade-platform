import { useMemo } from "react"
import type { DiffItem } from "../hooks/useJsonCompare.js"

interface HighlightedJsonProps {
  json: string
  differences: DiffItem[]
  showRemoved?: boolean
}

function highlightJsonLines(
  json: string,
  differences: DiffItem[],
  showRemoved: boolean = false,
  indent: number = 2
): Array<{ line: string; highlightClass: string }> {
  if (!json.trim()) return []

  try {
    const parsed = JSON.parse(json)
    const formatted = JSON.stringify(parsed, null, indent)
    const lines = formatted.split("\n")
    
    // Extract keys that need highlighting from differences
    // For JSON 1: show removed and changed
    // For JSON 2: show added and changed
    const keysToHighlight = new Map<string, "added" | "removed" | "changed">()
    differences.forEach((diff) => {
      // Get the key name from the path (last part)
      const key = diff.path.split(".").pop()?.split("[")[0] || diff.path
      if (key) {
        // If showing removed (JSON 1), include removed and changed
        // If not showing removed (JSON 2), include added and changed
        if (showRemoved && (diff.type === "removed" || diff.type === "changed")) {
          const existing = keysToHighlight.get(key)
          if (!existing || diff.type === "changed") {
            keysToHighlight.set(key, diff.type)
          }
        } else if (!showRemoved && (diff.type === "added" || diff.type === "changed")) {
          const existing = keysToHighlight.get(key)
          if (!existing || diff.type === "changed") {
            keysToHighlight.set(key, diff.type)
          }
        }
      }
    })
    
    const result: Array<{ line: string; highlightClass: string }> = []
    
    lines.forEach((line) => {
      const trimmed = line.trim()
      let highlightClass = ""
      
      // Check if this line contains a key that needs highlighting
      for (const [key, type] of keysToHighlight.entries()) {
        // Match the key in the JSON line (e.g., "key":)
        const keyPattern = new RegExp(`"${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s*:`, "i")
        if (keyPattern.test(trimmed)) {
          switch (type) {
            case "added":
              highlightClass = "bg-green-500/20 border-l-4 border-green-500"
              break
            case "removed":
              highlightClass = "bg-red-500/20 border-l-4 border-red-500"
              break
            case "changed":
              highlightClass = "bg-yellow-500/20 border-l-4 border-yellow-500"
              break
          }
          break
        }
      }
      
      result.push({ line, highlightClass })
    })
    
    return result
  } catch {
    return [{ line: json, highlightClass: "" }]
  }
}

export function HighlightedJson({ json, differences, showRemoved = false }: HighlightedJsonProps) {
  const highlightedLines = useMemo(() => {
    return highlightJsonLines(json, differences, showRemoved, 2)
  }, [json, differences, showRemoved])

  return (
    <div className="relative">
      <pre className="w-full min-h-[300px] p-3 rounded border bg-muted font-mono text-sm overflow-auto whitespace-pre">
        {highlightedLines.map((item, index) => (
          <div
            key={index}
            className={item.highlightClass ? `${item.highlightClass} px-2 -mx-2 py-0.5 my-0.5` : ""}
          >
            {item.line || "\n"}
          </div>
        ))}
      </pre>
    </div>
  )
}

