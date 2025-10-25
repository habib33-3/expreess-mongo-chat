// server/features/videoChat.feature.ts
import { Server, Socket } from "socket.io";
import { SocketEvent } from "../../constants";

/**
 * server-side maps:
 * - userSockets: userId -> socketId
 * - callRooms: userId -> roomId (optional; kept for your existing logic)
 */
const userSockets = new Map<string, string>();
const callRooms = new Map<string, string>();

export const videoChatFeature = {
  register: (io: Server, socket: Socket) => {
    // --- Caller initiates a call (notify callee by userId) ---
    socket.on(SocketEvent.CALL_REQUEST, ({ caller, calleeId, callLink }) => {
      const calleeSocketId = userSockets.get(calleeId);
      if (calleeSocketId) {
        io.to(calleeSocketId).emit(SocketEvent.CALL_RECEIVE, {
          caller,
          callLink,
        });
      } else {
        // callee offline / not connected
        socket.emit(SocketEvent.CALL_FAILED, { reason: "callee-offline" });
      }
    });

    // --- Callee accepts the call (notify caller) ---
    socket.on(SocketEvent.CALL_ACCEPT, ({ targetId, callee }) => {
      const targetSocketId = userSockets.get(targetId);
      if (targetSocketId) {
        io.to(targetSocketId).emit(SocketEvent.CALL_ACCEPT, { callee });
      }
    });

    // --- IMPORTANT: Join a video "room" and bind userId -> socket.id ---
    socket.on(SocketEvent.JOIN_VIDEO_ROOM, ({ roomId, userId }) => {
      socket.join(roomId);
      socket.data.userId = userId; // bind on socket for disconnect handling
      userSockets.set(userId, socket.id); // enable direct routing
      callRooms.set(userId, roomId);
      console.log(
        `User ${userId} joined video room ${roomId} (socket ${socket.id})`
      );
    });

    // --- SDP Offer (route to target's socket.id) ---
    socket.on(SocketEvent.OFFER, ({ targetId, offer }) => {
      const targetSocketId = userSockets.get(targetId);
      if (targetSocketId)
        io.to(targetSocketId).emit(SocketEvent.OFFER, {
          offer,
          fromId: socket.data.userId,
        });
    });

    // --- SDP Answer ---
    socket.on(SocketEvent.ANSWER, ({ targetId, answer }) => {
      const targetSocketId = userSockets.get(targetId);
      if (targetSocketId)
        io.to(targetSocketId).emit(SocketEvent.ANSWER, {
          answer,
          fromId: socket.data.userId,
        });
    });

    // --- ICE Candidates ---
    socket.on(SocketEvent.ICE_CANDIDATE, ({ targetId, candidate }) => {
      const targetSocketId = userSockets.get(targetId);
      if (targetSocketId)
        io.to(targetSocketId).emit(SocketEvent.ICE_CANDIDATE, {
          candidate,
          fromId: socket.data.userId,
        });
    });

    // --- Clean up on disconnect ---
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
