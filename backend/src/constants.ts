export enum SocketEvent {
  JOIN = "join",
  LEAVE = "leave",

  // --- Messaging ---
  SEND_MESSAGE = "send_message",
  RECEIVE_MESSAGE = "receive_message",
  LOAD_MESSAGES = "load_messages",
  TYPING = "typing",
  STOP_TYPING = "stop_typing",
  ONLINE_USERS = "online_users",
  MESSAGE_DELIVERED = "message_delivered",
  MESSAGE_SEEN = "message_seen",
  LOAD_LAST_MESSAGE_AND_COUNT = "load_last_message_and_count",

  // --- Video Call (1:1) ---
  CALL_REQUEST = "call_request",
  CALL_RECEIVE = "call_receive",
  CALL_ACCEPT = "call_accept",
  CALL_DECLINE = "call_decline",
  JOIN_VIDEO_ROOM = "join_video_room",
  OFFER = "offer",
  ANSWER = "answer",
  ICE_CANDIDATE = "ice_candidate",
  CALL_FAILED = "call_failed",

  // --- Streaming (1:N) ---

  JOIN_BROADCAST = "join_broadcast",
  JOIN_VIEWER = "join_viewer",
  NEW_VIEWER = "new_viewer",
  VIEWER_DISCONNECTED = "viewer_disconnected",
  BROADCASTER_DISCONNECTED = "broadcaster_disconnected",
  START_STREAMING = "START_STREAMING",
  START_STREAMING_ACK = "start_streaming_ack",
}

export const appUrl = "http://localhost:5173";
// export const appUrl = "https://zcr3h7z8-5173.inc1.devtunnels.ms";
