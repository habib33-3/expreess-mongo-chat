import { Server, Socket } from "socket.io";
import { SocketEvent } from "../../constants";

const callRooms = new Map<string, string>(); // key: userId, value: roomId

export const videoChatFeature = {
  register: (io: Server, socket: Socket) => {
    // --- Caller initiates a call ---
    socket.on(SocketEvent.CALL_REQUEST, ({ caller, calleeId, callLink }) => {
      console.log(`Call requested by ${caller.id} for ${calleeId}`);
      io.to(calleeId).emit(SocketEvent.CALL_RECEIVE, { caller, callLink });
    });

    // --- Callee accepts the call ---
    socket.on(SocketEvent.CALL_ACCEPT, ({ targetId, callee }) => {
      console.log(`Call accepted by ${callee.id} for ${targetId}`);
      io.to(targetId).emit(SocketEvent.CALL_ACCEPT, { callee });
    });

    // --- Join a video room ---
    socket.on(SocketEvent.JOIN_VIDEO_ROOM, ({ roomId, userId }) => {
      socket.join(roomId);
      callRooms.set(userId, roomId);
      console.log(`User ${userId} joined video room ${roomId}`);
    });

    // --- SDP Offer ---
    socket.on(SocketEvent.OFFER, ({ targetId, offer }) => {
      io.to(targetId).emit(SocketEvent.OFFER, { offer });
    });

    // --- SDP Answer ---
    socket.on(SocketEvent.ANSWER, ({ targetId, answer }) => {
      io.to(targetId).emit(SocketEvent.ANSWER, { answer });
    });

    // --- ICE Candidates ---
    socket.on(SocketEvent.ICE_CANDIDATE, ({ targetId, candidate }) => {
      io.to(targetId).emit(SocketEvent.ICE_CANDIDATE, { candidate });
    });

    // --- Handle user disconnect ---
    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      const roomId = callRooms.get(userId);
      if (roomId) {
        socket.to(roomId).emit("user-disconnected", { userId });
        callRooms.delete(userId);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  },
};
