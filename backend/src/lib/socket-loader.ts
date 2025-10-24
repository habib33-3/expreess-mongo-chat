import { getIO } from "./socket.ts";
import { multiUserChatFeature } from "./socket/chat.ts";
import { videoChatFeature } from "./socket/video.ts";

const features = [multiUserChatFeature, videoChatFeature]; // add more features

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
