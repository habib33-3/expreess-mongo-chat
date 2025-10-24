import { dbUrl } from "@/constants";
import { io } from "socket.io-client";

export const socket = (() => {
  const s = io(dbUrl, { reconnectionDelayMax: 10000 });
  console.log("Socket instance created", s.id);

  s.on("connect", () => console.log("✅ Socket connected:", s.id));

  s.on("connect_error", (err) =>
    console.error("⚠️ Socket connect error:", err.message)
  );

  s.on("disconnect", (reason) =>
    console.log("⚠️ Socket disconnected:", reason)
  );

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

  // Video call
  CALL_REQUEST: "call_request", // caller initiates
  CALL_RECEIVE: "call_receive", // server notifies callee
  CALL_ACCEPT: "call_accept", // callee accepts
  CALL_DECLINE: "call_decline", // callee declines
  JOIN_VIDEO_ROOM: "join_video_room",
  OFFER: "offer",
  ANSWER: "answer",
  ICE_CANDIDATE: "ice_candidate",
} as const;

export type SocketEventType = (typeof SocketEvent)[keyof typeof SocketEvent];
