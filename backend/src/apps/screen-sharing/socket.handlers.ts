import type { Socket } from "socket.io"
import { screenSharingService } from "./service.js"
import { logger } from "../../lib/logger.js"
import type { WebRTCOffer, WebRTCAnswer, ICECandidate } from "./types.js"

// Track active share participants: shareToken -> Set<socketId>
const shareParticipants = new Map<string, Set<string>>()
// Track sharer socket IDs: shareToken -> socketId
const sharerSockets = new Map<string, string>()

/**
 * Setup screen sharing socket handlers for WebRTC signaling
 * Viewers don't need authentication, but sharer does
 */
export const setupScreenSharingSocketHandlers = (socket: Socket): void => {
  const user = socket.data.user
  
  logger.info({ socketId: socket.id, userId: user?.userId }, "Setting up screen sharing socket handlers")

  // Join screen share (public - viewers don't need auth)
  socket.on("join_screen_share", async (data: { shareToken: string }) => {
    try {
      logger.info({ socketId: socket.id, data, userId: user?.userId }, "join_share event received")
      const { shareToken } = data

      if (!shareToken) {
        logger.warn({ socketId: socket.id }, "join_share called without shareToken")
        socket.emit("share_error", { shareToken: shareToken || "unknown", message: "Share token is required" })
        return
      }

      // Verify share exists and is active
      let share
      try {
        share = await screenSharingService.getShareByToken(shareToken)
        if (!share) {
          logger.warn({ shareToken, userId: user?.userId }, "Screen share not found or inactive")
          socket.emit("share_error", { shareToken, message: "Screen share not found or expired" })
          return
        }
      } catch (error) {
        logger.error({ error, shareToken }, "Error fetching screen share")
        socket.emit("share_error", { shareToken, message: "Failed to verify screen share" })
        return
      }

      // Join socket room
      const socketRoom = `screen-share:${shareToken}`
      socket.join(socketRoom)

      // Track participant
      if (!shareParticipants.has(shareToken)) {
        shareParticipants.set(shareToken, new Set())
      }
      shareParticipants.get(shareToken)!.add(socket.id)

      logger.info({ userId: user?.userId, shareToken, socketId: socket.id }, "User joined screen share")

      const isSharer = user?.userId === share.sharedBy
      
      // Track sharer socket
      if (isSharer) {
        sharerSockets.set(shareToken, socket.id)
      }

      // Confirm join
      logger.info({ socketId: socket.id, shareToken, isSharer }, "Emitting share_joined event")
      socket.emit("share_joined", {
        shareToken,
        success: true,
        isSharer,
      })
      logger.info({ socketId: socket.id, shareToken, isSharer }, "share_joined event emitted")

      // Notify sharer about new viewer (if not the sharer themselves)
      if (!isSharer) {
        socket.to(socketRoom).emit("viewer_joined", {
          shareToken,
          viewerId: socket.id,
        })
      } else {
        // If sharer joined, notify all viewers
        socket.to(socketRoom).emit("sharer_joined", {
          shareToken,
        })
      }
    } catch (error) {
      logger.error({ error }, "Join screen share failed")
      socket.emit("share_error", { message: "Failed to join screen share" })
    }
  })

  // Leave screen share
  socket.on("leave_screen_share", (data: { shareToken: string }) => {
    const { shareToken } = data
    const socketRoom = `screen-share:${shareToken}`
    socket.leave(socketRoom)

    // Remove participant tracking
    const participants = shareParticipants.get(shareToken)
    if (participants) {
      participants.delete(socket.id)
      if (participants.size === 0) {
        shareParticipants.delete(shareToken)
        sharerSockets.delete(shareToken)
      }
    }
    
    // Remove sharer tracking if this was the sharer
    if (sharerSockets.get(shareToken) === socket.id) {
      sharerSockets.delete(shareToken)
    }

    logger.info({ userId: user?.userId, shareToken, socketId: socket.id }, "User left screen share")

    // Notify others
    socket.to(socketRoom).emit("viewer_left", {
      shareToken,
      socketId: socket.id,
    })
  })

  // Handle WebRTC offer (from sharer to viewers, or viewer to sharer)
  socket.on("webrtc_offer", (data: WebRTCOffer) => {
    const { shareToken } = data

    // Verify user is in the share
    const participants = shareParticipants.get(shareToken)
    if (!participants || !participants.has(socket.id)) {
      socket.emit("share_error", { shareToken, message: "Not in share" })
      return
    }

    // Relay offer to all other participants in the share
    const socketRoom = `screen-share:${shareToken}`
    logger.info({ userId: user?.userId, shareToken, sdpLength: data.sdp.length }, "Relaying WebRTC offer")
    socket.to(socketRoom).emit("webrtc_offer", { ...data, type: "offer" })
  })

  // Handle WebRTC answer
  socket.on("webrtc_answer", (data: WebRTCAnswer) => {
    const { shareToken } = data

    // Verify user is in the share
    const participants = shareParticipants.get(shareToken)
    if (!participants || !participants.has(socket.id)) {
      socket.emit("share_error", { shareToken, message: "Not in share" })
      return
    }

    // Send answer only to the sharer
    const sharerSocketId = sharerSockets.get(shareToken)
    if (sharerSocketId) {
      socket.to(sharerSocketId).emit("webrtc_answer", { ...data, type: "answer" })
    } else {
      // Fallback: broadcast to all (shouldn't happen)
      const socketRoom = `screen-share:${shareToken}`
      socket.to(socketRoom).emit("webrtc_answer", { ...data, type: "answer" })
    }
  })

  // Handle sharing started event (from sharer)
  socket.on("sharing_started", (data: { shareToken: string }) => {
    const { shareToken } = data
    const socketRoom = `screen-share:${shareToken}`
    // Broadcast to all viewers
    socket.to(socketRoom).emit("sharing_started", { shareToken })
  })

  // Handle get viewers request (from sharer)
  socket.on("get_viewers", (data: { shareToken: string }) => {
    const { shareToken } = data
    const participants = shareParticipants.get(shareToken)
    if (participants) {
      // Send list of viewer socket IDs to the sharer
      const viewerIds = Array.from(participants).filter(id => id !== socket.id)
      socket.emit("viewers_list", {
        shareToken,
        viewerIds,
      })
    }
  })

  // Handle request for offer (from viewer)
  socket.on("request_offer", (data: { shareToken: string }) => {
    const { shareToken } = data
    // Verify user is in the share
    const participants = shareParticipants.get(shareToken)
    if (!participants || !participants.has(socket.id)) {
      return
    }
    
    // Notify sharer that a viewer wants an offer
    const socketRoom = `screen-share:${shareToken}`
    socket.to(socketRoom).emit("offer_requested", {
      shareToken,
      viewerId: socket.id,
    })
  })

  // Handle ICE candidate exchange
  socket.on("ice_candidate", (data: ICECandidate) => {
    const { shareToken } = data
    
    // Only relay if user is tracked as a participant
    const participants = shareParticipants.get(shareToken)
    if (!participants || !participants.has(socket.id)) {
      return // Silently ignore if not in share
    }

    // Relay ICE candidate to all other participants
    const socketRoom = `screen-share:${shareToken}`
    socket.to(socketRoom).emit("ice_candidate", data)
  })

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    // Remove from all shares
    for (const [shareToken, participants] of shareParticipants.entries()) {
      if (participants.has(socket.id)) {
        participants.delete(socket.id)
        if (participants.size === 0) {
          shareParticipants.delete(shareToken)
        } else {
          // Notify others
          const socketRoom = `screen-share:${shareToken}`
          socket.to(socketRoom).emit("viewer_left", {
            shareToken,
            socketId: socket.id,
          })
        }
      }
    }

    logger.info({ userId: user?.userId, socketId: socket.id }, "User disconnected from screen sharing")
  })
}
