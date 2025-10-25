import { getIO } from "./socket.ts";
import { multiUserChatFeature } from "./socket/chat.ts";
import { streamingVideoChatFeature } from "./socket/video.ts";


const features = [multiUserChatFeature, streamingVideoChatFeature]; // add more features

export const registerSocketHandlers = () => {
  const io = getIO();

  io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);

    // Attach all modular features
    features.forEach((feature) => feature.register(io, socket));

    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
    });
  });
};
