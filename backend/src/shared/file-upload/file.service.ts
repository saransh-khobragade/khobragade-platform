import prisma from "../../db/index.js"
import { logger } from "../../lib/logger.js"
import fs from "fs/promises"
import path from "path"
import type { FileUploadResult, FileMetadata } from "./file.types.js"

const UPLOAD_DIR = path.join(process.cwd(), "uploads")
const BASE_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 8080}`

// Ensure uploads directory exists
export const ensureUploadsDir = async () => {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    logger.info(`Created uploads directory: ${UPLOAD_DIR}`)
  }
}

export const fileService = {
  /**
   * Save file metadata to database
   */
  saveFileMetadata: async (
    filename: string,
    originalName: string,
    mimeType: string,
    size: number,
    uploadedBy?: string
  ): Promise<FileMetadata> => {
    const file = await prisma.file.create({
      data: {
        filename,
        originalName,
        mimeType,
        size,
        uploadedBy: uploadedBy || null,
      },
    })

    return {
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      uploadedBy: file.uploadedBy,
      createdAt: file.createdAt,
    }
  },

  /**
   * Get file metadata by filename
   */
  getFileMetadata: async (filename: string): Promise<FileMetadata | null> => {
    const file = await prisma.file.findUnique({
      where: { filename },
    })

    if (!file) return null

    return {
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      uploadedBy: file.uploadedBy,
      createdAt: file.createdAt,
    }
  },

  /**
   * Delete file and its metadata
   */
  deleteFile: async (filename: string): Promise<void> => {
    // Delete from database
    await prisma.file.delete({
      where: { filename },
    })

    // Delete from filesystem
    const filePath = path.join(UPLOAD_DIR, filename)
    try {
      await fs.unlink(filePath)
      logger.info(`Deleted file: ${filename}`)
    } catch (error) {
      logger.warn({ error, filename }, "File not found on filesystem, but metadata deleted")
    }
  },

  /**
   * Get file path
   */
  getFilePath: (filename: string): string => {
    return path.join(UPLOAD_DIR, filename)
  },

  /**
   * Get file URL
   */
  getFileUrl: (filename: string): string => {
    return `${BASE_URL}/api/files/${filename}`
  },
}
