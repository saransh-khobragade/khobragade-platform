import { useState, useRef, useCallback } from "react"
import { io, type Socket } from "socket.io-client"
import { getAuthToken } from "@/lib/api/client"
import type { TransferStatus } from "../types"

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:8080"
const CHUNK_SIZE = 64 * 1024 // 64KB chunks

interface UseP2PFileTransferOptions {
  shareToken: string
  role: "sender" | "receiver"
  onStatusChange?: (status: TransferStatus) => void
}

export const useP2PFileTransfer = ({
  shareToken,
  role,
  onStatusChange,
}: UseP2PFileTransferOptions) => {
  const [status, setStatus] = useState<TransferStatus["status"]>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const fileRef = useRef<File | null>(null)
  const receivedChunksRef = useRef<Uint8Array[]>([])
  const expectedSizeRef = useRef(0)
  const mimeTypeRef = useRef<string>("")

  // STUN/TURN servers (using free STUN servers)
  const getRTCConfiguration = (): RTCConfiguration => {
    return {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        // Add TURN server here if needed for NAT traversal
      ],
    }
  }

  // Initialize WebRTC connection
  const initializeConnection = useCallback(async (tokenOverride?: string) => {
    try {
      // Use override token if provided, otherwise use prop
      const tokenToUse = tokenOverride || shareToken
      
      // Validate shareToken before proceeding
      if (!tokenToUse || tokenToUse.trim() === "") {
        console.error("Cannot initialize connection: shareToken is empty", { tokenOverride, shareToken })
        setError("Share token is required")
        setStatus("error")
        return
      }

      // Clean up existing connections
      if (socketRef.current) {
        console.log("Cleaning up existing socket connection")
        socketRef.current.removeAllListeners()
        socketRef.current.disconnect()
        socketRef.current = null
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      setStatus("connecting")
      setError(null)

      // Create peer connection
      const pc = new RTCPeerConnection(getRTCConfiguration())
      peerConnectionRef.current = pc

      // Setup socket connection
      // Token is optional for receivers (public share links)
      const token = getAuthToken()
      const socket = io(SOCKET_URL, {
        auth: token ? { token } : {},
        transports: ["websocket", "polling"],
      })
      socketRef.current = socket
      
      console.log("New socket created, waiting for connection...")

      // Handle connection errors
      socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err)
        setError(err.message || "Failed to connect to server")
        setStatus("error")
      })

      socket.on("share_error", (data: { shareToken: string; message: string }) => {
        const tokenToUse = tokenOverride || shareToken
        if (data.shareToken === tokenToUse) {
          console.error("Share error:", data.message)
          setError(data.message)
          setStatus("error")
        }
      })

      // Join share room when socket connects (or immediately if already connected)
      const joinRoom = () => {
        const tokenToUse = tokenOverride || shareToken
        if (!tokenToUse || tokenToUse.trim() === "") {
          console.error("Cannot join room: shareToken is empty", { tokenOverride, shareToken })
          setError("Share token is required")
          setStatus("error")
          return
        }
        // Small delay to ensure handlers are set up on backend
        setTimeout(() => {
          if (!socket.connected) {
            console.warn("Socket not connected when trying to join room")
            return
          }
          console.log("Emitting join_share:", { shareToken: tokenToUse, role, socketConnected: socket.connected, socketId: socket.id })
          socket.emit("join_share", { shareToken: tokenToUse, role })
        }, 200)
      }

      if (socket.connected) {
        console.log("Socket already connected, joining room")
        joinRoom()
      } else {
        console.log("Socket not connected yet, waiting for connect event")
        socket.on("connect", () => {
          console.log("Socket connected event fired, joining room")
          joinRoom()
        })
      }

      // Handle WebRTC offer (receiver receives, sender creates)
      socket.on("webrtc_offer", async (data: { sdp: string; shareToken?: string }) => {
        const tokenToUse = tokenOverride || shareToken
        if (role === "receiver" && (!data.shareToken || data.shareToken === tokenToUse)) {
          try {
            console.log("Received WebRTC offer, creating answer...")
            await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: data.sdp }))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socket.emit("webrtc_answer", {
              shareToken: tokenToUse,
              sdp: answer.sdp!,
              type: "answer",
            })
            console.log("WebRTC answer sent")
          } catch (err) {
            console.error("Error handling offer:", err)
            setError(err instanceof Error ? err.message : "Failed to handle offer")
            setStatus("error")
          }
        }
      })

      // Handle WebRTC answer (sender receives)
      socket.on("webrtc_answer", async (data: { sdp: string }) => {
        if (role === "sender") {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: data.sdp }))
          } catch (err) {
            console.error("Error handling answer:", err)
            setError(err instanceof Error ? err.message : "Failed to handle answer")
            setStatus("error")
          }
        }
      })

      // Handle ICE candidates
      socket.on("ice_candidate", async (data: { candidate: string; sdpMLineIndex: number | null; sdpMid: string | null }) => {
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
      })

      // Handle share join confirmation
      socket.on("share_joined", (data: { shareToken: string; role: string; success: boolean }) => {
        const tokenToUse = tokenOverride || shareToken
        if (data.shareToken === tokenToUse && data.success) {
          console.log("Successfully joined share room:", tokenToUse, "as", role)
          // Status stays as "connecting" until WebRTC connects
        }
      })

      // Handle transfer status updates
      socket.on("transfer_status", (data: TransferStatus) => {
        const tokenToUse = tokenOverride || shareToken
        if (data.shareToken === tokenToUse) {
          setStatus(data.status)
          if (data.progress !== undefined) {
            setProgress(data.progress)
          }
          if (data.error) {
            setError(data.error)
          }
          onStatusChange?.(data)
        }
      })

      // Handle peer joined - this fires when the other peer joins the room
      socket.on("peer_joined", (data: { shareToken: string; role: string }) => {
        const tokenToUse = tokenOverride || shareToken
        console.log("Peer joined event:", data, "my role:", role, "my token:", tokenToUse)
        if (data.shareToken === tokenToUse) {
          if (role === "sender" && data.role === "receiver") {
            // Receiver joined, sender creates offer
            console.log("Receiver joined! Creating WebRTC offer...")
            if (!pc || pc.signalingState === "closed") {
              console.error("PeerConnection not ready for offer creation")
              return
            }
            createOffer(pc, socket, tokenOverride)
          } else if (role === "receiver" && data.role === "sender") {
            // Sender joined, receiver waits for offer
            console.log("Sender joined! Waiting for WebRTC offer...")
            // Status stays as "connecting" until offer arrives and WebRTC connects
          } else {
            console.log("Peer joined but roles don't match:", { myRole: role, peerRole: data.role })
          }
        } else {
          console.log("Token mismatch:", { eventToken: data.shareToken, myToken: tokenToUse })
        }
      })

      // Setup data channel
      if (role === "sender") {
        const dc = pc.createDataChannel("fileTransfer", { ordered: true })
        setupDataChannel(dc, "sender")
        dataChannelRef.current = dc
      } else {
        // Receiver waits for data channel
        pc.ondatachannel = (event) => {
          console.log("Data channel received:", event.channel.label)
          setupDataChannel(event.channel, "receiver")
          dataChannelRef.current = event.channel
        }
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const tokenToUse = tokenOverride || shareToken
          socket.emit("ice_candidate", {
            shareToken: tokenToUse,
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid,
          })
        }
      }

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState
        console.log("WebRTC connection state:", state)
        if (state === "connected" || state === "connecting") {
          // Keep status as connecting until data channel opens
          if (state === "connected" && dataChannelRef.current?.readyState === "open") {
            setStatus("connected")
          }
        } else if (state === "disconnected" || state === "failed" || state === "closed") {
          setStatus("error")
          setError(`Connection ${state}`)
        }
      }

      // Update UI to show we're waiting for sender
      // The status will change to "connected" when WebRTC data channel opens
    } catch (err) {
      console.error("Error initializing connection:", err)
      setError(err instanceof Error ? err.message : "Failed to initialize connection")
      setStatus("error")
    }
  }, [shareToken, role, onStatusChange])

  // Create WebRTC offer (sender)
  const createOffer = async (pc: RTCPeerConnection, socket: Socket, tokenOverride?: string) => {
    try {
      const tokenToUse = tokenOverride || shareToken
      console.log("Creating WebRTC offer for token:", tokenToUse)
      const offer = await pc.createOffer()
      console.log("WebRTC offer created, setting local description...")
      await pc.setLocalDescription(offer)
      console.log("Emitting webrtc_offer to backend:", { shareToken: tokenToUse, sdpLength: offer.sdp?.length })
      socket.emit("webrtc_offer", {
        shareToken: tokenToUse,
        sdp: offer.sdp!,
        type: "offer",
      })
      console.log("WebRTC offer emitted successfully")
    } catch (err) {
      console.error("Error creating offer:", err)
      setError(err instanceof Error ? err.message : "Failed to create offer")
      setStatus("error")
    }
  }

      // Setup data channel handlers
      const setupDataChannel = (dc: RTCDataChannel, role: "sender" | "receiver") => {
        dc.onopen = () => {
          console.log("Data channel opened:", role)
          setStatus("connected")
          if (role === "sender" && fileRef.current) {
            sendFile(dc, fileRef.current)
          }
        }

    dc.onerror = (err) => {
      console.error("Data channel error:", err)
      setError("Data channel error")
      setStatus("error")
    }

    dc.onclose = () => {
      setStatus("completed")
    }

    if (role === "receiver") {
      dc.onmessage = (event) => {
        handleReceivedChunk(event.data)
      }
    }
  }

  // Send file in chunks (sender)
  const sendFile = async (dc: RTCDataChannel, file: File) => {
    try {
      setStatus("transferring")
      const fileSize = file.size
      let offset = 0

      // Send file metadata first
      dc.send(
        JSON.stringify({
          type: "metadata",
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        })
      )

      // Send file in chunks
      while (offset < fileSize) {
        const chunk = file.slice(offset, offset + CHUNK_SIZE)
        const arrayBuffer = await chunk.arrayBuffer()
        dc.send(arrayBuffer)

        offset += CHUNK_SIZE
        const progressPercent = Math.round((offset / fileSize) * 100)
        setProgress(progressPercent)

        // Small delay to prevent overwhelming the connection
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      // Send completion signal
      dc.send(JSON.stringify({ type: "complete" }))
      setStatus("completed")
      setProgress(100)
    } catch (err) {
      console.error("Error sending file:", err)
      setError(err instanceof Error ? err.message : "Failed to send file")
      setStatus("error")
    }
  }

  // Handle received chunks (receiver)
  const handleReceivedChunk = (data: string | ArrayBuffer) => {
    if (typeof data === "string") {
      try {
        const message = JSON.parse(data)
        if (message.type === "metadata") {
          expectedSizeRef.current = message.fileSize
          receivedChunksRef.current = []
          setStatus("transferring")
        } else if (message.type === "complete") {
          // Reconstruct file
          setStatus("completed")
          setProgress(100)
          // File is ready - will be handled by component
          return null
        }
      } catch {
        // Not JSON, treat as binary data
      }
    } else {
      // Binary chunk
      receivedChunksRef.current.push(new Uint8Array(data))
      const totalSize = receivedChunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0)
      const progressPercent = expectedSizeRef.current
        ? Math.round((totalSize / expectedSizeRef.current) * 100)
        : 0
      setProgress(progressPercent)
    }
  }

  // Start sending a file (sender)
  const startSend = useCallback(
    async (file: File) => {
      fileRef.current = file
      if (dataChannelRef.current?.readyState === "open") {
        sendFile(dataChannelRef.current, file)
      } else {
        await initializeConnection()
      }
    },
        [initializeConnection]
  )

  // Get received file (receiver)
  const getReceivedFile = useCallback((): Blob | null => {
    if (status === "completed" && receivedChunksRef.current.length > 0) {
      // Convert Uint8Array[] to BlobPart[] - use chunks directly (they are BlobPart compatible)
      return new Blob(receivedChunksRef.current as BlobPart[], { type: mimeTypeRef.current })
    }
    return null
  }, [status])

  // Cleanup
  const cleanup = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (socketRef.current) {
      socketRef.current.emit("leave_share", { shareToken })
      socketRef.current.disconnect()
      socketRef.current = null
    }
    receivedChunksRef.current = []
    fileRef.current = null
    expectedSizeRef.current = 0
    mimeTypeRef.current = ""
  }, [shareToken])

  return {
    status,
    progress,
    error,
    initializeConnection,
    startSend,
    getReceivedFile,
    cleanup,
  }
}
