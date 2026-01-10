import crypto from "crypto"
import { logger } from "../../lib/logger.js"
import type { MD5ConvertInput, MD5ConvertResponse } from "./types.js"

export const md5Service = {
  // Convert text to MD5 hash
  convert: async (input: MD5ConvertInput): Promise<MD5ConvertResponse> => {
    const hash = crypto.createHash("md5").update(input.text).digest("hex")
    logger.info({ textLength: input.text.length }, "MD5 hash generated")
    return { hash }
  },
}



