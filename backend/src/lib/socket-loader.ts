import { getIO } from "./socket.ts";
import { multiUserChatFeature } from "./socket/chat.ts";

const features = [multiUserChatFeature, ]; // add more features

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
