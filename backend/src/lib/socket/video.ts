// server/features/videoChat.feature.ts
import { Server, Socket } from "socket.io";
import { SocketEvent } from "../../constants";

/**
 * Maps:
 * - userSockets: userId -> socketId (for direct signaling)
 * - callRooms: userId -> roomId
 */
const userSockets = new Map<string, string>();
const callRooms = new Map<string, string>();

export const videoChatFeature = {
  register: (io: Server, socket: Socket) => {
    // --- Join video room & bind userId to socket ---
    socket.on(SocketEvent.JOIN_VIDEO_ROOM, ({ roomId, userId }) => {
      socket.join(roomId);
      socket.data.userId = userId;
      userSockets.set(userId, socket.id);
      callRooms.set(userId, roomId);
      console.log(`User ${userId} joined room ${roomId} (socket ${socket.id})`);
    });

    // --- Caller initiates call ---
    socket.on(SocketEvent.CALL_REQUEST, ({ caller, calleeId, callLink }) => {
      const calleeSocketId = userSockets.get(calleeId);
      if (calleeSocketId) {
        io.to(calleeSocketId).emit(SocketEvent.CALL_RECEIVE, {
          caller,
          callLink,
        });
      } else {
        socket.emit(SocketEvent.CALL_FAILED, { reason: "callee-offline" });
      }
    });

    // --- Callee accepts call ---
    socket.on(SocketEvent.CALL_ACCEPT, ({ targetId, callee }) => {
      const targetSocketId = userSockets.get(targetId);
      if (targetSocketId) {
        io.to(targetSocketId).emit(SocketEvent.CALL_ACCEPT, { callee });
      }
    });

    // --- SDP Offer ---
    socket.on(SocketEvent.OFFER, ({ targetId, offer }) => {
      const targetSocketId = userSockets.get(targetId);
      if (targetSocketId) {
        io.to(targetSocketId).emit(SocketEvent.OFFER, {
          offer,
          fromId: socket.data.userId,
        });
      }
    });

    // --- SDP Answer ---
    socket.on(SocketEvent.ANSWER, ({ targetId, answer }) => {
      const targetSocketId = userSockets.get(targetId);
      if (targetSocketId) {
        io.to(targetSocketId).emit(SocketEvent.ANSWER, {
          answer,
          fromId: socket.data.userId,
        });
      }
    });

    // --- ICE Candidate ---
    socket.on(SocketEvent.ICE_CANDIDATE, ({ targetId, candidate }) => {
      const targetSocketId = userSockets.get(targetId);
      if (targetSocketId) {
        io.to(targetSocketId).emit(SocketEvent.ICE_CANDIDATE, {
          candidate,
          fromId: socket.data.userId,
        });
      }
    });

    // --- Handle disconnect ---
    socket.on("disconnect", () => {
      const userId = socket.data.userId as string | undefined;
      if (userId) {
        const roomId = callRooms.get(userId);
        if (roomId) {
          socket.to(roomId).emit("user-disconnected", { userId });
          callRooms.delete(userId);
        }
        userSockets.delete(userId);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  },
};
