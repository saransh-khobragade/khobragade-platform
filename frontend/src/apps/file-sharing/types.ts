export interface FileShare {
  id: string
  shareToken: string
  fileName: string
  fileSize: number
  mimeType: string
  sharedBy: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  sharer?: {
    id: string
    username: string
    name: string | null
  }
}

export interface FileShareInfo {
  shareToken: string
  fileName: string
  fileSize: number
  mimeType: string
  sharedBy: {
    id: string
    username: string
    name: string | null
  }
  isActive: boolean
  expiresAt: string | null
}

export interface CreateFileShareInput {
  fileName: string
  fileSize: number
  mimeType: string
  expiresAt?: string
}

// WebRTC Signaling types
export interface WebRTCOffer {
  type: "offer"
  sdp: string
  shareToken: string
}

export interface WebRTCAnswer {
  type: "answer"
  sdp: string
  shareToken: string
}

export interface ICECandidate {
  candidate: string
  sdpMLineIndex: number | null
  sdpMid: string | null
  shareToken: string
}

export interface TransferStatus {
  shareToken: string
  status: "idle" | "connecting" | "connected" | "transferring" | "completed" | "error"
  progress?: number
  error?: string
}
