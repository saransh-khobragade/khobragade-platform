import type { Socket } from "socket.io"
import { videoChatService } from "./service.js"
import { logger } from "../../lib/logger.js"
import type { WebRTCOffer, WebRTCAnswer, ICECandidate, RoomParticipant } from "./types.js"

// Track active room participants: roomId -> Map<socketId, participant>
const roomParticipants = new Map<string, Map<string, RoomParticipant>>()

/**
 * Setup video chat socket handlers for WebRTC signaling
 */
export const setupVideoChatSocketHandlers = (socket: Socket): void => {
  const user = socket.data.user

  if (!user) {
    logger.warn({ socketId: socket.id }, "Unauthenticated socket attempted to use video chat")
    return
  }

  // Join room for video chat
  socket.on("join_room", async (data: { roomId: string }) => {
    try {
      const { roomId } = data

      if (!roomId) {
        socket.emit("room_error", { roomId: roomId || "unknown", message: "Room ID is required" })
        return
      }

      // Verify room exists and is active
      const room = await videoChatService.getRoomById(roomId)
      if (!room || !room.isActive) {
        logger.warn({ roomId, userId: user.userId }, "Room not found or inactive")
        socket.emit("room_error", { roomId, message: "Room not found or inactive" })
        return
      }

      // Join socket room
      const socketRoom = `room:${roomId}`
      socket.join(socketRoom)

      // Track participant
      if (!roomParticipants.has(roomId)) {
        roomParticipants.set(roomId, new Map())
      }
      const participants = roomParticipants.get(roomId)!
      participants.set(socket.id, {
        userId: user.userId,
        socketId: socket.id,
        username: user.username,
        name: user.name || null,
      })

      logger.info({ userId: user.userId, roomId, socketId: socket.id }, "User joined video room")

      // Get list of existing participants (excluding self)
      const existingParticipants = Array.from(participants.values()).filter(
        (p) => p.socketId !== socket.id
      )

      // Confirm join to the socket that joined
      socket.emit("room_joined", {
        roomId,
        success: true,
        participants: existingParticipants,
      })

      // Notify others in the room about new participant
      socket.to(socketRoom).emit("participant_joined", {
        roomId,
        participant: {
          userId: user.userId,
          socketId: socket.id,
          username: user.username,
          name: user.name || null,
        },
      })
    } catch (error) {
      logger.error({ error }, "Join room failed")
      socket.emit("room_error", { message: "Failed to join room" })
    }
  })

  // Leave room
  socket.on("leave_room", (data: { roomId: string }) => {
    const { roomId } = data
    const socketRoom = `room:${roomId}`
    socket.leave(socketRoom)

    // Remove participant tracking
    const participants = roomParticipants.get(roomId)
    if (participants) {
      participants.delete(socket.id)
      if (participants.size === 0) {
        roomParticipants.delete(roomId)
      }
    }

    logger.info({ userId: user?.userId, roomId, socketId: socket.id }, "User left video room")

    // Notify others in the room
    socket.to(socketRoom).emit("participant_left", {
      roomId,
      socketId: socket.id,
      userId: user?.userId,
    })
  })

  // Handle WebRTC offer (from one peer to another)
  socket.on("webrtc_offer", (data: WebRTCOffer) => {
    const { roomId, fromUserId, sdp } = data

    // Verify user is in the room (using participant tracking - already validated on join)
    const participants = roomParticipants.get(roomId)
    if (!participants || !participants.has(socket.id)) {
      socket.emit("room_error", { roomId, message: "Not in room" })
      return
    }

    // Relay offer to all other participants in the room
    const socketRoom = `room:${roomId}`
    logger.info({ userId: user.userId, roomId, fromUserId, sdpLength: sdp.length }, "Relaying WebRTC offer")
    socket.to(socketRoom).emit("webrtc_offer", { ...data, type: "offer" })

    logger.info({ userId: user.userId, roomId }, "WebRTC offer relayed")
  })

  // Handle WebRTC answer
  socket.on("webrtc_answer", (data: WebRTCAnswer) => {
    const { roomId, fromUserId, sdp } = data

    // Verify user is in the room (using participant tracking - already validated on join)
    const participants = roomParticipants.get(roomId)
    if (!participants || !participants.has(socket.id)) {
      socket.emit("room_error", { roomId, message: "Not in room" })
      return
    }

    // Relay answer to the specific peer who sent the offer (targeted by fromUserId)
    const socketRoom = `room:${roomId}`
    socket.to(socketRoom).emit("webrtc_answer", { ...data, type: "answer" })

    logger.info({ userId: user.userId, roomId, fromUserId }, "WebRTC answer relayed")
  })

  // Handle ICE candidate exchange
  socket.on("ice_candidate", (data: ICECandidate) => {
    // ICE candidates are very frequent and not critical - skip DB validation entirely
    // Use participant tracking map instead (already validated on join_room)
    const { roomId, fromUserId } = data
    
    // Only relay if user is tracked as a participant (validated on join)
    const participants = roomParticipants.get(roomId)
    if (!participants || !participants.has(socket.id)) {
      return // Silently ignore if not in room
    }

    // Relay ICE candidate to all other participants
    const socketRoom = `room:${roomId}`
    socket.to(socketRoom).emit("ice_candidate", data)

    // Don't log - too frequent and not critical
  })

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    // Remove from all rooms
    for (const [roomId, participants] of roomParticipants.entries()) {
      if (participants.has(socket.id)) {
        participants.delete(socket.id)
        if (participants.size === 0) {
          roomParticipants.delete(roomId)
        } else {
          // Notify others
          const socketRoom = `room:${roomId}`
          socket.to(socketRoom).emit("participant_left", {
            roomId,
            socketId: socket.id,
            userId: user?.userId,
          })
        }
      }
    }

    logger.info({ userId: user?.userId, socketId: socket.id }, "User disconnected from video chat")
  })
}
