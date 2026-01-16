import { useState, useRef, useCallback, useEffect } from "react"
import { io, type Socket } from "socket.io-client"
import type { RoomParticipant, WebRTCOffer, WebRTCAnswer, ICECandidate } from "../types"
import { getAuthToken } from "@/lib/api/client"

interface UseWebRTCOptions {
  roomId: string
  userId: string
  onParticipantsChange?: (participants: RoomParticipant[]) => void
}

export const useWebRTC = ({ roomId, userId, onParticipantsChange }: UseWebRTCOptions) => {
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map()) // State for React reactivity

  const socketRef = useRef<Socket | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map()) // Keep ref for immediate access
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null) // Track stream in ref for immediate access

  // STUN/TURN servers
  const getRTCConfiguration = (): RTCConfiguration => {
    return {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        // Add TURN server here if needed for NAT traversal
      ],
    }
  }

  // Initialize local media stream
  const initializeLocalStream = useCallback(async () => {
    try {
      console.log("Requesting camera/microphone access...")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      })
      console.log("Media stream obtained:", stream.id, "tracks:", stream.getTracks().length)
      localStreamRef.current = stream // Update ref immediately (synchronous)
      setLocalStream(stream) // Update state (asynchronous)
      
      // Set video element if available
      if (localVideoRef.current) {
        console.log("Setting local video element srcObject")
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play().catch((err) => {
          console.error("Error playing local video:", err)
        })
      }
      return stream
    } catch (err) {
      console.error("Error accessing media devices:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera/microphone"
      setError(errorMessage)
      if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Camera/microphone permission denied. Please allow access and refresh.")
      } else if (err instanceof Error && err.name === "NotFoundError") {
        setError("No camera/microphone found. Please connect a device.")
      }
      throw err
    }
  }, [])

  // Create peer connection for a specific user
  const createPeerConnection = useCallback(
    (targetUserId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(getRTCConfiguration())

      // Add local stream tracks to peer connection (use ref for immediate access)
      const stream = localStreamRef.current || localStream
      if (stream) {
        console.log("📡 Adding", stream.getTracks().length, "tracks to peer connection for", targetUserId)
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream)
        })
      } else {
        console.warn("⚠️ No local stream available when creating peer connection for", targetUserId)
      }

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log("🎥 Received remote stream from:", targetUserId, "stream:", event.streams[0]?.id)
        console.log("📹 Track event details:", {
          streams: event.streams.length,
          track: event.track.kind,
          trackId: event.track.id,
          trackState: event.track.readyState
        })
        const remoteStream = event.streams[0]
        if (remoteStream) {
          console.log("✅ Remote stream has tracks:", remoteStream.getTracks().map(t => `${t.kind}:${t.id}`))
          remoteStreamsRef.current.set(targetUserId, remoteStream)
          // Update state to trigger React re-render
          setRemoteStreams(new Map(remoteStreamsRef.current))
          console.log("📊 Remote stream added, total remote streams:", remoteStreamsRef.current.size)
          
          // Dispatch a custom event to notify VideoRoom component
          window.dispatchEvent(new CustomEvent("remoteStreamAdded", { detail: { userId: targetUserId } }))
        } else {
          console.warn("⚠️ Remote stream event has no streams")
        }
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice_candidate", {
            roomId,
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
        console.log(`🔗 Connection state with ${targetUserId}:`, state, "signaling:", pc.signalingState)
        if (state === "connected") {
          console.log("✅ WebRTC connection established with", targetUserId)
        } else if (state === "failed" || state === "disconnected") {
          console.warn("⚠️ Connection failed/disconnected with", targetUserId)
          // Cleanup
          peerConnectionsRef.current.delete(targetUserId)
          remoteStreamsRef.current.delete(targetUserId)
          setRemoteStreams(new Map(remoteStreamsRef.current)) // Update state
        }
      }

      // Handle ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log(`🧊 ICE connection state with ${targetUserId}:`, pc.iceConnectionState)
      }

      // Handle ICE gathering state
      pc.onicegatheringstatechange = () => {
        console.log(`🧊 ICE gathering state with ${targetUserId}:`, pc.iceGatheringState)
      }

      return pc
    },
    [roomId, userId, localStream]
  )

  // Create and send offer to a peer
  const createOffer = useCallback(
    async (targetUserId: string) => {
      // Use ref for immediate access (state might not be updated yet)
      const stream = localStreamRef.current || localStream
      if (!stream) {
        console.warn("⚠️ Cannot create offer - local stream not available yet")
        return
      }

      console.log("📡 Creating WebRTC offer for:", targetUserId, "with stream:", stream.id)
      const pc = createPeerConnection(targetUserId)
      peerConnectionsRef.current.set(targetUserId, pc)

      try {
        console.log("🔨 Creating offer SDP...")
        const offer = await pc.createOffer()
        console.log("✅ Offer created, setting local description...")
        await pc.setLocalDescription(offer)
        console.log("📤 Emitting webrtc_offer to backend...")

        if (socketRef.current) {
          socketRef.current.emit("webrtc_offer", {
            roomId,
            fromUserId: userId,
            sdp: offer.sdp!,
            type: "offer",
          })
          console.log("✅ WebRTC offer emitted successfully")
        } else {
          console.error("❌ Socket not available to emit offer")
        }
      } catch (err) {
        console.error("❌ Error creating offer:", err)
        setError(err instanceof Error ? err.message : "Failed to create offer")
      }
    },
    [roomId, userId, localStream, createPeerConnection]
  )

  // Handle WebRTC offer from another peer
  const handleOffer = useCallback(
    async (data: WebRTCOffer) => {
      if (data.fromUserId === userId) {
        console.log("⏭️ Ignoring own offer")
        return // Ignore own offers
      }

      // Use ref for immediate access (state might not be updated yet)
      let stream = localStreamRef.current || localStream
      if (!stream) {
        console.warn("⚠️ Received offer but local stream not ready yet, waiting...")
        // Wait a bit for local stream to be ready
        await new Promise((resolve) => setTimeout(resolve, 500))
        stream = localStreamRef.current || localStream
        if (!stream) {
          console.error("❌ Local stream still not available after wait")
          return
        }
      }

      console.log("📥 Received WebRTC offer from:", data.fromUserId)
      let pc = peerConnectionsRef.current.get(data.fromUserId)
      if (!pc) {
        console.log("🆕 Creating new peer connection for offer sender")
        pc = createPeerConnection(data.fromUserId)
        peerConnectionsRef.current.set(data.fromUserId, pc)
      }

      // Check if we already have a remote description (avoid duplicate offers)
      if (pc.remoteDescription) {
        console.warn("⚠️ Remote description already set for this peer, ignoring duplicate offer")
        return
      }

      try {
        console.log("🔧 Setting remote description (offer)...", "Current signaling state:", pc.signalingState)
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: data.sdp }))
        console.log("✅ Remote description set, creating answer...")
        const answer = await pc.createAnswer()
        console.log("✅ Answer created, setting local description...")
        await pc.setLocalDescription(answer)
        console.log("📤 Emitting webrtc_answer to backend...")

        if (socketRef.current) {
          socketRef.current.emit("webrtc_answer", {
            roomId,
            fromUserId: userId,
            sdp: answer.sdp!,
            type: "answer",
          })
          console.log("✅ WebRTC answer emitted successfully")
        } else {
          console.error("❌ Socket not available to emit answer")
        }
      } catch (err: any) {
        // Ignore InvalidStateError if connection is already stable (race condition)
        if (err?.name === "InvalidStateError" && pc.signalingState === "stable") {
          console.log("ℹ️ Ignoring InvalidStateError - connection already stable")
          return
        }
        console.error("❌ Error handling offer:", err)
        setError(err instanceof Error ? err.message : "Failed to handle offer")
      }
    },
    [roomId, userId, localStream, createPeerConnection]
  )

  // Handle WebRTC answer from another peer
  const handleAnswer = useCallback(async (data: WebRTCAnswer) => {
    if (data.fromUserId === userId) {
      console.log("⏭️ Ignoring own answer")
      return // Ignore own answers
    }

    console.log("📥 Received WebRTC answer from:", data.fromUserId)
    const pc = peerConnectionsRef.current.get(data.fromUserId)
    if (!pc) {
      console.warn("⚠️ No peer connection found for answer from:", data.fromUserId)
      return
    }

    // Check if remote description is already set or connection is stable
    if (pc.remoteDescription) {
      console.warn("⚠️ Remote description already set, ignoring duplicate answer")
      return
    }

    const signalingState = pc.signalingState as RTCSignalingState
    if (signalingState === "stable") {
      console.warn("⚠️ Connection already stable, ignoring answer")
      return
    }

    try {
      console.log("🔧 Setting remote description (answer)...", "Current signaling state:", pc.signalingState)
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.sdp }))
      console.log("✅ Remote description (answer) set successfully")
      console.log("🔗 Peer connection state:", pc.connectionState, "signaling state:", pc.signalingState)
    } catch (err: any) {
      // Ignore InvalidStateError if connection is already stable (race condition)
      const signalingState = pc.signalingState as RTCSignalingState
      if (err?.name === "InvalidStateError" && signalingState === "stable") {
        console.log("ℹ️ Ignoring InvalidStateError - connection already stable")
        return
      }
      console.error("❌ Error handling answer:", err)
      setError(err instanceof Error ? err.message : "Failed to handle answer")
    }
  }, [userId])

  // Handle ICE candidate from another peer
  const handleICECandidate = useCallback(async (data: ICECandidate) => {
    if (data.fromUserId === userId) {
      return // Ignore own candidates
    }

    console.log("🧊 Received ICE candidate from:", data.fromUserId)
    const pc = peerConnectionsRef.current.get(data.fromUserId)
    if (!pc) {
      console.warn("⚠️ No peer connection found for ICE candidate from:", data.fromUserId)
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
      console.log("✅ ICE candidate added successfully")
    } catch (err) {
      console.error("❌ Error adding ICE candidate:", err)
    }
  }, [userId])

  // Join room
  const joinRoom = useCallback(async () => {
    if (!roomId || !userId) {
      console.warn("Cannot join room - missing roomId or userId", { roomId, userId })
      return
    }

    console.log("🚀 Starting joinRoom process...", { roomId, userId })

    try {
      // Create socket connection FIRST (before requesting media)
      const token = getAuthToken()
      if (!token) {
        console.error("❌ No auth token available for video chat")
        setError("Authentication required for video chat")
        return
      }
      
      console.log("🔌 Creating socket connection...")
      const socket = io(import.meta.env.VITE_API_URL || "http://localhost:8080", {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      socketRef.current = socket

      socket.on("connect", () => {
        console.log("✅ Socket connected! Socket ID:", socket.id, "Joining room:", roomId)
        // Small delay to ensure socket is fully ready
        setTimeout(() => {
          if (socketRef.current === socket && socket.connected) {
            console.log("📤 Emitting join_room event...")
            socket.emit("join_room", { roomId })
          } else {
            console.warn("⚠️ Socket changed or disconnected before join_room emit")
          }
        }, 100)
      })

      socket.on("connect_error", (err) => {
        console.error("❌ Socket connection error:", err)
        setError(`Connection failed: ${err.message}`)
      })

      socket.on("disconnect", (reason) => {
        console.warn("⚠️ Socket disconnected:", reason)
        // Only set error if it's not a manual disconnect
        if (reason !== "io client disconnect") {
          setError(`Connection lost: ${reason}`)
        }
      })

      socket.on("room_joined", async (data: { roomId: string; participants: RoomParticipant[] }) => {
        console.log("✅ Room joined successfully!", data)
        setIsConnected(true)
        setParticipants(data.participants)

        // Initialize local stream FIRST (before creating offers)
        try {
          console.log("🎥 Requesting camera/microphone access...")
          await initializeLocalStream()
          console.log("✅ Local stream initialized")
          
          // NOW create offers to existing participants (after local stream is ready)
          data.participants.forEach((participant) => {
            if (participant.userId !== userId) {
              console.log("📡 Creating offer for participant:", participant.userId)
              createOffer(participant.userId)
            }
          })
        } catch (err) {
          console.error("⚠️ Failed to initialize local stream, but continuing:", err)
          // Don't block room joining if media fails, but we won't be able to send video
        }
      })

      socket.on("participant_joined", (data: { roomId: string; participant: RoomParticipant }) => {
        console.log("👤 Participant joined:", data.participant)
        setParticipants((prev) => {
          if (prev.some((p) => p.userId === data.participant.userId)) {
            return prev
          }
          return [...prev, data.participant]
        })

        // Create offer to new participant (only if we have local stream)
        const stream = localStreamRef.current || localStream
        if (data.participant.userId !== userId && stream) {
          console.log("📡 Creating offer for new participant:", data.participant.userId)
          createOffer(data.participant.userId)
        } else if (!stream) {
          console.warn("⚠️ Cannot create offer - local stream not ready yet")
        }
      })

      socket.on("participant_left", (data: { roomId: string; socketId: string; userId: string }) => {
        console.log("Participant left:", data)
        setParticipants((prev) => prev.filter((p) => p.userId !== data.userId))

        // Cleanup peer connection
        const pc = peerConnectionsRef.current.get(data.userId)
        if (pc) {
          pc.close()
          peerConnectionsRef.current.delete(data.userId)
        }
        remoteStreamsRef.current.delete(data.userId)
        setRemoteStreams(new Map(remoteStreamsRef.current)) // Update state
      })

      socket.on("webrtc_offer", handleOffer)
      socket.on("webrtc_answer", handleAnswer)
      socket.on("ice_candidate", handleICECandidate)

      socket.on("room_error", (data: { message: string }) => {
        console.error("❌ Room error:", data.message)
        setError(data.message)
      })

      // Wait for socket to connect before proceeding
      if (socket.connected) {
        console.log("✅ Socket already connected, emitting join_room immediately")
        socket.emit("join_room", { roomId })
      } else {
        console.log("⏳ Socket not connected yet, waiting for connect event...")
      }
    } catch (err) {
      console.error("❌ Error joining room:", err)
      setError(err instanceof Error ? err.message : "Failed to join room")
    }
  }, [roomId, userId, initializeLocalStream, createOffer, handleOffer, handleAnswer, handleICECandidate])


  // Leave room
  const leaveRoom = useCallback(() => {
    console.log("🚪 Leaving room...", { roomId })
    
    if (socketRef.current) {
      console.log("📤 Emitting leave_room event...")
      socketRef.current.emit("leave_room", { roomId })
      // Don't disconnect immediately - let server handle cleanup
      // socketRef.current.disconnect()
      socketRef.current.removeAllListeners()
      socketRef.current = null
    }

    // Stop local stream
    const stream = localStreamRef.current || localStream
    if (stream) {
      console.log("🛑 Stopping local stream tracks...")
      stream.getTracks().forEach((track) => {
        track.stop()
        console.log("Stopped track:", track.kind)
      })
      localStreamRef.current = null
      setLocalStream(null)
    }

    // Close all peer connections
    console.log("🔌 Closing peer connections...", peerConnectionsRef.current.size)
    peerConnectionsRef.current.forEach((pc) => {
      pc.close()
    })
    peerConnectionsRef.current.clear()
    remoteStreamsRef.current.clear()
    setRemoteStreams(new Map()) // Update state

    setIsConnected(false)
    setParticipants([])
    console.log("✅ Room left successfully")
  }, [roomId, localStream])

  // Cleanup on unmount - only disconnect when component actually unmounts
  useEffect(() => {
    return () => {
      console.log("🧹 useWebRTC cleanup - component unmounting")
      // Only cleanup if we're actually leaving (not just re-rendering)
      if (socketRef.current) {
        leaveRoom()
      }
    }
  }, []) // Empty deps - only run on unmount

  // Notify parent of participants change (debounced to avoid excessive calls)
  useEffect(() => {
    if (onParticipantsChange && participants.length >= 0) {
      // Only call if participants actually changed
      onParticipantsChange(participants)
    }
  }, [participants, onParticipantsChange])

  return {
    isConnected,
    participants,
    localStream,
    remoteStreams, // Return state instead of ref
    error,
    joinRoom,
    leaveRoom,
    localVideoRef,
  }
}
