// server/features/video.ts
import { Server, Socket } from "socket.io";
import { appUrl, SocketEvent } from "../../constants";

// --- Types ---
interface StartStreamingPayload {
  roomId: string;
  userId: string;
  title?: string;
  thumbnailUrl?: string;
}
interface JoinViewerPayload {
  roomId: string;
  userId: string;
}
interface SignalPayload {
  targetId: string;
  offer?: any;
  answer?: any;
  candidate?: any;
}

// --- Maps ---
const broadcasters = new Map<string, { userId: string; socketId: string }>(); // roomId -> broadcaster info
const viewers = new Map<string, Set<string>>(); // roomId -> Set<socketId>
const socketToUser = new Map<string, string>(); // socketId -> userId
const streamMetadata = new Map<
  string,
  { title?: string; thumbnailUrl?: string }
>();

export const streamingVideoChatFeature = {
  register: (io: Server, socket: Socket) => {
    const addSocketMapping = (userId: string, socketId: string) => {
      socketToUser.set(socketId, userId);
    };

    const removeSocketMapping = (socketId: string) => {
      socketToUser.delete(socketId);
    };

    // --- Start streaming (broadcaster) ---
    socket.on(
      SocketEvent.START_STREAMING,
      ({ roomId, userId, title, thumbnailUrl }: StartStreamingPayload) => {
        socket.join(roomId);
        socket.data.userId = userId;
        socket.data.roomId = roomId;

        broadcasters.set(roomId, { userId, socketId: socket.id });
        addSocketMapping(userId, socket.id);

        streamMetadata.set(roomId, {
          ...(title !== undefined && { title }),
          ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        });

        console.log(
          `🎥 Broadcaster ${userId} (${
            socket.id
          }) started streaming room ${roomId} - "${title || "No title"}"`
        );

        socket.emit(SocketEvent.START_STREAMING_ACK, {
          success: true,
          streamId: roomId,
          link: `${appUrl}/watch/${roomId}`,
        });
      }
    );

    // --- Viewer joins broadcast ---
    socket.on(
      SocketEvent.JOIN_VIEWER,
      ({ roomId, userId }: JoinViewerPayload) => {
        socket.join(roomId);
        socket.data.userId = userId;
        socket.data.roomId = roomId;
        addSocketMapping(userId, socket.id);

        if (!viewers.has(roomId)) viewers.set(roomId, new Set());
        viewers.get(roomId)!.add(socket.id);

        // Send metadata to viewer
        const metadata = streamMetadata.get(roomId);
        socket.emit("stream_metadata", metadata);

        // Notify broadcaster with BOTH userId and socketId
        const broadcasterInfo = broadcasters.get(roomId);
        if (broadcasterInfo) {
          console.log(
            `👁️ Viewer ${userId} (${socket.id}) joined room ${roomId}, notifying broadcaster ${broadcasterInfo.socketId}`
          );

          io.to(broadcasterInfo.socketId).emit(SocketEvent.NEW_VIEWER, {
            viewerId: userId,
            viewerSocketId: socket.id,
          });
        } else {
          console.warn(`⚠️ No broadcaster found for room ${roomId}`);
        }
      }
    );

    // --- WebRTC signaling (using socketId directly) ---
    socket.on(SocketEvent.OFFER, ({ targetId, offer }: SignalPayload) => {
      const fromUserId = socket.data.userId;
      const targetUserId = socketToUser.get(targetId);

      console.log(
        `📤 OFFER: ${fromUserId} (${socket.id}) → ${targetUserId} (${targetId})`
      );

      io.to(targetId).emit(SocketEvent.OFFER, {
        offer,
        fromId: socket.id, // Send socket ID so viewer can reply
      });
    });

    socket.on(SocketEvent.ANSWER, ({ targetId, answer }: SignalPayload) => {
      const fromUserId = socket.data.userId;
      const targetUserId = socketToUser.get(targetId);

      console.log(
        `📤 ANSWER: ${fromUserId} (${socket.id}) → ${targetUserId} (${targetId})`
      );

      io.to(targetId).emit(SocketEvent.ANSWER, {
        answer,
        fromId: socket.id, // Send socket ID for peer connection mapping
      });
    });

    socket.on(
      SocketEvent.ICE_CANDIDATE,
      ({ targetId, candidate }: SignalPayload) => {
        const fromUserId = socket.data.userId;
        const targetUserId = socketToUser.get(targetId);

        console.log(
          `🧊 ICE: ${fromUserId} (${socket.id}) → ${targetUserId} (${targetId})`
        );

        io.to(targetId).emit(SocketEvent.ICE_CANDIDATE, {
          candidate,
          fromId: socket.id,
        });
      }
    );

    // --- Disconnect ---
    socket.on("disconnect", () => {
      const userId = socket.data.userId;
      const roomId = socket.data.roomId;

      if (!userId) return;

      removeSocketMapping(socket.id);

      // Check if this was a viewer
      if (roomId && viewers.has(roomId)) {
        const viewerSet = viewers.get(roomId)!;
        if (viewerSet.has(socket.id)) {
          viewerSet.delete(socket.id);

          // Notify broadcaster
          const broadcasterInfo = broadcasters.get(roomId);
          if (broadcasterInfo) {
            io.to(broadcasterInfo.socketId).emit(
              SocketEvent.VIEWER_DISCONNECTED,
              {
                socketId: socket.id,
                userId,
              }
            );
          }

          console.log(
            `👁️ Viewer ${userId} (${socket.id}) disconnected from room ${roomId}`
          );

          if (viewerSet.size === 0) {
            viewers.delete(roomId);
          }
        }
      }

      // Check if this was a broadcaster
      broadcasters.forEach((broadcasterInfo, roomId) => {
        if (broadcasterInfo.socketId === socket.id) {
          // Notify all viewers
          socket
            .to(roomId)
            .emit(SocketEvent.BROADCASTER_DISCONNECTED, { userId });

          // Cleanup
          broadcasters.delete(roomId);
          viewers.delete(roomId);
          streamMetadata.delete(roomId);

          console.log(
            `🎥 Broadcaster ${userId} (${socket.id}) disconnected from room ${roomId}`
          );
        }
      });
    });
  },
};
