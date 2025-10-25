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

  // --- Video Call ---
  CALL_REQUEST = "call_request", // caller initiates
  CALL_RECEIVE = "call_receive", // callee receives call notification
  CALL_ACCEPT = "call_accept", // callee accepts
  CALL_DECLINE = "call_decline", // callee declines
  JOIN_VIDEO_ROOM = "join_video_room", // both join same WebRTC room
  OFFER = "offer", // SDP offer
  ANSWER = "answer", // SDP answer
  ICE_CANDIDATE = "ice_candidate", // ICE candidate exchange
  CALL_FAILED = "call_failed",
}
