import { dbUrl } from "@/constants";
import { io } from "socket.io-client";

export const socket = (() => {
  const s = io(dbUrl, { reconnectionDelayMax: 10000 });
  console.log("Socket instance created", s.id);

  s.on("connect", () => console.log("✅ Socket connected:", s.id));
  s.on("connect_error", (err) => console.error("⚠️ Socket connect error:", err.message));
  s.on("disconnect", (reason) => console.log("⚠️ Socket disconnected:", reason));

  return s;
})();

// --- Socket events ---
export const SocketEvent = {
  JOIN: "join",
  SEND_MESSAGE: "send_message",
  RECEIVE_MESSAGE: "receive_message",
  LOAD_MESSAGES: "load_messages",
  TYPING: "typing",
  STOP_TYPING: "stop_typing",
  ONLINE_USERS: "online_users",
  LEAVE: "leave",
} as const;

export type SocketEventType = (typeof SocketEvent)[keyof typeof SocketEvent];
