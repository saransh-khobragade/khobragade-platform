import type { MD5Response } from "./types.js"
import { API_BASE_URL } from "@/lib/api/client.js"

export const md5Api = {
  // Convert text to MD5 hash
  convert: async (text: string): Promise<MD5Response> => {
    const response = await fetch(`${API_BASE_URL}/api/md5`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to convert to MD5")
    }
    return response.json()
  },
}

