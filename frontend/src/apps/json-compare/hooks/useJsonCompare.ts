import { useState, useCallback } from "react"

export type DiffType = "added" | "removed" | "changed" | "unchanged"

export interface DiffItem {
  key: string
  path: string
  type: DiffType
  oldValue?: unknown
  newValue?: unknown
  children?: DiffItem[]
}

export interface CompareResult {
  identical: boolean
  differences: DiffItem[]
  leftError?: string
  rightError?: string
}

function deepCompare(
  left: unknown,
  right: unknown,
  path: string = "",
  result: DiffItem[] = []
): DiffItem[] {
  // Both are null/undefined
  if (left === null && right === null) return result
  if (left === undefined && right === undefined) return result

  // One is null/undefined
  if (left === null || left === undefined) {
    result.push({
      key: path.split(".").pop() || "",
      path,
      type: "added",
      newValue: right,
    })
    return result
  }

  if (right === null || right === undefined) {
    result.push({
      key: path.split(".").pop() || "",
      path,
      type: "removed",
      oldValue: left,
    })
    return result
  }

  // Type mismatch
  if (typeof left !== typeof right) {
    result.push({
      key: path.split(".").pop() || "",
      path,
      type: "changed",
      oldValue: left,
      newValue: right,
    })
    return result
  }

  // Primitive values
  if (typeof left !== "object" || left === null || right === null) {
    if (left !== right) {
      result.push({
        key: path.split(".").pop() || "",
        path,
        type: "changed",
        oldValue: left,
        newValue: right,
      })
    }
    return result
  }

  // Arrays
  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLength = Math.max(left.length, right.length)
    for (let i = 0; i < maxLength; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`
      if (i >= left.length) {
        result.push({
          key: `[${i}]`,
          path: itemPath,
          type: "added",
          newValue: right[i],
        })
      } else if (i >= right.length) {
        result.push({
          key: `[${i}]`,
          path: itemPath,
          type: "removed",
          oldValue: left[i],
        })
      } else {
        deepCompare(left[i], right[i], itemPath, result)
      }
    }
    return result
  }

  // Objects
  if (typeof left === "object" && typeof right === "object") {
    const leftObj = left as Record<string, unknown>
    const rightObj = right as Record<string, unknown>
    const allKeys = new Set([...Object.keys(leftObj), ...Object.keys(rightObj)])

    for (const key of allKeys) {
      const itemPath = path ? `${path}.${key}` : key
      if (!(key in leftObj)) {
        result.push({
          key,
          path: itemPath,
          type: "added",
          newValue: rightObj[key],
        })
      } else if (!(key in rightObj)) {
        result.push({
          key,
          path: itemPath,
          type: "removed",
          oldValue: leftObj[key],
        })
      } else {
        deepCompare(leftObj[key], rightObj[key], itemPath, result)
      }
    }
    return result
  }

  return result
}

export function useJsonCompare() {
  const [result, setResult] = useState<CompareResult | null>(null)
  const [isComparing, setIsComparing] = useState(false)

  const compare = useCallback((leftJson: string, rightJson: string) => {
    setIsComparing(true)
    
    // Use setTimeout to ensure state update is visible
    setTimeout(() => {
      let leftParsed: unknown
      let rightParsed: unknown
      let leftError: string | undefined
      let rightError: string | undefined

      // Parse left JSON
      try {
        leftParsed = leftJson.trim() ? JSON.parse(leftJson) : null
      } catch (error) {
        leftError = error instanceof Error ? error.message : "Invalid JSON"
        setResult({
          identical: false,
          differences: [],
          leftError,
          rightError: undefined,
        })
        setIsComparing(false)
        return
      }

      // Parse right JSON
      try {
        rightParsed = rightJson.trim() ? JSON.parse(rightJson) : null
      } catch (error) {
        rightError = error instanceof Error ? error.message : "Invalid JSON"
        setResult({
          identical: false,
          differences: [],
          leftError: undefined,
          rightError,
        })
        setIsComparing(false)
        return
      }

      // Compare - always create a new array to ensure React detects the change
      const differences: DiffItem[] = []
      deepCompare(leftParsed, rightParsed, "", differences)

      // Always create a new result object to ensure React re-renders
      setResult({
        identical: differences.length === 0,
        differences: [...differences], // Create new array reference
        leftError,
        rightError,
      })
      setIsComparing(false)
    }, 10)
  }, [])

  const reset = useCallback(() => {
    setResult(null)
  }, [])

  return {
    result,
    isComparing,
    compare,
    reset,
  }
}

