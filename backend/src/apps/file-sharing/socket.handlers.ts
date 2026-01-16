import type { Socket } from "socket.io"
import { fileSharingService } from "./service.js"
import { logger } from "../../lib/logger.js"
import type { WebRTCOffer, WebRTCAnswer, ICECandidate, TransferStatus } from "./types.js"

// Track active file transfer sessions: shareToken -> { senderSocketId, receiverSocketId }
const activeTransfers = new Map<string, { senderSocketId?: string; receiverSocketId?: string }>()

/**
 * Setup file sharing socket handlers for WebRTC signaling
 */
export const setupFileSharingSocketHandlers = (socket: Socket): void => {
  const user = socket.data.user

  // Join share room for WebRTC signaling
  socket.on("join_share", async (data: { shareToken: string; role: "sender" | "receiver" }) => {
    try {
      logger.info({ socketId: socket.id, data, hasUser: !!user }, "join_share event received")
      const { shareToken, role } = data

      if (!shareToken || !role) {
        logger.error({ data }, "Invalid join_share data")
        socket.emit("share_error", { shareToken: shareToken || "unknown", message: "Invalid share token or role" })
        return
      }

      // Verify share exists and is valid
      const share = await fileSharingService.getShareByToken(shareToken)
      if (!share) {
        logger.warn({ shareToken }, "Share not found")
        socket.emit("share_error", { shareToken, message: "Share not found or expired" })
        return
      }

      // Sender must be authenticated and be the owner
      if (role === "sender") {
        if (!user) {
          socket.emit("share_error", { shareToken, message: "Authentication required to send files" })
          return
        }
        if (share.sharedBy !== user.userId) {
          socket.emit("share_error", { shareToken, message: "Not authorized to send this file" })
          return
        }
      }
      // Receiver can be unauthenticated (public share link)

      // Join share room
      const room = `share:${shareToken}`
      socket.join(room)

      // Track transfer session
      if (!activeTransfers.has(shareToken)) {
        activeTransfers.set(shareToken, {})
      }
      const transfer = activeTransfers.get(shareToken)!
      if (role === "sender") {
        transfer.senderSocketId = socket.id
      } else {
        transfer.receiverSocketId = socket.id
      }

      logger.info({ userId: user?.userId, shareToken, role, socketId: socket.id }, "User joined share room")

      // Confirm join to the socket that joined
      socket.emit("share_joined", { shareToken, role, success: true })

      // Notify others in the room
      socket.to(room).emit("peer_joined", { shareToken, role })
    } catch (error) {
      logger.error({ error }, "Join share failed")
      socket.emit("share_error", { message: "Failed to join share" })
    }
  })

  // Leave share room
  socket.on("leave_share", (data: { shareToken: string }) => {
    const { shareToken } = data
    const room = `share:${shareToken}`
    socket.leave(room)

    // Clean up transfer tracking
    const transfer = activeTransfers.get(shareToken)
    if (transfer) {
      if (transfer.senderSocketId === socket.id) {
        transfer.senderSocketId = undefined
      }
      if (transfer.receiverSocketId === socket.id) {
        transfer.receiverSocketId = undefined
      }
      if (!transfer.senderSocketId && !transfer.receiverSocketId) {
        activeTransfers.delete(shareToken)
      }
    }

    logger.info({ userId: user?.userId, shareToken }, "User left share room")
  })

  // Handle WebRTC offer (from sender)
  socket.on("webrtc_offer", async (data: WebRTCOffer) => {
    try {
      const { shareToken, sdp } = data

      // Ignore if this is a video chat event (has roomId instead of shareToken)
      if (!shareToken || (data as any).roomId) {
        return // This is a video chat event, not file sharing
      }

      // Verify share exists
      const share = await fileSharingService.getShareByToken(shareToken)
      if (!share) {
        socket.emit("share_error", { shareToken, message: "Share not found" })
        return
      }

      // Verify user is the sender (must be authenticated)
      if (!user || share.sharedBy !== user.userId) {
        socket.emit("share_error", { shareToken, message: "Not authorized" })
        return
      }

      // Relay offer to receiver in the share room
      const room = `share:${shareToken}`
      logger.info({ userId: user.userId, shareToken, room, sdpLength: sdp.length }, "Relaying WebRTC offer to receiver")
      socket.to(room).emit("webrtc_offer", { shareToken, sdp, type: "offer" })

      logger.info({ userId: user.userId, shareToken }, "WebRTC offer relayed")
    } catch (error) {
      logger.error({ error }, "WebRTC offer failed")
      socket.emit("share_error", { message: "Failed to send offer" })
    }
  })

  // Handle WebRTC answer (from receiver)
  socket.on("webrtc_answer", async (data: WebRTCAnswer) => {
    try {
      const { shareToken, sdp } = data

      // Ignore if this is a video chat event (has roomId instead of shareToken)
      if (!shareToken || (data as any).roomId) {
        return // This is a video chat event, not file sharing
      }

      // Verify share exists
      const share = await fileSharingService.getShareByToken(shareToken)
      if (!share) {
        socket.emit("share_error", { shareToken, message: "Share not found" })
        return
      }

      // Relay answer to sender in the share room
      const room = `share:${shareToken}`
      socket.to(room).emit("webrtc_answer", { shareToken, sdp, type: "answer" })

      logger.info({ userId: user.userId, shareToken }, "WebRTC answer relayed")
    } catch (error) {
      logger.error({ error }, "WebRTC answer failed")
      socket.emit("share_error", { message: "Failed to send answer" })
    }
  })

  // Handle ICE candidate exchange
  socket.on("ice_candidate", async (data: ICECandidate) => {
    try {
      const { shareToken, candidate, sdpMLineIndex, sdpMid } = data

      // Ignore if this is a video chat event (has roomId instead of shareToken)
      if (!shareToken || (data as any).roomId) {
        return // This is a video chat event, not file sharing
      }

      // Verify share exists
      const share = await fileSharingService.getShareByToken(shareToken)
      if (!share) {
        return // Silently ignore if share doesn't exist
      }

      // Relay ICE candidate to peer in the share room
      const room = `share:${shareToken}`
      socket.to(room).emit("ice_candidate", {
        shareToken,
        candidate,
        sdpMLineIndex,
        sdpMid,
      })

      logger.debug({ userId: user.userId, shareToken }, "ICE candidate relayed")
    } catch (error) {
      logger.error({ error }, "ICE candidate failed")
    }
  })

  // Handle transfer status updates
  socket.on("transfer_status", (data: TransferStatus) => {
    const { shareToken, status, progress, error } = data

    // Relay status to peer in the share room
    const room = `share:${shareToken}`
    socket.to(room).emit("transfer_status", {
      shareToken,
      status,
      progress,
      error,
    })

    logger.info({ userId: user.userId, shareToken, status, progress }, "Transfer status updated")
  })

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    // Clean up any transfers this socket was part of
    for (const [shareToken, transfer] of activeTransfers.entries()) {
      if (transfer.senderSocketId === socket.id) {
        transfer.senderSocketId = undefined
      }
      if (transfer.receiverSocketId === socket.id) {
        transfer.receiverSocketId = undefined
      }
      if (!transfer.senderSocketId && !transfer.receiverSocketId) {
        activeTransfers.delete(shareToken)
      }
    }
  })
}
