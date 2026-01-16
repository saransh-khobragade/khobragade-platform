export interface ScreenShare {
  id: string
  shareToken: string
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

export interface CreateScreenShareInput {
  expiresAt?: string
}

export interface ScreenShareInfo {
  shareToken: string
  sharedBy: {
    id: string
    username: string
    name: string | null
  }
  isActive: boolean
  expiresAt: string | null
}

// WebRTC Signaling types
export interface WebRTCOffer {
  type: "offer"
  sdp: string
  shareToken: string
  fromUserId?: string
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
