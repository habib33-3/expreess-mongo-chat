import { Server as IOServer } from "socket.io";
import { Server as HTTPServer } from "http";

let io: IOServer | null = null;

export function initSocket(server: HTTPServer) {
  if (io) return io;
  io = new IOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket"], // <- important for devtunnels (avoid HTTP 302)
  });

  io.on("connection", (socket) => {});

  return io;
}

export function getIO() {
  if (!io)
    throw new Error(
      "Socket.io not initialized — call initSocket(server) first"
    );
  return io;
}
