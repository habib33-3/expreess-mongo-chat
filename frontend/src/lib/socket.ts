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
  MESSAGE_DELIVERED: "message_delivered",
  MESSAGE_SEEN: "message_seen",
  LOAD_LAST_MESSAGE_AND_COUNT: "load_last_message_and_count",
  LEAVE: "leave",

  // Video call (1:1)
  CALL_REQUEST: "call_request",
  CALL_RECEIVE: "call_receive",
  CALL_ACCEPT: "call_accept",
  CALL_DECLINE: "call_decline",
  JOIN_VIDEO_ROOM: "join_video_room",
  OFFER: "offer",
  ANSWER: "answer",
  ICE_CANDIDATE: "ice_candidate",

  // Streaming (1:N)
  START_STREAMING: "START_STREAMING",
  START_STREAMING_ACK: "start_streaming_ack", // ✅ add this
  JOIN_BROADCAST: "join_broadcast",
  JOIN_VIEWER: "join_viewer",
  NEW_VIEWER: "new_viewer",
  VIEWER_DISCONNECTED: "viewer_disconnected",
  BROADCASTER_DISCONNECTED: "broadcaster_disconnected",
} as const;

export type SocketEventType = (typeof SocketEvent)[keyof typeof SocketEvent];
