export interface FileUploadResult {
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
}

export interface FileMetadata {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  uploadedBy: string | null
  createdAt: Date
}
