export interface ScreenShare {
  id: string
  shareToken: string
  sharedBy: string
  isActive: boolean
  expiresAt: Date | null
  createdAt: Date
  sharer?: {
    id: string
    username: string
    name: string | null
  }
}

export interface CreateScreenShareInput {
  expiresAt?: Date
}

export interface ScreenShareInfo {
  shareToken: string
  sharedBy: {
    id: string
    username: string
    name: string | null
  }
  isActive: boolean
  expiresAt: Date | null
}

// WebRTC Signaling types for screen sharing
export interface WebRTCOffer {
  type: "offer"
  sdp: string
  shareToken: string
  fromUserId?: string // Optional for viewers
}

export interface WebRTCAnswer {
  type: "answer"
  sdp: string
  shareToken: string
  fromUserId?: string
}

export interface ICECandidate {
  candidate: string
  sdpMLineIndex: number | null
  sdpMid: string | null
  shareToken: string
  fromUserId?: string
}
