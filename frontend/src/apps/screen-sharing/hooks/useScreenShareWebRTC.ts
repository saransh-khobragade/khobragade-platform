import { useState, useRef, useCallback, useEffect } from "react"
import { io, type Socket } from "socket.io-client"
import type { WebRTCOffer, WebRTCAnswer, ICECandidate } from "../types"

interface UseScreenShareWebRTCOptions {
  shareToken: string
  userId?: string // Optional for viewers
  isSharer?: boolean
}

export const useScreenShareWebRTC = ({ shareToken, userId, isSharer = false }: UseScreenShareWebRTCOptions) => {
  const [isConnected, setIsConnected] = useState(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())

  const socketRef = useRef<Socket | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map())
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  // STUN/TURN servers
  const getRTCConfiguration = (): RTCConfiguration => {
    return {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    }
  }

  // Start screen sharing (only for sharer)
  const startScreenShare = useCallback(async () => {
    if (!isSharer) {
      return
    }

    try {
      console.log("Requesting screen share and audio access...")
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: true,
      })
      
      console.log("Screen share stream obtained:", stream.id)
      
      // Try to get microphone audio separately if not included
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioStream.getAudioTracks().forEach((track) => {
          stream.addTrack(track)
        })
      } catch (audioErr) {
        console.warn("Could not get audio stream:", audioErr)
      }
      
      localStreamRef.current = stream
      setLocalStream(stream)
      setIsSharing(true)
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play().catch((err) => {
          console.error("Error playing local video:", err)
        })
      }
      
      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        console.log("Screen share ended by user")
        stopScreenShare()
      }
      
      // Notify all viewers that sharing has started
      if (socketRef.current) {
        socketRef.current.emit("sharing_started", { shareToken })
        // Request list of viewers to create offers to them
        socketRef.current.emit("get_viewers", { shareToken })
      }
      
      return stream
    } catch (err) {
      console.error("Error accessing screen share:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to access screen share"
      setError(errorMessage)
      throw err
    }
  }, [isSharer, shareToken])

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    const stream = localStreamRef.current || localStream
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
      })
      localStreamRef.current = null
      setLocalStream(null)
      setIsSharing(false)
    }
  }, [localStream])

  // Create peer connection
  const createPeerConnection = useCallback(
    (targetId: string, isInitiator: boolean): RTCPeerConnection => {
      const pc = new RTCPeerConnection(getRTCConfiguration())

      // Add local stream tracks (only if sharer and we have a stream)
      if (isSharer) {
        const stream = localStreamRef.current || localStream
        if (stream) {
          stream.getTracks().forEach((track) => {
            pc.addTrack(track, stream)
          })
        }
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log("🎥 Received remote stream from:", targetId)
        const remoteStream = event.streams[0]
        if (remoteStream) {
          remoteStreamsRef.current.set(targetId, remoteStream)
          setRemoteStreams(new Map(remoteStreamsRef.current))
          window.dispatchEvent(new CustomEvent("remoteStreamAdded", { detail: { userId: targetId } }))
        }
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice_candidate", {
            shareToken,
            fromUserId: userId,
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
          })
        }
      }

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState
        if (state === "failed" || state === "disconnected") {
          peerConnectionsRef.current.delete(targetId)
          remoteStreamsRef.current.delete(targetId)
          setRemoteStreams(new Map(remoteStreamsRef.current))
        }
      }

      return pc
    },
    [shareToken, userId, isSharer, localStream]
  )

  // Create and send offer
  const createOffer = useCallback(
    async (targetId: string) => {
      if (isSharer && !localStreamRef.current) {
        console.warn("Cannot create offer - no local stream")
        return
      }

      const pc = createPeerConnection(targetId, true)
      peerConnectionsRef.current.set(targetId, pc)

      try {
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        if (socketRef.current) {
          socketRef.current.emit("webrtc_offer", {
            shareToken,
            fromUserId: userId,
            sdp: offer.sdp!,
            type: "offer",
          })
        }
      } catch (err) {
        console.error("Error creating offer:", err)
        setError(err instanceof Error ? err.message : "Failed to create offer")
      }
    },
    [shareToken, userId, isSharer, createPeerConnection]
  )

  // Handle WebRTC offer
  const handleOffer = useCallback(
    async (data: WebRTCOffer) => {
      // If we're the sharer and receive an offer, ignore (viewers should receive from sharer)
      if (isSharer) {
        return
      }

      console.log("📥 Received WebRTC offer")
      const targetId = data.fromUserId || "sharer"
      let pc = peerConnectionsRef.current.get(targetId)
      if (!pc) {
        pc = createPeerConnection(targetId, false)
        peerConnectionsRef.current.set(targetId, pc)
      }

      if (pc.remoteDescription) {
        return
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: data.sdp }))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        if (socketRef.current) {
          socketRef.current.emit("webrtc_answer", {
            shareToken,
            fromUserId: userId,
            sdp: answer.sdp!,
            type: "answer",
          })
        }
      } catch (err: any) {
        if (err?.name === "InvalidStateError" && pc.signalingState === "stable") {
          return
        }
        console.error("Error handling offer:", err)
      }
    },
    [shareToken, userId, isSharer, createPeerConnection]
  )

  // Handle WebRTC answer
  const handleAnswer = useCallback(async (data: WebRTCAnswer) => {
    if (!isSharer) {
      return // Viewers don't send answers to other viewers
    }

    console.log("📥 Received WebRTC answer")
    const targetId = data.fromUserId || "viewer"
    const pc = peerConnectionsRef.current.get(targetId)
    if (!pc || pc.remoteDescription) {
      return
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.sdp }))
    } catch (err: any) {
      if (err?.name === "InvalidStateError" && pc.signalingState === "stable") {
        return
      }
      console.error("Error handling answer:", err)
    }
  }, [isSharer])

  // Handle ICE candidate
  const handleICECandidate = useCallback(async (data: ICECandidate) => {
    const targetId = data.fromUserId || (isSharer ? "viewer" : "sharer")
    const pc = peerConnectionsRef.current.get(targetId)
    if (!pc) {
      return
    }

    try {
      await pc.addIceCandidate(
        new RTCIceCandidate({
          candidate: data.candidate,
          sdpMLineIndex: data.sdpMLineIndex ?? undefined,
          sdpMid: data.sdpMid ?? undefined,
        })
      )
    } catch (err) {
      console.error("Error adding ICE candidate:", err)
    }
  }, [isSharer])

  // Join share
  const joinShare = useCallback(async () => {
    if (!shareToken) {
      return
    }

    console.log("🚀 Joining screen share...", { shareToken, isSharer })

    try {
      // Get auth token if available (for sharer)
      const token = userId ? sessionStorage.getItem("accessToken") : null
      
      const socket = io(import.meta.env.VITE_API_URL || "http://localhost:8080", {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        ...(token ? { auth: { token } } : {}),
      })

      socketRef.current = socket

      socket.on("connect", () => {
        console.log("✅ Socket connected!", { shareToken, socketId: socket.id })
        console.log("📤 Emitting join_screen_share event...", { shareToken })
        socket.emit("join_screen_share", { shareToken })
      })

      socket.on("connect_error", (err) => {
        console.error("❌ Socket connection error:", err)
        setError(`Connection failed: ${err.message}`)
      })

      socket.on("share_joined", async (data: { shareToken: string; isSharer: boolean; success?: boolean }) => {
        console.log("✅ Share joined!", data)
        if (data.success !== false) {
          setIsConnected(true)
        }
        
        // If we're a viewer, request an offer immediately (sharer might already be sharing)
        if (!isSharer && socketRef.current) {
          console.log("📨 Requesting offer as viewer...")
          socketRef.current.emit("request_offer", { shareToken })
        }
      })

      socket.on("viewer_joined", (data: { shareToken: string; viewerId: string }) => {
        console.log("👤 Viewer joined:", data.viewerId)
        // If we're the sharer and already sharing, create offer to new viewer
        if (isSharer && localStreamRef.current) {
          setTimeout(() => {
            createOffer(data.viewerId)
          }, 500)
        }
      })

      socket.on("sharing_started", () => {
        console.log("📺 Sharing started event received")
        // If we're a viewer, request an offer from sharer
        if (!isSharer && socketRef.current) {
          socketRef.current.emit("request_offer", { shareToken })
        }
      })

      socket.on("offer_requested", (data: { shareToken: string; viewerId: string }) => {
        console.log("📨 Offer requested by viewer:", data.viewerId)
        // If we're the sharer and already sharing, create offer
        if (isSharer && localStreamRef.current) {
          console.log("🎬 Sharer creating offer for viewer:", data.viewerId)
          setTimeout(() => {
            createOffer(data.viewerId)
          }, 100)
        } else if (isSharer) {
          console.log("⚠️ Sharer received offer request but not sharing yet")
        }
      })

      socket.on("viewers_list", (data: { shareToken: string; viewerIds: string[] }) => {
        console.log("👥 Received viewers list:", data.viewerIds)
        // If we're the sharer and already sharing, create offers to all viewers
        if (isSharer && localStreamRef.current && data.viewerIds.length > 0) {
          console.log("🎬 Creating offers to", data.viewerIds.length, "viewers")
          data.viewerIds.forEach((viewerId) => {
            setTimeout(() => {
              createOffer(viewerId)
            }, 100)
          })
        }
      })

      socket.on("webrtc_offer", handleOffer)
      socket.on("webrtc_answer", handleAnswer)
      socket.on("ice_candidate", handleICECandidate)

      socket.on("share_error", (data: { message: string }) => {
        console.error("❌ Share error:", data.message)
        setError(data.message)
      })

      if (socket.connected) {
        console.log("📤 Socket already connected, emitting join_screen_share immediately", { shareToken })
        socket.emit("join_screen_share", { shareToken })
      } else {
        console.log("⏳ Socket not connected yet, will emit on connect event")
      }
    } catch (err) {
      console.error("❌ Error joining share:", err)
      setError(err instanceof Error ? err.message : "Failed to join share")
    }
  }, [shareToken, userId, isSharer, isSharing, createOffer, handleOffer, handleAnswer, handleICECandidate])

  // Leave share
  const leaveShare = useCallback(() => {
    console.log("🚪 Leaving share...")
    
    stopScreenShare()
    
    if (socketRef.current) {
      socketRef.current.emit("leave_screen_share", { shareToken })
      socketRef.current.removeAllListeners()
      socketRef.current = null
    }

    peerConnectionsRef.current.forEach((pc) => {
      pc.close()
    })
    peerConnectionsRef.current.clear()
    remoteStreamsRef.current.clear()
    setRemoteStreams(new Map())

    setIsConnected(false)
  }, [shareToken, stopScreenShare])

  // Cleanup
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        leaveShare()
      }
    }
  }, [])

  return {
    isConnected,
    localStream,
    remoteStreams,
    isSharing,
    error,
    joinShare,
    leaveShare,
    startScreenShare,
    stopScreenShare,
    localVideoRef,
  }
}
