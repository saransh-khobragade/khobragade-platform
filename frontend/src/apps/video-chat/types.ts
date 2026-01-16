export interface Room {
  id: string
  name: string
  hostId: string
  isActive: boolean
  createdAt: string
  host?: {
    id: string
    username: string
    name: string | null
  }
}

export interface CreateRoomInput {
  name: string
}

export interface RoomInfo {
  id: string
  name: string
  hostId: string
  isActive: boolean
  createdAt: string
  host: {
    id: string
    username: string
    name: string | null
  }
}

// WebRTC Signaling types for video/audio
export interface WebRTCOffer {
  type: "offer"
  sdp: string
  roomId: string
  fromUserId: string
}

export interface WebRTCAnswer {
  type: "answer"
  sdp: string
  roomId: string
  fromUserId: string
}

export interface ICECandidate {
  candidate: string
  sdpMLineIndex: number | null
  sdpMid: string | null
  roomId: string
  fromUserId: string
}

export interface RoomParticipant {
  userId: string
  socketId: string
  username: string
  name: string | null
}
